import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: ReactNode;
  sub?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  width?: number | string;
}

const FOCUSABLE_SELECTOR =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Centered modal with overlay + ESC-to-close, focus-trap, and aria-labelledby (ported from ui.jsx). */
export function Modal({ open, onClose, title, sub, children, footer, width }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus management: move focus in on open, trap Tab, restore previous focus on close.
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusable = () =>
      dialog ? Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];
    focusable()[0]?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = focusable();
      if (els.length === 0) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === els[0]) { e.preventDefault(); els[els.length - 1].focus(); }
      } else {
        if (document.activeElement === els[els.length - 1]) { e.preventDefault(); els[0].focus(); }
      }
    };
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', trap);
      prev?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={width ? { width } : undefined}
      >
        {title && (
          <div className="modal-head">
            <h2 id={titleId} className="modal-title">{title}</h2>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </>
  );
}
