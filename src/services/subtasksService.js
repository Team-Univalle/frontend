import apiClient from './apiClient';

const SUBTASK_FIELD_MAP = {
  name: 'gestion',
  target_date: 'fechaObjetivo',
  estimated_hours: 'horasEstimadas',
  status: 'estado',
};

export function normalizeSubtask(subtask) {
  return {
    ...subtask,
    gestion: subtask.name ?? '',
    fechaObjetivo: subtask.target_date ?? '',
    horasEstimadas: Number(subtask.estimated_hours),
    estado: subtask.status ?? 'Pendiente',
  };
}

function toSubtaskPayload(subtaskData) {
  return {
    name: subtaskData.gestion.trim(),
    target_date: subtaskData.fechaObjetivo,
    estimated_hours: Number(subtaskData.horasEstimadas),
    ...(subtaskData.estado ? { status: subtaskData.estado } : {}),
  };
}

export function mapSubtaskFieldErrors(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([field, message]) => [SUBTASK_FIELD_MAP[field] ?? field, message])
  );
}

export async function getSubtasks(eventId) {
  const response = await apiClient(`/events/${eventId}/subtasks`);
  if (Array.isArray(response)) return response.map(normalizeSubtask);
  return { ...response, results: (response?.results ?? []).map(normalizeSubtask) };
}

export async function createSubtask(eventId, subtaskData) {
  const response = await apiClient(`/events/${eventId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(toSubtaskPayload(subtaskData)),
  });
  return normalizeSubtask(response);
}

export async function updateSubtask(subtaskId, subtaskData) {
  const response = await apiClient(`/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify(toSubtaskPayload(subtaskData)),
  });
  return normalizeSubtask(response);
}

export async function deleteSubtask(subtaskId) {
  await apiClient(`/subtasks/${subtaskId}`, { method: 'DELETE' });
}
