import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { ImportedDoc, SearchResult } from '../../types';
import './SearchResults.css';

function highlightText(text: string, query: string): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark>$1</mark>',
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EDITABLE_TAGS = ['登录凭证', '网址链接', '联系方式', '操作指南'];

export default function SearchResults() {
  const {
    documents,
    searchResults,
    searchQuery,
    activeCategory,
    fileNameQuery,
    categories,
    openPreview,
    openPreviewWithHighlight,
    deleteDoc,
    updateDocTags,
    updateDocCategory,
  } = useAppStore();

  const [contextMenu, setContextMenu] = useState<{
    doc: ImportedDoc;
    x: number;
    y: number;
  } | null>(null);
  const [newCatInput, setNewCatInput] = useState('');

  // Client-side filter by sidebar state
  const sidebarFiltered = useMemo(() => {
    let docs = documents;
    if (activeCategory) {
      docs = docs.filter((d) => d.category === activeCategory);
    }
    if (fileNameQuery.trim()) {
      const q = fileNameQuery.toLowerCase();
      docs = docs.filter((d) => d.fileName.toLowerCase().includes(q));
    }
    return docs;
  }, [documents, activeCategory, fileNameQuery]);

  // If search active, further filter search results to only include sidebar-filtered docs
  const items: Array<{ doc: ImportedDoc; matches: SearchResult['matches'] }> =
    searchQuery
      ? searchResults.filter((r) =>
          sidebarFiltered.some((d) => d.id === r.doc.id),
        )
      : sidebarFiltered.map((d) => ({ doc: d, matches: [] }));

  const handleTitleClick = useCallback(
    (doc: ImportedDoc) => {
      setContextMenu(null);
      openPreview(doc);
    },
    [openPreview],
  );

  const handleSnippetClick = useCallback(
    (e: React.MouseEvent, doc: ImportedDoc, match: SearchResult['matches'][0]) => {
      e.stopPropagation();
      setContextMenu(null);
      openPreviewWithHighlight(doc, searchQuery, match.position);
    },
    [openPreviewWithHighlight, searchQuery],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, doc: ImportedDoc) => {
      e.preventDefault();
      setContextMenu({ doc, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
    setNewCatInput('');
  }, []);

  const handleOpenWithSystem = useCallback(async () => {
    if (!contextMenu) return;
    await window.electronAPI.openPath(contextMenu.doc.originalPath);
    setContextMenu(null);
  }, [contextMenu]);

  const handleToggleTag = useCallback(
    async (tag: string) => {
      if (!contextMenu) return;
      const doc = contextMenu.doc;
      const newTags = doc.tags.includes(tag)
        ? doc.tags.filter((t) => t !== tag)
        : [...doc.tags, tag];
      await updateDocTags(doc.id, newTags);
      setContextMenu(null);
    },
    [contextMenu, updateDocTags],
  );

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

  if (items.length === 0) {
    return (
      <div className="results-empty" onClick={closeContextMenu}>
        {documents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">&#x1F4E5;</span>
            <p>还没有导入任何文档</p>
            <p className="empty-hint">拖放文件到上方区域开始使用</p>
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">&#x1F50E;</span>
            <p>
              {searchQuery
                ? `未找到匹配 "${searchQuery}" 的文档`
                : '没有符合条件的文档'}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="results-list" onClick={closeContextMenu}>
      {items.map(({ doc, matches }) => (
        <div
          key={doc.id}
          className="result-item"
          onContextMenu={(e) => handleContextMenu(e, doc)}
        >
          <div
            className="result-header"
            onClick={() => handleTitleClick(doc)}
          >
            <span className={`result-type result-type-${doc.fileType}`}>
              {doc.fileType.toUpperCase()}
            </span>
            <span className="result-name">{doc.fileName}</span>
            <span className="result-category">{doc.category}</span>
          </div>

          {matches.length > 0 && (
            <div className="result-snippets">
              {matches.slice(0, 3).map((m, i) => (
                <div
                  key={i}
                  className="result-snippet"
                  onClick={(e) => handleSnippetClick(e, doc, m)}
                  dangerouslySetInnerHTML={{
                    __html: highlightText(m.snippet, searchQuery),
                  }}
                />
              ))}
            </div>
          )}

          {!searchQuery && (
            <div
              className="result-preview-line"
              onClick={() => handleTitleClick(doc)}
            >
              {doc.contentPreview}
            </div>
          )}

          <div className="result-meta">
            <span>{formatDate(doc.importedAt)}</span>
            <span>{formatSize(doc.fileSize)}</span>
            {doc.tags.map((t) => (
              <span key={t} className="result-tag">{t}</span>
            ))}
            <button
              className="result-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`确定删除 "${doc.fileName}" 吗？`)) {
                  deleteDoc(doc.id);
                }
              }}
            >
              删除
            </button>
          </div>
        </div>
      ))}

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          className="context-menu-overlay"
          onClick={closeContextMenu}
          onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
        >
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="context-menu-item" onClick={handleOpenWithSystem}>
              &#x1F4C2; 用默认程序打开
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-label">移动到分类</div>
            {categories.map((cat) => (
              <div
                key={cat}
                className={`context-menu-item ${
                  contextMenu.doc.category === cat ? 'context-tag-active' : ''
                }`}
                onClick={() => handleChangeCategory(cat)}
              >
                {contextMenu.doc.category === cat ? '✓ ' : '  '}
                {cat}
              </div>
            ))}
            <div className="context-menu-input-row">
              <input
                className="context-menu-input"
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
                className="context-menu-confirm"
                onClick={handleNewCategory}
                disabled={!newCatInput.trim()}
              >
                确定
              </button>
            </div>
            <div className="context-menu-divider" />
            <div className="context-menu-label">标签</div>
            {EDITABLE_TAGS.map((tag) => (
              <div
                key={tag}
                className={`context-menu-item context-tag-item ${
                  contextMenu.doc.tags.includes(tag) ? 'context-tag-active' : ''
                }`}
                onClick={() => handleToggleTag(tag)}
              >
                {contextMenu.doc.tags.includes(tag) ? '✓ ' : '  '}
                {tag}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
