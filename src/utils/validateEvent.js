export function validateEvent({ titulo, tipo, fecha, hora, lugar, contacto }, ahora = new Date()) {
  const errors = {};

  if (!titulo || !titulo.trim()) {
    errors.titulo = 'El título del evento es obligatorio.';
  }

  if (!tipo) {
    errors.tipo = 'Selecciona el tipo de evento.';
  }
   if (!lugar || !lugar.trim()) {
    errors.lugar = 'El lugar del evento es obligatorio.';
  }
  if (!contacto || !String(contacto).trim()) {
    errors.contacto = 'El contacto del evento es obligatorio.';
  }
  if (!fecha) {
    errors.fecha = 'La fecha del evento es obligatoria.';
  } else {
    const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    const [year, month, day] = partes ? partes.slice(1).map(Number) : [];
    // Las fechas del input no tienen zona horaria: construirlas en hora local,
    // no como ISO/UTC (que desplaza hoy al día anterior en Colombia).
    const fechaEvento = new Date(year, month - 1, day);
    if (!partes || fechaEvento.getFullYear() !== year ||
      fechaEvento.getMonth() !== month - 1 || fechaEvento.getDate() !== day) {
      errors.fecha = 'La fecha ingresada no es válida.';
    } else {
      const hoy = new Date(ahora);
      hoy.setHours(0, 0, 0, 0);

      if (fechaEvento < hoy) {
        errors.fecha = 'La fecha del evento no puede ser anterior a hoy.';
      } else if (hora && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora) &&
        fechaEvento.getTime() === hoy.getTime()) {
        const [hours, minutes] = hora.split(':').map(Number);
        if (hours * 60 + minutes < ahora.getHours() * 60 + ahora.getMinutes()) {
          errors.hora = 'La hora del evento no puede ser anterior a la hora actual de hoy.';
        }
      }
    }
  }
  if (hora && !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(hora)) {
    errors.hora = 'La hora ingresada no es válida.';
  }

  return errors;
}
