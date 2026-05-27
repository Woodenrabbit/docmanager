import { useAppStore } from '../../stores/appStore';
import './AppBar.css';

export default function AppBar() {
  const { activeView, setActiveView } = useAppStore();

  return (
    <div className="app-bar">
      <div
        className={`app-bar-icon ${activeView === 'explorer' ? 'active' : ''}`}
        onClick={() => setActiveView('explorer')}
        title="文档管理"
      >
        &#x1F4C1;
      </div>

      <div
        className={`app-bar-icon ${activeView === 'import' ? 'active' : ''}`}
        onClick={() => setActiveView('import')}
        title="导入文档"
      >
        +
      </div>
    </div>
  );
}
