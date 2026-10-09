import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import Modal from './Modal';
import { getDailyLimit, saveDailyLimit } from '../services/limitService';
import {
  LIMITE_MAX,
  LIMITE_MIN,
  LIMITE_POR_DEFECTO,
  aNumero,
  formatHoras,
  textoHoras,
  validarLimite,
} from '../utils/limite';
import './LimiteDiarioModal.css';

function vistaPrevia(limite, programadas) {
  const diferencia = programadas - limite;
  const horasHoy = formatHoras(programadas);
  const horasLimite = formatHoras(limite);

  if (Math.abs(diferencia) < 1e-9) {
    return {
      titulo: `Con ${textoHoras(limite)}, hoy llegarías justo a tu límite.`,
      detalle: `Hoy tienes ${horasHoy} h programadas, así que no hay exceso. Desde ahora te avisaremos si un día supera las ${horasLimite} h.`,
    };
  }
  if (diferencia > 0) {
    return {
      titulo: `Con ${textoHoras(limite)}, hoy superarías tu límite por ${formatHoras(diferencia)} h.`,
      detalle: `Hoy tienes ${horasHoy} h programadas. No movemos tus gestiones; te avisaremos si un día supera las ${horasLimite} h.`,
      alerta: true,
    };
  }
  return {
    titulo: `Con ${textoHoras(limite)}, hoy te quedarían ${formatHoras(-diferencia)} h libres.`,
    detalle: `Hoy tienes ${horasHoy} h programadas. Desde ahora te avisaremos si un día supera las ${horasLimite} h.`,
  };
}

export default function LimiteDiarioModal({ open, programadasHoy, onClose, onSaved }) {
  const formId = useId();
  const inputId = useId();
  const mensajeId = useId();

  const [estado, setEstado] = useState('cargando'); // cargando | listo | error-carga
  const [guardado, setGuardado] = useState(null); // límite guardado en el BE (null = sin configurar)
  const [valor, setValor] = useState('');
  const [tocado, setTocado] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const enCurso = useRef(false);
  const solicitud = useRef(0);

  const cargar = useCallback(async () => {
    const id = ++solicitud.current;
    const token = localStorage.getItem('token');
    setEstado('cargando');
    try {
      const { limite } = await getDailyLimit();
      if (id !== solicitud.current || token !== localStorage.getItem('token')) return;
      setGuardado(limite);
      setValor(String(limite ?? LIMITE_POR_DEFECTO));
      setEstado('listo');
    } catch {
      if (id !== solicitud.current) return;
      setEstado('error-carga');
    }
  }, []);

  const invalidateRequest = useCallback(() => { solicitud.current++; }, []);
  useEffect(() => {
    if (!open) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setTocado(false);
      setSaveError(false);
      setFieldError('');
      setSaving(false);
      cargar();
    });
    return () => { active = false; invalidateRequest(); };
  }, [open, cargar, invalidateRequest]);

  const error = validarLimite(valor);
  const mostrarError = fieldError || (tocado && error);
  const hayProgramadas = Number.isFinite(programadasHoy);
  const preview =
    estado === 'listo' && !error && hayProgramadas && (guardado !== null || tocado)
      ? vistaPrevia(aNumero(valor), programadasHoy)
      : null;

  async function guardar(event) {
    event?.preventDefault();
    if (enCurso.current || estado !== 'listo') return;
    setTocado(true);
    if (error) return;

    enCurso.current = true;
    setSaving(true);
    setSaveError(false);
    setFieldError('');
    const token = localStorage.getItem('token');
    try {
      const { limite } = await saveDailyLimit(aNumero(valor));
      if (token !== localStorage.getItem('token')) return;
      onSaved(limite);
    } catch (err) {
      const message = err?.data?.fields?.daily_limit_hours;
      if (message) setFieldError(Array.isArray(message) ? message.join(' ') : message);
      setSaveError(err.message || 'Intenta nuevamente.');
    } finally {
      enCurso.current = false;
      setSaving(false);
    }
  }

  function handleChange(event) {
    setValor(event.target.value);
    setTocado(true);
    setSaveError(false);
    setFieldError('');
  }

  let footer;
  if (estado === 'listo') {
    footer = (
      <>
        <button className="modal-btn" type="button" onClick={onClose} disabled={saving}>
          Cancelar
        </button>
        <button
          className="modal-btn modal-btn--primary"
          type="submit"
          form={formId}
          disabled={saving || Boolean(error)}
        >
          {saving ? 'Guardando...' : 'Guardar límite'}
        </button>
      </>
    );
  } else if (estado === 'cargando') {
    footer = (
      <>
        <button className="modal-btn" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="modal-btn modal-btn--primary" type="button" disabled>
          Guardar límite
        </button>
      </>
    );
  } else {
    footer = (
      <button className="modal-btn" type="button" onClick={onClose}>
        Cancelar
      </button>
    );
  }

  return (
    <Modal open={open} title="Límite diario de horas" onClose={onClose} busy={saving} footer={footer}>
      {estado === 'cargando' && (
        <div className="limite-cargando" role="status">
          <p>Cargando tu límite diario...</p>
          <span className="limite-skeleton limite-skeleton--largo" />
          <span className="limite-skeleton limite-skeleton--medio" />
          <span className="limite-skeleton limite-skeleton--corto" />
          <span className="limite-skeleton limite-skeleton--campo" />
        </div>
      )}

      {estado === 'error-carga' && (
        <div className="limite-banner limite-banner--error" role="alert">
          <strong>No pudimos cargar tu límite diario</strong>
          <p>Revisa tu conexión e inténtalo de nuevo.</p>
          <button className="limite-banner__accion" type="button" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {estado === 'listo' && (
        <form id={formId} onSubmit={guardar} noValidate>
          {saveError && (
            <div className="limite-banner limite-banner--error" role="alert">
              <strong>No pudimos guardar tu límite diario</strong>
              <p>{saveError}</p>
              <p>
                Tu valor de {formatHoras(aNumero(valor))} horas sigue aquí. Revisa tu conexión e
                inténtalo de nuevo.
              </p>
              <button className="limite-banner__accion" type="button" onClick={guardar}>
                Reintentar
              </button>
            </div>
          )}

          <p className="limite-intro">
            Es el máximo de horas de gestión que quieres planificar cada día. Es un ajuste personal
            y no mueve las gestiones que ya tienes.
          </p>

          {guardado === null && (
            <div className="limite-banner limite-banner--info">
              Todavía no has guardado un límite. Usamos {LIMITE_POR_DEFECTO} horas por día.
            </div>
          )}

          <div className="limite-campo">
            <label htmlFor={inputId}>Horas por día</label>
            <div className="limite-campo__fila">
              <input
                id={inputId}
                type="number"
                inputMode="decimal"
                min={LIMITE_MIN}
                max={LIMITE_MAX}
                value={valor}
                onChange={handleChange}
                disabled={saving}
                aria-invalid={mostrarError ? true : undefined}
                aria-describedby={mensajeId}
                autoFocus
              />
              <span>horas/día</span>
            </div>

            {mostrarError ? (
              <p id={mensajeId} className="limite-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" /> {mostrarError}
              </p>
            ) : saving ? (
              <p id={mensajeId} className="limite-guardando" role="status">
                <span className="limite-spinner" aria-hidden="true" /> Guardando límite...
              </p>
            ) : (
              <p id={mensajeId} className="limite-ayuda">
                Elige entre {LIMITE_MIN} y {LIMITE_MAX} horas. Si no configuras un límite, usaremos{' '}
                {LIMITE_POR_DEFECTO} horas por día.
              </p>
            )}
          </div>

          {preview && !saving && (
            <div
              className={`limite-banner limite-banner--vista${preview.alerta ? ' limite-banner--alerta' : ''}`}
              aria-live="polite"
            >
              <strong>{preview.titulo}</strong>
              <p>{preview.detalle}</p>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
