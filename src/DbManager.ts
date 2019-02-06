import Knex from 'knex';
import knexFile from '../knexfile';
import { Torrent, TorrentFile } from 'webtorrent';


export default class DbManager {
  private knex = Knex(knexFile[process.env.NODE_ENV]);

  public async addTorrent(torrent: Torrent) {
    await this.knex.insert({
      infoHash: torrent.infoHash,
    }).into('torrents');
  }

  public async addFile(torrent: Torrent, file: TorrentFile, s3Key: string) {
    await this.knex.insert({
      torrentId: this.knex('torrents').select('id').where('infoHash', torrent.infoHash),
      name: file.name,
      filePath: file.path,
      s3Key,
    }).into('files');
  }

  public async isAlreadyAddedTorrent(torrent: Torrent): Promise<boolean> {
    const torrents = await this.knex.select('id').where({
      infoHash: torrent.infoHash,
    }).from('torrents');
    return torrents.length > 0;
  }
}