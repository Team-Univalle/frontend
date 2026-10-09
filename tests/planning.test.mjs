import test from 'node:test';
import assert from 'node:assert/strict';
import { checkConflict, getCurrentCapacity } from '../src/services/conflictsService.js';
import { getDailyLimit, saveDailyLimit } from '../src/services/limitService.js';
import { validateHours } from '../src/utils/validateSubtask.js';

const calls = [];
globalThis.localStorage = { getItem: () => 'test-token', removeItem: () => {} };
function respond(data, status = 200) {
  calls.length = 0;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
  };
}

test('7 horas guardadas frente a 6 muestra el conflicto y mensaje del servidor', async () => {
  const data = { conflict: true, planned_hours: 7, daily_limit: 6, message: 'Exceso: 1 hora.' };
  respond(data);
  assert.deepEqual(await checkConflict({ date: '2026-10-10', hours: 2, excludeSubtaskId: 'task-1' }), data);
  assert.equal(new URL(calls[0].url).search, '?date=2026-10-10');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
});
test('6 horas guardadas frente a 6 usa false del servidor', async () => {
  respond({ conflict: false, planned_hours: 6, daily_limit: 6 });
  assert.equal((await checkConflict({ date: '2026-10-10', hours: 2 })).conflict, false);
});
test('no inventa la evaluación de una reducción que la API no soporta', async () => {
  respond({ conflict: false, planned_hours: 5, daily_limit: 6 });
  const data = await checkConflict({ date: '2026-10-10', hours: 1 });
  assert.equal(data.planned_hours, 5);
  assert.equal(data.total_hours, undefined);
  assert.equal(new URL(calls[0].url).searchParams.has('hours'), false);
});
test('una respuesta sin límite no se considera válida', async () => {
  respond({ conflict: false, planned_hours: 5 });
  await assert.rejects(checkConflict({ date: '2026-10-10', hours: 2 }), /incompleta/);
});
test('fallo controlado y reintento de la misma propuesta', async () => {
  respond({ error: 'Error controlado' }, 500);
  await assert.rejects(checkConflict({ date: '2026-10-10', hours: 1 }), /Error controlado/);
  respond({ conflict: false, planned_hours: 5, daily_limit: 6 });
  assert.equal((await checkConflict({ date: '2026-10-10', hours: 1 })).planned_hours, 5);
});
test('horas inválidas y precisión del DecimalField', () => {
  for (const value of ['', 0, -1, 'texto', Infinity, NaN, '1.234', 1000]) assert.ok(validateHours(value), String(value));
  for (const value of ['0.01', '1', '1.25', '999.99']) assert.equal(validateHours(value), '');
});
test('GET devuelve el límite personal sin sustituirlo por 6', async () => {
  respond({ daily_limit_hours: 4 });
  assert.deepEqual(await getDailyLimit(), { limite: 4 });
});
test('guardar usa PATCH y luego GET confirma persistencia del contrato', async () => {
  respond({ daily_limit_hours: 4 });
  assert.deepEqual(await saveDailyLimit(4), { limite: 4 });
  assert.equal(calls[0].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[0].options.body), { daily_limit_hours: 4 });
  assert.deepEqual(await getDailyLimit(), { limite: 4 });
});
test('límites inválidos no hacen ninguna petición', async () => {
  respond({ daily_limit_hours: 6 });
  for (const value of [0, 17, '', 1.5, 'texto']) await assert.rejects(saveDailyLimit(value));
  assert.equal(calls.length, 0);
});
test('GET incompleto es un error, no una configuración predeterminada', async () => {
  respond({});
  await assert.rejects(getDailyLimit(), /no informó/);
});
test('capacidad guardada utiliza planned_hours del servidor', async () => {
  respond({ conflict: false, planned_hours: 5, daily_limit: 8 });
  assert.equal((await getCurrentCapacity('2026-10-10')).planned_hours, 5);
});
