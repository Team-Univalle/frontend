// src/services/eventsService.js
import apiClient from './apiClient';

export async function createEvent(eventData) {
  // eventData: { titulo, tipo, fecha }
  return apiClient('/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
}