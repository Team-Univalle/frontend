import apiClient from './apiClient.js';
import { validarLimite } from '../utils/limite.js';

// Contrato de DailyLimitView: GET/PUT /daily-limit.
const ENDPOINT = '/daily-limit';
const CAMPO = 'daily_limit_hours';
const METODO_GUARDAR = 'PUT';

function leerLimite(data) {
  if (!data || !Object.hasOwn(data, CAMPO)) throw new Error('El servidor no informó el límite diario.');
  const valor = data[CAMPO];
  if (valor === null || valor === undefined || valor === '') throw new Error('El servidor no informó un límite válido.');
  const numero = Number(valor);
  if (validarLimite(numero)) throw new Error('El servidor devolvió un límite inválido.');
  return numero;
}

// El default pertenece al perfil del servidor, no se inventa en el navegador.
export async function getDailyLimit() {
  const data = await apiClient(ENDPOINT);
  return { limite: leerLimite(data) };
}

export async function saveDailyLimit(horas) {
  const error = validarLimite(horas);
  if (error) throw new Error(error);
  const enviado = Number(horas);
  const data = await apiClient(ENDPOINT, {
    method: METODO_GUARDAR,
    body: JSON.stringify({ [CAMPO]: enviado }),
  });
  if (data === null || data === undefined || data === '') throw new Error('El servidor no confirmó el límite guardado. Reintenta.');
  const confirmado = leerLimite(data);
  if (confirmado === null) throw new Error('El servidor no confirmó el nuevo límite.');
  if (confirmado !== enviado) throw new Error('El servidor no confirmó el valor solicitado. Tu propuesta sigue sin confirmar.');
  return { limite: confirmado };
}
