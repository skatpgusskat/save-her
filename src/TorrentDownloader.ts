import WebTorrent, { Torrent } from 'webtorrent';
import path from 'path';
import fs from 'fs-extra';

const downloadDirectory = path.join(__dirname, 'files');
if (!fs.existsSync(downloadDirectory)) {
  fs.mkdirSync(downloadDirectory);
}

const torrentFilesDirectory = path.join(__dirname, 'meta');
if (!fs.existsSync(torrentFilesDirectory)) {
  fs.mkdirSync(torrentFilesDirectory);
}

export default class TorrentDownloader {
  private torrents: Torrent[] = [];
  private torrentClient = new WebTorrent();
  constructor() {
    this.loadSavedTorrentFiles();

    this.torrentClient.on("error", (err) => {
      console.error(err);
    });
    setInterval(() => {
      this.torrents.forEach(torrent => {
        console.log(torrent.ready);
        console.log(torrent.torrentFile.length);
      });
    }, 1000);
  }

  private async loadSavedTorrentFiles() {
    const filenames = await fs.readdir(torrentFilesDirectory);
    await Promise.all(filenames.map(async (filename) => {
      const filePath = path.join(torrentFilesDirectory, filename);
      const file = await fs.readFile(filePath);
      this.requestDownload(file);
    }));
  }

  public requestDownload(magnetUriOrTorrentFile: string | Buffer): Torrent {
    const torrent = this.torrentClient.add(magnetUriOrTorrentFile, {
      path: downloadDirectory,
    });

    if (this.isAlreadyAdded(torrent)) {
      torrent.destroy();
      return null;
    }

    this.torrents.push(torrent);
    torrent.on("metadata", () => {
      this.onMetadataLoaded(torrent);
    });

    return torrent;
  }

  public getAllTorrents(): Torrent[] {
    return this.torrents;
  }

  private getTorrentFilePath(torrent: Torrent) {
    const filePath = path.join(torrentFilesDirectory, torrent.infoHash);
    return filePath;
  }

  private async removeTorrent(torrent: Torrent) {
    const torrentFilePath = this.getTorrentFilePath(torrent);

    torrent.pause();

    if (await fs.pathExists(torrentFilePath)) {
      fs.remove(torrentFilePath);
    }

    torrent.destroy();
  }

  private isAlreadyAdded(torrent: Torrent) {
    return this.torrents.some(addedTorrent => addedTorrent.infoHash === torrent.infoHash);
  }

  private async onMetadataLoaded(torrent: Torrent) {
    console.log("metadata torrent.torrentFile.length", torrent.torrentFile.length);
    const torrentFilePath = this.getTorrentFilePath(torrent);
    await fs.writeFile(torrentFilePath, torrent.torrentFile);
  }
}
