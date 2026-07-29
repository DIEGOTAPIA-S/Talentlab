import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [activeRole, setActiveRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: activeRole })
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
      setError('Error de conexión con el servidor. ¿El backend está encendido en el puerto 8000?');
    }
  };

  return (
    <div className="login-layout">
      <div className="login-visuals">
        <div className="login-branding">
          <h1><i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span></h1>
          <p>Potenciando la retención estudiantil con IA.</p>
        </div>
      </div>
      
      <div className="login-container">
        <div className="login-header">
          <h2>Bienvenido de Nuevo</h2>
          <p>Selecciona tu perfil para ingresar</p>
        </div>

        <div className="role-selector">
          <div 
            className={`role-option ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => setActiveRole('student')}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span>Estudiante</span>
          </div>
          <div 
            className={`role-option ${activeRole === 'admin_tenant' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin_tenant')}
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
            <label htmlFor="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              className="form-control" 
              placeholder={activeRole === 'student' ? 'estudiante@talentlab.edu' : 'director@talentlab.edu'}
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
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Ingresar <i className="fa-solid fa-arrow-right-to-bracket"></i>
          </button>
        </form>
      </div>
    </div>
  );
}
