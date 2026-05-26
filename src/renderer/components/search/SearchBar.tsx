import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import './SearchBar.css';

export default function SearchBar() {
  const { search, searchQuery, isSearching, searchResults } = useAppStore();
  const [input, setInput] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      search(input);
    }, 200);
    return () => clearTimeout(timer);
  }, [input]);

  const resultCount = searchQuery ? searchResults.length : 0;

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <span className="search-icon">&#x1F50D;</span>
        <input
          type="text"
          className="search-input"
          placeholder="输入关键字搜索文档内容..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setInput('');
              search('');
            }
          }}
        />
        {isSearching && <span className="search-spinner" />}
        {input && !isSearching && (
          <button
            className="search-clear"
            onClick={() => {
              setInput('');
              search('');
            }}
          >
            &times;
          </button>
        )}
      </div>
      {searchQuery && !isSearching && (
        <span className="search-count">
          {resultCount} 条结果
        </span>
      )}
    </div>
  );
}
