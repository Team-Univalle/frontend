import apiClient from './apiClient';

const CAMPOS_NUMERICOS = ['planned_hours', 'task_hours', 'total_hours', 'daily_limit', 'excess_hours'];

/**
 * Pregunta al servidor si dejar `hours` horas en `date` supera el límite diario del usuario.
 * La regla (planificadas + gestión > límite personal) vive solo en el backend:
 * aquí únicamente se valida que la respuesta venga completa.
 */
export async function checkConflict({ date, hours, excludeSubtaskId }) {
  const params = new URLSearchParams({ date, hours: String(hours) });
  if (excludeSubtaskId) params.set('exclude_subtask', excludeSubtaskId);

  const response = await apiClient(`/conflicts?${params.toString()}`);

  const completa =
    response &&
    typeof response.conflict === 'boolean' &&
    CAMPOS_NUMERICOS.every((campo) => Number.isFinite(response[campo]));

  if (!completa) {
    throw new Error('La respuesta de capacidad llegó incompleta.');
  }
  return response;
}
