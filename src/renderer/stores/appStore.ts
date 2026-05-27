import { create } from 'zustand';
import type { ImportedDoc, SearchResult } from '../types';
import { playSuccessSound, playErrorSound } from '../utils/sound';

interface AppState {
  documents: ImportedDoc[];
  categories: string[];

  activeView: 'explorer' | 'import';

  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;

  activeCategory: string | null;
  fileNameQuery: string;

  previewDoc: ImportedDoc | null;
  isPreviewOpen: boolean;
  previewScrollTo: number | null;
  previewHighlight: string | null;

  isLoading: boolean;
  isImporting: boolean;
  error: string | null;
  message: string | null;

  initialize: () => Promise<void>;
  importFiles: (paths: string[]) => Promise<void>;
  search: (query: string) => Promise<void>;
  setActiveCategory: (cat: string | null) => void;
  setFileNameQuery: (q: string) => void;
  setActiveView: (view: 'explorer' | 'import') => void;
  openPreview: (doc: ImportedDoc) => void;
  openPreviewWithHighlight: (doc: ImportedDoc, query: string, scrollTo: number) => void;
  closePreview: () => void;
  deleteDoc: (id: string) => Promise<void>;
  updateDocTags: (id: string, tags: string[]) => Promise<void>;
  updateDocCategory: (id: string, category: string) => Promise<void>;
  clearError: () => void;
  setMessage: (msg: string) => void;
  clearMessage: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  documents: [],
  categories: [],

  searchQuery: '',
  searchResults: [],
  isSearching: false,

  activeCategory: null,
  fileNameQuery: '',

  activeView: 'explorer',

  previewDoc: null,
  isPreviewOpen: false,
  previewScrollTo: null,
  previewHighlight: null,

  isLoading: false,
  isImporting: false,
  error: null,
  message: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const [docs, cats] = await Promise.all([
        window.electronAPI.getAllDocs(),
        window.electronAPI.getCategories(),
      ]);
      set({ documents: docs, categories: cats, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  importFiles: async (paths: string[]) => {
    set({ isImporting: true });
    try {
      const newDocs = await window.electronAPI.importFiles(paths);
      const merged = [...get().documents];
      for (const doc of newDocs) {
        const idx = merged.findIndex((d) => d.id === doc.id);
        if (idx !== -1) {
          merged[idx] = doc;
        } else {
          merged.push(doc);
        }
      }
      const cats = await window.electronAPI.getCategories();
      set({
        documents: merged,
        categories: cats,
        isImporting: false,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.message, isImporting: false });
    }
  },

  search: async (query: string) => {
    set({ searchQuery: query });
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false });
      return;
    }
    set({ isSearching: true });
    try {
      const results = await window.electronAPI.search(query);
      set({ searchResults: results, isSearching: false });
    } catch (err: any) {
      set({ error: err.message, isSearching: false });
    }
  },

  setActiveCategory: (cat) => {
    set({ activeCategory: cat });
  },

  setFileNameQuery: (q) => {
    set({ fileNameQuery: q });
  },

  setActiveView: (view) => {
    set({ activeView: view });
  },

  openPreview: (doc) => {
    set({ previewDoc: doc, isPreviewOpen: true, previewScrollTo: null, previewHighlight: null });
  },

  openPreviewWithHighlight: (doc, query, scrollTo) => {
    set({ previewDoc: doc, isPreviewOpen: true, previewScrollTo: scrollTo, previewHighlight: query });
  },

  closePreview: () => {
    set({ previewDoc: null, isPreviewOpen: false, previewScrollTo: null, previewHighlight: null });
  },

  deleteDoc: async (id: string) => {
    try {
      await window.electronAPI.deleteDoc(id);
      const docs = get().documents.filter((d) => d.id !== id);
      const cats = await window.electronAPI.getCategories();
      const previewDoc = get().previewDoc;
      set({
        documents: docs,
        categories: cats,
        previewDoc: previewDoc?.id === id ? null : previewDoc,
        isPreviewOpen: previewDoc?.id === id ? false : get().isPreviewOpen,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateDocTags: async (id: string, tags: string[]) => {
    try {
      const updated = await window.electronAPI.updateTags(id, tags);
      if (updated) {
        const docs = get().documents.map((d) => (d.id === id ? updated : d));
        const previewDoc = get().previewDoc;
        set({
          documents: docs,
          previewDoc: previewDoc?.id === id ? updated : previewDoc,
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateDocCategory: async (id: string, category: string) => {
    try {
      const updated = await window.electronAPI.updateCategory(id, category);
      if (updated) {
        const docs = get().documents.map((d) => (d.id === id ? updated : d));
        const cats = [...new Set(docs.map((d) => d.category))].sort();
        const previewDoc = get().previewDoc;
        set({
          documents: docs,
          categories: cats,
          previewDoc: previewDoc?.id === id ? updated : previewDoc,
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  clearError: () => set({ error: null }),
  setMessage: (msg) => set({ message: msg }),
  clearMessage: () => set({ message: null }),
}));
