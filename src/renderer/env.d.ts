import type { ImportedDoc, SearchResult } from './types';

interface ElectronAPI {
  importFiles: (filePaths: string[]) => Promise<ImportedDoc[]>;
  search: (query: string) => Promise<SearchResult[]>;
  getAllDocs: () => Promise<ImportedDoc[]>;
  getDocById: (id: string) => Promise<ImportedDoc | null>;
  deleteDoc: (id: string) => Promise<void>;
  getCategories: () => Promise<string[]>;
  updateTags: (id: string, tags: string[]) => Promise<ImportedDoc | null>;
  updateCategory: (id: string, category: string) => Promise<ImportedDoc | null>;
  openPath: (filePath: string) => Promise<{ error: string }>;
  getDataDir: () => Promise<string>;
  exportAll: () => Promise<{ success: boolean; path?: string; size?: number; reason?: string }>;
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  getFilePath: (file: File) => string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
