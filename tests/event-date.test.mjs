import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEvent } from '../src/utils/validateEvent.js';

const base = { titulo: 'Evento', tipo: 'Social', lugar: 'Cali', contacto: 'Cliente', fecha: '2026-10-09' };
const now = new Date(2026, 9, 9, 13, 0);
test('hoy a las 14:57 es válido a las 13:00', () => {
  assert.deepEqual(validateEvent({ ...base, hora: '14:57' }, now), {});
});
test('hoy a las 10:00 muestra error en hora, no en fecha', () => {
  const errors = validateEvent({ ...base, hora: '10:00' }, now);
  assert.ok(errors.hora);
  assert.equal(errors.fecha, undefined);
});
test('mañana a las 10:00 no es una hora pasada', () => {
  assert.deepEqual(validateEvent({ ...base, fecha: '2026-10-10', hora: '10:00' }, now), {});
});
test('ayer muestra error de fecha', () => {
  assert.ok(validateEvent({ ...base, fecha: '2026-10-08', hora: '23:59' }, now).fecha);
});
test('hoy sigue vigente hasta las 23:59', () => {
  assert.deepEqual(validateEvent({ ...base, hora: '23:59' }, new Date(2026, 9, 9, 23, 58)), {});
});
test('después de medianoche la fecha anterior es pasada', () => {
  assert.ok(validateEvent({ ...base, hora: '23:59' }, new Date(2026, 9, 10, 0, 0)).fecha);
});
test('el minuto actual se permite', () => {
  assert.deepEqual(validateEvent({ ...base, hora: '13:00' }, now), {});
});
test('fechas y horas inexistentes se rechazan', () => {
  assert.ok(validateEvent({ ...base, fecha: '2026-02-30' }, now).fecha);
  assert.ok(validateEvent({ ...base, hora: '25:00' }, now).hora);
});
