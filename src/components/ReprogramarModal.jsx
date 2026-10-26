import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import Modal from './Modal';
import { checkConflict } from '../services/conflictsService';
import apiClient from '../services/apiClient';
import { notifyPlanningUpdated } from '../services/planningEvents';
import { validateHours, validateFechaObjetivo } from '../utils/validateSubtask';
import './ReprogramarModal.css';

const n = (val) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(val || 0);
const dateText = (date) => date ? new Date(date + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }) : '—';

function Capacity({ value }) {
  if (!value) return null;
  const conflict = value.conflict || value.total_hours > value.daily_limit;
  return (
    <div className={`rp-capacity ${conflict ? 'rp-capacity--danger' : ''}`}>
      <strong>{value.message || (conflict ? `Quedarías con ${n(value.total_hours)} horas planificadas. Exceso: ${n(value.excess || value.total_hours - value.daily_limit)} h.` : 'Capacidad disponible')}</strong>
      <div className="rp-bar">
        <span className="rp-bar-planned" style={{ width: `${Math.min(100, (value.planned_hours / Math.max(value.total_hours, value.daily_limit)) * 100)}%` }} />
        <span className="rp-bar-task" style={{ width: `${Math.min(100, (value.task_hours / Math.max(value.total_hours, value.daily_limit)) * 100)}%` }} />
      </div>
      <div className="rp-scale"><span>0 h</span><span>Límite {n(value.daily_limit)} h</span></div>
      <dl>
        <dt>Ya planificadas ese día</dt><dd>{n(value.planned_hours)} h</dd>
        <dt>Esta gestión</dt><dd>+ {n(value.task_hours)} h</dd>
        <dt>Total resultante</dt><dd>{n(value.total_hours)} h</dd>
        <dt>Tu límite diario</dt><dd>{n(value.daily_limit)} h</dd>
        {conflict && <><dt>Exceso</dt><dd>{n(value.excess || value.total_hours - value.daily_limit)} h</dd></>}
      </dl>
    </div>
  );
}

export default function ReprogramarModal({ item, eventName, maxDate, onClose, onSaved }) {
  const originalDate = item.target_date ?? item.fechaObjetivo;
  const originalHours = Number(item.estimated_hours ?? item.horasEstimadas ?? 0);
  const originalStatus = item.status ?? item.estado ?? 'Pendiente';
  const title = item.name ?? item.gestion;

  const [date, setDate] = useState(originalDate);
  const [hours, setHours] = useState(String(originalHours));
  const [stage, setStage] = useState('reprogramar');
  const [mode, setMode] = useState('mover');
  const [capacity, setCapacity] = useState(null);
  const [before, setBefore] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const pending = useRef(false);
  const sequence = useRef(0);
  const active = useRef(true);

  const effectiveDate = date;
  const hourError = validateHours(hours);
  const today = new Date().toLocaleDateString('en-CA');
  const dateError = !effectiveDate ? 'Selecciona una nueva fecha.' : validateFechaObjetivo(effectiveDate, maxDate) || (effectiveDate < today ? 'La fecha objetivo no puede ser anterior a hoy.' : '');
  const fieldError = hourError || dateError;

  useEffect(() => { const counter = sequence; active.current = true; return () => { active.current = false; counter.current++; }; }, []);

  useEffect(() => {
    if (fieldError || stage === 'conflicto') return;
    const counter = sequence;
    const id = ++counter.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      try {
        const response = await checkConflict({ date: effectiveDate, subtaskId: item.id, hours: Number(hours), status: originalStatus, originalDate});
        if (id === sequence.current && active.current) { setCapacity(response); setError(''); }
      } catch (err) { if (id === sequence.current && active.current) { setCapacity(null); setError(`No pudimos comprobar la carga. ${err.message}`); } }
      finally { if (id === sequence.current && active.current) setBusy(false); }
    }, 250);
    return () => { clearTimeout(timer); counter.current++; };
  }, [effectiveDate, hours, fieldError, item.id, originalStatus, stage]);

  function changeDate(val) { sequence.current++; setDate(val); setCapacity(null); setError(''); }
  function changeHours(val) { sequence.current++; setHours(val); setCapacity(null); setError(''); }

  async function save(e) {
    e?.preventDefault();
    if (pending.current || fieldError) return;
    sequence.current++;
    pending.current = true; setBusy(true); setError('');
    try {
      const response = await checkConflict({ date: effectiveDate, subtaskId: item.id, hours: Number(hours), status: originalStatus, originalDate });
      setCapacity(response);
      const isConflict = response.conflict || response.total_hours > response.daily_limit;

      if (isConflict) { setBefore((prev) => prev ?? response); setStage('conflicto'); return; }

      setSaving(true);
      const patch = { target_date: effectiveDate, estimated_hours: Number(hours) };
      const saved = await apiClient(`/subtasks/${item.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      if (!saved || saved.target_date !== effectiveDate) throw new Error('El servidor no confirmó los cambios.');

      notifyPlanningUpdated(); onSaved?.(saved);
    } catch (err) {
      if (err.status === 409 || err.data?.conflict) {
        const c = err.data?.conflict || capacity;
        setCapacity(c); setBefore((prev) => prev ?? c); setStage('conflicto');
      } else setError(`No pudimos guardar los cambios. ${err.message}`);
    } finally { pending.current = false; setBusy(false); setSaving(false); }
  }

  async function postpone() {
    if (pending.current) return;
    sequence.current++; pending.current = true; setBusy(true); setError('');
    try {
      const saved = await apiClient(`/subtasks/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Pospuesta' }) });
      notifyPlanningUpdated(); onSaved?.(saved);
    } catch (err) { setError(`No pudimos posponer la gestión. ${err.message}`); }
    finally { pending.current = false; setBusy(false); }
  }

  const resolve = (nextMode) => {
    setMode(nextMode);
    setStage('resolver');
    setError('');
    
    if (nextMode === 'reducir') {
      // Calcula cuántas horas restar sobre la fecha actual
      const excesoActual = capacity?.excess || Math.max(0, (capacity?.total_hours || 0) - (capacity?.daily_limit || 6));
      const horasSugeridas = Math.max(0.01, originalHours - excesoActual);
      setHours(String(horasSugeridas));
    }
  };

  const footer = (
    <>
      <small>{stage === 'resolver' ? 'Cancelar conserva la fecha y las horas originales.' : 'Si cancelas, la gestión conserva su fecha anterior.'}</small>
      <button className="modal-btn" disabled={busy} onClick={onClose}>Cancelar</button>
      {stage !== 'conflicto' && (
        <button className="modal-btn modal-btn--primary" disabled={busy || Boolean(fieldError) || (stage === 'resolver' && (!capacity || capacity.conflict || capacity.total_hours > capacity.daily_limit))} onClick={save}>
          {busy ? (saving ? 'Guardando...' : 'Comprobando...') : error ? 'Reintentar' : stage === 'resolver' ? 'Guardar cambios' : 'Guardar'}
        </button>
      )}
    </>
  );

  return (
    <Modal open title={stage === 'conflicto' ? 'Este día quedaría muy cargado' : stage === 'resolver' ? 'Resolver sobrecarga' : 'Reprogramar gestión'} role={stage === 'conflicto' ? 'alertdialog' : 'dialog'} className="rp-modal" busy={busy} onClose={onClose} footer={footer}>
      {stage !== 'conflicto' && <p className="rp-context">Gestión: <strong>{title}</strong> · {n(originalHours)} h estimadas<br />Evento: {eventName ?? item.event_name}</p>}
      {error && <div className="rp-error" role="alert">{error}<button className="modal-btn" disabled={busy || !!fieldError} onClick={save}>Reintentar</button></div>}
      
      {stage === 'conflicto' ? (
        <>
          <Capacity value={capacity} />
          <p className="rp-context">Gestión: <strong>{title}</strong> · Evento: {eventName ?? item.event_name}<br />Fecha propuesta: <strong>{dateText(effectiveDate)}</strong></p>
          <h3>¿Cómo quieres resolverlo?</h3>
          <div className="rp-options">
            <button className="rp-option-primary" onClick={() => resolve('mover')}><span><strong>Mover a otro día</strong><small>Elige un día que tenga espacio.</small></span><ArrowRight size={18} /></button>
            <button onClick={() => resolve('reducir')}><span><strong>Reducir horas</strong><small>Baja a {n(Math.max(0.01, originalHours - (capacity?.excess || 0)))} h para quedar justo en tu límite.</small></span><ArrowRight size={18} /></button>
            <button disabled={busy} onClick={postpone}><span><strong>Posponer</strong><small>Márcala como pospuesta y decide después.</small></span><ArrowRight size={18} /></button>
          </div>
        </>
      ) : (
        <form onSubmit={save} noValidate>
          {stage === 'resolver' && (
            <div className="rp-compare">
              <div className="rp-summary rp-summary--danger"><span>Antes · {dateText(before?.date)}</span><strong>{n(before?.total_hours ?? 0)} h <small>de {n(before?.daily_limit ?? 0)} h</small></strong><b>Excede por {n(before?.excess ?? 0)} h</b></div>
              <div className={`rp-summary ${capacity && (capacity.conflict || capacity.total_hours > capacity.daily_limit) ? 'rp-summary--danger' : 'rp-summary--success'}`}><span>Después · {dateText(effectiveDate)}</span><strong>{capacity ? n(capacity.total_hours) : '—'} h <small>de {capacity ? n(capacity.daily_limit) : '—'} h</small></strong><b>{capacity ? ((capacity.conflict || capacity.total_hours > capacity.daily_limit) ? `Aún excede por ${n(capacity.excess)} h` : 'Cabe en tu límite') : 'Corrige los datos'}</b></div>
            </div>
          )}
          {stage === 'resolver' && <button type="button" disabled={busy} className={`rp-choice ${mode === 'mover' ? 'rp-choice--active' : ''}`} onClick={() => { setMode('mover'); setCapacity(null); }}><strong>Mover a otro día</strong><small>La gestión sigue igual, pero otro día.</small></button>}
          {mode === 'mover' && (
            <div className={stage === 'resolver' ? 'rp-edit rp-edit--active' : 'rp-edit'}>
              <label htmlFor="rp-date">Nueva fecha</label>
              <input id="rp-date" type="date" value={date} min={today} max={maxDate} disabled={busy} onChange={(e) => changeDate(e.target.value)} aria-invalid={!!dateError} aria-describedby="rp-validation" />
              {stage === 'resolver' && before?.suggested_dates?.length > 0 && (
                <div className="rp-suggestions"><small>Días con espacio</small>{before.suggested_dates.map((day) => <button type="button" key={day.date} onClick={() => changeDate(day.date)} disabled={busy}>{dateText(day.date)} · {n(day.daily_limit - day.planned_hours)} h libres</button>)}</div>
              )}
            </div>
          )}
          {stage === 'resolver' && <button type="button" disabled={busy} className={`rp-choice ${mode === 'reducir' ? 'rp-choice--active' : ''}`} onClick={() => { setMode('reducir'); setCapacity(null); if (Number(hours) === originalHours) setHours(String(Math.max(0.01, originalHours - (before?.excess ?? 0)))); }}><strong>Reducir horas</strong><small>Baja las horas de esta gestión en el mismo día.</small></button>}
          {mode === 'reducir' && (
            <div className="rp-edit rp-edit--active">
              <label htmlFor="rp-hours">Horas estimadas</label>
              <div className="rp-hours"><input id="rp-hours" type="text" inputMode="decimal" value={hours} disabled={busy} onChange={(e) => changeHours(e.target.value)} aria-invalid={!!hourError} aria-describedby="rp-validation" /><span>horas</span></div>
            </div>
          )}
          {fieldError && <p id="rp-validation" className="rp-error" role="alert">{fieldError}</p>}
          {busy && <p role="status">{saving ? 'Guardando cambios...' : 'Comprobando disponibilidad...'}</p>}
          {stage === 'reprogramar' && <Capacity value={capacity} />}
          {stage === 'resolver' && capacity && (
            <p className={(capacity.conflict || capacity.total_hours > capacity.daily_limit) ? 'rp-error' : 'rp-formula'} aria-live="polite">
              <Check size={16} />{(capacity.conflict || capacity.total_hours > capacity.daily_limit) ? 'Todavía supera tu límite. ' : ''}{dateText(effectiveDate)}: {n(capacity.planned_hours)} h planificadas + {n(capacity.task_hours)} h = {n(capacity.total_hours)} h (límite {n(capacity.daily_limit)} h)
            </p>
          )}
        </form>
      )}
    </Modal>
  );
}