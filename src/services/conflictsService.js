import apiClient from './apiClient.js';

export function validateCapacity(response, hoursRequested = 0, isSameOriginalDate = false) {
  if (!response) {
    throw new Error('Respuesta de capacidad no válida.');
  }

  let planned = Number(response.planned_hours ?? response.plannedHours ?? 0);
  let task = Number(response.task_hours ?? response.taskHours ?? 0);

  // Si la API devuelve 0 en task_hours pero se solicitaron horas, usamos las horas solicitadas
  if (task === 0 && hoursRequested > 0) {
    task = hoursRequested;
  }

  // SI ESTAMOS EN LA MISMA FECHA ORIGINAL:
  // La API ya incluye las horas previas de esta subtarea dentro de 'planned'.
  // Las descontamos de 'planned' para no contar la misma tarea dos veces.
  if (isSameOriginalDate && planned >= task) {
    planned = planned - task;
  }

  const limit = Number(response.daily_limit ?? response.dailyLimit ?? 6);
  const total = planned + task;
  const excess = Math.max(0, total - limit);
  const conflict = Boolean(response.conflict) || total > limit || excess > 0;

  return {
    ...response,
    conflict,
    planned_hours: planned,
    task_hours: task,
    total_hours: total,
    daily_limit: limit,
    excess
  };
}

export async function getCurrentCapacity(date) {
  return checkConflict({ date });
}

export async function checkConflict({ date, subtaskId, hours, status, originalDate }) {
  const params = new URLSearchParams({ date });
  const valHoras = Number(hours) || 0;

  if (subtaskId) params.set('subtask_id', String(subtaskId));
  if (valHoras > 0) {
    params.set('estimated_hours', String(valHoras));
    params.set('hours', String(valHoras));
  }
  if (status) params.set('status', String(status));

  const response = await apiClient(`/conflicts?${params.toString()}`);
  
  // Detecta si la fecha consultada es la misma fecha original de la subtarea
  const isSameOriginalDate = Boolean(originalDate && date === originalDate);

  return validateCapacity(response, valHoras, isSameOriginalDate);
}