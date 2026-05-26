import { useState } from 'react';
import './AppBar.css';

export default function AppBar() {
  const [active, setActive] = useState('explorer');

  return (
    <div className="app-bar">
      <div
        className={`app-bar-icon ${active === 'explorer' ? 'active' : ''}`}
        onClick={() => setActive('explorer')}
        title="文档管理"
      >
        &#x1F4C1;
      </div>
    </div>
  );
}
