import { readFileSync } from 'fs';

function cleanCsvLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // skip lines that are only commas (all empty cells)
  if (/^[\s,]+$/.test(trimmed)) return null;
  // collapse 3+ consecutive commas into a single comma
  const cleaned = trimmed.replace(/,{3,}/g, ',').replace(/,+$/, '');
  if (!cleaned || /^,+$/.test(cleaned)) return null;
  return cleaned;
}

export async function parseXlsx(filePath: string): Promise<string> {
  const XLSX = await import('xlsx');
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const texts: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csvText = XLSX.utils.sheet_to_csv(sheet);
    const lines = csvText.split('\n');
    const cleanLines = lines.map(cleanCsvLine).filter(Boolean) as string[];

    if (cleanLines.length > 0) {
      texts.push(`[${sheetName}]\n${cleanLines.join('\n')}`);
    }
  }

  return texts.join('\n\n');
}
