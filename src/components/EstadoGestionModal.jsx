import { useId } from 'react';
import Modal from './Modal';
import { NOTA_MAX, hoyISO, nombreDe } from '../utils/estadoGestion';
import './GestionesEstado.css';

export default function EstadoGestionModal({
  open,
  accion,
  items = [],
  form,
  onChange,
  fieldErrors = {},
  error = '',
  guardando = false,
  maxDate,
  onClose,
  onConfirm,
}) {
  const idBase = useId();
  const formId = `${idBase}-form`;
  const esPosponer = accion === 'posponer';
  const total = items.length;

  const titulo = esPosponer
    ? total === 1 ? 'Posponer gestión' : `Posponer ${total} gestiones`
    : total === 1 ? 'Marcar gestión como hecha' : `Marcar ${total} gestiones como hechas`;
  const confirmar = esPosponer
    ? 'Confirmar posposición'
    : total === 1 ? 'Guardar como hecha' : 'Guardar como hechas';

  function handleSubmit(event) {
    event.preventDefault();
    if (!guardando) onConfirm();
  }

  const footer = (
    <>
      <button className="modal-btn" type="button" onClick={onClose} disabled={guardando}>
        Volver
      </button>
      <button className="modal-btn modal-btn--primary" type="submit" form={formId} disabled={guardando}>
        {guardando && <span className="ge-spinner" aria-hidden="true" />}
        {guardando ? 'Guardando...' : confirmar}
      </button>
    </>
  );

  return (
    <Modal open={open} title={titulo} onClose={onClose} busy={guardando} footer={footer}>
      <form id={formId} className="ge-modal" onSubmit={handleSubmit} noValidate>
        <p className="ge-modal__sub">Revisa la selección y confirma los cambios.</p>
        <ul className="ge-modal__lista">
          {items.map((item) => <li key={item.id}>{nombreDe(item)}</li>)}
        </ul>

        {esPosponer && (
          <div className="ge-campo">
            <label htmlFor={`${idBase}-fecha`}>Nueva fecha objetivo (opcional)</label>
            <input
              id={`${idBase}-fecha`}
              type="date"
              value={form.fecha}
              min={hoyISO()}
              max={maxDate || undefined}
              onChange={(event) => onChange('fecha', event.target.value)}
              disabled={guardando}
              aria-invalid={!!fieldErrors.fecha}
              aria-describedby={`${idBase}-fecha-ayuda${fieldErrors.fecha ? ` ${idBase}-fecha-error` : ''}`}
            />
            <small id={`${idBase}-fecha-ayuda`} className="ge-campo__ayuda">
              Si la dejas vacía, la gestión conserva su fecha actual.
            </small>
            {fieldErrors.fecha && (
              <span id={`${idBase}-fecha-error`} className="field-error">{fieldErrors.fecha}</span>
            )}
          </div>
        )}

        <div className="ge-campo">
          <label htmlFor={`${idBase}-nota`}>
            {esPosponer ? 'Nota (opcional)' : 'Nota de ejecución (opcional)'}
          </label>
          <textarea
            id={`${idBase}-nota`}
            rows={4}
            maxLength={NOTA_MAX}
            placeholder="Ej: Se pagó el 50% del depósito del salón"
            value={form.nota}
            onChange={(event) => onChange('nota', event.target.value)}
            disabled={guardando}
            aria-invalid={!!fieldErrors.nota}
            aria-describedby={`${idBase}-nota-contador${fieldErrors.nota ? ` ${idBase}-nota-error` : ''}`}
          />
          <small id={`${idBase}-nota-contador`} className="ge-campo__ayuda ge-campo__contador">
            {form.nota.length}/{NOTA_MAX}
          </small>
          {fieldErrors.nota && (
            <span id={`${idBase}-nota-error`} className="field-error">{fieldErrors.nota}</span>
          )}
        </div>

        {fieldErrors.estado && <span className="field-error">{fieldErrors.estado}</span>}

        {error && (
          <div className="ge-error" role="alert">
            <div>
              <strong>No se pudo actualizar el estado de la gestión</strong>
              <span>{error}</span>
            </div>
            <button className="modal-btn" type="submit" disabled={guardando}>
              Reintentar
            </button>
          </div>
        )}
      </form>
    </Modal>
  );
}
