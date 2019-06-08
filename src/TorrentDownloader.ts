import WebTorrent, { Torrent } from 'webtorrent';
import path from 'path';
import fs from 'fs-extra';
import S3Uploader from './S3Uploader';
import parseTorrent from 'parse-torrent';
import TorrentModel from './Model/TorrentModel';
import { transaction } from 'objection';
import FileModel from './Model/FileModel';
import normalizeFilePath from './utils/normalizeFilePath';
import WaitingQueue from './WaitingQueue';
import Locker from './Locker';

export type TorrentInfo = {
  name: string;
  infoHash: string;
};

const downloadDirectory = path.join(__dirname, 'files');
if (!fs.existsSync(downloadDirectory)) {
  fs.mkdirSync(downloadDirectory);
}

const torrentFilesDirectory = path.join(__dirname, 'meta');
if (!fs.existsSync(torrentFilesDirectory)) {
  fs.mkdirSync(torrentFilesDirectory);
}

class TorrentDownloader {
  private torrentClient = new WebTorrent();
  private s3Uploader = new S3Uploader();
  private readonly downloadRequestWaitingQueue = new WaitingQueue();
  private readonly locker: Locker = new Locker();

  constructor() {
    this.torrentClient.on('error', (err) => {
      console.error(err);
    });

    setInterval(() => {
      this.torrentClient.torrents.forEach(torrent => {
        console.log(torrent.progress);
      });
    }, 1000);
  }

  public async init() {
    await Promise.all([
      this.loadSavedTorrentFiles(),
      this.s3Uploader.init()
    ]);
  }

  private async loadSavedTorrentFiles() {
    const filenames = await fs.readdir(torrentFilesDirectory);
    await Promise.all(filenames.map(async (filename) => {
      const filePath = path.join(torrentFilesDirectory, filename);
      const file = await fs.readFile(filePath);
      await this.startDownload(file);
    }));
  }

  private getInfoHash(magnetUriOrTorrentFile: string | Buffer): string | undefined {
    const { infoHash } = parseTorrent(magnetUriOrTorrentFile);
    return infoHash;
  }

  public async startDownload(magnetUriOrTorrentFile: string | Buffer): Promise<TorrentInfo> {
    return await this.locker.lock(async () => {
      const infoHash = this.getInfoHash(magnetUriOrTorrentFile);

      let torrent = this.torrentClient.torrents.find(torrent => torrent.infoHash === infoHash);

      if (torrent) {
        if (torrent.ready) {
          return torrent;
        }

        return new Promise<TorrentInfo>((resolve) => {
          torrent.setMaxListeners(torrent.getMaxListeners() + 1);
          torrent.on('ready', () => {
            resolve(torrent);
          });
        });
      }

      const torrentModel = await TorrentModel.query().findOne({
        infoHash,
      });

      if (torrentModel && torrentModel.isDownloaded) {
        return torrentModel;
      }

      torrent = this.torrentClient.add(magnetUriOrTorrentFile, {
        path: downloadDirectory,
      });

      torrent.on('done', () => {
        this.onDownloadDone(torrent);
      });

      return new Promise<TorrentInfo>((resolve) => {
        torrent.on('metadata', () => {
          resolve(torrent)
          this.onMetadataLoaded(torrent);
        });
      });
    });
  }

  private getTorrentFilePath(torrent: Torrent) {
    const filePath = path.join(torrentFilesDirectory, torrent.infoHash);
    return filePath;
  }

  private async removeDownloadedFiles(torrent: Torrent) {
    await Promise.all(torrent.files.map(async file => {
      const filePath = path.join(downloadDirectory, file.path);
      await fs.remove(filePath);
    }))
  }

  private async removeTorrent(torrent: Torrent) {
    const torrentFilePath = this.getTorrentFilePath(torrent);

    torrent.pause();

    if (await fs.pathExists(torrentFilePath)) {
      fs.remove(torrentFilePath);
    }

    await this.removeDownloadedFiles(torrent);

    torrent.destroy();
  }

  private async onMetadataLoaded(torrent: Torrent) {
    try {
      await transaction(TorrentModel.knex(), async trx => {
        const torrentModel = await TorrentModel.query().findOne({
          infoHash: torrent.infoHash,
        });

        if (torrentModel) {
          return;
        }

        await TorrentModel.query().insert({
          name: torrent.name,
          infoHash: torrent.infoHash,
          isDownloaded: false,
        });
      });
    } catch(err) {
      console.error(err);
    }

    const torrentFilePath = this.getTorrentFilePath(torrent);
    await fs.writeFile(torrentFilePath, torrent.torrentFile);
  }

  private async onDownloadDone(torrent: Torrent) {
    const torrentModel = await TorrentModel.query().findOne({
      infoHash: torrent.infoHash,
    });

    if (!torrentModel) {
      throw new Error(`cannot find torrent model with infoHash(${torrent.infoHash}`);
    }

    await Promise.all(torrent.files.map(async (file) => {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        file.getBuffer((err, buffer) => {
          if (err) {
            return reject(err);
          }
          resolve(buffer);
        });
      });

      const normalizedFilePath = normalizeFilePath(file.path);

      console.log(`start uploading ${normalizedFilePath}`);

      const s3Key = this.s3Uploader.encodeStringForS3Key(normalizedFilePath);
      await this.s3Uploader.upload(buffer, s3Key);

      await FileModel.query().insert({
        torrentId: torrentModel.id,
        s3Key,
        filePath: normalizedFilePath,
      });
      console.log(`uploading finished ${normalizedFilePath}`);
    }));

    await TorrentModel.query()
      .update({
        isDownloaded: true,
      })
      .where({
        infoHash: torrent.infoHash,
      });

    await this.removeTorrent(torrent);
  }
}
const torrentDownloader = new TorrentDownloader();
export default torrentDownloader;
