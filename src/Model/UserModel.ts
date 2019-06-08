import { Model } from 'objection';
import TorrentModel from './TorrentModel';

export default class UserModel extends Model {
  readonly id!: number;
  username!: string;
  createdAt: Date;
  updatedAt: Date;

  torrents?: TorrentModel[];

  static tableName = 'users';

  static relationMappings = () => ({
    torrents: {
      relation: Model.ManyToManyRelation ,
      modelClass: TorrentModel,
      join: {
        from: 'users.id',
        through: {
          from: 'usersTorrents.userId',
          to: 'usersTorrents.torrentId'
        },
        to: 'torrents.id'
      },
    },
  });
}
