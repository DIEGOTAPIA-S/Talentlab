import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const rawName = session.role === 'student' ? (session.fullName || 'Diego Tapia') : 'Diego Tapia';
  const studentName = rawName.replace(/^Dra\.\s*/i, '');

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user_session');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar del Estudiante */}
      <aside className="sidebar">
        <div>
          <Link to="/simulador" className="sidebar-brand">
            <i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span>
          </Link>

          {/* Badge del Perfil de Estudiante */}
          <div style={{ padding: '0 15px', marginBottom: '18px' }}>
            <div style={{ 
              background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.35)', 
              borderRadius: '8px', padding: '10px 12px' 
            }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--secondary)', fontWeight: 700, display: 'block' }}>
                <i className="fa-solid fa-user-graduate"></i> Perfil Activo
              </span>
              <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-main)', marginTop: '2px' }}>
                APRENDIZ SENA
              </strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {studentName}
              </span>
            </div>
          </div>

          <ul className="sidebar-menu">
            <li className={`sidebar-item ${location.pathname === '/simulador' ? 'active' : ''}`}>
              <Link to="/simulador"><i className="fa-solid fa-microphone-lines"></i> Simulador IA</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/mentorias' ? 'active' : ''}`}>
              <Link to="/mentorias"><i className="fa-solid fa-graduation-cap"></i> Mis Mentorías (IA)</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/mi-reporte' ? 'active' : ''}`}>
              <Link to="/mi-reporte"><i className="fa-solid fa-file-invoice"></i> Mi Reporte</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/perfil' ? 'active' : ''}`}>
              <Link to="/perfil"><i className="fa-solid fa-user-gear"></i> Mi Perfil</Link>
            </li>
          </ul>
        </div>

        <div>
          {/* Indicador de Estado de Base de Datos */}
          <div style={{ 
            padding: '10px 14px', margin: '0 15px 12px 15px', 
            background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', 
            borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 600, marginBottom: '2px' }}>
              <i className="fa-solid fa-database"></i> Base de Datos Activa
            </div>
            <span>SQLite Local / PostgreSQL Ready</span>
          </div>

          <div className="sidebar-item">
            <a href="#" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Salir
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area para el Estudiante */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
