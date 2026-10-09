import { formatHoras } from '../utils/limite';

export default function CapacityFeedback({ capacity, onReduce }) {
  if (!capacity) return null;
  return (
    <div className="subtarea-submit-error" role="alert">
      <strong>El día consultado tiene sobrecarga.</strong>
      {typeof capacity.message === 'string' && <p>{capacity.message}</p>}
      <p>Horas ya planificadas: {formatHoras(capacity.planned_hours)} h. Límite personal: {formatHoras(capacity.daily_limit)} h.</p>
      <p>Elige otra fecha y vuelve a comprobar. Aún no se guardaron cambios. Esta consulta informa la carga actual, no el resultado de cambiar la fecha o las horas.</p>
      {onReduce && <button type="button" onClick={onReduce}>Reducir horas estimadas</button>}
    </div>
  );
}
