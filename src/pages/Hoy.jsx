import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHoyData } from '../services/hoyService';
import './Hoy.css';

export default function Hoy() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatosHoy() {
      try {
        const resultado = await getHoyData();
        setData(resultado);
      } catch (error) {
        console.error('Error al cargar la vista Hoy:', error);
      } finally {
        setLoading(false);
      }
    }
    cargarDatosHoy();
  }, []);

  if (loading) {
    return <div className="hoy-principal"><p>Cargando prioridades...</p></div>;
  }

  // Extraemos directamente de la estructura que devuelve el backend (/today)
  const vencidas = data?.vencidas || [];
  const paraHoy = data?.hoy || [];
  const proximas = data?.proximas || [];

  // Comprobamos si no hay tareas en ninguna de las secciones
  const noHayTareas = vencidas.length === 0 && paraHoy.length === 0 && proximas.length === 0;

  // Calculamos el total de tareas que requieren atención
  const totalTareasAtencion = data?.capacidad?.tareasAtencion || paraHoy.length;

  return (
    <main className="hoy-principal">
      {/* Cabecera (Ya sin el badge de usuario) */}
      <div className="hoy-header-container">
        <div className="hoy-titulo-area">
          <h1>Hoy</h1>
          <br></br>
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

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-grupo">
          <button className="filtro-pill active">Todos los eventos</button>
          <button className="filtro-pill">Estado: Todos</button>
          <button className="filtro-pill filtro-limpiar">Limpiar filtros</button>
        </div>
        <span className="regla-texto">Regla: vencidas &rarr; hoy &rarr; próximas; empate = menor esfuerzo</span>
      </div>

      {/* Estado Vacío (Se muestra si no hay tareas) */}
      {noHayTareas ? (
        <div className="estado-vacio">
          <div className="estado-vacio-icono">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h3>¡Todo al día!</h3>
          <p>No tienes tareas pendientes programadas para hoy.</p>
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