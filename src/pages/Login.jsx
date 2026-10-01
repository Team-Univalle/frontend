import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService'; // <--- Importamos el servicio
import Toast from '../components/Toast';
import '../components/Toast.css';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      // Llamamos a la API real a través de nuestro authService
      // El backend te devolverá un objeto que comúnmente contiene el token y datos del usuario
      const response = await loginUser(form);

      // Guardamos el token en el localStorage (asegúrate de que la propiedad coincida con lo que envíe tu backend, ej: response.token o response.access)
      const token = response.token || response.access;
      if (!token) {
        throw new Error('No se recibió un token de autenticación.');
      }

      localStorage.setItem('token', token);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      setToast({ message: '¡Bienvenido!', type: 'success' });
      setTimeout(() => {
        navigate('/eventos'); // Te redirige a la vista principal protegida
      }, 800);
    } catch (err) {
      const mensajeError = err?.data?.detail || err?.message || 'Credenciales incorrectas.';
      setError(mensajeError);
      setToast({ message: 'Error al iniciar sesión', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="forms-principal">
      <h1>Iniciar Sesión</h1>
      <p>Ingresa tus datos para acceder a tu plataforma</p>

      <section className="forms" aria-label="Iniciar sesión">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field field--email">
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="field field--password">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {error && <div className="general-error" role="alert">{error}</div>}

          <div className="form-actions">
            <button className="boton-guardado" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
      </section>
    </main>
  );
}