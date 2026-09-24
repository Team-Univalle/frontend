import apiClient from './apiClient';

const hasBackend = Boolean(import.meta.env.VITE_API_URL?.trim());
const storageKey = (eventId) => `event-${eventId}-subtasks`;

function wait(milliseconds = 350) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function readMockSubtasks(eventId) {
  const stored = localStorage.getItem(storageKey(eventId));
  return stored ? JSON.parse(stored) : [];
}

function saveMockSubtasks(eventId, subtasks) {
  localStorage.setItem(storageKey(eventId), JSON.stringify(subtasks));
}

function normalizeSubtask(subtask) {
  return {
    ...subtask,
    gestion: subtask.gestion ?? subtask.titulo ?? '',
  };
}

export async function getSubtasks(eventId) {
  if (hasBackend) {
    const response = await apiClient(`/events/${eventId}/subtasks`);
    if (Array.isArray(response)) return response.map(normalizeSubtask);
    if (Array.isArray(response?.results)) {
      return { ...response, results: response.results.map(normalizeSubtask) };
    }
    return response;
  }

  await wait();
  return readMockSubtasks(eventId);
}

export async function createSubtask(eventId, subtaskData) {
  if (hasBackend) {
    const response = await apiClient(`/events/${eventId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({
        titulo: subtaskData.gestion,
        fechaObjetivo: subtaskData.fechaObjetivo,
        horasEstimadas: subtaskData.horasEstimadas,
      }),
    });
    return normalizeSubtask(response);
  }

  await wait();
  const subtasks = readMockSubtasks(eventId);
  const createdSubtask = {
    id: globalThis.crypto?.randomUUID?.() ?? Date.now(),
    ...subtaskData,
  };
  saveMockSubtasks(eventId, [...subtasks, createdSubtask]);
  return createdSubtask;
}
