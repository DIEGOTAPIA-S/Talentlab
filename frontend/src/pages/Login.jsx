import { API_BASE_URL } from '../config/api';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TalentLabLogo from '../components/TalentLabLogo';

const API = API_BASE_URL;

export default function Login() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('estudiante@talentlab.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Estados del Modal "¿Olvidaste tu contraseña?"
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [forgotStatus, setForgotStatus] = useState({
    loading: false,
    success: null,
    error: null,
    resetLink: null
  });

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

  const handleSendRecovery = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotStatus({ loading: true, success: null, error: null, resetLink: null });
    setCopiedLink(false);

    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          frontend_url: window.location.origin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al procesar la solicitud.');
      }

      setForgotStatus({
        loading: false,
        success: data.message || 'Instrucciones generadas exitosamente.',
        error: null,
        resetLink: data.reset_link
      });
    } catch (err) {
      setForgotStatus({
        loading: false,
        success: null,
        error: err.message || 'Error de conexión con el servidor.',
        resetLink: null
      });
    }
  };

  const handleCopyLink = () => {
    if (!forgotStatus.resetLink) return;
    navigator.clipboard.writeText(forgotStatus.resetLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Contraseña</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email || '');
                  setForgotStatus({ loading: false, success: null, error: null, resetLink: null });
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
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

      {/* MODAL RECUPERACIÓN DE CONTRASEÑA */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  <i className="fa-solid fa-key"></i>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 700 }}>
                  Recuperar Contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Ingresa el correo institucional asociado a tu cuenta. Generaremos un enlace de recuperación seguro con vigencia de 30 minutos.
            </p>

            {forgotStatus.error && (
              <div className="alert alert-danger" style={{ display: 'flex', marginBottom: '16px', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{forgotStatus.error}</span>
              </div>
            )}

            {forgotStatus.success && (
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.12)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4ade80', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>¡Enlace generado exitosamente!</span>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {forgotStatus.success}
                </p>

                {forgotStatus.resetLink && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '0.78rem', padding: '8px' }}
                      >
                        <i className={`fa-solid ${copiedLink ? 'fa-check' : 'fa-copy'}`}></i>{' '}
                        {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotModal(false);
                          window.location.href = forgotStatus.resetLink;
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: '0.78rem', padding: '8px' }}
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square"></i> Abrir Enlace
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!forgotStatus.success ? (
              <form onSubmit={handleSendRecovery}>
                <div className="form-group" style={{ marginBottom: '18px' }}>
                  <label htmlFor="forgotEmail" style={{ fontSize: '0.85rem' }}>Correo Institucional</label>
                  <input
                    type="email"
                    id="forgotEmail"
                    className="form-control"
                    placeholder="ejemplo@talentlab.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowForgotModal(false)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={forgotStatus.loading}
                    style={{ fontSize: '0.85rem' }}
                  >
                    {forgotStatus.loading ? 'Enviando...' : 'Generar Enlace'} <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowForgotModal(false)}
                  style={{ fontSize: '0.85rem' }}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
