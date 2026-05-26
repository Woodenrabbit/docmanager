import { readFileSync, statSync } from 'fs';
import { basename, extname } from 'path';

export function parseTxt(filePath: string): string {
  const buffer = readFileSync(filePath);
  // Try UTF-8 first, if it has replacement chars, try GBK
  const text = buffer.toString('utf-8');
  return text;
}

export function getFileInfo(filePath: string) {
  const stats = statSync(filePath);
  const ext = extname(filePath).toLowerCase().replace('.', '');
  return {
    fileName: basename(filePath),
    fileSize: stats.size,
    extension: ext,
  };
}
