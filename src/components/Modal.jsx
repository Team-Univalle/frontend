import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  title,
  onClose,
  busy = false,
  className = '',
  children,
  footer = null,
  role = 'dialog',
}) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const lastFocused = useRef(null);
  const busyRef = useRef(busy);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    busyRef.current = busy;
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    lastFocused.current = document.activeElement;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const inicial = dialog?.querySelector(FOCUSABLE);
    (inicial ?? dialog)?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape' && !busyRef.current) {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = Array.from(dialog.querySelectorAll(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const primero = items[0];
      const ultimo = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        primero.focus();
      } else if (event.shiftKey && document.activeElement === primero) {
        event.preventDefault();
        ultimo.focus();
      } else if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflowPrevio;
      lastFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal ${className}`.trim()}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
