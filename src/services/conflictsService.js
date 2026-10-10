import apiClient from './apiClient.js';

const CAMPOS_NUMERICOS = ['planned_hours', 'task_hours', 'total_hours', 'daily_limit', 'excess'];

export function validateCapacity(response) {
  if (!response || typeof response.conflict !== 'boolean' ||
    !CAMPOS_NUMERICOS.every((field) => typeof response[field] === 'number' && Number.isFinite(response[field])) ||
    response.daily_limit < 1 || response.daily_limit > 16 ||
    CAMPOS_NUMERICOS.some((field) => response[field] < 0)) {
    throw new Error('La respuesta de capacidad llegó incompleta. No se guardaron cambios; reintenta cuando el servidor confirme las horas planificadas y el límite.');
  }
  if (Math.abs(response.total_hours - response.planned_hours - response.task_hours) > 0.00001 ||
    response.conflict !== (response.total_hours > response.daily_limit) ||
    Math.abs(response.excess - Math.max(0, response.total_hours - response.daily_limit)) > 0.00001) {
    throw new Error('El servidor devolvió cantidades de capacidad inconsistentes. Reintenta sin guardar.');
  }
  return response;
}

// Consulta de carga YA guardada: no es una evaluación de una propuesta.
export async function getCurrentCapacity(date) {
  return checkConflict({ date });
}

/**
 * El servidor evalúa la propuesta, excluyendo la gestión editada.
 * El cliente no duplica la regla de negocio.
 */
export async function checkConflict({ date, subtaskId, hours, status }) {
  const params = new URLSearchParams({ date });
  if (subtaskId) params.set('subtask_id', subtaskId);
  if (hours !== undefined) params.set('estimated_hours', hours);
  if (status) params.set('status', status);

  const response = await apiClient(`/conflicts?${params.toString()}`);

  return validateCapacity(response);
}
