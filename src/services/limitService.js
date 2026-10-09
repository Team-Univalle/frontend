import apiClient from './apiClient';

// AJUSTA estas tres constantes al contrato real del backend.
//
const ENDPOINT = '/daily-limit';
const CAMPO = 'daily_limit_hours';
const METODO_GUARDAR = 'PATCH';

function leerLimite(data) {
  const valor = data?.[CAMPO];
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

// limite === null significa "todavía no guardó un límite" (se usan 6 h por defecto).
export async function getDailyLimit() {
  const data = await apiClient(ENDPOINT);
  return { limite: leerLimite(data) };
}

export async function saveDailyLimit(horas) {
  const enviado = Number(horas);
  const data = await apiClient(ENDPOINT, {
    method: METODO_GUARDAR,
    body: JSON.stringify({ [CAMPO]: enviado }),
  });
  // 204 sin cuerpo: el servidor aceptó el valor enviado.
  if (data === null || data === undefined || data === '') return { limite: enviado };
  const confirmado = leerLimite(data);
  if (confirmado === null) throw new Error('El servidor no confirmó el nuevo límite.');
  return { limite: confirmado };
}
