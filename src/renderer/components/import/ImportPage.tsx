import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import './ImportPage.css';

export default function ImportPage() {
  const { importFiles, isImporting } = useAppStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files: string[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files[i];
        const filePath = window.electronAPI.getFilePath(f);
        if (filePath) {
          const ext = filePath.toLowerCase();
          if (
            ext.endsWith('.txt') ||
            ext.endsWith('.doc') ||
            ext.endsWith('.docx') ||
            ext.endsWith('.xls') ||
            ext.endsWith('.xlsx')
          ) {
            files.push(filePath);
          }
        }
      }

      if (files.length > 0) {
        await importFiles(files);
      }
    },
    [importFiles],
  );

  const handleSelectFiles = useCallback(async () => {
    const result = await window.electronAPI.openFilesDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      await importFiles(result.filePaths);
    }
  }, [importFiles]);

  return (
    <div
      className={`import-page ${isDragOver ? 'import-page-dragover' : ''} ${isImporting ? 'import-page-importing' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isImporting ? (
        <div className="import-page-content">
          <div className="import-spinner" />
          <p className="import-status">正在导入文档...</p>
        </div>
      ) : (
        <div className="import-page-content">
          <div className="import-icon">&#x1F4C4;</div>
          <h2>导入文档</h2>
          <p className="import-hint">
            将文件拖放到此处，或点击下方按钮选择文件
          </p>
          <button className="import-btn" onClick={handleSelectFiles}>
            选择文件
          </button>
          <p className="import-formats">
            支持格式：txt / doc / docx / xls / xlsx
          </p>
        </div>
      )}
    </div>
  );
}
