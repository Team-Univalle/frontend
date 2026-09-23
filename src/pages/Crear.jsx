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

  const [form, setForm] = useState({
    titulo: '',
    contacto: '',
    tipo: '',
    fecha: '',
    hora: '',
    limite: '',
    Lugar: '',
  });
  const [logisticsItems, setLogisticsItems] = useState([
    { id: 1, gestion: '', fechaObjetivo: '', horasEstimadas: '' },
  ]);
  const [logisticsErrors, setLogisticsErrors] = useState({});
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

  function handleLogisticsChange(id, field, value) {
    setLogisticsItems((items) =>
      items.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );

    const errorKey = `${id}-${field}`;
    if (logisticsErrors[errorKey]) {
      setLogisticsErrors((errors) => ({ ...errors, [errorKey]: undefined }));
    }
  }

  function addLogisticsItem() {
    const nextId = Math.max(...logisticsItems.map((item) => item.id), 0) + 1;
    setLogisticsItems((items) => [
      ...items,
      { id: nextId, gestion: '', fechaObjetivo: '', horasEstimadas: '' },
    ]);
  }

  function quitLogisticsItem(id) {
    setLogisticsItems((items) => items.filter((item) => item.id !== id));

    setLogisticsErrors((errors) =>
      Object.fromEntries(
        Object.entries(errors).filter(([key]) => !key.startsWith(`${id}-`))
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError('');

    const errors = validateEvent(form);
    const planErrors = {};

    logisticsItems.forEach((item) => {
      if (!item.gestion.trim()) {
        planErrors[`${item.id}-gestion`] = 'Describe la gestión.';
      }
      if (!item.fechaObjetivo) {
        planErrors[`${item.id}-fechaObjetivo`] = 'Selecciona una fecha.';
      }
      if (!item.horasEstimadas || Number(item.horasEstimadas) <= 0) {
        planErrors[`${item.id}-horasEstimadas`] = 'Debe ser mayor que 0';
      }
    });

    if (Object.keys(errors).length > 0 || Object.keys(planErrors).length > 0) {
      setFieldErrors(errors);
      setLogisticsErrors(planErrors);
      return;
    }

    setFieldErrors({});
    setLogisticsErrors({});
    setStatus('loading');

    try {
      const evento = await createEvent({
        ...form,
        planLogistico: logisticsItems.map((item) => ({
          gestion: item.gestion,
          fechaObjetivo: item.fechaObjetivo,
          horasEstimadas: Number(item.horasEstimadas),
        })),
      });
      setStatus('idle');

      if (!evento?.id) {
        // El backend respondió, pero sin el id esperado — no podemos redirigir con seguridad
        setGeneralError(
          'El evento se creó, pero no se pudo confirmar su identificador.'
        );
        setToast({
          message: 'Evento creado, pero hubo un problema al redirigir.',
          type: 'error',
        });
        return;
      }

      setToast({ message: 'Evento creado exitosamente', type: 'success' });
      setTimeout(() => {
        navigate(`/evento/${evento.id}`);
      }, 800);
    } catch {
      setStatus('idle');
      const mensaje = 'No se pudo crear el evento. Intenta de nuevo.';
      setGeneralError(mensaje);
      setToast({ message: mensaje, type: 'error' });
    }
  }

  return (
    <main className="forms-principal">
      <h1>Crear Evento</h1>
      <p>Formulario de creación</p>

      <section className="forms" aria-label="Crear evento">
        <p>Datos del evento</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field field--titulo">
              <label htmlFor="titulo">Nombre del evento</label>
              <input
                id="titulo"
                name="titulo"
                type="text"
                value={form.titulo}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.titulo}
                aria-describedby={
                  fieldErrors.titulo ? 'titulo-error' : undefined
                }
                disabled={status === 'loading'}
              />
              {fieldErrors.titulo && (
                <span id="titulo-error" className="field-error">
                  {fieldErrors.titulo}
                </span>
              )}
            </div>

            <div className="field field--tipo">
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

            <div className="field field--contacto">
              <label htmlFor="contacto">Cliente o contacto</label>
              <input
                id="contacto"
                name="contacto"
                type="text"
                value={form.contacto}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.contacto}
                aria-describedby={
                  fieldErrors.contacto ? 'contacto-error' : undefined
                }
                disabled={status === 'loading'}
              />
              {fieldErrors.contacto && (
                <span id="contacto-error" className="field-error">
                  {fieldErrors.contacto}
                </span>
              )}
            </div>

            <div className="field field--lugar">
              <label htmlFor="Lugar">Lugar</label>
              <input
                id="Lugar"
                name="Lugar"
                type="text"
                value={form.Lugar}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.Lugar}
                aria-describedby={fieldErrors.Lugar ? 'Lugar-error' : undefined}
                disabled={status === 'loading'}
              />
              {fieldErrors.Lugar && (
                <span id="Lugar-error" className="field-error">
                  {fieldErrors.Lugar}
                </span>
              )}
            </div>

            <div className="field field--fecha">
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

            <div className="field field--hora">
              <label htmlFor="hora">Hora del evento</label>
              <input
                id="hora"
                name="hora"
                type="time"
                value={form.hora}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.hora}
                aria-describedby={fieldErrors.hora ? 'hora-error' : undefined}
                disabled={status === 'loading'}
              />
              {fieldErrors.hora && (
                <span id="hora-error" className="field-error">
                  {fieldErrors.hora}
                </span>
              )}
            </div>

            <div className="field field--limite">
              <label htmlFor="limite">Límite diario</label>
              <input
                id="limite"
                name="limite"
                type="number"
                value={form.limite}
                onChange={handleChange}
                max="8"
                min="1"
                aria-invalid={!!fieldErrors.limite}
                aria-describedby={
                  fieldErrors.limite ? 'limite-error' : undefined
                }
                disabled={status === 'loading'}
              />
              {fieldErrors.limite && (
                <span id="limite-error" className="field-error">
                  {fieldErrors.limite}
                </span>
              )}
            </div>
          </div>

          {generalError && (
            <div className="general-error" role="alert">
              {generalError}
            </div>
          )}

          <section
            className="plan-logistico"
            aria-labelledby="plan-logistico-title"
          >
            <div className="plan-logistico__header">
              <div>
                <h2 id="plan-logistico-title">Plan logístico inicial</h2>
                <p>
                  Añade subtareas con fecha objetivo y esfuerzo mayor que cero.
                </p>
              </div>
              <button
                className="boton-adicional"
                type="button"
                onClick={addLogisticsItem}
                disabled={status === 'loading'}
              >
                + Añadir gestión
              </button>
            </div>

            <div className="plan-logistico__lista">
              {logisticsItems.map((item, index) => (
                <div className="gestion-card" key={item.id}>
                  <span className="gestion-card__numero" aria-hidden="true">
                    {index + 1}
                  </span>

                  <div className="gestion-field gestion-field--nombre">
                    <label htmlFor={`gestion-${item.id}`}>Gestión</label>
                    <input
                      id={`gestion-${item.id}`}
                      type="text"
                      value={item.gestion}
                      onChange={(e) =>
                        handleLogisticsChange(
                          item.id,
                          'gestion',
                          e.target.value
                        )
                      }
                      aria-invalid={!!logisticsErrors[`${item.id}-gestion`]}
                      disabled={status === 'loading'}
                    />
                    {logisticsErrors[`${item.id}-gestion`] && (
                      <span className="field-error">
                        {logisticsErrors[`${item.id}-gestion`]}
                      </span>
                    )}
                  </div>

                  <div className="gestion-field">
                    <label htmlFor={`fecha-objetivo-${item.id}`}>
                      Fecha objetivo
                    </label>
                    <input
                      id={`fecha-objetivo-${item.id}`}
                      type="date"
                      value={item.fechaObjetivo}
                      onChange={(e) =>
                        handleLogisticsChange(
                          item.id,
                          'fechaObjetivo',
                          e.target.value
                        )
                      }
                      aria-invalid={
                        !!logisticsErrors[`${item.id}-fechaObjetivo`]
                      }
                      disabled={status === 'loading'}
                    />
                    {logisticsErrors[`${item.id}-fechaObjetivo`] && (
                      <span className="field-error">
                        {logisticsErrors[`${item.id}-fechaObjetivo`]}
                      </span>
                    )}
                  </div>

                  <div className="gestion-field gestion-field--horas">
                    <label htmlFor={`horas-estimadas-${item.id}`}>
                      Horas estimadas
                    </label>
                    <input
                      id={`horas-estimadas-${item.id}`}
                      type="number"
                      min="0"
                      step="0.25"
                      placeholder="Ej. 1.5"
                      value={item.horasEstimadas}
                      onChange={(e) =>
                        handleLogisticsChange(
                          item.id,
                          'horasEstimadas',
                          e.target.value
                        )
                      }
                      aria-invalid={
                        !!logisticsErrors[`${item.id}-horasEstimadas`]
                      }
                      disabled={status === 'loading'}
                    />
                    {logisticsErrors[`${item.id}-horasEstimadas`] && (
                      <span className="field-error">
                        {logisticsErrors[`${item.id}-horasEstimadas`]}
                      </span>
                    )}
                  </div>

                  <button
                    className="boton-eliminar-gestion"
                    type="button"
                    onClick={() => quitLogisticsItem(item.id)}
                    disabled={status === 'loading'}
                    aria-label={`Eliminar gestión ${index + 1}`}
                    title="Eliminar gestión"
                  >
                    <span aria-hidden="true">🗑</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="form-actions">
            <button
              className="boton-cancelar"
              type="button"
              disabled={status === 'loading'}
            >
              Cancelar
            </button>
            <button
              className="boton-guardado"
              type="submit"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Guardando...' : 'Guardar evento'}
            </button>
          </div>
        </form>

        <Toast
          message={toast?.message}
          type={toast?.type}
          onClose={() => setToast(null)}
        />
      </section>
    </main>
  );
}
