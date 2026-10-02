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

  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  if (response.user) {
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  return response;
}

/**
 * Registra un nuevo usuario en el backend.
 * @param {Object} credentials - { name, email, password }
 * @returns {Promise<Object>} Retorna los datos del usuario y el token de acceso.
 */
export async function registerUser(credentials) {
  const response = await apiClient('/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

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
  const savedUser = localStorage.getItem('user');
  if (savedUser && savedUser !== 'undefined') {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error('Error al parsear el usuario del localStorage', e);
    }
  }

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