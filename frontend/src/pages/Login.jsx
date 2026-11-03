import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TalentLabLogo from '../components/TalentLabLogo';

const API = 'http://localhost:8000';

export default function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('estudiante@talentlab.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setError(null);
    if (role === 'student') {
      setEmail('estudiante@talentlab.edu');
      setPassword('student123');
    } else if (role === 'admin_tenant') {
      setEmail('director@talentlab.edu');
      setPassword('director123');
    } else if (role === 'super_admin') {
      setEmail('admin@talentlab.edu');
      setPassword('admin123');
    }
  };

  const handleQuickLogin = (role) => {
    const defaultEmail =
      role === 'student'
        ? 'estudiante@talentlab.edu'
        : role === 'super_admin'
        ? 'admin@talentlab.edu'
        : 'director@talentlab.edu';
    const defaultPass =
      role === 'student'
        ? 'student123'
        : role === 'super_admin'
        ? 'admin123'
        : 'director123';

    setActiveRole(role);
    setEmail(defaultEmail);
    setPassword(defaultPass);
    executeLogin(defaultEmail, defaultPass, role);
  };

  const executeLogin = async (loginEmail, loginPass, role) => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass, role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Credenciales inválidas.');
        setSubmitting(false);
        return;
      }

      const sessionData = await response.json();
      localStorage.setItem('user_session', JSON.stringify(sessionData));

      if (sessionData.role === 'student') {
        navigate('/simulador');
      } else if (sessionData.role === 'super_admin') {
        navigate('/admin/usuarios');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el backend (Puerto 8000). Asegúrate de que el servidor FastAPI esté iniciado.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    executeLogin(email, password, activeRole);
  };

  return (
    <div className="login-layout">
      {/* Lado Izquierdo: Branding Limpio y Elegante */}
      <div className="login-visuals">
        <div
          className="login-branding"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            padding: '0 32px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            <TalentLabLogo size={64} />
            <h1 style={{ margin: 0, fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Talent<span>Lab</span>
            </h1>
          </div>

          <div
            style={{
              width: '72px',
              height: '3px',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #38bdf8, #8b5cf6, #ec4899)',
              marginBottom: '16px'
            }}
          />

          <p
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#f8fafc',
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}
          >
            “Detecta. Prepara. Conecta.”
          </p>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Volver a la Página Principal
          </Link>
        </div>
      </div>

      {/* Lado Derecho: Formulario Estricto de Iniciar Sesión */}
      <div className="login-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <Link
            to="/"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-house"></i> Inicio
          </Link>

          <Link
            to="/registro"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#38bdf8',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          >
            <i className="fa-solid fa-user-plus"></i> Crear Cuenta
          </Link>
        </div>

        <div className="login-header" style={{ marginBottom: '24px' }}>
          <h2>Acceso al Ecosistema</h2>
          <p>Selecciona tu perfil para ingresar</p>
        </div>

        {/* Selector de los 3 Roles */}
        <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          <div
            className={`role-option ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
            style={{ padding: '12px 8px' }}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Estudiante</span>
          </div>
          <div
            className={`role-option ${activeRole === 'admin_tenant' ? 'active' : ''}`}
            onClick={() => handleRoleChange('admin_tenant')}
            style={{ padding: '12px 8px' }}
          >
            <i className="fa-solid fa-building-columns"></i>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Directivo</span>
          </div>
          <div
            className={`role-option ${activeRole === 'super_admin' ? 'active' : ''}`}
            onClick={() => handleRoleChange('super_admin')}
            style={{ padding: '12px 8px' }}
          >
            <i className="fa-solid fa-user-shield"></i>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Administrador</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', marginBottom: '20px' }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Correo Institucional</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Iniciar Sesión'} <i className="fa-solid fa-arrow-right-to-bracket"></i>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>¿No tienes una cuenta aún? </span>
          <Link to="/registro" style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
            Regístrate aquí
          </Link>
        </div>

        <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>
            Acceso Rápido de Demostración:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '8px 6px' }}
              onClick={() => handleQuickLogin('student')}
            >
              🎓 Estudiante
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '8px 6px' }}
              onClick={() => handleQuickLogin('admin_tenant')}
            >
              🏛️ Directivo
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '8px 6px' }}
              onClick={() => handleQuickLogin('super_admin')}
            >
              🛡️ Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
