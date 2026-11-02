import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TalentLabLogo from '../components/TalentLabLogo';

export default function Login() {
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('estudiante@talentlab.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass, role: role })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Credenciales inválidas.');
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
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    executeLogin(email, password, activeRole);
  };

  return (
    <div className="login-layout">
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
              margin: 0,
              textAlign: 'center'
            }}
          >
            “Detecta. Prepara. Conecta.”
          </p>
        </div>
      </div>
      
      <div className="login-container">
        <div className="login-header">
          <h2>Acceso al Ecosistema</h2>
          <p>Selecciona tu perfil para ingresar</p>
        </div>

        {/* Selector limpio de los 3 Roles */}
        <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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
          <button type="submit" className="btn btn-primary btn-block">
            Iniciar Sesión <i className="fa-solid fa-arrow-right-to-bracket"></i>
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
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
