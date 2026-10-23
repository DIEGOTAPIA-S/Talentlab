import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_STUDENTS = [
  { name: 'Juan Pérez García', program: 'Tecnólogo en ADSO', risk: 'alto', factor: 'Económico (Transporte/Matrícula)', score: '42%' },
  { name: 'Camila Restrepo', program: 'Tecnólogo en ADSO', risk: 'alto', factor: 'Tiempo (Estudio y Trabajo)', score: '39%' },
  { name: 'Diego Tapia', program: 'Tecnólogo en ADSO', risk: 'medio', factor: 'Académico (Rendimiento Lógica)', score: '62%' },
  { name: 'Mateo Bermúdez', program: 'Diseño Gráfico Digital', risk: 'medio', factor: 'Personal (Desmotivación Vocacional)', score: '68%' },
  { name: 'Daniela Rojas', program: 'Tecnólogo en ADSO', risk: 'bajo', factor: 'Desempeño Estable', score: '89%' },
  { name: 'Estefanía Herrera', program: 'Desarrollo de Software', risk: 'bajo', factor: 'Desempeño Estable', score: '93%' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [totalEvaluated, setTotalEvaluated] = useState(96);
  const [kpiHigh, setKpiHigh] = useState(26);
  const [retentionRate, setRetentionRate] = useState('94%');
  const [filterRisk, setFilterRisk] = useState('todos');

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
        if (response.ok) {
          const data = await response.json();
          if (data.students && data.students.length > 0) {
            setStudents(data.students);
          }
          if (data.totalEvaluated) setTotalEvaluated(data.totalEvaluated);
          if (data.highRiskCount !== undefined) setKpiHigh(data.highRiskCount);
          if (data.retentionRate) setRetentionRate(data.retentionRate);
        }
      } catch (error) {
        console.warn('Backend local no detectado, operando con datos locales de contingencia:', error);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const triggerAction = (name, risk) => {
    if (risk === 'alto') {
      alert(`[ALERTA DE RETENCIÓN TALENTLAB]\nSe ha activado el protocolo prioritario para ${name}.\nAcción: Notificación enviada al orientador y citación para plan de apoyo.`);
    } else if (risk === 'medio') {
      alert(`[SEGUIMIENTO PREVENTIVO TALENTLAB]\nSe asignó tutoría académica y refuerzo vocacional para ${name}.`);
    } else {
      alert(`[REPORTE GENERAL]\nEl estudiante ${name} mantiene indicadores de permanencia y desempeño satisfactorios.`);
    }
  };

  const filteredStudents = filterRisk === 'todos' 
    ? students 
    : students.filter(s => s.risk === filterRisk);

  if (!session) return null;

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{session.institution}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Semáforo Predictivo de Retención Estudiantil y Analítica B2B.</p>
        </div>
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{ 
            width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
          }}>
            {(session.fullName || 'Patricia Gómez Salazar').replace(/^Dra\.\s*/i, '').split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h4 style={{ fontWeight: 600 }}>{(session.fullName || 'Patricia Gómez Salazar').replace(/^Dra\.\s*/i, '')}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {session.title || 'Coordinadora de Formación y Permanencia Académica'}
            </span>
          </div>
        </div>
      </header>

      {/* Tarjetas de Indicadores Clave (KPIs) */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Matrícula Evaluada</span>
            <div className="kpi-value">{totalEvaluated}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <i className="fa-solid fa-caret-up"></i> 100% Cuestionarios Completos
            </span>
          </div>
          <i className="fa-solid fa-users-viewfinder kpi-icon"></i>
        </div>
        
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Riesgo Alto (Semáforo Rojo)</span>
            <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{kpiHigh}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> 27.1% Requiere Atención
            </span>
          </div>
          <i className="fa-solid fa-triangle-exclamation kpi-icon"></i>
        </div>

        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Entrenamientos IA</span>
            <div className="kpi-value">64</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <i className="fa-solid fa-check"></i> Simulaciones Activas
            </span>
          </div>
          <i className="fa-solid fa-microphone-lines kpi-icon"></i>
        </div>

        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Retención Proyectada</span>
            <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{retentionRate}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <i className="fa-solid fa-circle-check"></i> Meta Cumplida
            </span>
          </div>
          <i className="fa-solid fa-heart-circle-check kpi-icon"></i>
        </div>
      </div>

      {/* Sección del Semáforo de Alertas Tempranas */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontWeight: 600 }}>Semáforo de Alertas Tempranas (Machine Learning)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Clasificación automática mediante modelo Random Forest para intervención oportuna.
            </p>
          </div>

          {/* Filtros rápidos */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${filterRisk === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => setFilterRisk('todos')}
            >
              Todos ({students.length})
            </button>
            <button 
              className={`btn ${filterRisk === 'alto' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterRisk !== 'alto' ? '#ef4444' : '#fff' }}
              onClick={() => setFilterRisk('alto')}
            >
              🔴 Alto
            </button>
            <button 
              className={`btn ${filterRisk === 'medio' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterRisk !== 'medio' ? '#f59e0b' : '#fff' }}
              onClick={() => setFilterRisk('medio')}
            >
              🟡 Medio
            </button>
            <button 
              className={`btn ${filterRisk === 'bajo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterRisk !== 'bajo' ? '#10b981' : '#fff' }}
              onClick={() => setFilterRisk('bajo')}
            >
              🟢 Bajo
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre del Estudiante</th>
                <th>Programa Técnico</th>
                <th>Nivel de Riesgo</th>
                <th>Factor Crítico Predominante</th>
                <th>Acción Sugerida</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                let badgeClass = '';
                let btnClass = 'btn-secondary';
                let actionText = 'Ver Detalle';
                
                if (student.risk === 'alto') {
                  badgeClass = 'badge-danger';
                  btnClass = 'btn-primary';
                  actionText = '🚨 Intervención';
                } else if (student.risk === 'medio') {
                  badgeClass = 'badge-warning';
                  actionText = 'Asignar Tutoría';
                } else {
                  badgeClass = 'badge-success';
                  actionText = 'Ver Reporte';
                }

                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 500 }}>{student.name}</td>
                    <td>{student.program}</td>
                    <td><span className={`badge ${badgeClass}`}>{student.risk.toUpperCase()} ({student.score})</span></td>
                    <td style={{ 
                      color: student.risk === 'bajo' ? 'var(--text-muted)' : 'var(--text-main)', 
                      fontWeight: student.risk === 'bajo' ? 'normal' : 500 
                    }}>
                      {student.factor}
                    </td>
                    <td>
                      <button 
                        className={`btn ${btnClass}`} 
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }} 
                        onClick={() => triggerAction(student.name, student.risk)}
                      >
                        {actionText}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
