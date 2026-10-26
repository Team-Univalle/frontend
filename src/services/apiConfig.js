export function resolveApiUrl(env = {}) {
  const production = env.PROD === true || env.PROD === 'true';
  const configured = String(env.VITE_API_URL || '').trim();
  if (!configured && production) {
    throw new Error('Falta configurar VITE_API_URL para la API de producción.');
  }
  const value = configured || 'http://127.0.0.1:8000';
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_URL debe ser una URL absoluta válida.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_API_URL debe ser una URL HTTP o HTTPS sin credenciales, consulta ni fragmento.');
  }
  const host = url.hostname.toLowerCase();
  const loopback = host === 'localhost' || host.endsWith('.localhost') || host.startsWith('127.') || host === '[::1]' || host === '0.0.0.0';
  if (production && (url.protocol !== 'https:' || loopback)) {
    throw new Error('VITE_API_URL en producción debe usar una API pública HTTPS, no localhost.');
  }
  return url.href.replace(/\/+$/, '');
}
