import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('estudiante@talentlab.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setActiveRole(role);
    if (role === 'student') {
      setEmail('estudiante@talentlab.edu');
      setPassword('student123');
    } else {
      setEmail('director@talentlab.edu');
      setPassword('director123');
    }
  };

  const handleQuickLogin = (role) => {
    const defaultEmail = role === 'student' ? 'estudiante@talentlab.edu' : 'director@talentlab.edu';
    const defaultPass = role === 'student' ? 'student123' : 'director123';
    setActiveRole(role);
    setEmail(defaultEmail);
    setPassword(defaultPass);

    // Ejecuta el login directamente
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
      } else if (sessionData.role === 'admin_tenant') {
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
        <div className="login-branding">
          <h1><i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span></h1>
          <p>Potenciando la retención estudiantil y la orientación con IA.</p>
        </div>
      </div>
      
      <div className="login-container">
        <div className="login-header">
          <h2>Bienvenido de Nuevo</h2>
          <p>Selecciona tu perfil para ingresar a la plataforma</p>
        </div>

        <div className="role-selector">
          <div 
            className={`role-option ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span>Estudiante</span>
          </div>
          <div 
            className={`role-option ${activeRole === 'admin_tenant' ? 'active' : ''}`}
            onClick={() => handleRoleChange('admin_tenant')}
          >
            <i className="fa-solid fa-building-columns"></i>
            <span>Directivo</span>
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
            Ingresar al Sistema <i className="fa-solid fa-arrow-right-to-bracket"></i>
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px' }}>
            Acceso Rápido para Demostración SENA:
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1, fontSize: '0.78rem', padding: '8px 5px' }}
              onClick={() => handleQuickLogin('student')}
            >
              🎓 Como Estudiante
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ flex: 1, fontSize: '0.78rem', padding: '8px 5px' }}
              onClick={() => handleQuickLogin('admin_tenant')}
            >
              🏛️ Como Directivo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
