import { useCallback, useRef, useState } from 'react';
import { CalendarClock, CircleCheck } from 'lucide-react';
import Toast from './Toast';
import EstadoGestionModal from './EstadoGestionModal';
import BitacoraGestiones from './BitacoraGestiones';
import { actualizarEstadoGestion } from '../services/estadoGestionService';
import { notifyPlanningUpdated } from '../services/planningEvents';
import {
  armarCambios,
  estadoDe,
  fechaDe,
  formatFechaCorta,
  horasDe,
  mapEstadoFieldErrors,
  nombreDe,
  validarFormEstado,
} from '../utils/estadoGestion';
import './PlanLogistico.css';
import './GestionesEstado.css';

const ACCIONES = {
  posponer: { boton: 'Posponer', titulo: 'Posponer gestiones', estado: 'Pospuesta', icono: CalendarClock },
  hecha: { boton: 'Marcar como hecha', titulo: 'Marcar gestiones como hechas', estado: 'Ejecutada', icono: CircleCheck },
};

const FORM_VACIO = { nota: '', fecha: '' };

/**
 * Envuelve una lista de gestiones existente (children) y agrega las acciones
 * "Posponer" y "Marcar como hecha" con selección, modal de nota y guardado optimista.
 * onAplicar recibe { [id]: gestiónCompleta } y la página decide cómo reflejarlo.
 */
export default function GestionesEstado({
  items = [],
  onAplicar,
  maxDate,
  notificar = false,
  mostrarBitacora = false,
  children,
}) {
  const [accion, setAccion] = useState(null);
  const [seleccion, setSeleccion] = useState([]);
  const [enModal, setEnModal] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState('');
  const primeraAccionRef = useRef(null);
  const guardadoEnCurso = useRef(false);

  const cerrarToast = useCallback(() => setToast(''), []);

  if (items.length === 0 && !accion) {
    return (
      <>
        {children}
        {mostrarBitacora && <BitacoraGestiones items={items} />}
        <div className="ge-toast" aria-live="polite"><Toast message={toast} type="success" onClose={cerrarToast} /></div>
      </>
    );
  }

  const seleccionables = items.filter((item) => estadoDe(item) !== 'Ejecutada');
  const seleccionadas = seleccion.filter((id) => seleccionables.some((item) => item.id === id));
  const todas = seleccionables.length > 0 && seleccionadas.length === seleccionables.length;

  function elegirAccion(clave) {
    setAccion(clave);
    setSeleccion([]);
    setForm(FORM_VACIO);
    setFieldErrors({});
    setError('');
  }

  function salirDeSeleccion() {
    setAccion(null);
    setSeleccion([]);
    setEnModal([]);
    setModalAbierto(false);
    setForm(FORM_VACIO);
    setFieldErrors({});
    setError('');
  }

  function alternar(id) {
    setSeleccion((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]));
  }

  function alternarTodas() {
    setSeleccion(todas ? [] : seleccionables.map((item) => item.id));
  }

  function abrirModal() {
    setEnModal(seleccionables.filter((item) => seleccionadas.includes(item.id)));
    setFieldErrors({});
    setError('');
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setFieldErrors({});
    setError('');
  }

  function cambiarCampo(campo, valor) {
    setForm((actual) => ({ ...actual, [campo]: valor }));
    if (fieldErrors[campo]) setFieldErrors((actual) => ({ ...actual, [campo]: undefined }));
  }

  function terminar() {
    salirDeSeleccion();
    setToast('Gestión actualizada');
    requestAnimationFrame(() => primeraAccionRef.current?.focus());
  }

  async function guardar() {
    if (guardadoEnCurso.current) return;
    const errores = validarFormEstado(form, maxDate);
    if (Object.keys(errores).length > 0) {
      setFieldErrors(errores);
      return;
    }

    const lotes = enModal
      .map((item) => ({
        item,
        cambios: armarCambios(item, {
          estado: ACCIONES[accion].estado,
          nota: form.nota,
          fecha: accion === 'posponer' ? form.fecha : '',
        }),
      }))
      .filter(({ cambios }) => Object.keys(cambios).length > 0);

    if (lotes.length === 0) {
      terminar();
      return;
    }

    guardadoEnCurso.current = true;
    setGuardando(true);
    setError('');
    setFieldErrors({});

    // Actualización optimista: la lista cambia de una vez.
    onAplicar(Object.fromEntries(lotes.map(({ item, cambios }) => [item.id, { ...item, ...cambios }])));

    const resultados = await Promise.allSettled(
      lotes.map(({ item, cambios }) => actualizarEstadoGestion(item.id, cambios))
    );

    const confirmadas = {};
    const revertidas = {};
    const fallidas = [];
    let primerError = null;
    resultados.forEach((resultado, index) => {
      const { item, cambios } = lotes[index];
      if (resultado.status === 'fulfilled') {
        // Si el backend no devuelve "notes" es que no la guardó: no mostramos una nota que se perdería al recargar.
        const guardoNota = resultado.value && Object.hasOwn(resultado.value, 'notes');
        confirmadas[item.id] = { ...item, ...cambios, ...(guardoNota ? {} : { notes: item.notes }), ...resultado.value };
      } else {
        revertidas[item.id] = item;
        fallidas.push(item);
        primerError ??= resultado.reason;
      }
    });

    // Lo confirmado toma los datos del servidor; lo fallido vuelve a su estado anterior.
    onAplicar({ ...confirmadas, ...revertidas });
    guardadoEnCurso.current = false;
    setGuardando(false);
    if (notificar && Object.keys(confirmadas).length > 0) notifyPlanningUpdated();

    if (fallidas.length > 0) {
      // El modal sigue abierto con lo que el usuario escribió y solo con las gestiones fallidas.
      setEnModal(fallidas);
      setSeleccion(fallidas.map((item) => item.id));
      if (primerError?.data?.fields) setFieldErrors(mapEstadoFieldErrors(primerError.data.fields));
      setError(primerError?.message || 'Intenta nuevamente.');
      return;
    }

    terminar();
  }

  return (
    <>
      <section className="ge-panel" aria-label="Acciones sobre gestiones">
        <div className="ge-panel__barra">
          <div className="ge-panel__acciones" role="group" aria-label="Elegir acción">
            {Object.entries(ACCIONES).map(([clave, { boton, icono: Icono }], index) => (
              <button
                key={clave}
                ref={index === 0 ? primeraAccionRef : undefined}
                type="button"
                className={`ge-btn${accion === clave ? ' ge-btn--activo' : ''}`}
                aria-pressed={accion === clave}
                onClick={() => elegirAccion(clave)}
                disabled={guardando}
              >
                <Icono size={15} aria-hidden="true" /> {boton}
              </button>
            ))}
          </div>
          {accion && (
            <button type="button" className="ge-btn" onClick={salirDeSeleccion} disabled={guardando}>
              Cancelar
            </button>
          )}
        </div>

        {!accion ? (
          <p className="ge-panel__ayuda">Elige una acción para seleccionar las gestiones.</p>
        ) : (
          <div className="ge-panel__seleccion">
            <div className="ge-panel__texto">
              <strong>{ACCIONES[accion].titulo}</strong>
              <span>Selecciona las gestiones a las que quieres aplicar esta acción.</span>
            </div>
            <button
              type="button"
              className="modal-btn modal-btn--primary"
              onClick={abrirModal}
              disabled={seleccionadas.length === 0 || guardando}
            >
              Continuar ({seleccionadas.length})
            </button>
            <label className="ge-check">
              <input
                type="checkbox"
                checked={todas}
                onChange={alternarTodas}
                disabled={seleccionables.length === 0 || guardando}
              />
              Seleccionar todas
            </label>
            <span className="ge-panel__contador" aria-live="polite">
              {seleccionadas.length} {seleccionadas.length === 1 ? 'seleccionada' : 'seleccionadas'}
            </span>
          </div>
        )}
      </section>

      {accion ? (
        <ul className="ge-lista" aria-label="Gestiones para seleccionar">
          {items.map((item) => {
            const estado = estadoDe(item);
            const ejecutada = estado === 'Ejecutada';
            const marcada = seleccionadas.includes(item.id);
            return (
              <li key={item.id}>
                <label
                  className={`ge-item ge-item--${estado.toLowerCase()}${marcada ? ' ge-item--marcada' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => alternar(item.id)}
                    disabled={ejecutada || guardando}
                  />
                  <span className="ge-item__titulo">
                    <strong>{nombreDe(item)}</strong>
                    <small>{ejecutada ? 'Ya está ejecutada' : item.event_name || 'Gestión logística'}</small>
                  </span>
                  <span className="ge-item__tiempo">
                    <span>{horasDe(item)} h estim.</span>
                    <small>{formatFechaCorta(fechaDe(item))}</small>
                  </span>
                  <span className={`gestion-estado gestion-estado--${estado.toLowerCase()}`}>{estado}</span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          {children}
          {mostrarBitacora && <BitacoraGestiones items={items} />}
        </>
      )}

      {accion && (
        <EstadoGestionModal
          open={modalAbierto}
          accion={accion}
          items={enModal}
          form={form}
          onChange={cambiarCampo}
          fieldErrors={fieldErrors}
          error={error}
          guardando={guardando}
          maxDate={maxDate}
          onClose={cerrarModal}
          onConfirm={guardar}
        />
      )}

      <div className="ge-toast" aria-live="polite">
        <Toast message={toast} type="success" onClose={cerrarToast} />
      </div>
    </>
  );
}
