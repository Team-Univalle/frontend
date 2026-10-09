import apiClient from './apiClient.js';
import { validarLimite } from '../utils/limite.js';

// Contrato de DailyLimitView: GET/PATCH /daily-limit.
const ENDPOINT = '/daily-limit';
const CAMPO = 'daily_limit_hours';
const METODO_GUARDAR = 'PATCH';

function leerLimite(data) {
  if (!data || !Object.hasOwn(data, CAMPO)) throw new Error('El servidor no informó el límite diario.');
  const valor = data[CAMPO];
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  if (validarLimite(numero)) throw new Error('El servidor devolvió un límite inválido.');
  return numero;
}

// limite === null significa "todavía no guardó un límite" (se usan 6 h por defecto).
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
  // 204 sin cuerpo: el servidor aceptó el valor enviado.
  if (data === null || data === undefined || data === '') return { limite: enviado };
  const confirmado = leerLimite(data);
  if (confirmado === null) throw new Error('El servidor no confirmó el nuevo límite.');
  if (confirmado !== enviado) throw new Error('El servidor no confirmó el valor solicitado. Tu propuesta sigue sin confirmar.');
  return { limite: confirmado };
}
