export function validateSubtask({ gestion, fechaObjetivo, horasEstimadas }, fechaEvento) {
  const errors = {};

  if (!gestion || !gestion.trim()) {
    errors.gestion = 'El título de la subtarea es obligatorio.';
  }
  if (!fechaObjetivo) {
    errors.fechaObjetivo = 'Selecciona una fecha objetivo.';
  } else if (Number.isNaN(new Date(fechaObjetivo).getTime())) {
    errors.fechaObjetivo = 'La fecha objetivo no es válida.';
  } else if (fechaEvento && fechaObjetivo > fechaEvento) {
    errors.fechaObjetivo = 'No puede ser posterior a la fecha del evento.';
  }
  const errorHoras = validateHours(horasEstimadas);
  if (errorHoras) errors.horasEstimadas = errorHoras;

  return errors;
}

// DecimalField del BE: max_digits=5, decimal_places=2.
export function validateHours(value) {
  const text = String(value ?? '').trim();
  const number = Number(text);
  if (!text || !Number.isFinite(number) || number <= 0) return 'Las horas deben ser un número finito mayor que 0.';
  if (number > 999.99 || !/^\d+(\.\d{1,2})?$/.test(text)) return 'Usa como máximo 999.99 horas y 2 decimales.';
  return '';
}

export function validateFechaObjetivo(fecha, fechaEvento) {
  if (!fecha) return 'Selecciona una fecha objetivo.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'La fecha objetivo no es válida.';
  const [y, m, d] = fecha.split('-').map(Number);
  const real = new Date(y, m - 1, d);
  if (real.getFullYear() !== y || real.getMonth() !== m - 1 || real.getDate() !== d) {
    return 'La fecha objetivo no es válida.';
  }
  if (fechaEvento && fecha > fechaEvento) return 'No puede ser posterior a la fecha del evento.';
  return '';
}
