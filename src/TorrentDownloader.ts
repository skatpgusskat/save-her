import WebTorrent, { Torrent } from 'webtorrent';
import path from 'path';
import fs from 'fs-extra';
import S3Uploader from './S3Uploader';
import parseTorrent from 'parse-torrent';


const downloadDirectory = path.join(__dirname, 'files');
if (!fs.existsSync(downloadDirectory)) {
  fs.mkdirSync(downloadDirectory);
}

const torrentFilesDirectory = path.join(__dirname, 'meta');
if (!fs.existsSync(torrentFilesDirectory)) {
  fs.mkdirSync(torrentFilesDirectory);
}

export default class TorrentDownloader {
  private torrentClient = new WebTorrent();
  private s3Uploader = new S3Uploader();

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

  public startDownload(magnetUriOrTorrentFile: string | Buffer): Promise<Torrent> {
    const infoHash = this.getInfoHash(magnetUriOrTorrentFile);

    let torrent = this.torrentClient.torrents.find(torrent => torrent.infoHash === infoHash);

    if (!torrent) {
      torrent = this.torrentClient.add(magnetUriOrTorrentFile, {
        path: downloadDirectory,
      });

      torrent.on('metadata', () => {
        this.onMetadataLoaded(torrent);
      });

      torrent.on('done', () => {
        this.onDownloadDone(torrent);
      });
    }

    return new Promise<Torrent>((resolve) => {
      if (torrent.ready) {
        return resolve(torrent);
      }
      torrent.setMaxListeners(torrent.getMaxListeners() + 1);
      torrent.on('ready', () => {
        resolve(torrent);
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
    const torrentFilePath = this.getTorrentFilePath(torrent);
    await fs.writeFile(torrentFilePath, torrent.torrentFile);
  }

  private async onDownloadDone(torrent: Torrent) {
    await Promise.all(torrent.files.map(async (file) => {
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        file.getBuffer((err, buffer) => {
          if (err) {
            return reject(err);
          }
          resolve(buffer);
        });
      });
      console.log(`start uploading ${file.path}`);

      const s3Key = this.s3Uploader.encodeStringForS3Key(file.path);

      await this.s3Uploader.upload(buffer, s3Key);
      console.log(`uploading finished ${file.path}`);
    }));
    await this.removeTorrent(torrent);
  }
}
