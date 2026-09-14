import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../services/eventsService';
import { validateEvent } from '../utils/validateEvent';
import Toast from '../components/Toast';
import '../components/Toast.css';
import './Crear.css';

const TIPOS_EVENTO = [
  { value: 'boda', label: 'Boda' },
  { value: 'corporativo', label: 'Corporativo' },
  { value: 'social', label: 'Social' },
  { value: 'cumpleanos', label: 'Cumpleaños' },
  { value: 'otro', label: 'Otro' },
];

export default function Crear() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ titulo: '', tipo: '', fecha: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading
  const [toast, setToast] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError('');

    const errors = validateEvent(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setStatus('loading');

        try {
      const evento = await createEvent(form);
      setStatus('idle');

      if (!evento?.id) {
        // El backend respondió, pero sin el id esperado — no podemos redirigir con seguridad
        setGeneralError('El evento se creó, pero no se pudo confirmar su identificador.');
        setToast({ message: 'Evento creado, pero hubo un problema al redirigir.', type: 'error' });
        return;
      }

      setToast({ message: 'Evento creado exitosamente', type: 'success' });
      setTimeout(() => {
        navigate(`/evento/${evento.id}`);
      }, 800);
    } catch (err) {
      setStatus('idle');
      const mensaje = 'No se pudo crear el evento. Intenta de nuevo.';
      setGeneralError(mensaje);
      setToast({ message: mensaje, type: 'error' });
    }
  }

  return (
    <div className="crear-evento">
      <h1>Crear nuevo evento</h1>
      <p className="hint">
        Dale un nombre claro a tu evento, elige el tipo y define la fecha para empezar a planificar.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="titulo">Título del evento</label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            value={form.titulo}
            onChange={handleChange}
            aria-invalid={!!fieldErrors.titulo}
            aria-describedby={fieldErrors.titulo ? 'titulo-error' : undefined}
            disabled={status === 'loading'}
          />
          {fieldErrors.titulo && (
            <span id="titulo-error" className="field-error">
              {fieldErrors.titulo}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="tipo">Tipo de evento</label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            aria-invalid={!!fieldErrors.tipo}
            aria-describedby={fieldErrors.tipo ? 'tipo-error' : undefined}
            disabled={status === 'loading'}
          >
            <option value="">Selecciona un tipo</option>
            {TIPOS_EVENTO.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {fieldErrors.tipo && (
            <span id="tipo-error" className="field-error">
              {fieldErrors.tipo}
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="fecha">Fecha del evento</label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            value={form.fecha}
            onChange={handleChange}
            aria-invalid={!!fieldErrors.fecha}
            aria-describedby={fieldErrors.fecha ? 'fecha-error' : undefined}
            disabled={status === 'loading'}
          />
          {fieldErrors.fecha && (
            <span id="fecha-error" className="field-error">
              {fieldErrors.fecha}
            </span>
          )}
        </div>

        {generalError && (
          <div className="general-error" role="alert">
            {generalError}
          </div>
        )}

        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}