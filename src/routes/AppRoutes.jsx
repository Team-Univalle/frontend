import { Navigate, Routes, Route, Outlet } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Hoy from '../pages/Hoy';
import Eventos from '../pages/Eventos';
import Crear from '../pages/Crear';
import EventoDetalle from '../pages/EventoDetalle';
import Progreso from '../pages/Progreso';
import Login from '../pages/Login'; // <--- Tu nueva vista de login que crearemos

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
      <Route path="/login" element={<Login />} />

      {/* Grupo de Rutas Protegidas bajo AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/eventos" replace />} />
          <Route path="/hoy" element={<Hoy />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/crear" element={<Crear />} />
          <Route path="/evento/:id" element={<EventoDetalle />} />
          <Route path="/progreso" element={<Progreso />} />
        </Route>
      </Route>

      {/* Ruta por defecto ante cualquier URL no encontrada */}
      <Route path="*" element={<Navigate to="/eventos" replace />} />
    </Routes>
  );
}

export default AppRoutes;