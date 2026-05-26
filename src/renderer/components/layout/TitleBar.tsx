import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import './TitleBar.css';

export default function TitleBar() {
  const { documents } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI.isMaximized().then(setMaximized);
    const onResize = () => {
      window.electronAPI.isMaximized().then(setMaximized);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleExport = useCallback(async () => {
    if (documents.length === 0) return;
    setIsExporting(true);
    try {
      await window.electronAPI.exportAll();
    } catch {
      // silently ignore
    } finally {
      setIsExporting(false);
    }
  }, [documents.length]);

  return (
    <div className="title-bar">
      <div className="title-bar-content">
        <span className="title-bar-app-icon">&#x1F4C4;</span>
        <span className="title-bar-app-name">DocManager</span>
        {documents.length > 0 && (
          <button
            className="title-bar-export-btn"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? '打包中...' : '📦 打包导出'}
          </button>
        )}
      </div>
      <div className="title-bar-controls">
        <button className="win-btn" onClick={() => window.electronAPI.minimize()} title="最小化">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1.5" fill="currentColor"/></svg>
        </button>
        <button className="win-btn" onClick={() => window.electronAPI.maximize()} title={maximized ? '还原' : '最大化'}>
          {maximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect x="2.5" y="0.5" width="8.5" height="8.5" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              <rect x="0.5" y="3" width="7" height="7" fill="currentColor"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
          )}
        </button>
        <button className="win-btn win-btn-close" onClick={() => window.electronAPI.close()} title="关闭">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5"/></svg>
        </button>
      </div>
    </div>
  );
}
