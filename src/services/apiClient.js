const BASE_URL = (import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function apiClient(endpoint, options = {}) {
  const { headers, ...requestOptions } = options;
  let response;

  // Recuperamos el token almacenado al iniciar sesión
  const token = localStorage.getItem('token');

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
        // Si el token existe, lo inyectamos automáticamente en el header Authorization
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError('No fue posible conectar con el servidor.', 0, null);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = response.status === 204
    ? null
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    // Si el backend responde con 401 (No autorizado) o 403, podríamos limpiar la sesión opcionalmente
    if (response.status === 401) {
      localStorage.removeItem('token');
      // Opcional: window.location.href = '/login';
    }

    const message = typeof data === 'object' && data?.error
      ? data.error
      : `Error en la petición: ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export default apiClient;
