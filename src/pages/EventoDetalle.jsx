import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PlanLogistico from '../components/PlanLogistico';
import { createSubtask, getSubtasks } from '../services/subtasksService';
import { validateSubtask } from '../utils/validateSubtask';
import './EventoDetalle.css';

const EMPTY_SUBTASK = {
  gestion: '',
  fechaObjetivo: '',
  horasEstimadas: '',
};

export default function EventoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const event = location.state?.event;

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_SUBTASK);
  const [draftErrors, setDraftErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

    getSubtasks(id)
      .then((response) => {
        if (!ignore) {
          setSubtasks(Array.isArray(response) ? response : response?.results ?? []);
        }
      })
      .catch(() => {
        if (!ignore) setLoadError('No fue posible cargar las subtareas.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  function openForm() {
    setDraft(EMPTY_SUBTASK);
    setDraftErrors({});
    setSubmitError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
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

  async function handleCreateSubtask(eventObject) {
    eventObject.preventDefault();
    const errors = validateSubtask(draft);
    if (Object.keys(errors).length > 0) {
      setDraftErrors(errors);
      return;
    }

    setSaving(true);
    setSubmitError('');
    try {
      const createdSubtask = await createSubtask(id, {
        gestion: draft.gestion.trim(),
        fechaObjetivo: draft.fechaObjetivo,
        horasEstimadas: Number(draft.horasEstimadas),
      });
      setSubtasks((current) => [...current, createdSubtask]);
      closeForm();
    } catch {
      setSubmitError('No fue posible guardar la subtarea. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="detalle-principal">
      <div className="detalle-contenido">
        <button className="detalle-volver" type="button" onClick={() => navigate('/crear')}>
          ← Volver
        </button>

        <section className="detalle-card" aria-labelledby="evento-titulo">
          <header className="detalle-encabezado">
            <h1 id="evento-titulo">{event?.titulo || `Evento ${id}`}</h1>
            <p>{event?.lugar || 'Detalle y organización del evento'}</p>
          </header>

          <div className="detalle-datos">
            <div className="detalle-dato">
              <span>Fecha</span>
              <strong>{event?.fecha || 'Por confirmar'}</strong>
            </div>
            <div className="detalle-dato">
              <span>Hora</span>
              <strong>{event?.hora || 'Por confirmar'}</strong>
            </div>
            <div className="detalle-dato">
              <span>Límite diario</span>
              <strong>{event?.limite ? `${event.limite} horas` : 'Por confirmar'}</strong>
            </div>
          </div>

          <div className="detalle-plan">
            <PlanLogistico
              mode="detail"
              items={subtasks}
              loading={loading}
              loadError={loadError}
              onRetry={loadSubtasks}
              onAdd={openForm}
              isFormOpen={isFormOpen}
              draft={draft}
              draftErrors={draftErrors}
              onDraftChange={handleDraftChange}
              onCancel={closeForm}
              onSubmit={handleCreateSubtask}
              saving={saving}
              submitError={submitError}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
