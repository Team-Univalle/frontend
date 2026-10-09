export const LIMITE_POR_DEFECTO = 6;
export const LIMITE_MIN = 1;
export const LIMITE_MAX = 16;
export const MENSAJE_RANGO = `El límite debe estar entre ${LIMITE_MIN} y ${LIMITE_MAX} horas por día`;

export function aNumero(texto) {
  return Number(String(texto ?? '').trim().replace(',', '.'));
}

// Devuelve '' si es válido; si no, el mensaje de error.
export const MENSAJE_ENTERO = 'El límite debe ser un número entero de horas';

export function validarLimite(texto) {
  const limpio = String(texto ?? '').trim();
  if (limpio === '') return MENSAJE_RANGO;
  const numero = aNumero(limpio);
  if (!Number.isFinite(numero) || numero < LIMITE_MIN || numero > LIMITE_MAX) return MENSAJE_RANGO;
  if (!Number.isInteger(numero)) return MENSAJE_ENTERO;
  return '';
}

export function formatHoras(numero) {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(numero);
}

export function textoHoras(numero) {
  return `${formatHoras(numero)} ${numero === 1 ? 'hora' : 'horas'}`;
}
