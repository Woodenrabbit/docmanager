import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import AppLayout from './components/layout/AppLayout';
import Toast from './components/layout/Toast';

export default function App() {
  const { initialize, isLoading, error, clearError, closePreview, isPreviewOpen } =
    useAppStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (isPreviewOpen) {
          closePreview();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewOpen, closePreview]);

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: '#666',
        }}
      >
        <p>DocManager 加载中...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '10px 16px',
            borderRadius: 8,
            zIndex: 200,
            fontSize: 14,
            maxWidth: 400,
          }}
        >
          <span>{error}</span>
          <button
            onClick={clearError}
            style={{
              marginLeft: 12,
              background: 'none',
              border: 'none',
              color: '#b91c1c',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            &times;
          </button>
        </div>
      )}
      <AppLayout />
      <Toast />
    </>
  );
}
