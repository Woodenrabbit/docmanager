import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { ImportedDoc } from '../../types';
import './CategorySidebar.css';

export default function CategorySidebar() {
  const {
    categories,
    documents,
    activeCategory,
    setActiveCategory,
    fileNameQuery,
    setFileNameQuery,
    openPreview,
    updateDocCategory,
  } = useAppStore();

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [contextMenu, setContextMenu] = useState<{
    doc: ImportedDoc;
    x: number;
    y: number;
  } | null>(null);
  const [newCatInput, setNewCatInput] = useState('');

  const filteredDocs = useMemo(() => {
    let docs = activeCategory
      ? documents.filter((d) => d.category === activeCategory)
      : documents;
    if (fileNameQuery.trim()) {
      const q = fileNameQuery.toLowerCase();
      docs = docs.filter((d) => d.fileName.toLowerCase().includes(q));
    }
    return docs;
  }, [documents, activeCategory, fileNameQuery]);

  const groupedDocs = useMemo(() => {
    const map = new Map<string, ImportedDoc[]>();
    for (const doc of filteredDocs) {
      const list = map.get(doc.category) || [];
      list.push(doc);
      map.set(doc.category, list);
    }
    return map;
  }, [filteredDocs]);

  const toggleCollapse = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const allCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const doc of documents) {
      map.set(doc.category, (map.get(doc.category) || 0) + 1);
    }
    return map;
  }, [documents]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, doc: ImportedDoc) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ doc, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setNewCatInput('');
  }, []);

  const handleChangeCategory = useCallback(
    async (category: string) => {
      if (!contextMenu) return;
      await updateDocCategory(contextMenu.doc.id, category);
      setContextMenu(null);
      setNewCatInput('');
    },
    [contextMenu, updateDocCategory],
  );

  const handleNewCategory = useCallback(async () => {
    const name = newCatInput.trim();
    if (!name || !contextMenu) return;
    await updateDocCategory(contextMenu.doc.id, name);
    setContextMenu(null);
    setNewCatInput('');
  }, [contextMenu, newCatInput, updateDocCategory]);

  return (
    <div className="category-sidebar" onClick={closeContextMenu}>
      <div className="sidebar-search">
        <input
          type="text"
          className="sidebar-search-input"
          placeholder="搜索文件名..."
          value={fileNameQuery}
          onChange={(e) => setFileNameQuery(e.target.value)}
        />
        {fileNameQuery && (
          <button
            className="sidebar-search-clear"
            onClick={() => setFileNameQuery('')}
          >
            &times;
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <div
          className={`sidebar-all-item ${activeCategory === null ? 'sidebar-active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          <span className="sidebar-all-name">全部文档</span>
          <span className="sidebar-count">{documents.length}</span>
        </div>
      </div>

      <div className="category-tree">
        {categories.map((cat) => {
          const count = allCounts.get(cat) || 0;
          const isCollapsed = collapsedCategories.has(cat);
          const docsInCat = groupedDocs.get(cat) || [];

          return (
            <div key={cat} className={`tree-group ${isCollapsed ? 'collapsed' : ''}`}>
              <div
                className={`tree-group-header ${activeCategory === cat ? 'sidebar-active' : ''}`}
              >
                <span
                  className="tree-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCollapse(cat);
                  }}
                >
                  {isCollapsed ? '▸' : '▾'}
                </span>
                <span
                  className="tree-group-name"
                  onClick={() =>
                    setActiveCategory(cat === activeCategory ? null : cat)
                  }
                >
                  {cat}
                </span>
                <span className="sidebar-count">{count}</span>
              </div>

              {!isCollapsed && docsInCat.length > 0 && (
                <div className="tree-children">
                  {docsInCat.map((doc) => (
                    <div
                      key={doc.id}
                      className="tree-doc-item"
                      onClick={() => openPreview(doc)}
                      onContextMenu={(e) => handleContextMenu(e, doc)}
                      title={doc.fileName}
                    >
                      <span className={`tree-doc-type tree-doc-type-${doc.fileType}`}>
                        {doc.fileType}
                      </span>
                      <span className="tree-doc-name">{doc.fileName}</span>
                    </div>
                  ))}
                  {docsInCat.length === 0 && (
                    <div className="tree-empty">暂无文档</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="sidebar-context-overlay" onClick={closeContextMenu}>
          <div
            className="sidebar-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="context-menu-label">移动到分类</div>
            {categories.map((cat) => (
              <div
                key={cat}
                className={`sidebar-context-item ${
                  contextMenu.doc.category === cat ? 'sidebar-context-active' : ''
                }`}
                onClick={() => handleChangeCategory(cat)}
              >
                {contextMenu.doc.category === cat ? '✓ ' : '  '}
                {cat}
              </div>
            ))}
            <div className="sidebar-context-input-row">
              <input
                className="sidebar-context-input"
                placeholder="输入新分类..."
                value={newCatInput}
                onChange={(e) => setNewCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNewCategory();
                  e.stopPropagation();
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="sidebar-context-confirm"
                onClick={handleNewCategory}
                disabled={!newCatInput.trim()}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
