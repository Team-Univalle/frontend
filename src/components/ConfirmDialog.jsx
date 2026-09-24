import { AlertTriangle, X } from 'lucide-react';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  loading = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !loading) onCancel();
    }}>
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <button className="confirm-dialog__close" type="button" onClick={onCancel} disabled={loading} aria-label="Cerrar diálogo"><X size={18} /></button>
        <span className="confirm-dialog__icon"><AlertTriangle size={22} aria-hidden="true" /></span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{message}</p>
        {error && <div className="confirm-dialog__error" role="alert">{error}</div>}
        <div className="confirm-dialog__actions">
          <button type="button" onClick={onCancel} disabled={loading}>Cancelar</button>
          <button className="confirm-dialog__danger" type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : error ? 'Reintentar' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
