import { useEffect, type ReactNode } from 'react';
import { I } from './icons';

export interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}

/** Right-side drawer with overlay + ESC-to-close (ported from ui.jsx). */
export function Drawer({ open, onClose, title, children, actions }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ fontSize: 13 }}>{title}</strong>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {actions}
            <button className="iconbtn" onClick={onClose} aria-label="Close">
              <I.X size={16} />
            </button>
          </div>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}
