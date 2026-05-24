import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export type ToastKind = '' | 'error' | 'warn';

export interface ToastInput {
  title: string;
  body?: string;
  kind?: ToastKind;
  duration?: number;
}

interface ToastEntry extends ToastInput {
  id: string;
}

interface ToastApi {
  push: (t: ToastInput) => void;
}

const ToastContext = createContext<ToastApi>({ push: () => {} });

export function useToast(): ToastApi {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const push = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, ...t }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      t.duration ?? 3600,
    );
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
