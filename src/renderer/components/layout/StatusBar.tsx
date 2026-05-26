import { useAppStore } from '../../stores/appStore';
import './StatusBar.css';

export default function StatusBar() {
  const { documents, activeCategory, searchQuery, categories } = useAppStore();

  const filteredCount = activeCategory
    ? documents.filter((d) => d.category === activeCategory).length
    : documents.length;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          文档: <span className="status-count">{documents.length}</span>
        </span>
        {activeCategory && (
          <span className="status-item">
            分类: {activeCategory} ({filteredCount})
          </span>
        )}
        {searchQuery && (
          <span className="status-item">
            搜索: "{searchQuery}"
          </span>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">分类数: {categories.length}</span>
      </div>
    </div>
  );
}
