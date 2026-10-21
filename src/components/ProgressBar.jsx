import { estadoProgreso, textoProgreso } from '../utils/progreso';
import './ProgressBar.css';

/**
 * Barra de progreso genérica (HU-10).
 * valor: 0 a 100. Si llegan ejecutadas y total, el texto es "57% - 4 de 7 gestiones ejecutadas";
 * si no, "57% completado".
 */
export default function ProgressBar({
  valor = 0,
  ejecutadas,
  total,
  tamano = 'md',
  mostrarTexto = true,
  etiqueta = 'Progreso',
}) {
  const porcentaje = Math.min(100, Math.max(0, Math.round(Number(valor) || 0)));
  const completo = porcentaje === 100;
  const tieneConteo = ejecutadas !== undefined && total !== undefined;
  const texto = tieneConteo ? textoProgreso({ porcentaje, ejecutadas, total }) : `${porcentaje}% completado`;

  return (
    <div className={`progress-bar progress-bar--${tamano}${completo ? ' progress-bar--completo' : ''}`}>
      <div
        className="progress-bar__pista"
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`${etiqueta}: ${porcentaje}%`}
      >
        <div className="progress-bar__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      {mostrarTexto && (
        <p className="progress-bar__texto" aria-live="polite">{texto}</p>
      )}
    </div>
  );
}

export function ProgresoBadge({ porcentaje, total }) {
  const { clave, etiqueta } = estadoProgreso(porcentaje, total);
  return <span className={`progreso-badge progreso-badge--${clave}`}>{etiqueta}</span>;
}
