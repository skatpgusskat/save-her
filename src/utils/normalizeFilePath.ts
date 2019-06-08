import path from 'path';

export default function normalizeFilePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}
