import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../services/authService';
import Toast from '../components/Toast';
import '../components/Toast.css';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }

  function toggleMode() {
    setIsRegistering((prev) => !prev);
    setError('');
    setForm({ name: '', email: '', password: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password || (isRegistering && !form.name)) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isRegistering) {
        response = await registerUser(form);
      } else {
        response = await loginUser(form);
      }

      const token = response.token || response.access;
      if (!token) {
        throw new Error('No se recibió un token de autenticación.');
      }

      localStorage.setItem('token', token);
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      setToast({ message: isRegistering ? '¡Cuenta creada con éxito!' : '¡Bienvenido!', type: 'success' });
      setTimeout(() => {
        navigate('/today');
      }, 800);
    } catch (err) {
      const mensajeError = err?.data?.error || err?.message || (isRegistering ? 'Error al registrarse.' : 'Credenciales incorrectas.');
      setError(mensajeError);
      setToast({ message: isRegistering ? 'Error en el registro' : 'Error al iniciar sesión', type: 'error' });
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

      {/* Panel Derecho (Formulario de Acceso / Registro) */}
      <main className="login-main">
        <div className="login-form-container">
          <div className="login-header">
            <h2>{isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}</h2>
            <p>{isRegistering ? 'Regístrate para empezar a organizar tu planificación.' : 'Accede a tu planificación y prioridades.'}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              {isRegistering && (
                <div className="field field--name">
                  <label htmlFor="name">Nombre</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre completo"
                    value={form.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              )}

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

            <div className="form-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <button className="boton-guardado" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? (isRegistering ? 'Registrando...' : 'Ingresando...') : (isRegistering ? 'Registrarse' : 'Ingresar')}
              </button>

              <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#4f46e5',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  textAlign: 'center'
                }}
              >
                {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
              </button>
            </div>
          </form>

          <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
        </div>
      </main>
    </div>
  );
}