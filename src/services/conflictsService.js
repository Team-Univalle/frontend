import apiClient from './apiClient.js';

const CAMPOS_NUMERICOS = ['planned_hours', 'daily_limit'];

export function validateCapacity(response) {
  if (!response || typeof response.conflict !== 'boolean' ||
    !CAMPOS_NUMERICOS.every((field) => typeof response[field] === 'number' && Number.isFinite(response[field])) ||
    response.daily_limit < 1 || response.daily_limit > 16 ||
    CAMPOS_NUMERICOS.some((field) => response[field] < 0)) {
    throw new Error('La respuesta de capacidad llegó incompleta. No se guardaron cambios; reintenta cuando el servidor confirme las horas planificadas y el límite.');
  }
  return response;
}

// Consulta de carga YA guardada: no es una evaluación de una propuesta.
export async function getCurrentCapacity(date) {
  return checkConflict({ date });
}

/**
 * Consume el contrato actual: evalúa únicamente la carga ya guardada de date.
 * No suma horas propuestas ni calcula el conflicto en el cliente.
 */
export async function checkConflict({ date }) {
  const params = new URLSearchParams({ date });

  const response = await apiClient(`/conflicts?${params.toString()}`);

  return validateCapacity(response);
}
