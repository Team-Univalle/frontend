import { normalizeSubtask } from '../services/subtasksService';
import { validateFechaObjetivo } from './validateSubtask';

export const NOTA_MAX = 500;

const CAMPOS_FORM = { notes: 'nota', target_date: 'fecha', status: 'estado' };

// Las gestiones de /hoy llegan crudas (name, status) y las de /evento normalizadas (gestion, estado).
export const nombreDe = (item) => item.name ?? item.gestion ?? '';
export const estadoDe = (item) => item.status ?? item.estado ?? 'Pendiente';
export const fechaDe = (item) => item.target_date ?? item.fechaObjetivo ?? '';
export const horasDe = (item) => Number(item.estimated_hours ?? item.horasEstimadas ?? 0);

export const hoyISO = () => new Date().toLocaleDateString('en-CA');

export function formatFechaCorta(fecha) {
  if (!fecha) return 'Sin fecha';
  return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

export function formatFechaLarga(fechaHora) {
  if (!fechaHora) return 'Sin fecha';
  return new Date(fechaHora).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Solo incluye los campos que realmente cambian.
export function armarCambios(item, { estado, nota, fecha }) {
  const cambios = {};
  if (estado && estado !== estadoDe(item)) cambios.status = estado;
  const notaLimpia = nota?.trim();
  if (notaLimpia && notaLimpia !== (item.notes ?? '')) cambios.notes = notaLimpia;
  if (fecha && fecha !== fechaDe(item)) cambios.target_date = fecha;
  return cambios;
}

export function validarFormEstado({ nota, fecha }, maxDate) {
  const errores = {};
  if (fecha) {
    const error = validateFechaObjetivo(fecha, maxDate);
    if (error) errores.fecha = error;
    else if (fecha < hoyISO()) errores.fecha = 'La nueva fecha no puede ser anterior a hoy.';
  }
  if ((nota ?? '').trim().length > NOTA_MAX) {
    errores.nota = `Las notas no pueden superar los ${NOTA_MAX} caracteres.`;
  }
  return errores;
}

export function mapEstadoFieldErrors(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([campo, mensaje]) => [CAMPOS_FORM[campo] ?? campo, mensaje])
  );
}

// /evento/:id: reemplaza las gestiones cambiadas y mantiene el orden por fecha.
export function aplicarEnLista(lista, cambios) {
  return lista
    .map((item) => (cambios[item.id] ? normalizeSubtask({ ...item, ...cambios[item.id] }) : item))
    .sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)));
}

// /hoy: reagrupa en vencidas / hoy / próximas y saca las ejecutadas de la lista activa.
export function aplicarEnHoy(data, cambios) {
  if (!data) return data;
  const hoy = hoyISO();
  const porId = new Map();
  [...(data.vencidas ?? []), ...(data.hoy ?? []), ...(data.proximas ?? [])]
    .forEach((item) => porId.set(item.id, item));
  Object.entries(cambios).forEach(([id, item]) => porId.set(id, { ...porId.get(id), ...item }));

  const activas = [...porId.values()]
    .filter((item) => estadoDe(item) !== 'Ejecutada')
    .sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)) || horasDe(a) - horasDe(b));

  return {
    ...data,
    vencidas: activas.filter((item) => fechaDe(item) < hoy),
    hoy: activas.filter((item) => fechaDe(item) === hoy),
    proximas: activas.filter((item) => fechaDe(item) > hoy),
  };
}
