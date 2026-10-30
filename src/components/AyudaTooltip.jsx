import { useId } from 'react';
import { CircleHelp } from 'lucide-react';
import './AyudaTooltip.css';

// Ícono (?) que muestra una explicación al pasar el mouse, enfocarlo con teclado o tocarlo.
// El padre debe ser .ayuda-etiqueta para que el cuadro se ubique debajo de la etiqueta.
export default function AyudaTooltip({ label, children }) {
  const tooltipId = useId();

  return (
    <>
      <button className="ayuda-icono" type="button" aria-label={label} aria-describedby={tooltipId}>
        <CircleHelp size={16} aria-hidden="true" />
      </button>
      <span id={tooltipId} className="ayuda-tooltip" role="tooltip">
        {children}
      </span>
    </>
  );
}
