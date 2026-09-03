import { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

let toastIdCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((msg) => addToast(msg, 'success'), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error', 6000), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info'), [addToast]);

  return { toasts, success, error, info, removeToast };
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => {
        const Icon = icons[t.type] || Info;
        return (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => onRemove(t.id)}
          >
            <Icon size={18} />
            <span style={{ flex: 1 }}>{t.message}</span>
            <X size={14} style={{ opacity: 0.6 }} />
          </div>
        );
      })}
    </div>
  );
}
