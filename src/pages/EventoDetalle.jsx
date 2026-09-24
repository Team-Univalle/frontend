import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  Home,
  ListChecks,
  Pencil,
  Plus,
  UserRound,
} from 'lucide-react';
import PlanLogistico from '../components/PlanLogistico';
import {
  getEvent,
  mapEventFieldErrors,
  updateEvent,
} from '../services/eventsService';
import {
  createSubtask,
  deleteSubtask,
  getSubtasks,
  mapSubtaskFieldErrors,
  updateSubtask,
} from '../services/subtasksService';
import { validateEvent } from '../utils/validateEvent';
import { validateSubtask } from '../utils/validateSubtask';
import './EventoDetalle.css';

const EMPTY_SUBTASK = {
  gestion: '',
  fechaObjetivo: '',
  horasEstimadas: '',
  estado: 'Pendiente',
};

function formatEventDate(value) {
  if (!value) return 'Fecha sin definir';
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function displayType(value) {
  if (!value) return 'Evento';
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

export default function EventoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [eventData, setEventData] = useState(location.state?.event ?? null);
  const [eventLoading, setEventLoading] = useState(!location.state?.event);
  const [eventLoadError, setEventLoadError] = useState('');
  const [notice, setNotice] = useState(location.state?.warning ?? '');
  const [isEventEditOpen, setIsEventEditOpen] = useState(false);
  const [eventDraft, setEventDraft] = useState(location.state?.event ?? null);
  const [eventErrors, setEventErrors] = useState({});
  const [eventSaving, setEventSaving] = useState(false);
  const [eventSubmitError, setEventSubmitError] = useState('');

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_SUBTASK);
  const [draftErrors, setDraftErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const completedSubtasks = subtasks.filter(
    (subtask) => String(subtask.estado).toLowerCase() === 'ejecutada'
  ).length;
  const progress = subtasks.length
    ? Math.round((completedSubtasks / subtasks.length) * 100)
    : 0;

  const loadEvent = useCallback(async () => {
    setEventLoading(true);
    setEventLoadError('');
    try {
      const response = await getEvent(id);
      setEventData((current) => ({ ...response, limite: current?.limite ?? 6 }));
    } catch (error) {
      setEventLoadError(error?.message || 'No fue posible cargar el evento.');
    } finally {
      setEventLoading(false);
    }
  }, [id]);

  const loadSubtasks = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await getSubtasks(id);
      setSubtasks(Array.isArray(response) ? response : response?.results ?? []);
    } catch {
      setLoadError('No fue posible cargar las subtareas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([getEvent(id), getSubtasks(id)]).then(([eventResult, subtasksResult]) => {
      if (ignore) return;

      if (eventResult.status === 'fulfilled') {
        setEventData((current) => ({ ...eventResult.value, limite: current?.limite ?? 6 }));
      } else {
        setEventLoadError(eventResult.reason?.message || 'No fue posible cargar el evento.');
      }
      setEventLoading(false);

      if (subtasksResult.status === 'fulfilled') {
        const response = subtasksResult.value;
        setSubtasks(Array.isArray(response) ? response : response?.results ?? []);
      } else {
        setLoadError('No fue posible cargar las subtareas.');
      }
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [id]);

  function openCreateForm() {
    setEditingSubtaskId(null);
    setDraft(EMPTY_SUBTASK);
    setDraftErrors({});
    setSubmitError('');
    setIsFormOpen(true);
  }

  function openEditSubtask(item) {
    setEditingSubtaskId(item.id);
    setDraft({
      gestion: item.gestion,
      fechaObjetivo: item.fechaObjetivo,
      horasEstimadas: String(item.horasEstimadas),
      estado: item.estado,
    });
    setDraftErrors({});
    setSubmitError('');
    setIsFormOpen(true);
  }

  function closeSubtaskForm() {
    setIsFormOpen(false);
    setEditingSubtaskId(null);
    setDraft(EMPTY_SUBTASK);
    setDraftErrors({});
    setSubmitError('');
  }

  function handleDraftChange(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (draftErrors[field]) {
      setDraftErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function handleSaveSubtask(eventObject) {
    eventObject.preventDefault();
    const errors = validateSubtask(draft);
    if (Object.keys(errors).length > 0) {
      setDraftErrors(errors);
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const payload = {
        gestion: draft.gestion.trim(),
        fechaObjetivo: draft.fechaObjetivo,
        horasEstimadas: Number(draft.horasEstimadas),
        estado: draft.estado,
      };
      const savedSubtask = editingSubtaskId
        ? await updateSubtask(editingSubtaskId, payload)
        : await createSubtask(id, payload);

      setSubtasks((current) => {
        const next = editingSubtaskId
          ? current.map((item) => (item.id === savedSubtask.id ? savedSubtask : item))
          : [...current, savedSubtask];
        return next.sort((a, b) => a.fechaObjetivo.localeCompare(b.fechaObjetivo));
      });
      setNotice(editingSubtaskId ? 'Subtarea actualizada correctamente.' : 'Subtarea creada correctamente.');
      closeSubtaskForm();
    } catch (error) {
      if (error?.data?.fields) {
        setDraftErrors(mapSubtaskFieldErrors(error.data.fields));
      }
      setSubmitError(error?.message || 'No fue posible guardar la subtarea. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSubtask(item) {
    const confirmed = window.confirm(`¿Eliminar la subtarea “${item.gestion}”?`);
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await deleteSubtask(item.id);
      setSubtasks((current) => current.filter((subtask) => subtask.id !== item.id));
      if (editingSubtaskId === item.id) closeSubtaskForm();
      setNotice('Subtarea eliminada correctamente.');
    } catch (error) {
      setNotice(`⚠ ${error?.message || 'No fue posible eliminar la subtarea.'}`);
    } finally {
      setDeletingId(null);
    }
  }

  function openEventEdit() {
    setEventDraft({ ...eventData });
    setEventErrors({});
    setEventSubmitError('');
    setIsEventEditOpen(true);
  }

  function handleEventDraftChange(eventObject) {
    const { name, value } = eventObject.target;
    setEventDraft((current) => ({ ...current, [name]: value }));
    if (eventErrors[name]) {
      setEventErrors((current) => ({ ...current, [name]: undefined }));
    }
  }

  async function handleUpdateEvent(eventObject) {
    eventObject.preventDefault();
    const errors = validateEvent(eventDraft);
    if (Object.keys(errors).length > 0) {
      setEventErrors(errors);
      return;
    }

    setEventSaving(true);
    setEventSubmitError('');
    try {
      const updated = await updateEvent(id, eventDraft);
      setEventData((current) => ({ ...updated, limite: current?.limite ?? 6 }));
      setIsEventEditOpen(false);
      setNotice('Evento actualizado correctamente.');
    } catch (error) {
      if (error?.data?.fields) {
        setEventErrors(mapEventFieldErrors(error.data.fields));
      }
      setEventSubmitError(error?.message || 'No fue posible actualizar el evento.');
    } finally {
      setEventSaving(false);
    }
  }

  if (eventLoading && !eventData) {
    return <main className="detalle-carga" role="status">Cargando evento...</main>;
  }

  if (!eventData) {
    return (
      <main className="detalle-carga detalle-carga--error" role="alert">
        <p>{eventLoadError || 'No fue posible cargar el evento.'}</p>
        <button type="button" onClick={loadEvent}>Reintentar</button>
      </main>
    );
  }

  return (
    <div className="detalle-app">
      <aside className="detalle-sidebar" aria-label="Navegación principal">
        <div className="detalle-logo">
          <span className="detalle-logo__icon"><CalendarCheck2 size={20} aria-hidden="true" /></span>
          <span><strong>Organiza</strong><small>Eventos</small></span>
        </div>

        <nav className="detalle-nav">
          <button type="button" onClick={() => navigate('/hoy')}><Home size={17} aria-hidden="true" /> <span>Hoy</span></button>
          <button className="is-active" type="button" aria-current="page"><ListChecks size={17} aria-hidden="true" /> <span>Eventos</span></button>
          <button type="button" onClick={() => navigate('/crear')}><Plus size={17} aria-hidden="true" /> <span>Crear evento</span></button>
          <button type="button" onClick={() => navigate('/progreso')}><ChartNoAxesColumnIncreasing size={17} aria-hidden="true" /> <span>Progreso</span></button>
        </nav>

        <div className="detalle-capacidad">
          <span>Capacidad diaria</span>
          <strong>{eventData.limite ?? 6} horas</strong>
          <progress value={Math.min(Number(eventData.limite ?? 6), 8)} max="8" aria-label="Capacidad diaria" />
          <small>{Math.min(Number(eventData.limite ?? 6), 8)} h programadas hoy</small>
        </div>
      </aside>

      <main className="detalle-principal">
        <div className="detalle-contenido">
          <header className="detalle-topbar">
            <div>
              <h1 id="evento-titulo">{eventData.titulo}</h1>
              <p>{formatEventDate(eventData.fecha)} · {eventData.lugar || 'Lugar sin definir'}</p>
            </div>
            <div className="detalle-usuario" aria-label="Usuario actual">
              <span><UserRound size={14} aria-hidden="true" /></span>
              <strong>Verónica</strong>
            </div>
          </header>

          {notice && (
            <div className={`detalle-aviso${notice.startsWith('⚠') ? ' detalle-aviso--error' : ''}`} role="status">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice('')} aria-label="Cerrar mensaje">×</button>
            </div>
          )}
          {eventLoadError && <div className="detalle-aviso detalle-aviso--error" role="alert">{eventLoadError}</div>}

          <section className="detalle-resumen" aria-labelledby="evento-titulo">
            <div className="detalle-resumen__encabezado">
              <div>
                <span className="detalle-tipo">{displayType(eventData.tipo)}</span>
                <p>Preparación del evento</p>
                <div className="detalle-progreso__valor">
                  <strong>{progress}%</strong>
                  <span>{completedSubtasks} de {subtasks.length} gestiones ejecutadas</span>
                </div>
              </div>
              <div className="detalle-resumen__acciones">
                <button className="detalle-editar" type="button" onClick={openEventEdit} disabled={isEventEditOpen || eventLoading}>
                  <Pencil size={15} aria-hidden="true" /> Editar evento
                </button>
                <button className="detalle-agregar" type="button" onClick={openCreateForm} disabled={isFormOpen || loading}>
                  <Plus size={16} aria-hidden="true" /> Agregar subtarea
                </button>
              </div>
            </div>
            <progress className="detalle-progreso" value={progress} max="100" aria-label={`Progreso del evento: ${progress}%`} />
          </section>

          {isEventEditOpen && (
            <form className="evento-edicion" onSubmit={handleUpdateEvent} noValidate>
              <h2>Editar evento</h2>
              <div className="evento-edicion__grid">
                {[
                  ['titulo', 'Nombre del evento', 'text'],
                  ['tipo', 'Tipo de evento', 'text'],
                  ['contacto', 'Cliente o contacto', 'text'],
                  ['lugar', 'Lugar', 'text'],
                  ['fecha', 'Fecha del evento', 'date'],
                  ['hora', 'Hora del evento', 'time'],
                ].map(([name, label, type]) => (
                  <div className="evento-edicion__campo" key={name}>
                    <label htmlFor={`editar-${name}`}>{label}</label>
                    <input id={`editar-${name}`} name={name} type={type} value={eventDraft?.[name] ?? ''} onChange={handleEventDraftChange} aria-invalid={!!eventErrors[name]} disabled={eventSaving} />
                    {eventErrors[name] && <span className="field-error">{eventErrors[name]}</span>}
                  </div>
                ))}
              </div>
              {eventSubmitError && <div className="subtarea-submit-error" role="alert">{eventSubmitError}</div>}
              <div className="evento-edicion__acciones">
                <button type="button" onClick={() => setIsEventEditOpen(false)} disabled={eventSaving}>Cancelar</button>
                <button className="boton-guardado" type="submit" disabled={eventSaving}>{eventSaving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          )}

          <PlanLogistico
            mode="detail"
            items={subtasks}
            loading={loading}
            loadError={loadError}
            onRetry={loadSubtasks}
            onAdd={openCreateForm}
            onEdit={openEditSubtask}
            onDelete={handleDeleteSubtask}
            deletingId={deletingId}
            isFormOpen={isFormOpen}
            isEditing={Boolean(editingSubtaskId)}
            draft={draft}
            draftErrors={draftErrors}
            onDraftChange={handleDraftChange}
            onCancel={closeSubtaskForm}
            onSubmit={handleSaveSubtask}
            saving={saving}
            submitError={submitError}
          />
        </div>
      </main>
    </div>
  );
}
