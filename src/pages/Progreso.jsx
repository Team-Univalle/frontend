import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar, { ProgresoBadge } from '../components/ProgressBar';
import { getEvents } from '../services/eventsService';
import { getSubtasks } from '../services/subtasksService';
import { calcularProgreso, sumarProgresos, textoProgreso } from '../utils/progreso';
import '../components/Modal.css';
import '../components/ProgressBar.css';
import './Progreso.css';

function formatFechaCorta(value) {
  if (!value) return 'Fecha sin definir';
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short' })
    .format(new Date(`${value}T00:00:00`))
    .replace('.', '');
}

const comoLista = (response) => (Array.isArray(response) ? response : response?.results ?? []);

// Las subtareas de todos los eventos se piden en paralelo, no una por una.
async function obtenerProgreso() {
  const eventos = comoLista(await getEvents());
  const subtareas = await Promise.all(eventos.map((evento) => getSubtasks(evento.id)));
  return eventos.map((evento, i) => ({ evento, progreso: calcularProgreso(comoLista(subtareas[i])) }));
}

function Encabezado() {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">Progreso</h1>
        <p className="page-header__subtitle">Visión rápida de cuánto falta en cada evento.</p>
      </div>
    </header>
  );
}

function Skeleton() {
  return (
    <div className="progreso-lista" role="status" aria-live="polite">
      <span className="progreso-sr">Calculando progreso...</span>
      {[0, 1, 2].map((i) => (
        <div className="progreso-card progreso-card--skeleton" key={i} aria-hidden="true">
          <span className="progreso-skeleton progreso-skeleton--titulo" />
          <span className="progreso-skeleton progreso-skeleton--texto" />
          <span className="progreso-skeleton progreso-skeleton--barra" />
        </div>
      ))}
    </div>
  );
}

export default function Progreso() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function mostrar(promesa, sigueActivo = () => true) {
    promesa
      .then((datos) => { if (sigueActivo()) setItems(datos); })
      .catch((err) => { if (sigueActivo()) setError(err?.message || 'Intenta nuevamente.'); })
      .finally(() => { if (sigueActivo()) setLoading(false); });
  }

  useEffect(() => {
    let activo = true;
    mostrar(obtenerProgreso(), () => activo);
    return () => { activo = false; };
  }, []);

  function reintentar() {
    setLoading(true);
    setError('');
    mostrar(obtenerProgreso());
  }

  const abrirDetalle = (evento) => navigate(`/evento/${evento.id}`, { state: { event: evento } });

  if (loading) {
    return (
      <main className="page-container progreso-page">
        <Encabezado />
        <Skeleton />
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-container progreso-page">
        <Encabezado />
        <div className="progreso-estado progreso-estado--error" role="alert">
          <h2>No pudimos cargar el progreso</h2>
          <p>{error}</p>
          <button type="button" className="modal-btn" onClick={reintentar}>Reintentar</button>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="page-container progreso-page">
        <Encabezado />
        <div className="progreso-estado">
          <h2>Aún no tienes eventos. Crea un evento</h2>
          <button type="button" className="modal-btn modal-btn--primary" onClick={() => navigate('/crear')}>
            Crear evento
          </button>
        </div>
      </main>
    );
  }

  const global = sumarProgresos(items.map((item) => item.progreso));

  return (
    <main className="page-container progreso-page">
      <Encabezado />

      <section className="progreso-resumen" aria-labelledby="progreso-resumen-titulo">
        <h2 id="progreso-resumen-titulo">Resumen</h2>
        <div className="progreso-resumen__metricas">
          <p><strong>{global.ejecutadas}</strong> gestiones ejecutadas</p>
          <p><strong>{global.pendientes}</strong> pendientes</p>
          <p className={global.vencidas > 0 ? 'progreso-metrica--alerta' : undefined}>
            <strong>{global.vencidas}</strong> vencidas
          </p>
        </div>
        <div className="progreso-resumen__barra">
          <ProgressBar valor={global.porcentaje} mostrarTexto={false} etiqueta="Progreso global" />
          <span aria-live="polite">{global.porcentaje}% completado global</span>
        </div>
      </section>

      <section className="progreso-lista" aria-label="Progreso por evento">
        {items.map(({ evento, progreso }) => {
          const { porcentaje, total } = progreso;
          return (
            <article className="progreso-card" key={evento.id}>
              <div className="progreso-card__cabecera">
                <div>
                  <h3>{evento.titulo}</h3>
                  <p>{formatFechaCorta(evento.fecha)} · {evento.lugar || 'Lugar sin definir'}</p>
                </div>
                <div className="progreso-card__valor" aria-live="polite">
                  <strong>{porcentaje}%</strong>
                  <span>{progreso.ejecutadas} de {total} {total === 1 ? 'gestión ejecutada' : 'gestiones ejecutadas'}</span>
                  <span className="progreso-sr">{textoProgreso(progreso)}</span>
                </div>
              </div>

              <ProgressBar
                valor={porcentaje}
                ejecutadas={progreso.ejecutadas}
                total={total}
                mostrarTexto={false}
                etiqueta={`Progreso de ${evento.titulo}`}
              />

              {total === 0 ? (
                <div className="progreso-aviso">
                  <span>Agrega subtareas para comenzar a medir el progreso</span>
                  <button type="button" className="modal-btn" onClick={() => abrirDetalle(evento)}>
                    Añadir gestión
                  </button>
                </div>
              ) : (
                <>
                  {porcentaje === 100 && (
                    <div className="progreso-aviso progreso-aviso--exito">
                      ¡Listo! Completaste toda la logística de este evento.
                    </div>
                  )}
                  <div className="progreso-card__pie">
                    <ul className="progreso-card__metricas" aria-label="Métricas del evento">
                      <li>Ejecutadas <strong>{progreso.ejecutadas}</strong></li>
                      <li>Pendientes <strong>{progreso.pendientes}</strong></li>
                      <li className={progreso.vencidas > 0 ? 'progreso-metrica--alerta' : undefined}>
                        Vencidas <strong>{progreso.vencidas}</strong>
                      </li>
                    </ul>
                    <ProgresoBadge porcentaje={porcentaje} total={total} />
                    <button type="button" className="modal-btn" onClick={() => abrirDetalle(evento)}>
                      Ver detalle
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
