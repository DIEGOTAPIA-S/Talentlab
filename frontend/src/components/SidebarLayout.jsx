import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const rawName = session.fullName || 'Patricia Gómez Salazar';
  const adminName = rawName.replace(/^Dra\.\s*/i, '');

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user_session');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar para Administrador */}
      <aside className="sidebar">
        <div>
          <Link to="/dashboard" className="sidebar-brand">
            <i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span>
          </Link>

          {/* Badge del Perfil de Administrador */}
          <div style={{ padding: '0 15px', marginBottom: '18px' }}>
            <div style={{ 
              background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', 
              borderRadius: '8px', padding: '10px 12px' 
            }}>
              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700, display: 'block' }}>
                <i className="fa-solid fa-shield-halved"></i> Perfil Activo
              </span>
              <strong style={{ fontSize: '0.88rem', display: 'block', color: 'var(--text-main)', marginTop: '2px' }}>
                ADMINISTRADOR
              </strong>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {adminName}
              </span>
            </div>
          </div>

          <ul className="sidebar-menu">
            <li className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <Link to="/dashboard"><i className="fa-solid fa-chart-line"></i> Dashboard Riesgo</Link>
            </li>
            <li className={`sidebar-item ${location.pathname === '/consolidado' ? 'active' : ''}`}>
              <Link to="/consolidado"><i className="fa-solid fa-layer-group"></i> Consolidado Global</Link>
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
            <li className={`sidebar-item ${location.pathname === '/perfil' ? 'active' : ''}`}>
              <Link to="/perfil"><i className="fa-solid fa-id-card"></i> Mi Perfil y Sistema</Link>
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

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
