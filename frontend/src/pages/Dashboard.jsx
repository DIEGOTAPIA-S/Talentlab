import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [kpiHigh, setKpiHigh] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem('user_session'));
    if (!sessionData || sessionData.role !== 'admin_tenant') {
      navigate('/login');
      return;
    }
    setSession(sessionData);

    const loadDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard/risk-semaphore');
        if (!response.ok) {
          setError("Error loading dashboard data");
          return;
        }
        const data = await response.json();
        setKpiHigh(data.highRiskCount);
        setStudents(data.students);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Error conectando con el servidor Backend (Puerto 8000)');
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    navigate('/login');
  };

  const triggerAction = (name, risk) => {
    if (risk === 'alto') {
      alert(`[TALENTLAB ALERT] Iniciando protocolo de retención para ${name}. Se enviará correo automático con opciones de subsidio de transporte y horario flexible.`);
    } else {
      alert(`Abriendo reporte general de habilidades e historial de simulaciones para ${name}.`);
    }
  };

  if (!session) return null; // loading or redirecting

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <Link to="/dashboard" className="sidebar-brand">
            <i className="fa-solid fa-flask-bubble"></i> Talent<span>Lab</span>
          </Link>
          <ul className="sidebar-menu">
            <li className="sidebar-item active">
              <Link to="/dashboard"><i className="fa-solid fa-chart-line"></i> Dashboard Riesgo</Link>
            </li>
            <li className="sidebar-item">
              <a href="#"><i className="fa-solid fa-users"></i> Alumnos Registrados</a>
            </li>
            <li className="sidebar-item">
              <a href="#"><i className="fa-solid fa-file-contract"></i> Planes de Apoyo</a>
            </li>
          </ul>
        </div>
        <div className="sidebar-item">
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Salir
          </a>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="main-content">
        <header className="panel-header">
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{session.institution}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Alertas Predictivas de Deserción y Seguimiento Académico B2B.</p>
          </div>
          <div className="user-info">
            <div className="avatar">
              {session.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h4 style={{ fontWeight: 600 }}>{session.fullName}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Coordinadora de Permanencia</span>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <div className="kpi-grid">
          <div className="card kpi-card">
            <div>
              <span className="kpi-label">Matrícula Evaluada</span>
              <div className="kpi-value">96</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}><i className="fa-solid fa-caret-up"></i> 100% Cuestionario</span>
            </div>
            <i className="fa-solid fa-users-viewfinder kpi-icon"></i>
          </div>
          
          <div className="card kpi-card">
            <div>
              <span className="kpi-label">Riesgo Alto (Semáforo)</span>
              <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{kpiHigh}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}><i className="fa-solid fa-triangle-exclamation"></i> 27.1% Alertas</span>
            </div>
            <i className="fa-solid fa-triangle-exclamation kpi-icon"></i>
          </div>

          <div className="card kpi-card">
            <div>
              <span className="kpi-label">Entrenamientos IA</span>
              <div className="kpi-value">64</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}><i className="fa-solid fa-check"></i> Activos</span>
            </div>
            <i className="fa-solid fa-microphone-lines kpi-icon"></i>
          </div>

          <div className="card kpi-card">
            <div>
              <span className="kpi-label">Retención Lograda</span>
              <div className="kpi-value" style={{ color: 'var(--color-success)' }}>94%</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}><i className="fa-solid fa-circle-check"></i> Meta Semestre</span>
            </div>
            <i className="fa-solid fa-heart-circle-check kpi-icon"></i>
          </div>
        </div>

        {/* Semaphore Alerts Section */}
        <div className="card" style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Semáforo de Alertas Tempranas (Machine Learning)</h3>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre del Estudiante</th>
                  <th>Programa Técnico</th>
                  <th>Nivel de Riesgo</th>
                  <th>Factor Crítico Predominante</th>
                  <th>Acciones sugeridas</th>
                </tr>
              </thead>
              <tbody>
                {error ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'red' }}>{error}</td></tr>
                ) : (
                  students.map((student, index) => {
                    let badgeClass = '';
                    let btnClass = 'btn-secondary';
                    let actionText = 'Contactar';
                    
                    if (student.risk === 'alto') {
                      badgeClass = 'badge-danger';
                      btnClass = 'btn-primary';
                      actionText = 'Intervención Urgente';
                    } else if (student.risk === 'medio') {
                      badgeClass = 'badge-warning';
                    } else {
                      badgeClass = 'badge-success';
                      actionText = 'Ver Reporte';
                    }

                    return (
                      <tr key={index}>
                        <td style={{ fontWeight: 500 }}>{student.name}</td>
                        <td>{student.program}</td>
                        <td><span className={`badge ${badgeClass}`}>{student.risk} ({student.score})</span></td>
                        <td style={{ 
                          color: student.risk === 'bajo' ? 'var(--text-muted)' : 'var(--text-main)', 
                          fontWeight: student.risk === 'bajo' ? 'normal' : 500 
                        }}>
                          {student.factor}
                        </td>
                        <td>
                          <button 
                            className={`btn ${btnClass}`} 
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }} 
                            onClick={() => triggerAction(student.name, student.risk)}
                          >
                            {actionText}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
