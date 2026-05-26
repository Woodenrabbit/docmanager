import { useCallback, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import './DropZone.css';

export default function DropZone() {
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
      if (e.dataTransfer.files) {
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
      }

      if (files.length > 0) {
        await importFiles(files);
      }
    },
    [importFiles],
  );

  return (
    <div
      className={`dropzone ${isDragOver ? 'dropzone-active' : ''} ${isImporting ? 'dropzone-importing' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isImporting ? (
        <div className="dropzone-content">
          <span className="dropzone-spinner" />
          <p>正在导入文档...</p>
        </div>
      ) : (
        <div className="dropzone-content">
          <span className="dropzone-icon">&#x1F4C4;</span>
          <p>拖放 <strong>txt / doc / docx / xls / xlsx</strong> 文件到此处</p>
          <p className="dropzone-hint">自动解析内容并分类归档</p>
        </div>
      )}
    </div>
  );
}
