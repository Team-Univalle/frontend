import { lazy } from 'react';
import { Navigate, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import RouteFeedback from '../components/RouteFeedback';

const AppLayout = lazy(() => import('../components/AppLayout'));
const Hoy = lazy(() => import('../pages/Hoy'));
const Eventos = lazy(() => import('../pages/Eventos'));
const Crear = lazy(() => import('../pages/Crear'));
const EventoDetalle = lazy(() => import('../pages/EventoDetalle'));
const Progreso = lazy(() => import('../pages/Progreso'));
const Login = lazy(() => import('../pages/Login'));

function Page({ children }) {
  const { pathname } = useLocation();
  return <RouteFeedback key={pathname}>{children}</RouteFeedback>;
}

// Componente auxiliar para proteger las rutas internas
function ProtectedRoute() {
  const token = localStorage.getItem('token');
  
  // Si no hay token, redirige al usuario a la vista de login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token, renderiza los componentes hijos (las vistas protegidas)
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Ruta pública de Login */}
      <Route path="/login" element={<Page><Login /></Page>} />

      {/* Grupo de Rutas Protegidas bajo AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<RouteFeedback><AppLayout /></RouteFeedback>}>
          <Route index element={<Navigate to="/eventos" replace />} />
          <Route path="/hoy" element={<Page><Hoy /></Page>} />
          <Route path="/eventos" element={<Page><Eventos /></Page>} />
          <Route path="/crear" element={<Page><Crear /></Page>} />
          <Route path="/evento/:id" element={<Page><EventoDetalle /></Page>} />
          <Route path="/progreso" element={<Page><Progreso /></Page>} />
        </Route>
      </Route>

      {/* Ruta por defecto ante cualquier URL no encontrada */}
      <Route path="*" element={<Navigate to="/eventos" replace />} />
    </Routes>
  );
}

export default AppRoutes;
