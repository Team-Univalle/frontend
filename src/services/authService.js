import apiClient from './apiClient';

/**
 * Inicia sesión enviando las credenciales al backend.
 * @param {Object} credentials - { email, password } (o username según configure tu backend)
 * @returns {Promise<Object>} Retorna los datos del usuario y el token de acceso.
 */
export async function loginUser(credentials) {
  // Ajusta la ruta '/auth/login/' o '/api/login/' según lo que defina tu backend
  const response = await apiClient('/auth/login/', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return response;
}

/**
 * Cierra la sesión limpiando el token del almacenamiento local.
 */
export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user'); // Por si también guardas datos del usuario
}

/**
 * Obtiene los datos del usuario autenticado actual (opcional, si tu backend tiene la ruta).
 */
export async function getCurrentUser() {
  return await apiClient('/auth/me/');
}