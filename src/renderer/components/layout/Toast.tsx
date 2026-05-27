import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import './Toast.css';

export default function Toast() {
  const { message, clearMessage } = useAppStore();

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(clearMessage, 3000);
    return () => clearTimeout(timer);
  }, [message, clearMessage]);

  if (!message) return null;

  return (
    <div className="toast" onClick={clearMessage}>
      <span className="toast-icon">&#x2713;</span>
      <span>{message}</span>
    </div>
  );
}
