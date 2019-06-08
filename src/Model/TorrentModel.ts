import { Model } from 'objection';

export default class TorrentModel extends Model {
  readonly id!: number;
  name!: string;
  infoHash!: string;
  isDownloaded!: boolean;

  createdAt: Date;
  updatedAt: Date;

  static tableName = 'torrents';
}