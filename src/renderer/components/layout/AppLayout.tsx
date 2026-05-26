import { useState, useCallback, useRef, useEffect } from 'react';
import AppBar from './AppBar';
import TitleBar from './TitleBar';
import StatusBar from './StatusBar';
import CategorySidebar from '../sidebar/CategorySidebar';
import SearchBar from '../search/SearchBar';
import DropZone from '../dropzone/DropZone';
import SearchResults from '../results/SearchResults';
import DocPreview from '../preview/DocPreview';
import './AppLayout.css';

const MIN_SIDEBAR = 160;
const MAX_SIDEBAR = 500;
const DEFAULT_SIDEBAR = 240;

export default function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 48;
      const clamped = Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, x));
      setSidebarWidth(clamped);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  return (
    <div className="app-layout" ref={containerRef}>
      <TitleBar />
      <div className="app-body">
        <AppBar />

        <div className="sidebar-panel" style={{ width: sidebarWidth }}>
          <CategorySidebar />
        </div>

        <div
          className={`sidebar-resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        />

        <main className="app-main">
          <SearchBar />
          <DropZone />
          <SearchResults />
        </main>
      </div>

      <StatusBar />

      <DocPreview />
    </div>
  );
}
