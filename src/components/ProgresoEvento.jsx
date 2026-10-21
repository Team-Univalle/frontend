import ProgressBar, { ProgresoBadge } from './ProgressBar';
import { calcularProgreso, textoProgreso } from '../utils/progreso';
import './Modal.css';
import './ProgressBar.css';

// Barra + badge + avisos del resumen de /evento/:id. Se deriva de la misma lista
// de subtareas que ya tiene el detalle, así que se recalcula al instante (HU-09).
export default function ProgresoEvento({ subtareas = [], titulo = 'el evento', onAgregar }) {
  const progreso = calcularProgreso(subtareas);
  const { porcentaje, total } = progreso;

  return (
    <div className="progreso-evento">
      <div className="progreso-evento__fila">
        <ProgressBar
          valor={porcentaje}
          ejecutadas={progreso.ejecutadas}
          total={total}
          mostrarTexto={false}
          etiqueta={`Progreso de ${titulo}`}
        />
        <ProgresoBadge porcentaje={porcentaje} total={total} />
      </div>

      <p className="progreso-sr" aria-live="polite">{textoProgreso(progreso)}</p>

      {total === 0 && (
        <div className="progreso-aviso">
          <span>Agrega subtareas para comenzar a medir el progreso</span>
          {onAgregar && (
            <button type="button" className="modal-btn" onClick={onAgregar}>
              Añadir gestión
            </button>
          )}
        </div>
      )}

      {total > 0 && porcentaje === 100 && (
        <div className="progreso-aviso progreso-aviso--exito" role="status">
          ¡Listo! Completaste toda la logística de este evento.
        </div>
      )}
    </div>
  );
}
