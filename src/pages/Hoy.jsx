import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHoyData } from '../services/hoyService';
import './Hoy.css';

export default function Hoy() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatosHoy = async () => {
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
  };

  useEffect(() => {
    cargarDatosHoy();
  }, []);

  // C4: ESTADO DE CARGA
  if (loading) {
    return (
      <main className="hoy-principal">
        <div className="estado-carga-container" style={{ textAlign: 'center', padding: '60px' }}>
          <div className="spinner" style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <p>Cargando tus prioridades del día...</p>
        </div>
      </main>
    );
  }

  // C4: ESTADO DE ERROR (Alineado con la paleta de colores y estilo general)
  if (error) {
    return (
      <main className="hoy-principal">
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px', 
          background: '#ffffff', 
          borderRadius: '12px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          maxWidth: '600px',
          margin: '40px auto'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#1e293b', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>
            ¡Ocurrió un error inesperado!
          </h3>
          <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>
            {error}
          </p>
          <button 
            onClick={cargarDatosHoy}
            style={{ 
              background: '#6366f1', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 24px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '500',
              fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.background = '#4f46e5'}
            onMouseOut={(e) => e.target.style.background = '#6366f1'}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  const vencidas = data?.vencidas || [];
  const paraHoy = data?.hoy || [];
  const proximas = data?.proximas || [];

  const noHayTareas = vencidas.length === 0 && paraHoy.length === 0 && proximas.length === 0;
  const totalTareasAtencion = data?.capacidad?.tareasAtencion || paraHoy.length;

  return (
    <main className="hoy-principal">
      {/* Cabecera */}
      <div className="hoy-header-container">
        <div className="hoy-titulo-area">
          <h1>Hoy</h1>
          <br />
          <p>{data?.fechaTexto || new Date().toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="boton-crear-evento"
            onClick={() => navigate('/crear')}
          >
            + Crear evento
          </button>
        </div>
      </div>

      {/* Tarjeta de Capacidad */}
      <section className="capacidad-card">
        <div className="capacidad-info">
          <div className="capacidad-textos">
            <h3>Capacidad de hoy</h3>
            <div className="capacidad-numeros">
              {data?.capacidad?.horasOcupadas || 0} <span>de {data?.capacidad?.horasDisponibles || 8}h</span>
            </div>
          </div>
          <div className="alerta-atencion">
            {totalTareasAtencion} {totalTareasAtencion === 1 ? 'tarea requiere atención' : 'tareas requieren atención'}
          </div>
        </div>
        <div className="barra-progreso-bg">
          <div 
            className="barra-progreso-fill" 
            style={{ width: `${data?.capacidad?.porcentaje || 0}%` }}
          ></div>
        </div>
      </section>

      {/* Filtros y Regla de orden visible y justificada */}
      <div className="filtros-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div className="filtros-grupo">
          <button className="filtro-pill active">Todos los eventos</button>
          <button className="filtro-pill">Estado: Todos</button>
          <button className="filtro-pill filtro-limpiar">Limpiar filtros</button>
        </div>
        
        <div className="regla-banner" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '8px', maxWidth: '380px', fontSize: '12px', color: '#475569', textAlign: 'justify' }}>
          <strong>Criterio de orden:</strong> Las gestiones urgentes y vencidas se atienden primero. Luego las programadas para hoy y finalmente las próximas. En caso de empate en fecha, se priorizan las de menor esfuerzo.
        </div>
      </div>

      {/* C4: ESTADO VACÍO (Sin duplicar el botón de crear evento) */}
      {noHayTareas ? (
        <div className="estado-vacio" style={{ textAlign: 'center', padding: '50px 20px', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '20px' }}>
          <div className="estado-vacio-icono" style={{ marginBottom: '12px', color: '#6366f1' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>¡Todo al día! No hay pendientes</h3>
          <p style={{ color: '#64748b' }}>No tienes tareas programadas para hoy. Utiliza el botón superior para crear nuevos eventos.</p>
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
                    </div>
                    <button className="tarea-accion-btn">{t.status}</button>
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
                      <span className="badge-etiqueta warning">
                        {t.status}
                      </span>
                    </div>
                    <button className="tarea-accion-btn">Completar</button>
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
                    </div>
                    <button className="tarea-accion-btn">{t.status}</button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}