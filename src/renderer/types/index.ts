export interface ImportedDoc {
  id: string;
  fileName: string;
  originalPath: string;
  fileType: 'txt' | 'docx' | 'xlsx';
  content: string;
  contentPreview: string;
  category: string;
  tags: string[];
  fileSize: number;
  importedAt: number;
}

export interface SearchResult {
  doc: ImportedDoc;
  matches: Array<{
    snippet: string;
    position: number;
  }>;
  score: number;
}
