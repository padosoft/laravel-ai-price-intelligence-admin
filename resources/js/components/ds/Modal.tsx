import { useEffect, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number | string;
}

/** Centered modal with overlay + ESC-to-close (ported from ui.jsx). */
export function Modal({ open, onClose, title, sub, children, footer, width }: ModalProps) {
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
      <div className="modal" role="dialog" aria-modal="true" style={width ? { width } : undefined}>
        {title && (
          <div className="modal-head">
            <h2 className="modal-title">{title}</h2>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>
  );
}
