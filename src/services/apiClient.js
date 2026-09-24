const BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

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

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...requestOptions,
      headers: {
        'Content-Type': 'application/json',
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
    const message = typeof data === 'object' && data?.error
      ? data.error
      : `Error en la petición: ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export default apiClient;
