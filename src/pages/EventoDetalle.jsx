import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Pencil,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import PlanLogistico from '../components/PlanLogistico';
import {
  deleteEvent,
  getEvent,
  mapEventFieldErrors,
  updateEvent,
} from '../services/eventsService';
import {
  createSubtask,
  deleteSubtask,
  getSubtasks,
  mapSubtaskFieldErrors,
  rescheduleSubtask,
  updateSubtask,
} from '../services/subtasksService';
import { checkConflict } from '../services/conflictsService';
import { notifyPlanningUpdated } from '../services/planningEvents';
import { validateEvent } from '../utils/validateEvent';
import { validateSubtask, validateFechaObjetivo } from '../utils/validateSubtask';
import './EventoDetalle.css';

const EMPTY_SUBTASK = {
  gestion: '',
  fechaObjetivo: '',
  horasEstimadas: '',
  estado: 'Pendiente',
};

const CAMPOS_SUBTAREA = ['gestion', 'fechaObjetivo', 'horasEstimadas', 'estado'];
const borradorKey = (eventId, subtaskId) => `borrador-subtarea:${eventId}:${subtaskId ?? 'nueva'}`;

function leerBorrador(key) {
  try { const raw = sessionStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
function guardarBorrador(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* sin almacenamiento */ }
}
function borrarBorrador(key) {
  try { sessionStorage.removeItem(key); } catch { /* sin almacenamiento */ }
}
function subtareaADraft(item) {
  return {
    gestion: item.gestion, fechaObjetivo: item.fechaObjetivo,
    horasEstimadas: String(item.horasEstimadas), estado: item.estado
  };
}
function recuperarBorrador(key, base) {
  const guardado = leerBorrador(key);
  const hayCambios = guardado && CAMPOS_SUBTAREA.some(
    (c) => String(guardado[c] ?? '') !== String(base[c] ?? ''));
  return hayCambios ? { ...base, ...guardado } : null;
}

function ordenarSubtasks(lista) {
  return [...lista].sort((a, b) => a.fechaObjetivo.localeCompare(b.fechaObjetivo));
}


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
  const [isEventEditOpen, setIsEventEditOpen] = useState(Boolean(location.state?.edit && location.state?.event));
  const [eventDraft, setEventDraft] = useState(location.state?.event ?? null);
  const [eventErrors, setEventErrors] = useState({});
  const [eventSaving, setEventSaving] = useState(false);
  const [eventSubmitError, setEventSubmitError] = useState('');
  const [eventDeleteOpen, setEventDeleteOpen] = useState(false);
  const [eventDeleting, setEventDeleting] = useState(false);
  const [eventDeleteError, setEventDeleteError] = useState('');

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [draft, setDraft] = useState(EMPTY_SUBTASK);
  const [draftErrors, setDraftErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [subtaskToDelete, setSubtaskToDelete] = useState(null);
  const [subtaskDeleteError, setSubtaskDeleteError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [conflict, setConflict] = useState(null);
  const [draftRecovered, setDraftRecovered] = useState(false);
  const [reprogramId, setReprogramId] = useState(null);
  const [reprogramFecha, setReprogramFecha] = useState('');
  const [reprogramError, setReprogramError] = useState('');
  const [reprogramSubmitError, setReprogramSubmitError] = useState('');
  const [reprogramSaving, setReprogramSaving] = useState(false);
  const [reprogramConflict, setReprogramConflict] = useState(null);
  const reprogramEnCurso = useRef(false);
  const saveEnCurso = useRef(false);

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
      setSubtasks(ordenarSubtasks(Array.isArray(response) ? response : response?.results ?? []));
    } catch {
      setLoadError('No fue posible cargar las subtareas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const refrescarSubtasks = useCallback(async () => {
    try {
      const response = await getSubtasks(id);
      setSubtasks(ordenarSubtasks(Array.isArray(response) ? response : response?.results ?? []));
    } catch {
      /* se conserva lo ya mostrado */
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;

    Promise.allSettled([getEvent(id), getSubtasks(id)]).then(([eventResult, subtasksResult]) => {
      if (ignore) return;

      if (eventResult.status === 'fulfilled') {
        setEventData((current) => ({ ...eventResult.value, limite: current?.limite ?? 6 }));
        if (location.state?.edit) {
          setEventDraft(eventResult.value);
          setIsEventEditOpen(true);
        }
      } else {
        setEventLoadError(eventResult.reason?.message || 'No fue posible cargar el evento.');
      }
      setEventLoading(false);

      if (subtasksResult.status === 'fulfilled') {
        const response = subtasksResult.value;
        setSubtasks(ordenarSubtasks(Array.isArray(response) ? response : response?.results ?? []));
      } else {
        setLoadError('No fue posible cargar las subtareas.');
      }
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [id, location.state?.edit]);

  function openCreateForm() {
    const recuperado = recuperarBorrador(borradorKey(id, null), EMPTY_SUBTASK);
    setEditingSubtaskId(null);
    setDraft(recuperado ?? EMPTY_SUBTASK);
    setDraftRecovered(Boolean(recuperado));
    setDraftErrors({});
    setSubmitError('');
    setConflict(null);
    setIsFormOpen(true);
  }

  function openEditSubtask(item) {
    const base = subtareaADraft(item);
    const recuperado = recuperarBorrador(borradorKey(id, item.id), base);
    setEditingSubtaskId(item.id);
    setDraft(recuperado ?? base);
    setDraftRecovered(Boolean(recuperado));
    setDraftErrors({});
    setSubmitError('');
    setConflict(null);
    setIsFormOpen(true);
  }

  function closeSubtaskForm() {
    setIsFormOpen(false);
    setEditingSubtaskId(null);
    setDraft(EMPTY_SUBTASK);
    setDraftErrors({});
    setSubmitError('');
    setConflict(null);
    setDraftRecovered(false);
  }

  function restoreOriginalSubtask() {
    const original = subtasks.find((item) => item.id === editingSubtaskId);
    if (!original) return;
    setDraft(subtareaADraft(original));
    setDraftErrors({});
    setSubmitError('');
    setConflict(null);
    setDraftRecovered(false);
    borrarBorrador(borradorKey(id, editingSubtaskId));
  }

  useEffect(() => {
    if (isFormOpen) guardarBorrador(borradorKey(id, editingSubtaskId), draft);
  }, [id, isFormOpen, editingSubtaskId, draft]);

  function handleDraftChange(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (field === 'fechaObjetivo' || field === 'horasEstimadas') setConflict(null);
    if (draftErrors[field]) {
      setDraftErrors((current) => ({ ...current, [field]: undefined }));
    }
  }
  async function handleSaveSubtask(eventObject) {
    eventObject.preventDefault();
    if (saveEnCurso.current) return;
    const errors = validateSubtask(draft, eventData?.fecha);
    if (Object.keys(errors).length > 0) {
      setDraftErrors(errors);
      return;
    }

    saveEnCurso.current = true;
    setSaving(true);
    setSubmitError('');
    setConflict(null);
    try {
      // Reprogramar (cambiar fecha u horas): el servidor decide si hay exceso de capacidad
      const original = editingSubtaskId ? subtasks.find((item) => item.id === editingSubtaskId) : null;
      const reprograma = Boolean(original) && (
        draft.fechaObjetivo !== original.fechaObjetivo ||
        Number(draft.horasEstimadas) !== Number(original.horasEstimadas)
      );

      if (reprograma) {
        let evaluacion;
        try {
          evaluacion = await checkConflict({
            date: draft.fechaObjetivo,
          });
        } catch (error) {
          setSubmitError(`No se pudo verificar la capacidad del día. ${error?.message || 'Intenta nuevamente.'}`);
          return;
        }
        if (evaluacion.conflict) {
          setConflict(evaluacion);
          return;
        }
      }
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
      setNotice(editingSubtaskId ? 'Cambios guardados.' : 'Subtarea creada correctamente.');
      notifyPlanningUpdated();
      refrescarSubtasks();
      borrarBorrador(borradorKey(id, editingSubtaskId));
      closeSubtaskForm();
    } catch (error) {
      if (error?.data?.fields) {
        setDraftErrors(mapSubtaskFieldErrors(error.data.fields));
      }
      setSubmitError(
        `${editingSubtaskId ? 'No se pudo actualizar la subtarea.' : 'No se pudo crear la subtarea.'} ${error?.message || 'Intenta nuevamente.'}`
      );
    } finally {
      saveEnCurso.current = false;
      setSaving(false);
    }
  }

  function openReprogram(item) {
    setReprogramId(item.id);
    setReprogramFecha(item.fechaObjetivo);
    setReprogramError('');
    setReprogramSubmitError('');
    setReprogramConflict(null);
  }

  function cancelReprogram() {
    if (reprogramEnCurso.current) return;
    setReprogramId(null);
    setReprogramFecha('');
    setReprogramError('');
    setReprogramSubmitError('');
    setReprogramConflict(null);
  }

  function handleReprogramChange(value) {
    setReprogramFecha(value);
    setReprogramError('');
    setReprogramSubmitError('');
    setReprogramConflict(null);
  }

  async function handleReprogramSubmit(eventObject) {
    eventObject.preventDefault();
    if (reprogramEnCurso.current) return;
    const original = subtasks.find((item) => item.id === reprogramId);
    if (!original) return;

    const errorFecha = validateFechaObjetivo(reprogramFecha, eventData?.fecha);
    if (errorFecha) {
      setReprogramError(errorFecha);
      return;
    }
    if (reprogramFecha === original.fechaObjetivo) {
      cancelReprogram();
      return;
    }

    reprogramEnCurso.current = true;
    setReprogramSaving(true);
    setReprogramSubmitError('');
    setReprogramConflict(null);
    try {
      const evaluacion = await checkConflict({ date: reprogramFecha });
      if (evaluacion.conflict) {
        setReprogramConflict(evaluacion);
        return;
      }
      const saved = await rescheduleSubtask(reprogramId, reprogramFecha);
      if (String(saved.fechaObjetivo).slice(0, 10) !== reprogramFecha) {
        throw new Error('El servidor no confirmó la nueva fecha.');
      }
      const idReprogramado = reprogramId;
      setSubtasks((current) =>
        ordenarSubtasks(
          current.map((item) =>
            item.id === idReprogramado ? { ...item, fechaObjetivo: reprogramFecha } : item
          )
        )
      );
      borrarBorrador(borradorKey(id, idReprogramado));
      setReprogramId(null);
      setReprogramFecha('');
      setNotice('Cambios guardados.');
      notifyPlanningUpdated();
      refrescarSubtasks();
    } catch (error) {
      if (error?.status === 409) {
        setReprogramSubmitError(`El servidor rechazó la propuesta por sobrecarga. ${error.message} Cambia la fecha o reduce las horas.`);
      } else {
        if (error?.data?.fields) {
          const campos = mapSubtaskFieldErrors(error.data.fields);
          if (campos.fechaObjetivo) setReprogramError(campos.fechaObjetivo);
        }
        setReprogramSubmitError(
          `No se pudo reprogramar la gestión. ${error?.message || 'Intenta nuevamente.'}`
        );
      }
    } finally {
      reprogramEnCurso.current = false;
      setReprogramSaving(false);
    }
  }

  function requestDeleteSubtask(item) {
    setSubtaskToDelete(item);
    setSubtaskDeleteError('');
  }

  async function confirmDeleteSubtask() {
    setDeletingId(subtaskToDelete.id);
    setSubtaskDeleteError('');
    try {
      await deleteSubtask(subtaskToDelete.id);
      setSubtasks((current) => current.filter((subtask) => subtask.id !== subtaskToDelete.id));
      borrarBorrador(borradorKey(id, subtaskToDelete.id));
      if (editingSubtaskId === subtaskToDelete.id) closeSubtaskForm();
      setSubtaskToDelete(null);
      setNotice('Subtarea eliminada correctamente.');
    } catch (error) {
      setSubtaskDeleteError(error?.message || 'No se pudo eliminar la subtarea.');
    } finally {
      setDeletingId(null);
    }
  }

  function requestDeleteEvent() {
    setEventDeleteError('');
    setEventDeleteOpen(true);
  }

  async function confirmDeleteEvent() {
    setEventDeleting(true);
    setEventDeleteError('');
    try {
      await deleteEvent(id);
      navigate('/eventos', { replace: true, state: { notice: 'Evento eliminado con éxito.' } });
    } catch (error) {
      setEventDeleteError(error?.message || 'No se pudo eliminar el evento.');
      setEventDeleting(false);
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
    const conflicto = subtasks.find((item) => item.fechaObjetivo > eventDraft.fecha);
    if (conflicto) {
      setEventErrors({
        fecha: `La subtarea “${conflicto.gestion}” tiene fecha posterior. Edítala antes de mover el evento.`,
      });
      return;
    }
    setEventSaving(true);
    setEventSubmitError('');
    try {
      const updated = await updateEvent(id, eventDraft);
      setEventData((current) => ({ ...updated, limite: current?.limite ?? 6 }));
      setIsEventEditOpen(false);
      setNotice('Cambios guardados.');
    } catch (error) {
      if (error?.data?.fields) {
        setEventErrors(mapEventFieldErrors(error.data.fields));
      }
      setEventSubmitError(`No se pudo actualizar el evento. ${error?.message || 'Intenta nuevamente.'}`);
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
    <main className="detalle-principal">
      <div className="detalle-contenido">
        <header className="detalle-topbar">
          <div>
            <h1 id="evento-titulo">{eventData.titulo}</h1>
            <p>{formatEventDate(eventData.fecha)} · {eventData.lugar || 'Lugar sin definir'}</p>
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
              <button className="detalle-eliminar" type="button" onClick={requestDeleteEvent}>
                <Trash2 size={15} aria-hidden="true" /> Eliminar evento
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
              <button className="boton-guardado" type="submit" disabled={eventSaving}>
                {eventSaving ? 'Guardando...' : eventSubmitError ? 'Reintentar' : 'Guardar cambios'}
              </button>
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
          onDelete={requestDeleteSubtask}
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
          editingId={editingSubtaskId}
          maxDate={eventData.fecha}
          conflict={conflict}
          original={subtasks.find((item) => item.id === editingSubtaskId) ?? null}
          onRestore={restoreOriginalSubtask}
          draftRecovered={draftRecovered}
          onReprogram={openReprogram}
          reprogramId={reprogramId}
          reprogramFecha={reprogramFecha}
          reprogramError={reprogramError}
          reprogramSubmitError={reprogramSubmitError}
          reprogramSaving={reprogramSaving}
          reprogramConflict={reprogramConflict}
          onReduceHours={() => {
            const item = subtasks.find((task) => task.id === reprogramId);
            const fecha = reprogramFecha;
            cancelReprogram();
            openEditSubtask(item);
            setDraft(subtareaADraft({ ...item, fechaObjetivo: fecha }));
          }}
          onReprogramChange={handleReprogramChange}
          onReprogramCancel={cancelReprogram}
          onReprogramSubmit={handleReprogramSubmit}
        />
      </div>

      <ConfirmDialog
        open={eventDeleteOpen}
        title="Eliminar evento"
        message={`¿Seguro que deseas eliminar “${eventData.titulo}”? También se eliminarán sus subtareas. Esta acción no se puede deshacer.`}
        loading={eventDeleting}
        error={eventDeleteError}
        onConfirm={confirmDeleteEvent}
        onCancel={() => !eventDeleting && setEventDeleteOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(subtaskToDelete)}
        title="Eliminar subtarea"
        message={`¿Seguro que deseas eliminar “${subtaskToDelete?.gestion ?? ''}”? Esta acción no se puede deshacer.`}
        loading={Boolean(deletingId)}
        error={subtaskDeleteError}
        onConfirm={confirmDeleteSubtask}
        onCancel={() => !deletingId && setSubtaskToDelete(null)}
      />
    </main>
  );
}
