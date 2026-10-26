// Cálculo puro del avance de un evento (HU-10). Sin dependencias del navegador para poder probarlo con node:test.

const estadoDe = (subtarea) => String(subtarea?.status ?? subtarea?.estado ?? 'Pendiente').toLowerCase();
const fechaDe = (subtarea) => subtarea?.target_date ?? subtarea?.fechaObjetivo ?? '';

export function hoyLocal() {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Devuelve { total, ejecutadas, pendientes, vencidas, porcentaje }.
 * Pendiente y Pospuesta cuentan como no completadas. Con N = 0 el porcentaje es 0.
 * El redondeo es al entero más cercano, pero nunca muestra 100% si falta alguna
 * ni 0% si ya hay alguna ejecutada (ej. 199 de 200 = 99%, 1 de 300 = 1%).
 */
export function calcularProgreso(subtareas = [], hoy = hoyLocal()) {
  const lista = Array.isArray(subtareas) ? subtareas : [];
  const total = lista.length;
  const ejecutadas = lista.filter((subtarea) => estadoDe(subtarea) === 'ejecutada').length;
  const pendientes = total - ejecutadas;
  const vencidas = lista.filter((subtarea) => {
    const fecha = fechaDe(subtarea);
    return estadoDe(subtarea) !== 'ejecutada' && fecha && fecha < hoy;
  }).length;

  return { total, ejecutadas, pendientes, vencidas, porcentaje: porcentajeDe(ejecutadas, total) };
}

export function porcentajeDe(ejecutadas, total) {
  if (!total) return 0;
  let porcentaje = Math.round((ejecutadas / total) * 100);
  if (ejecutadas < total) porcentaje = Math.min(porcentaje, 99);
  if (ejecutadas > 0) porcentaje = Math.max(porcentaje, 1);
  return porcentaje;
}

// Progreso que ya calcula el backend en GET /events (total_subtasks, completed_subtasks, overdue_subtasks).
// Devuelve null si el backend no envía esos campos, para usar calcularProgreso con las subtareas.
export function progresoDesdeEvento(evento) {
  const total = Number(evento?.total_subtasks);
  const ejecutadas = Number(evento?.completed_subtasks);
  const vencidas = Number(evento?.overdue_subtasks);
  if (![total, ejecutadas, vencidas].every(Number.isFinite)) return null;
  return { total, ejecutadas, pendientes: total - ejecutadas, vencidas, porcentaje: porcentajeDe(ejecutadas, total) };
}

// Badge según los rangos de la Guía de Diseño: verde 80%+, púrpura 50–79, gris 20–49, naranja 0–19.
export function estadoProgreso(porcentaje, total) {
  if (!total) return { clave: 'vacio', etiqueta: 'Sin gestiones' };
  if (porcentaje >= 100) return { clave: 'completado', etiqueta: 'Completado' };
  if (porcentaje >= 80) return { clave: 'avanzado', etiqueta: 'Casi listo' };
  if (porcentaje >= 50) return { clave: 'en-curso', etiqueta: 'En curso' };
  if (porcentaje >= 20) return { clave: 'iniciado', etiqueta: 'Iniciado' };
  return { clave: 'por-iniciar', etiqueta: 'Por iniciar' };
}

export function textoProgreso({ porcentaje, ejecutadas, total }) {
  return `${porcentaje}% - ${ejecutadas} de ${total} ${total === 1 ? 'gestión ejecutada' : 'gestiones ejecutadas'}`;
}

export function sumarProgresos(progresos = []) {
  const total = progresos.reduce((suma, p) => suma + p.total, 0);
  const ejecutadas = progresos.reduce((suma, p) => suma + p.ejecutadas, 0);
  const vencidas = progresos.reduce((suma, p) => suma + p.vencidas, 0);
  return { total, ejecutadas, pendientes: total - ejecutadas, vencidas, porcentaje: porcentajeDe(ejecutadas, total) };
}
