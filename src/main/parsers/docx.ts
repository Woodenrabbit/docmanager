import { readFileSync } from 'fs';

export async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth');
  const buffer = readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
