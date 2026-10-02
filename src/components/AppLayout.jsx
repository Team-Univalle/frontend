import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  Home,
  ListChecks,
  Plus,
  LogOut,
} from 'lucide-react';
import { getCurrentUser, logoutUser } from '../services/authService';
import './AppLayout.css';

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

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        if (data) setUser(data);
      })
      .catch((error) => {
        console.error('Error al cargar el usuario en el layout:', error);
      });
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login', { replace: true });
  };

  // Obtener nombre e iniciales de forma segura según los campos de tu ProfileSerializer
  const rawNombre = user?.nombre || user?.first_name || user?.email || 'Usuario';
  const nombreUsuario = rawNombre.includes('@') ? rawNombre.split('@')[0] : rawNombre;
  const inicialUsuario = user?.iniciales || nombreUsuario.charAt(0).toUpperCase();

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

        <div className="app-capacidad">
          <span>Capacidad diaria</span>
          <strong>6 horas</strong>
          <progress value="6" max="8" aria-label="Capacidad diaria" />
          <small>6 h programadas hoy</small>
        </div>

        {/* Botón de Cierre de Sesión al final */}
        <div style={{ marginTop: 'auto', padding: '10px 0' }}>
          <button 
            type="button" 
            onClick={handleLogout}
            className="app-logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 12px',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '500',
              textAlign: 'left',
              transition: 'background 0.2s'
            }}
          >
            <LogOut size={17} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <div className="app-content"><Outlet /></div>
    </div>
  );
}