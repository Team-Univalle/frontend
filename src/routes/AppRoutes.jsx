import { Navigate, Routes, Route } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import Hoy from '../pages/Hoy';
import Eventos from '../pages/Eventos';
import Crear from '../pages/Crear';
import EventoDetalle from '../pages/EventoDetalle';
import Progreso from '../pages/Progreso';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/eventos" replace />} />
        <Route path="/hoy" element={<Hoy />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/crear" element={<Crear />} />
        <Route path="/evento/:id" element={<EventoDetalle />} />
        <Route path="/progreso" element={<Progreso />} />
      </Route>
      <Route path="*" element={<Navigate to="/eventos" replace />} />
    </Routes>
  );
}

export default AppRoutes;
