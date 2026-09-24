import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { deleteEvent, getEvents } from '../services/eventsService';
import './Eventos.css';

function formatDate(value) {
  if (!value) return 'Fecha sin definir';
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

export default function Eventos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice ?? '');
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await getEvents();
      setEvents(Array.isArray(response) ? response : response?.results ?? []);
    } catch (error) {
      setLoadError(error?.message || 'No fue posible cargar los eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    getEvents()
      .then((response) => {
        if (!ignore) setEvents(Array.isArray(response) ? response : response?.results ?? []);
      })
      .catch((error) => {
        if (!ignore) setLoadError(error?.message || 'No fue posible cargar los eventos.');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  function requestDelete(event) {
    setEventToDelete(event);
    setDeleteError('');
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteEvent(eventToDelete.id);
      setEvents((current) => current.filter((event) => event.id !== eventToDelete.id));
      setEventToDelete(null);
      setNotice('Evento eliminado con éxito.');
    } catch (error) {
      setDeleteError(error?.message || 'No se pudo eliminar el evento.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="eventos-page">
      <header className="eventos-header">
        <div><h1>Eventos</h1><p>Administra tus eventos y su plan logístico.</p></div>
        <button type="button" onClick={() => navigate('/crear')}><Plus size={17} /> Crear evento</button>
      </header>

      {notice && <div className="eventos-notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Cerrar mensaje">×</button></div>}

      {loading && <div className="eventos-state" role="status"><span className="eventos-spinner" /> Cargando eventos...</div>}

      {!loading && loadError && (
        <div className="eventos-state eventos-state--error" role="alert">
          <p>{loadError}</p><button type="button" onClick={loadEvents}>Reintentar</button>
        </div>
      )}

      {!loading && !loadError && events.length === 0 && (
        <div className="eventos-state eventos-state--empty">
          <span className="eventos-empty-icon"><CalendarDays size={26} /></span>
          <h2>Aún no tienes eventos</h2>
          <p>Crea tu primer evento para comenzar a organizar sus gestiones.</p>
          <button type="button" onClick={() => navigate('/crear')}><Plus size={16} /> Crear evento</button>
        </div>
      )}

      {!loading && !loadError && events.length > 0 && (
        <section className="eventos-grid" aria-label="Lista de eventos">
          {events.map((event) => (
            <article className="evento-card" key={event.id}>
              <div className="evento-card__top"><span>{event.tipo || 'Evento'}</span><time>{formatDate(event.fecha)}</time></div>
              <h2>{event.titulo}</h2>
              <p><MapPin size={14} aria-hidden="true" /> {event.lugar || 'Lugar sin definir'}</p>
              <div className="evento-card__actions">
                <button type="button" onClick={() => navigate(`/evento/${event.id}`, { state: { event } })}>Ver detalle</button>
                <button type="button" onClick={() => navigate(`/evento/${event.id}`, { state: { event, edit: true } })}><Pencil size={15} /> Editar</button>
                <button className="evento-card__delete" type="button" onClick={() => requestDelete(event)} aria-label={`Eliminar ${event.titulo}`}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(eventToDelete)}
        title="Eliminar evento"
        message={`¿Seguro que deseas eliminar “${eventToDelete?.titulo ?? ''}”? También se eliminarán sus subtareas. Esta acción no se puede deshacer.`}
        loading={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setEventToDelete(null)}
      />
    </main>
  );
}
