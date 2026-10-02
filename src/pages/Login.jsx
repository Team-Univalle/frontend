import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
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
      const response = await loginUser(form);
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
        navigate('/today'); // Redirige a la vista principal correcta (Hoy)
      }, 800);
    } catch (err) {
      // Modificado de 'detail' a 'error' para que coincida exactamente con tu exceptions.py del backend
      const mensajeError = err?.data?.error || err?.message || 'Credenciales incorrectas.';
      setError(mensajeError);
      setToast({ message: 'Error al iniciar sesión', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-layout">
      {/* Panel Izquierdo (Oscuro con Branding y Frase) */}
      <aside className="login-sidebar">
        <div className="sidebar-top">
          <h1>Organiza</h1>
          <br></br>
          <p>Tus eventos bajo control, incluso cuando cambian los planes.</p>
        </div>

        <div className="sidebar-quote-card">
          <blockquote>
            “En segundos quiero saber qué requiere atención hoy.”
          </blockquote>
          <span>
            Diseñado para organizadores que coordinan proveedores, clientes y múltiples fechas a la vez.
          </span>
        </div>
      </aside>

      {/* Panel Derecho (Formulario de Acceso) */}
      <main className="login-main">
        <div className="login-form-container">
          <div className="login-header">
            <h2>Iniciar sesión</h2>
            <p>Accede a tu planificación y prioridades.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="field field--email">
                <label htmlFor="email">Correo</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="veronica@correo.com"
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
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

            {error && <div className="general-error" role="alert">{error}</div>}

            <div className="form-actions">
              <button className="boton-guardado" type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </div>
          </form>

          <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </div>
      </main>
    </div>
  );
}