// src/services/eventsService.js
import apiClient from './apiClient';

const EVENT_FIELD_MAP = {
  name: 'titulo',
  type: 'tipo',
  client: 'contacto',
  event_date: 'fecha',
  event_time: 'hora',
  location: 'lugar',
  deadline: 'fechaLimite',
};

export function normalizeEvent(event) {
  return {
    ...event,
    titulo: event.name ?? '',
    tipo: event.type ?? '',
    contacto: event.client ?? '',
    fecha: event.event_date ?? '',
    hora: event.event_time?.slice(0, 5) ?? '',
    lugar: event.location ?? '',
    fechaLimite: event.deadline ?? '',
  };
}

function toEventPayload(eventData) {
  return {
    name: eventData.titulo.trim(),
    type: eventData.tipo,
    client: eventData.contacto?.trim() || null,
    event_date: eventData.fecha,
    event_time: eventData.hora || null,
    location: eventData.lugar?.trim() || null,
  };
}

export function mapEventFieldErrors(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([field, message]) => [EVENT_FIELD_MAP[field] ?? field, message])
  );
}

export async function createEvent(eventData) {
  const response = await apiClient('/events', {
    method: 'POST',
    body: JSON.stringify(toEventPayload(eventData)),
  });
  return normalizeEvent(response);
}

export async function getEvent(eventId) {
  const response = await apiClient(`/events/${eventId}`);
  return normalizeEvent(response);
}

export async function updateEvent(eventId, eventData) {
  const response = await apiClient(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(toEventPayload(eventData)),
  });
  return normalizeEvent(response);
}
