import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  Home,
  ListChecks,
  Pencil,
  Plus,
  LogOut,
} from 'lucide-react';
import LimiteDiarioModal from './LimiteDiarioModal';
import Toast from './Toast';
import { getCurrentUser, logoutUser } from '../services/authService';
import { getCurrentCapacity } from '../services/conflictsService';
import { PLANNING_UPDATED, notifyPlanningUpdated } from '../services/planningEvents';
import { getDailyLimit } from '../services/limitService';
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

  // Límite guardado + horas programadas hoy (las páginas pueden volver a pedirlo con refrescarCapacidad)
  const cargarCapacidad = useCallback(async () => {
    const request = ++capacityRequest.current;
    const token = localStorage.getItem('token');
    setLimite(null);
    setProgramadasHoy(null);
    setCapacityError('');
    const date = new Date().toLocaleDateString('en-CA');
    const [limiteResult, hoyResult] = await Promise.allSettled([getDailyLimit(), getCurrentCapacity(date)]);
    if (request !== capacityRequest.current || token !== localStorage.getItem('token')) return;
    if (limiteResult.status === 'fulfilled') {
      setLimite(limiteResult.value.limite ?? LIMITE_POR_DEFECTO);
    }
    if (hoyResult.status === 'fulfilled') {
      setProgramadasHoy(hoyResult.value.planned_hours);
    }
    if (limiteResult.status === 'rejected' || hoyResult.status === 'rejected') setCapacityError('No pudimos consultar tu capacidad diaria.');
  }, []);

  const invalidateCapacity = useCallback(() => { capacityRequest.current++; }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) cargarCapacidad(); });
    window.addEventListener(PLANNING_UPDATED, cargarCapacidad);
    return () => { active = false; invalidateCapacity(); window.removeEventListener(PLANNING_UPDATED, cargarCapacidad); };
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

  // Obtener nombre e iniciales de forma segura según los campos de tu ProfileSerializer
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
          <span className="app-logo__icon"><CalendarCheck2 size={20} aria-hidden="true" /></span>
          <span><strong>Organiza</strong><small>Eventos</small></span>
        </NavLink>

        {/* Perfil del usuario en la barra lateral */}
        <div className="app-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', margin: '8px 0', background: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
          <div className="hoy-user-avatar" style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>
            {inicialUsuario}
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nombreUsuario}
          </span>
        </div>

        <nav className="app-nav">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => (
              isActive || (to === '/eventos' && location.pathname.startsWith('/evento/'))
                ? 'is-active'
                : undefined
            )}>
              <Icon size={17} aria-hidden="true" /> <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <section
          className={`capacidad-diaria${recienActualizado ? ' is-updated' : ''}`}
          aria-label="Capacidad diaria"
        >
          <h2 className="capacidad-diaria__titulo">Capacidad diaria</h2>
          <p className="capacidad-diaria__horas">
            <strong>{hayDato ? `${formatHoras(programadasHoy)} h` : '—'}</strong> programadas hoy
          </p>
          <div
            className={`capacidad-diaria__barra${sobrepasa ? ' is-over' : ''}`}
            role="progressbar"
            aria-label="Horas programadas hoy"
            aria-valuemin={0}
            aria-valuemax={limite}
            aria-valuenow={hayDato ? Math.min(programadasHoy, limite) : 0}
          >
            <span style={{ width: `${porcentaje}%` }} />
          </div>
          <p className={`capacidad-diaria__limite${recienActualizado ? ' is-strong' : ''}`}>
            Tu límite: {limite === null ? 'consultando...' : `${textoHoras(limite)} por día`}
          </p>
          {capacityError && <p role="alert">{capacityError} <button type="button" onClick={cargarCapacidad}>Reintentar</button></p>}
          {justo && <p className="capacidad-diaria__nota">Hoy llegas justo a tu límite.</p>}
          {sobrepasa && (
            <p className="capacidad-diaria__nota capacidad-diaria__nota--alerta">
              Hoy superas tu límite por {formatHoras(exceso)} h.
            </p>
          )}
          <button
            type="button"
            className="capacidad-diaria__boton"
            onClick={() => setModalAbierto(true)}
          >
            <Pencil size={15} aria-hidden="true" /> Cambiar límite
          </button>
        </section>

        {/* Botón de Cierre de Sesión al final */}
        <div style={{ marginTop: 'auto', padding: '10px 0' }}>
          <button type="button" onClick={handleLogout} className="app-logout-btn">
            <LogOut size={17} aria-hidden="true" />
            <span>Cerrar sesión</span>
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
        onClose={() => setModalAbierto(false)}
        onSaved={handleLimiteGuardado}
      />
    </div>
  );
}
