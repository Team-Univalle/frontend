import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularProgreso, estadoProgreso, sumarProgresos } from '../src/utils/progreso.js';

const HOY = '2026-10-15';
const gestiones = (ejecutadas, total) =>
  Array.from({ length: total }, (_, i) => ({ status: i < ejecutadas ? 'Ejecutada' : 'Pendiente', target_date: '2026-10-20' }));

test('N = 0: 0% sin dividir entre cero', () => {
  assert.deepEqual(calcularProgreso([], HOY), { total: 0, ejecutadas: 0, pendientes: 0, vencidas: 0, porcentaje: 0 });
  assert.equal(calcularProgreso(undefined, HOY).porcentaje, 0);
});

test('M = 0: 0%', () => {
  assert.equal(calcularProgreso(gestiones(0, 5), HOY).porcentaje, 0);
});

test('M parcial: 4 de 7 = 57%', () => {
  const p = calcularProgreso(gestiones(4, 7), HOY);
  assert.equal(p.porcentaje, 57);
  assert.equal(p.ejecutadas, 4);
  assert.equal(p.pendientes, 3);
});

test('M = N: 100%', () => {
  assert.equal(calcularProgreso(gestiones(3, 3), HOY).porcentaje, 100);
});

test('redondeo al entero más cercano', () => {
  assert.equal(calcularProgreso(gestiones(1, 3), HOY).porcentaje, 33); // 33.33
  assert.equal(calcularProgreso(gestiones(2, 3), HOY).porcentaje, 67); // 66.67
  assert.equal(calcularProgreso(gestiones(1, 8), HOY).porcentaje, 13); // 12.5
});

test('no muestra 100% si falta alguna ni 0% si ya hay una ejecutada', () => {
  assert.equal(calcularProgreso(gestiones(199, 200), HOY).porcentaje, 99);
  assert.equal(calcularProgreso(gestiones(1, 300), HOY).porcentaje, 1);
});

test('Pospuesta cuenta como no completada y las vencidas no cambian el porcentaje', () => {
  const lista = [
    { status: 'Ejecutada', target_date: '2026-10-10' },
    { status: 'Pospuesta', target_date: '2026-10-12' },
    { status: 'Pendiente', target_date: '2026-10-14' },
    { status: 'Pendiente', target_date: '2026-10-20' },
  ];
  assert.deepEqual(calcularProgreso(lista, HOY), { total: 4, ejecutadas: 1, pendientes: 3, vencidas: 2, porcentaje: 25 });
});

test('acepta subtareas normalizadas (estado / fechaObjetivo)', () => {
  const p = calcularProgreso([{ estado: 'Ejecutada', fechaObjetivo: '2026-10-01' }, { estado: 'Pendiente', fechaObjetivo: '2026-10-01' }], HOY);
  assert.equal(p.porcentaje, 50);
  assert.equal(p.vencidas, 1);
});

test('badge según rango', () => {
  assert.equal(estadoProgreso(0, 0).clave, 'vacio');
  assert.equal(estadoProgreso(10, 5).clave, 'por-iniciar');
  assert.equal(estadoProgreso(57, 7).clave, 'en-curso');
  assert.equal(estadoProgreso(100, 3).etiqueta, 'Completado');
});

test('resumen global suma todos los eventos', () => {
  const global = sumarProgresos([calcularProgreso(gestiones(5, 7), HOY), calcularProgreso(gestiones(3, 6), HOY), calcularProgreso([], HOY)]);
  assert.deepEqual(global, { total: 13, ejecutadas: 8, pendientes: 5, vencidas: 0, porcentaje: 62 });
});
