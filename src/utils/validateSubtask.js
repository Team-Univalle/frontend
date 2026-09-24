export function validateSubtask({ gestion, fechaObjetivo, horasEstimadas }) {
  const errors = {};

  if (!gestion || !gestion.trim()) {
    errors.gestion = 'El título de la subtarea es obligatorio.';
  }
  if (!fechaObjetivo) {
    errors.fechaObjetivo = 'Selecciona una fecha objetivo.';
  } else if (Number.isNaN(new Date(fechaObjetivo).getTime())) {
    errors.fechaObjetivo = 'La fecha objetivo no es válida.';
  }
  if (!horasEstimadas || Number(horasEstimadas) <= 0) {
    errors.horasEstimadas = 'Las horas deben ser mayores que 0.';
  }

  return errors;
}
