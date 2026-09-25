import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarCheck2,
  ChartNoAxesColumnIncreasing,
  Home,
  ListChecks,
  Plus,
} from 'lucide-react';
import './AppLayout.css';

const links = [
  { to: '/hoy', label: 'Hoy', icon: Home },
  { to: '/eventos', label: 'Eventos', icon: ListChecks },
  { to: '/crear', label: 'Crear evento', icon: Plus },
  { to: '/progreso', label: 'Progreso', icon: ChartNoAxesColumnIncreasing },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="Navegación principal">
        <NavLink className="app-logo" to="/eventos" aria-label="Organiza Eventos">
          <span className="app-logo__icon"><CalendarCheck2 size={20} aria-hidden="true" /></span>
          <span><strong>Organiza</strong><small>Eventos</small></span>
        </NavLink>

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
      </aside>

      <div className="app-content"><Outlet /></div>
    </div>
  );
}
