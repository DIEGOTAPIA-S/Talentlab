import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate, Navigate } from 'react-router-dom';
import TalentLabLogo from './TalentLabLogo';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user_session') || 'null');
    } catch {
      return null;
    }
  });

  // Sincronizar cierre de sesión entre pestañas o ventanas abiertas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user_session') {
        const updated = e.newValue ? JSON.parse(e.newValue) : null;
        setSession(updated);
        if (!updated || !updated.email) {
          navigate('/login', { replace: true });
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  // Sincronización automática con la Base de Datos cuando el Directivo o Admin modifica datos del aprendiz
  useEffect(() => {
    const current = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (!current || !current.email) {
      setSession(null);
      return;
    }
    fetch(`${API_BASE_URL}/api/auth/profile?email=${encodeURIComponent(current.email)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(dbProf => {
        const activeNow = JSON.parse(localStorage.getItem('user_session') || 'null');
        if (!activeNow || !activeNow.email) return;
        if (dbProf && dbProf.email) {
          const updated = {
            ...activeNow,
            fullName: dbProf.fullName || activeNow.fullName,
            institution: dbProf.institution || activeNow.institution,
            title: dbProf.title || activeNow.title,
            program: dbProf.program || activeNow.program,
            phone: dbProf.phone || activeNow.phone,
            department: dbProf.department || activeNow.department
          };
          localStorage.setItem('user_session', JSON.stringify(updated));
          setSession(updated);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  // Protección estricta de ruta: si no hay sesión activa o el rol no es estudiante, redirigir a /login
  if (!session || !session.email || session.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  const rawName = session.fullName || 'Diego Tapia';
  const studentName = rawName.replace(/^Dra\.\s*/i, '');
  const institution = session.institution || 'SENA Centro de Tecnologías';

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user_session');
    setSession(null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar del Estudiante */}
      <aside className="sidebar">
        <div>
          <Link to="/simulador" className="sidebar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TalentLabLogo size={34} />
            <span>Talent<span>Lab</span></span>
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
            <Link to="/" style={{ color: '#94a3b8' }}>
              <i className="fa-solid fa-house"></i> Página de Inicio
            </Link>
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
