import { contextBridge, ipcRenderer, webUtils } from 'electron';

const electronAPI = {
  importFiles: (filePaths: string[]) =>
    ipcRenderer.invoke('doc:import', { filePaths }),

  openFilesDialog: () =>
    ipcRenderer.invoke('dialog:open-files'),

  search: (query: string) =>
    ipcRenderer.invoke('doc:search', { query }),

  getAllDocs: () =>
    ipcRenderer.invoke('doc:get-all'),

  getDocById: (id: string) =>
    ipcRenderer.invoke('doc:get-by-id', { id }),

  deleteDoc: (id: string) =>
    ipcRenderer.invoke('doc:delete', { id }),

  getCategories: () =>
    ipcRenderer.invoke('doc:get-categories'),

  updateTags: (id: string, tags: string[]) =>
    ipcRenderer.invoke('doc:update-tags', { id, tags }),

  updateCategory: (id: string, category: string) =>
    ipcRenderer.invoke('doc:update-category', { id, category }),

  openPath: (filePath: string) =>
    ipcRenderer.invoke('shell:open-path', { filePath }),

  getDataDir: () =>
    ipcRenderer.invoke('app:data-dir'),

  exportAll: () =>
    ipcRenderer.invoke('doc:export-all'),

  minimize: () => ipcRenderer.invoke('win:minimize'),
  maximize: () => ipcRenderer.invoke('win:maximize'),
  close: () => ipcRenderer.invoke('win:close'),
  isMaximized: () => ipcRenderer.invoke('win:is-maximized'),

  getFilePath: (file: File) => webUtils.getPathForFile(file),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
