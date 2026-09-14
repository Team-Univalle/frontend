import { Routes, Route } from 'react-router-dom';
import Hoy from '../pages/Hoy';
import Crear from '../pages/Crear';
import EventoDetalle from '../pages/EventoDetalle';
import Progreso from '../pages/Progreso';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/hoy" element={<Hoy />} />
      <Route path="/crear" element={<Crear />} />
      <Route path="/evento/:id" element={<EventoDetalle />} />
      <Route path="/progreso" element={<Progreso />} />
    </Routes>
  );
}

export default AppRoutes;