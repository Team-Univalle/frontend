import apiClient from './apiClient';

/**
 * Inicia sesión enviando las credenciales al backend.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Retorna los datos del usuario y el token de acceso.
 */
export async function loginUser(credentials) {
  // CORRECCIÓN: Cambiado de '/auth/login/' a '/login' para que coincida con tu urls.py
  const response = await apiClient('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  return response;
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function getCurrentUser() {
  // Y si usas '/auth/me/' aquí, recuerda que en tu urls.py está como '/me'
  return await apiClient('/me');
}