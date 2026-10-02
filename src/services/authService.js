import apiClient from './apiClient';

/**
 * Inicia sesión enviando las credenciales al backend.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Retorna los datos del usuario y el token de acceso.
 */
export async function loginUser(credentials) {
  const response = await apiClient('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Guardar token y datos del usuario en localStorage para acceso instantáneo
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  if (response.user) {
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  return response;
}

export function logoutUser() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function getCurrentUser() {
  // 1. Intentar obtener el usuario directamente del localStorage
  const savedUser = localStorage.getItem('user');
  if (savedUser && savedUser !== 'undefined') {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error('Error al parsear el usuario del localStorage', e);
    }
  }

  // 2. Si no está en localStorage, consultarlo al backend (/me)
  try {
    const user = await apiClient('/me');
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    return user;
  } catch (error) {
    console.error('Error al obtener el usuario actual del backend:', error);
    return null;
  }
}