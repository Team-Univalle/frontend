import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getHoyData } from '../services/hoyService';
import { PLANNING_UPDATED } from '../services/planningEvents';
import { getCurrentCapacity } from '../services/conflictsService';
import ReprogramarModal from '../components/ReprogramarModal';
import './Hoy.css';

function filtrosKey() {
  try { return `hoy:filtros:${JSON.parse(localStorage.getItem('user'))?.id ?? 'anon'}`; }
  catch { return 'hoy:filtros:anon'; }
}

function leerFiltros() {
  try {
    return JSON.parse(sessionStorage.getItem(filtrosKey())) ?? {};
  } catch {
    return {};
  }
}

export default function Hoy() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [capacityError, setCapacityError] = useState('');
  const [reprogramItem, setReprogramItem] = useState(null);
  const [notice, setNotice] = useState('');

  // Estados para los filtros
  const [filtroCategoria, setFiltroCategoria] = useState(() => leerFiltros().categoria ?? 'todos');
  const [filtroEstado, setFiltroEstado] = useState(() => leerFiltros().estado ?? 'todos');
  const [filtroEvento, setFiltroEvento] = useState(() => leerFiltros().evento ?? 'todos');

  const cargarDatosHoy = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await getHoyData();
      setData(resultado);
    } catch (err) {
      console.error('Error al cargar la vista Hoy:', err);
      setError('No pudimos conectar con el servidor para obtener tus prioridades de hoy.');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarCapacidad = useCallback(async () => {
    setCapacity(null);
    setCapacityError('');
    const date = new Date().toLocaleDateString('en-CA');
    try { 
      const res = await getCurrentCapacity(date);
      
      const planned = Number(res?.planned_hours ?? res?.plannedHours ?? 0);
      const limit = Number(res?.daily_limit ?? res?.dailyLimit ?? 6);

      setCapacity({
        planned_hours: planned,
        daily_limit: limit,
      });
    } catch (err) { 
      console.error('Error al cargar capacidad:', err);
      setCapacityError(err.message || 'Error de sincronización'); 
    }
  }, []);

  useEffect(() => {
    let active = true;
    const refresh = () => { if (active) { cargarDatosHoy(); cargarCapacidad(); } };
    refresh();
    window.addEventListener(PLANNING_UPDATED, refresh);
    return () => { active = false; window.removeEventListener(PLANNING_UPDATED, refresh); };
  }, [cargarDatosHoy, cargarCapacidad]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        filtrosKey(),
        JSON.stringify({ categoria: filtroCategoria, estado: filtroEstado, evento: filtroEvento })
      );
    } catch {
      /* sin almacenamiento */
    }
  }, [filtroCategoria, filtroEstado, filtroEvento]);

  if (loading) {
    return (
      <main className="page-container">
        <header className="page-header">
          <div>
            <h1 className="page-header__title">Hoy</h1>
            <p className="page-header__subtitle">{new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </header>

        <div 
          className="estado-carga-card" 
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
            maxWidth: '520px',
            margin: '40px auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div 
            className="spinner-moderno" 
            style={{
              width: '36px',
              height: '36px',
              border: '3px solid #e0e7ff',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} 
          />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
              Cargando tus prioridades del día
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Sincronizando la agenda y capacidad diaria...
            </p>
          </div>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-container">
        <header className="page-header">
          <div>
            <h1 className="page-header__title">Hoy</h1>
            <p className="page-header__subtitle">{new Date().toLocaleDateString('es-CO')}</p>
          </div>
        </header>

        <div 
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #fee2e2',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.05)',
            maxWidth: '520px',
            margin: '40px auto'
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#991b1b', marginBottom: '8px', fontSize: '17px', fontWeight: '600' }}>
            No pudimos conectar con el servidor
          </h3>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
            {error}
          </p>
          <button
            onClick={cargarDatosHoy}
            style={{
              background: '#6366f1',
              color: '#ffffff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.2)'
            }}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const vencidasOriginales = data?.vencidas || [];
  const paraHoyOriginales = data?.hoy || [];
  const proximasOriginales = data?.proximas || [];

  const todasLasTareas = [...vencidasOriginales, ...paraHoyOriginales, ...proximasOriginales];
  const eventosDisponibles = Array.from(new Set(todasLasTareas.map(t => t.event_name).filter(Boolean)));
  const eventoActivo = eventosDisponibles.includes(filtroEvento) ? filtroEvento : 'todos';

  const filtrarTarea = (t) => {
    const coincideEstado = filtroEstado === 'todos' || t.status?.toLowerCase() === filtroEstado.toLowerCase();
    const coincideEvento = eventoActivo === 'todos' || t.event_name === eventoActivo;
    return coincideEstado && coincideEvento;
  };

  const vencidas = (filtroCategoria === 'todos' || filtroCategoria === 'vencidas')
    ? vencidasOriginales.filter(filtrarTarea)
    : [];

  const paraHoy = (filtroCategoria === 'todos' || filtroCategoria === 'hoy')
    ? paraHoyOriginales.filter(filtrarTarea)
    : [];

  const proximas = (filtroCategoria === 'todos' || filtroCategoria === 'proximas')
    ? proximasOriginales.filter(filtrarTarea)
    : [];

  const noHayTareas = vencidas.length === 0 && paraHoy.length === 0 && proximas.length === 0;
  const totalTareasAtencion = data?.capacidad?.tareasAtencion || paraHoyOriginales.length;

  const limpiarFiltros = () => {
    setFiltroCategoria('todos');
    setFiltroEstado('todos');
    setFiltroEvento('todos');
  };

  const hayFiltrosActivos = filtroCategoria !== 'todos' || filtroEstado !== 'todos' || eventoActivo !== 'todos';

  const porcentajeCapacidad = capacity && capacity.daily_limit > 0 
    ? Math.min(100, (capacity.planned_hours / capacity.daily_limit) * 100) 
    : 0;

  return (
    <main className="page-container">
      {/* Cabecera Estándar */}
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Hoy</h1>
          <p className="page-header__subtitle">{data?.fechaTexto || new Date().toLocaleDateString('es-CO')}</p>
        </div>
        <button className="boton-crear-evento" onClick={() => navigate('/crear')}>
          + Crear evento
        </button>
      </header>

      {/* Tarjeta de Capacidad */}
      <section className="capacidad-card">
        <div className="capacidad-info">
          <div className="capacidad-textos">
            <h3>Capacidad de hoy</h3>
            <div className="capacidad-numeros">
              {capacity ? capacity.planned_hours : '—'} <span>de {capacity ? capacity.daily_limit : '—'}h</span>
            </div>
          </div>
          <div className="alerta-atencion">
            {totalTareasAtencion} {totalTareasAtencion === 1 ? 'tarea requiere atención' : 'tareas requieren atención'}
          </div>
        </div>
        <div className="barra-progreso-bg">
          <div
            className="barra-progreso-fill"
            style={{ width: `${porcentajeCapacidad}%` }}
          ></div>
        </div>
        {capacityError && (
          <p role="alert" style={{ marginTop: '12px', fontSize: '13px', color: '#b91c1c' }}>
            No pudimos cargar la capacidad. {capacityError}{' '}
            <button type="button" className="btn-reintentar-link" onClick={cargarCapacidad}>Reintentar</button>
          </p>
        )}
      </section>

      {/* Filtros Interactivos */}
      <div className="filtros-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="filtros-grupo" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className={`filtro-pill ${filtroCategoria === 'hoy' ? 'active' : ''}`}
            onClick={() => setFiltroCategoria(filtroCategoria === 'hoy' ? 'todos' : 'hoy')}
          >
            Solo para hoy
          </button>
          <button
            className={`filtro-pill ${filtroCategoria === 'vencidas' ? 'active' : ''}`}
            onClick={() => setFiltroCategoria(filtroCategoria === 'vencidas' ? 'todos' : 'vencidas')}
          >
            Solo vencidas
          </button>
          <button
            className={`filtro-pill ${filtroCategoria === 'proximas' ? 'active' : ''}`}
            onClick={() => setFiltroCategoria(filtroCategoria === 'proximas' ? 'todos' : 'proximas')}
          >
            Solo próximas
          </button>

          {/* Selector de Evento */}
          <select
            value={eventoActivo}
            onChange={(e) => setFiltroEvento(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              fontSize: '13px',
              color: '#334155',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="todos">Evento: Todos</option>
            {eventosDisponibles.map((evento, index) => (
              <option key={index} value={evento}>
                {evento}
              </option>
            ))}
          </select>

          {/* Botón de limpiar filtros */}
          {hayFiltrosActivos && (
            <button className="filtro-pill filtro-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros ✕
            </button>
          )}
        </div>

        <div className="regla-banner" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', maxWidth: '380px', fontSize: '12px', color: '#475569', textAlign: 'justify' }}>
          <strong>Criterio de orden:</strong> Las gestiones urgentes y vencidas se atienden primero. Luego las programadas para hoy y finalmente las próximas. En caso de empate en fecha, se priorizan las de menor esfuerzo.
        </div>
      </div>

      {/* TAREAS */}
      {noHayTareas ? (
        <div className="estado-vacio" style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
          <div className="estado-vacio-icono" style={{ marginBottom: '12px', color: '#6366f1' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>{hayFiltrosActivos ? '¡Sin resultados con estos filtros!' : 'No hay tareas programadas.'}</h3>
          <p style={{ color: '#64748b' }}>{hayFiltrosActivos ? 'No hay tareas que coincidan con los filtros seleccionados.' : 'Hoy no tienes gestiones logísticas pendientes. ¿Quieres crear un evento?'}</p>
          {!hayFiltrosActivos && <Link className="boton-crear-evento" to="/crear">Crear evento</Link>}
        </div>
      ) : (
        <>
          {/* Sección Vencidas */}
          {vencidas.length > 0 && (
            <section className="seccion-tareas">
              <div className="seccion-header">
                <h2>Vencidas</h2>
                <span className="seccion-badge">{vencidas.length}</span>
              </div>
              {vencidas.map((t) => (
                <div key={t.id} className="tarea-card vencida">
                  <div className="tarea-contenido">
                    <h4 className="tarea-titulo">{t.name}</h4>
                    <p className="tarea-subtitulo">{t.event_name}</p>
                  </div>
                  <div className="tarea-derecha">
                    <div className="tarea-meta">
                      <span className="badge-tiempo">{t.estimated_hours}h est.</span>
                      <span className="badge-alerta-tiempo">{t.target_date}</span>
                      <span className="badge-etiqueta danger">{t.status || 'Pendiente'}</span>
                    </div>
                    <Link className="tarea-accion-btn tarea-detalle-link" to={`/evento/${t.event_id}`}>Ver detalle</Link>
                    <button className="tarea-accion-btn" onClick={() => setReprogramItem(t)}>Reprogramar</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Sección Para hoy */}
          {paraHoy.length > 0 && (
            <section className="seccion-tareas">
              <div className="seccion-header">
                <h2>Para hoy</h2>
                <span className="seccion-badge warning">{paraHoy.length}</span>
              </div>
              {paraHoy.map((t) => (
                <div key={t.id} className="tarea-card hoy">
                  <div className="tarea-contenido">
                    <h4 className="tarea-titulo">{t.name}</h4>
                    <p className="tarea-subtitulo">{t.event_name}</p>
                  </div>
                  <div className="tarea-derecha">
                    <div className="tarea-meta">
                      <span className="badge-tiempo">{t.estimated_hours}h est.</span>
                      <span className="badge-etiqueta warning">{t.status || 'Pendiente'}</span>
                    </div>
                    <Link className="tarea-accion-btn tarea-detalle-link" to={`/evento/${t.event_id}`}>Ver detalle</Link>
                    <button className="tarea-accion-btn" onClick={() => setReprogramItem(t)}>Reprogramar</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Sección Próximas */}
          {proximas.length > 0 && (
            <section className="seccion-tareas">
              <div className="seccion-header">
                <h2>Próximas</h2>
                <span className="seccion-badge proxima">{proximas.length}</span>
              </div>
              {proximas.map((t) => (
                <div key={t.id} className="tarea-card proxima">
                  <div className="tarea-contenido">
                    <h4 className="tarea-titulo">{t.name}</h4>
                    <p className="tarea-subtitulo">{t.event_name}</p>
                  </div>
                  <div className="tarea-derecha">
                    <div className="tarea-meta">
                      <span className="badge-tiempo">{t.estimated_hours}h est.</span>
                      <span className="badge-etiqueta">{t.target_date}</span>
                      <span className="badge-etiqueta">{t.status || 'Pendiente'}</span>
                    </div>
                    <Link className="tarea-accion-btn tarea-detalle-link" to={`/evento/${t.event_id}`}>Ver detalle</Link>
                    <button className="tarea-accion-btn" onClick={() => setReprogramItem(t)}>Reprogramar</button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {notice && (
        <div className="toast-notificacion" role="status">
          <span>✓</span>
          <span>{notice}</span>
        </div>
      )}
      {reprogramItem && (
        <ReprogramarModal
          key={reprogramItem.id}
          item={reprogramItem}
          onClose={() => setReprogramItem(null)}
          onSaved={() => {
            setReprogramItem(null);
            setNotice('Gestión reprogramada correctamente. Cambios guardados.');
            cargarDatosHoy();
            cargarCapacidad();
          }}
        />
      )}
    </main>
  );
}