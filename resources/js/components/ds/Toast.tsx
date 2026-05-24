import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastEntry, type ToastInput } from './toast-context';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const push = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    const handle = setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      timers.current.delete(handle);
    }, t.duration ?? 3600);
    timers.current.add(handle);
  }, []);

  // Clear any pending auto-dismiss timers on unmount (no setState after unmount).
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notifications" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind ?? ''}`}>
            <b>{t.title}</b>
            {t.body && <small>{t.body}</small>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
