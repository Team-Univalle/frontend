import apiClient from './apiClient';

// PATCH /subtasks/<id> solo con los campos que cambian: status, notes y target_date.
export async function actualizarEstadoGestion(subtaskId, cambios) {
  return apiClient(`/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(cambios),
  });
}
