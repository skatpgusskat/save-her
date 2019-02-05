import WebTorrent, { Torrent } from 'webtorrent';
import path from 'path';
import fs from 'fs';

const torrentClient = new WebTorrent();

const tempDir = path.join(__dirname, 'files');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

export default class TorrentDownloader {
  private torrents: Torrent[] = [];
  constructor() {

  }

  public AddMagnet(magnetUri): Torrent {
    const torrent = torrentClient.add(magnetUri, {
      path: path.join(__dirname, 'files'),
    });
    this.torrents.push(torrent);
    return torrent;
  }

  public GetAllTorrents(): Torrent[] {
    return this.torrents;
  }
}
