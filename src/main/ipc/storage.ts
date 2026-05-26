import { app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const DATA_DIR = join(app.getPath('userData'), 'app-data');
const DOCS_FILE = join(DATA_DIR, 'documents.json');

export function getDataDir(): string {
  return DATA_DIR;
}

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDocs(): any[] {
  ensureDataDir();
  if (!existsSync(DOCS_FILE)) {
    return [];
  }
  try {
    const raw = readFileSync(DOCS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDocs(docs: any[]) {
  ensureDataDir();
  writeFileSync(DOCS_FILE, JSON.stringify(docs, null, 2), 'utf-8');
}
