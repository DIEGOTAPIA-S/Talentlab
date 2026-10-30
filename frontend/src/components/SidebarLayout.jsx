import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';

export default function SidebarLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const isSuperAdmin = session.role === 'super_admin';
  const rawName = session.fullName || (isSuperAdmin ? 'Carlos Alberto Ramírez' : 'Patricia Gómez Salazar');
  const displayName = rawName.replace(/^Dra\.\s*/i, '');
  const institutionName = session.institution || 'SENA - Centro de Tecnologías del Software';

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user_session');
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div>
          <Link to={isSuperAdmin ? "/admin/usuarios" : "/dashboard"} className="sidebar-brand">
            <i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span>
          </Link>

          {/* Tarjeta de Identidad del Rol Activo */}
          <div style={{ padding: '0 8px', marginBottom: '22px' }}>
            <div style={{ 
              background: isSuperAdmin ? 'rgba(245, 158, 11, 0.12)' : 'rgba(139, 92, 246, 0.12)',
              border: isSuperAdmin ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(139, 92, 246, 0.3)', 
              borderRadius: '10px',
              padding: '12px 14px' 
            }}>
              <span style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isSuperAdmin ? '#fbbf24' : 'var(--primary)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className={`fa-solid ${isSuperAdmin ? 'fa-user-shield' : 'fa-building-columns'}`}></i>
                {isSuperAdmin ? 'Administrador General' : 'Directivo Institucional'}
              </span>
              <strong style={{ fontSize: '0.9rem', display: 'block', color: 'var(--text-main)', marginTop: '4px' }}>
                {displayName}
              </strong>
              {!isSuperAdmin && (
                <span style={{
                  fontSize: '0.72rem',
                  color: '#c4b5fd',
                  display: 'block',
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  lineHeight: 1.3
                }}>
                  <i className="fa-solid fa-location-dot" style={{ marginRight: '4px' }}></i>
                  {institutionName}
                </span>
              )}
            </div>
          </div>

          <ul className="sidebar-menu">
            {isSuperAdmin ? (
              <>
                <li className={`sidebar-item ${location.pathname === '/admin/usuarios' ? 'active' : ''}`}>
                  <Link to="/admin/usuarios"><i className="fa-solid fa-users-gear"></i> Gestión de Usuarios</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/consolidado' ? 'active' : ''}`}>
                  <Link to="/consolidado"><i className="fa-solid fa-layer-group"></i> Consolidado General</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/alumnos' ? 'active' : ''}`}>
                  <Link to="/alumnos"><i className="fa-solid fa-user-graduate"></i> Directorio de Estudiantes</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/planes' ? 'active' : ''}`}>
                  <Link to="/planes"><i className="fa-solid fa-clipboard-check"></i> Planes de Mejoramiento</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/egresados' ? 'active' : ''}`}>
                  <Link to="/egresados"><i className="fa-solid fa-network-wired"></i> Red de Egresados</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/perfil' ? 'active' : ''}`}>
                  <Link to="/perfil"><i className="fa-solid fa-user-gear"></i> Mi Perfil</Link>
                </li>
              </>
            ) : (
              <>
                <li className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                  <Link to="/dashboard"><i className="fa-solid fa-chart-line"></i> Riesgo de mi Institución</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/alumnos' ? 'active' : ''}`}>
                  <Link to="/alumnos"><i className="fa-solid fa-users"></i> Estudiantes de mi Sede</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/planes' ? 'active' : ''}`}>
                  <Link to="/planes"><i className="fa-solid fa-clipboard-check"></i> Planes de Mejoramiento</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/consolidado' ? 'active' : ''}`}>
                  <Link to="/consolidado"><i className="fa-solid fa-chart-pie"></i> Analítica de mi Sede</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/egresados' ? 'active' : ''}`}>
                  <Link to="/egresados"><i className="fa-solid fa-network-wired"></i> Red de Egresados</Link>
                </li>
                <li className={`sidebar-item ${location.pathname === '/perfil' ? 'active' : ''}`}>
                  <Link to="/perfil"><i className="fa-solid fa-user-gear"></i> Mi Perfil</Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <div>
          <div className="sidebar-item">
            <a href="#" onClick={handleLogout} style={{ color: 'var(--color-danger)' }}>
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar Sesión
            </a>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
