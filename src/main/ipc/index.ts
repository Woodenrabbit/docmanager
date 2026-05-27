import { ipcMain, app, shell, dialog, BrowserWindow } from 'electron';
import archiver from 'archiver';
const { ZipArchive } = archiver as any;
import { createWriteStream, mkdirSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { importFiles } from './documents';
import { getAllDocs, getDocById, deleteDoc, getCategories, searchDocs, updateDocTags, updateDocCategory } from './documents';
import { getDataDir } from './storage';

export function registerAllHandlers() {
  ipcMain.handle('doc:import', async (_event, { filePaths }) => {
    return importFiles(filePaths);
  });

  ipcMain.handle('dialog:open-files', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return { canceled: true, filePaths: [] };
    const result = await dialog.showOpenDialog(win, {
      title: '选择要导入的文档',
      filters: [
        { name: '文档文件', extensions: ['txt', 'doc', 'docx', 'xls', 'xlsx'] },
      ],
      properties: ['openFile', 'multiSelections'],
    });
    return { canceled: result.canceled, filePaths: result.filePaths };
  });

  ipcMain.handle('doc:search', async (_event, { query }) => {
    return searchDocs(query);
  });

  ipcMain.handle('doc:get-all', async () => {
    return getAllDocs();
  });

  ipcMain.handle('doc:get-by-id', async (_event, { id }) => {
    return getDocById(id);
  });

  ipcMain.handle('doc:delete', async (_event, { id }) => {
    return deleteDoc(id);
  });

  ipcMain.handle('doc:get-categories', async () => {
    return getCategories();
  });

  ipcMain.handle('doc:update-tags', async (_event, { id, tags }) => {
    return updateDocTags(id, tags);
  });

  ipcMain.handle('doc:update-category', async (_event, { id, category }) => {
    return updateDocCategory(id, category);
  });

  ipcMain.handle('shell:open-path', async (_event, { filePath }) => {
    const error = await shell.openPath(filePath);
    return { error };
  });

  ipcMain.handle('app:data-dir', async () => {
    return getDataDir();
  });

  ipcMain.handle('win:minimize', () => {
    BrowserWindow.getFocusedWindow()?.minimize();
  });

  ipcMain.handle('win:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) {
      win.unmaximize();
    } else {
      win?.maximize();
    }
  });

  ipcMain.handle('win:close', () => {
    BrowserWindow.getFocusedWindow()?.close();
  });

  ipcMain.handle('win:is-maximized', () => {
    return BrowserWindow.getFocusedWindow()?.isMaximized() ?? false;
  });

  ipcMain.handle('doc:export-all', async () => {
    const docs = getAllDocs();
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: '打包导出所有文档',
      defaultPath: `docmanager-export-${new Date().toISOString().slice(0, 10)}.zip`,
      filters: [{ name: 'ZIP 压缩包', extensions: ['zip'] }],
    });

    if (canceled || !filePath) return { success: false, reason: 'canceled' };

    return new Promise((resolve) => {
      const output = createWriteStream(filePath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', () => {
        resolve({ success: true, path: filePath, size: archive.pointer() });
      });

      archive.on('error', (err: Error) => {
        resolve({ success: false, reason: err.message });
      });

      archive.pipe(output);

      const cats = new Map<string, typeof docs>();
      for (const doc of docs) {
        const list = cats.get(doc.category) || [];
        list.push(doc);
        cats.set(doc.category, list);
      }

      for (const [cat, catDocs] of cats) {
        for (const doc of catDocs) {
          const ext = doc.fileType === 'txt' ? 'txt' : doc.fileType === 'docx' ? 'docx' : 'xlsx';
          archive.append(doc.content, { name: `${cat}/${doc.fileName.replace(/\.[^.]+$/, '')}.${ext}` });
        }
      }

      archive.finalize();
    });
  });
}
