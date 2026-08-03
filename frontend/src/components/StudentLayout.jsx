import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

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
          <ul className="sidebar-menu">
            <li className={`sidebar-item ${location.pathname === '/simulador' ? 'active' : ''}`}>
              <Link to="/simulador"><i className="fa-solid fa-microphone-lines"></i> Simulador IA</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/mentorias' ? 'active' : ''}`}>
              <Link to="/mentorias"><i className="fa-solid fa-graduation-cap"></i> Mis Mentorías</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/mi-reporte' ? 'active' : ''}`}>
              <Link to="/mi-reporte"><i className="fa-solid fa-file-invoice"></i> Mi Reporte</Link>
            </li>
          </ul>
        </div>
        <div className="sidebar-item">
          <a href="#" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Salir
          </a>
        </div>
      </aside>

      {/* Main Content Area para el Estudiante */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
