import { estadoDe, formatFechaLarga, nombreDe } from '../utils/estadoGestion';
import './GestionesEstado.css';

// El backend guarda una sola nota por gestión (la última); por eso cada gestión
// muestra su último registro: estado, fecha de actualización y nota.
export default function BitacoraGestiones({ items = [] }) {
  const registros = items
    .filter((item) => estadoDe(item) !== 'Pendiente' || item.notes)
    .sort((a, b) => String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')));

  return (
    <section className="ge-bitacora" aria-labelledby="ge-bitacora-titulo">
      <h2 id="ge-bitacora-titulo">Bitácora de gestiones</h2>
      {registros.length === 0 ? (
        <p className="ge-bitacora__vacio">
          Aún no hay registros. Cuando marques una gestión como hecha o la pospongas, aparecerá aquí.
        </p>
      ) : (
        <ul className="ge-bitacora__lista">
          {registros.map((item) => {
            const estado = estadoDe(item);
            return (
              <li key={item.id} className={`ge-bitacora__item ge-bitacora__item--${estado.toLowerCase()}`}>
                <div className="ge-bitacora__cabecera">
                  <strong>{nombreDe(item)}</strong>
                  <span className={`gestion-estado gestion-estado--${estado.toLowerCase()}`}>{estado}</span>
                </div>
                <small>Actualizada el {formatFechaLarga(item.updated_at)}</small>
                <p>{item.notes || 'Sin nota.'}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
