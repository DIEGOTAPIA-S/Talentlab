import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user_session');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <Link to="/dashboard" className="sidebar-brand">
            <i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span>
          </Link>
          <ul className="sidebar-menu">
            <li className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <Link to="/dashboard"><i className="fa-solid fa-chart-line"></i> Dashboard Riesgo</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/alumnos' ? 'active' : ''}`}>
              <Link to="/alumnos"><i className="fa-solid fa-users"></i> Alumnos Registrados</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/planes' ? 'active' : ''}`}>
              <Link to="/planes"><i className="fa-solid fa-file-contract"></i> Planes de Apoyo</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/egresados' ? 'active' : ''}`}>
              <Link to="/egresados"><i className="fa-solid fa-network-wired"></i> Red de Egresados</Link>
            </li>
          </ul>
        </div>
        <div className="sidebar-item">
          <a href="#" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Salir
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
