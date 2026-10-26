import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApiUrl } from '../src/services/apiConfig.js';

test('desarrollo permite backend local sin variable', () => {
  assert.equal(resolveApiUrl({}), 'http://127.0.0.1:8000');
});
test('producción requiere API HTTPS y normaliza la barra final', () => {
  assert.equal(resolveApiUrl({ PROD: true, VITE_API_URL: ' https://backend-qs5z.onrender.com/ ' }), 'https://backend-qs5z.onrender.com');
  assert.throws(() => resolveApiUrl({ PROD: true }), /Falta configurar/);
  for (const value of ['http://api.example.com', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://0.0.0.0']) {
    assert.throws(() => resolveApiUrl({ PROD: true, VITE_API_URL: value }), /API pública HTTPS/);
  }
});
test('rechaza URLs inválidas, credenciales o parámetros accidentales', () => {
  for (const value of ['api', 'ftp://api.example.com', 'https://user:pass@api.example.com', 'https://api.example.com?secret=value', 'https://api.example.com#anchor']) {
    assert.throws(() => resolveApiUrl({ PROD: true, VITE_API_URL: value }));
  }
});
