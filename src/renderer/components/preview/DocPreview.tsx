import { useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';
import './DocPreview.css';

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function highlightQuery(text: string, query: string | null): string {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="preview-highlight">$1</mark>',
  );
}

export default function DocPreview() {
  const {
    previewDoc,
    isPreviewOpen,
    previewScrollTo,
    previewHighlight,
    closePreview,
  } = useAppStore();

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewScrollTo !== null && contentRef.current) {
      // Delay to allow render
      setTimeout(() => {
        const marks = contentRef.current?.querySelectorAll('mark.preview-highlight');
        if (marks && marks.length > 0) {
          // Find the mark closest to the target position
          let targetMark: HTMLElement | null = null;
          for (const mark of marks) {
            const htmlMark = mark as HTMLElement;
            // We can't exactly match position, so scroll to the first highlight near the position
            if (!targetMark) targetMark = htmlMark;
          }
          if (targetMark) {
            targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 100);
    }
  }, [previewScrollTo, previewDoc?.id]);

  if (!isPreviewOpen || !previewDoc) {
    return null;
  }

  const contentHtml = previewHighlight
    ? highlightQuery(previewDoc.content, previewHighlight)
    : previewDoc.content;

  return (
    <div className="preview-overlay" onClick={closePreview}>
      <div className="preview-panel" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <div className="preview-title">
            <span className={`preview-type-badge preview-type-${previewDoc.fileType}`}>
              {previewDoc.fileType.toUpperCase()}
            </span>
            <h2>{previewDoc.fileName}</h2>
          </div>
          <button className="preview-close" onClick={closePreview}>
            &times;
          </button>
        </div>

        <div className="preview-meta">
          <div className="preview-meta-item">
            <span className="preview-meta-label">分类</span>
            <span>{previewDoc.category}</span>
          </div>
          <div className="preview-meta-item">
            <span className="preview-meta-label">大小</span>
            <span>{formatSize(previewDoc.fileSize)}</span>
          </div>
          <div className="preview-meta-item">
            <span className="preview-meta-label">导入日期</span>
            <span>{formatDate(previewDoc.importedAt)}</span>
          </div>
          {previewDoc.tags.length > 0 && (
            <div className="preview-meta-item">
              <span className="preview-meta-label">标签</span>
              <span className="preview-tags">
                {previewDoc.tags.map((t) => (
                  <span key={t} className="preview-tag">{t}</span>
                ))}
              </span>
            </div>
          )}
        </div>

        <div className="preview-content" ref={contentRef}>
          <pre
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </div>
    </div>
  );
}
