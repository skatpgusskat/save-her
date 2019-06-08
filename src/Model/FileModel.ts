import { Model } from 'objection';

export default class FileModel extends Model {
  readonly id!: number;
  torrentId: number;
  filePath!: string;
  s3Key!: string;

  static tableName = 'files';
}
