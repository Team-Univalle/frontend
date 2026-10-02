import apiClient from './apiClient';

export async function getHoyData() {
  const response = await apiClient('/today');
  return response; // Esto retornará el objeto con { vencidas: [...], hoy: [...], proximas: [...] }
}