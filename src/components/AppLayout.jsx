import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  Home,
  ListChecks,
  Plus,
  Pencil,
  LogOut,
} from 'lucide-react';
import LimiteDiarioModal from './LimiteDiarioModal';
import Toast from './Toast';
import { getCurrentUser, logoutUser } from '../services/authService';
import { getCurrentCapacity } from '../services/conflictsService';
import { PLANNING_UPDATED, notifyPlanningUpdated } from '../services/planningEvents';
import { getDailyLimit } from '../services/limitService';
import { getHoyData } from '../services/hoyService'; // <--- Importado para auditar subtareas globales
import { LIMITE_POR_DEFECTO, formatHoras, textoHoras } from '../utils/limite';
import './AppLayout.css';
import './CapacidadDiaria.css';

const links = [
  { to: '/hoy', label: 'Hoy', icon: Home },
  { to: '/eventos', label: 'Eventos', icon: ListChecks },
  { to: '/crear', label: 'Crear evento', icon: Plus },
  { to: '/progreso', label: 'Progreso', icon: ChartNoAxesColumnIncreasing },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const [limite, setLimite] = useState(null);
  const [capacityError, setCapacityError] = useState('');
  const capacityRequest = useRef(0);
  const [programadasHoy, setProgramadasHoy] = useState(null);
  const [todasLasTareas, setTodasLasTareas] = useState([]); // <--- Guarda todas las tareas activas
  const [modalAbierto, setModalAbierto] = useState(false);
  const [toast, setToast] = useState(null);
  const [recienActualizado, setRecienActualizado] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        if (data) setUser(data);
      })
      .catch((error) => {
        console.error('Error al cargar el usuario en el layout:', error);
      });
  }, []);

  const cargarCapacidad = useCallback(async () => {
    const request = ++capacityRequest.current;
    const token = localStorage.getItem('token');
    setLimite(null);
    setProgramadasHoy(null);
    setCapacityError('');
    const date = new Date().toLocaleDateString('en-CA');

    const [limiteResult, hoyResult, datosTareasResult] = await Promise.allSettled([
      getDailyLimit(),
      getCurrentCapacity(date),
      getHoyData(),
    ]);

    if (request !== capacityRequest.current || token !== localStorage.getItem('token')) return;

    if (limiteResult.status === 'fulfilled') {
      setLimite(limiteResult.value.limite ?? LIMITE_POR_DEFECTO);
    }
    if (hoyResult.status === 'fulfilled') {
      setProgramadasHoy(hoyResult.value.planned_hours);
    }
    if (datosTareasResult.status === 'fulfilled' && datosTareasResult.value) {
      const { vencidas = [], hoy = [], proximas = [] } = datosTareasResult.value;
      setTodasLasTareas([...vencidas, ...hoy, ...proximas]);
    }
    if (limiteResult.status === 'rejected' || hoyResult.status === 'rejected') {
      setCapacityError('No pudimos consultar tu capacidad diaria.');
    }
  }, []);

  const invalidateCapacity = useCallback(() => {
    capacityRequest.current++;
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) cargarCapacidad();
    });
    window.addEventListener(PLANNING_UPDATED, cargarCapacidad);
    return () => {
      active = false;
      invalidateCapacity();
      window.removeEventListener(PLANNING_UPDATED, cargarCapacidad);
    };
  }, [cargarCapacidad, invalidateCapacity, location.pathname]);

  useEffect(() => {
    if (!recienActualizado) return undefined;
    const timer = setTimeout(() => setRecienActualizado(false), 4000);
    return () => clearTimeout(timer);
  }, [recienActualizado]);

  const cerrarToast = useCallback(() => setToast(null), []);

  function handleLimiteGuardado(nuevoLimite) {
    setLimite(nuevoLimite);
    setModalAbierto(false);
    setRecienActualizado(true);
    notifyPlanningUpdated();
    setToast({
      id: Date.now(),
      type: 'success',
      message: `Límite diario actualizado. Ahora es de ${textoHoras(nuevoLimite)} por día.`,
    });
  }

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  const rawNombre = user?.name || user?.first_name || user?.email || 'Usuario';
  const nombreUsuario = rawNombre.includes('@') ? rawNombre.split('@')[0] : rawNombre;
  const inicialUsuario = user?.iniciales || nombreUsuario.charAt(0).toUpperCase();

  const hayDato = Number.isFinite(programadasHoy) && Number.isFinite(limite);
  const exceso = hayDato ? programadasHoy - limite : 0;
  const justo = hayDato && Math.abs(exceso) < 1e-9;
  const sobrepasa = hayDato && exceso > 1e-9;
  const porcentaje = hayDato ? Math.min(100, (programadasHoy / limite) * 100) : 0;

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Navegación principal">
        <NavLink className="app-logo" to="/eventos" aria-label="Organiza Eventos">
          <span className="app-logo__icon">
            <CalendarCheck2 size={20} aria-hidden="true" />
          </span>
          <span>
            <strong>Organiza</strong>
            <small>Eventos</small>
          </span>
        </NavLink>

        <nav className="app-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive || (to === '/eventos' && location.pathname.startsWith('/evento/'))
                  ? 'is-active'
                  : undefined
              }
            >
              <Icon size={17} aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sección de Capacidad Diaria en la Sidebar */}
        <section
          className={`capacidad-diaria${recienActualizado ? ' is-updated' : ''}${
            sobrepasa ? ' is-over' : ''
          }`}
          aria-label="Capacidad diaria"
        >
          <div className="capacidad-diaria__header">
            <h2 className="capacidad-diaria__titulo">Capacidad diaria</h2>
            <button
              type="button"
              className="capacidad-diaria__btn-editar"
              onClick={() => setModalAbierto(true)}
              title="Configurar tu límite de horas diarias"
            >
              <Pencil size={12} aria-hidden="true" />
              <span>Cambiar</span>
            </button>
          </div>

          <div className="capacidad-diaria__metricas">
            <div className="capacidad-diaria__horas">
              <strong>{hayDato ? `${formatHoras(programadasHoy)}` : '—'}h</strong>
              <small>hoy</small>
            </div>
            <span className="capacidad-diaria__limite-tag">
              Límite {limite === null ? '...' : `${formatHoras(limite)}h`}
            </span>
          </div>

          <div
            className="capacidad-diaria__barra"
            role="progressbar"
            aria-label="Horas programadas hoy"
            aria-valuemin={0}
            aria-valuemax={limite || 6}
            aria-valuenow={hayDato ? Math.min(programadasHoy, limite) : 0}
          >
            <span style={{ width: `${porcentaje}%` }} />
          </div>

          {capacityError && (
            <p role="alert" className="capacidad-diaria__error">
              {capacityError}{' '}
              <button type="button" onClick={cargarCapacidad}>
                Reintentar
              </button>
            </p>
          )}

          {justo && <p className="capacidad-diaria__nota">Llegas justo al límite.</p>}
          {sobrepasa && (
            <p className="capacidad-diaria__nota capacidad-diaria__nota--alerta">
              Superas por {formatHoras(exceso)} h
            </p>
          )}
        </section>

        {/* Footer unificado: Usuario y Botón Logout */}
        <div className="app-sidebar-footer">
          <div className="app-user-profile" title={nombreUsuario}>
            <div className="app-user-avatar">{inicialUsuario}</div>
            <span className="app-user-name">{nombreUsuario}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="app-logout-icon-btn"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="app-content">
        <Toast
          key={toast?.id ?? 'sin-aviso'}
          message={toast?.message}
          type={toast?.type}
          onClose={cerrarToast}
        />
        <Outlet context={{ refrescarCapacidad: cargarCapacidad, limiteDiario: limite }} />
      </div>

      <LimiteDiarioModal
        open={modalAbierto}
        programadasHoy={programadasHoy}
        todasLasTareas={todasLasTareas}
        onClose={() => setModalAbierto(false)}
        onSaved={handleLimiteGuardado}
      />
    </div>
  );
}