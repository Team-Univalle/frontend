export function validateEvent({ titulo, tipo, fecha }) {
  const errors = {};

  if (!titulo || !titulo.trim()) {
    errors.titulo = 'El título del evento es obligatorio.';
  }

  if (!tipo) {
    errors.tipo = 'Selecciona el tipo de evento.';
  }

  if (!fecha) {
    errors.fecha = 'La fecha del evento es obligatoria.';
  } else {
    const fechaEvento = new Date(fecha);

    if (isNaN(fechaEvento.getTime())) {
      errors.fecha = 'La fecha ingresada no es válida.';
    } else {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // ignoramos la hora, solo comparamos el día

      if (fechaEvento < hoy) {
        errors.fecha = 'La fecha del evento no puede ser anterior a hoy.';
      }
    }
  }

  return errors;
}