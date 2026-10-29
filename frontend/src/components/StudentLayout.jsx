import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const rawName = session.role === 'student' ? (session.fullName || 'Diego Tapia') : 'Diego Tapia';
  const studentName = rawName.replace(/^Dra\.\s*/i, '');
  const institution = session.institution || 'SENA Centro de Tecnologías';

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
                ESTUDIANTE / APRENDIZ
              </strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>
                {studentName}
              </span>
              <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.7rem', color: '#67e8f9' }}>
                <i className="fa-solid fa-building-columns"></i> {institution}
              </div>
            </div>
          </div>

          <ul className="sidebar-menu">
            <li className={`sidebar-item ${location.pathname === '/simulador' ? 'active' : ''}`}>
              <Link to="/simulador"><i className="fa-solid fa-microphone-lines"></i> Simulador IA</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/mi-reporte' ? 'active' : ''}`}>
              <Link to="/mi-reporte"><i className="fa-solid fa-clipboard-check"></i> Mi Reporte y Planes</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/mentorias' ? 'active' : ''}`}>
              <Link to="/mentorias"><i className="fa-solid fa-graduation-cap"></i> Mis Mentorías (IA)</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/perfil' ? 'active' : ''}`}>
              <Link to="/perfil"><i className="fa-solid fa-user-gear"></i> Mi Perfil</Link>
            </li>
          </ul>
        </div>

        <div>
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
