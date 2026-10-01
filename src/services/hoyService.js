import apiClient from './apiClient'; // forma en que se usa el cliente HTTP

export async function getHoyData() {
  // Cuando me pasen la API real, se edita
  // const response = await apiClient.get('/hoy');
  // return response.data;

  // -----------------------------------------------------------------
  // DATOS SIMULADOS (Mock) mientras entregan la API
  // -----------------------------------------------------------------
  return {
    fechaTexto: 'Miércoles, 16 de septiembre · Estas son tus prioridades',
    usuario: {
      nombre: 'Verónica',
      iniciales: 'VG',
    },
    capacidad: {
      horasOcupadas: '4 h 30 min',
      horasDisponibles: '6 h disponibles',
      porcentaje: 75,
      tareasAtencion: 2,
    },
    tareas: [
      {
        id: 1,
        titulo: 'Confirmar disponibilidad del fotógrafo',
        subtitulo: 'Boda Laura & Andrés',
        tiempo: '45 min',
        estadoTiempos: 'vencida',
        badgeExtra: '2 días tarde',
        tipoBadge: 'alerta',
        categoria: 'Vencidas',
        accionTexto: 'Reprogramar',
      },
      {
        id: 2,
        titulo: 'Confirmar menú final con catering',
        subtitulo: 'Boda Laura & Andrés',
        tiempo: '1 h',
        estadoTiempos: 'hoy',
        badgeExtra: 'Alta',
        tipoBadge: 'alta',
        categoria: 'Para hoy',
        accionTexto: 'Registrar',
      },
      {
        id: 3,
        titulo: 'Enviar agenda a conferencistas',
        subtitulo: 'Taller Innovación 2026',
        tiempo: '30 min',
        estadoTiempos: 'hoy',
        badgeExtra: 'Rápida',
        tipoBadge: 'rapida',
        categoria: 'Para hoy',
        accionTexto: 'Registrar',
      },
      {
        id: 4,
        titulo: 'Revisar montaje del salón',
        subtitulo: 'Taller Innovación 2026',
        tiempo: '1 h 30',
        estadoTiempos: 'proxima',
        badgeExtra: 'Mañana',
        tipoBadge: 'normal',
        categoria: 'Próximas',
        accionTexto: 'Ver detalle',
      },
    ],
  };
}