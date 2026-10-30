import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_STUDENTS = [
  { id: 1, name: 'Juan Pérez García', program: 'Tecnólogo en ADSO', attendance: 62, academic_score: 58, risk: 'alto', factor: 'Económico (Transporte / Sin Auxilio)', score: '82%' },
  { id: 2, name: 'Camila Restrepo', program: 'Tecnólogo en ADSO', attendance: 65, academic_score: 60, risk: 'alto', factor: 'Tiempo (Cruce Estudio y Trabajo)', score: '78%' },
  { id: 3, name: 'Diego Tapia', program: 'Tecnólogo en ADSO', attendance: 78, academic_score: 72, risk: 'medio', factor: 'Académico (Refuerzo en Competencias)', score: '55%' },
  { id: 4, name: 'Mateo Bermúdez', program: 'Diseño Gráfico Digital', attendance: 80, academic_score: 70, risk: 'medio', factor: 'Personal (Desmotivación Vocacional)', score: '48%' },
  { id: 5, name: 'Daniela Rojas', program: 'Tecnólogo en ADSO', attendance: 95, academic_score: 91, risk: 'bajo', factor: 'Desempeño Estable', score: '18%' },
  { id: 6, name: 'Estefanía Herrera', program: 'Desarrollo de Software', attendance: 98, academic_score: 94, risk: 'bajo', factor: 'Desempeño Estable', score: '12%' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState(DEFAULT_STUDENTS);
  const [totalEvaluated, setTotalEvaluated] = useState(6);
  const [kpiHigh, setKpiHigh] = useState(2);
  const [retentionRate, setRetentionRate] = useState('94%');
  const [activePlansCount, setActivePlansCount] = useState(4);
  const [filterRisk, setFilterRisk] = useState('todos');

  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem('user_session'));
    if (!sessionData || (sessionData.role !== 'admin_tenant' && sessionData.role !== 'super_admin')) {
      navigate('/login');
      return;
    }
    setSession(sessionData);

    const loadDashboardData = async () => {
      try {
        const instParam = sessionData.role === 'admin_tenant' && sessionData.institution
          ? `?institution=${encodeURIComponent(sessionData.institution)}`
          : '';
        const response = await fetch(`http://localhost:8000/api/dashboard/risk-semaphore${instParam}`);
        if (response.ok) {
          const data = await response.json();
          if (data.students) setStudents(data.students);
          if (data.totalEvaluated !== undefined) setTotalEvaluated(data.totalEvaluated);
          if (data.highRiskCount !== undefined) setKpiHigh(data.highRiskCount);
          if (data.retentionRate) setRetentionRate(data.retentionRate);
          if (data.activePlansCount !== undefined) setActivePlansCount(data.activePlansCount);
        }
      } catch (error) {
        console.warn('Backend local no detectado, operando con datos locales de contingencia:', error);
      }
    };

    loadDashboardData();
  }, [navigate]);

  const handleAssignImprovementPlan = (student) => {
    navigate(`/planes?studentId=${student.id || ''}&studentName=${encodeURIComponent(student.name)}`);
  };

  const filteredStudents = filterRisk === 'todos' 
    ? students 
    : students.filter(s => s.risk === filterRisk);

  if (!session) return null;

  return (
    <>
      <header className="panel-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>{session.institution}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Monitoreo de alertas tempranas, factores de deserción y Planes de Mejoramiento de tu institución.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/alumnos')}
          >
            <i className="fa-solid fa-sliders"></i> Gestionar Factores / Cargar CSV
          </button>

          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="avatar" style={{ 
              width: '42px', height: '42px', borderRadius: '50%', background: 'var(--primary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' 
            }}>
              {(session.fullName || 'Patricia Gómez Salazar').replace(/^Dra\.\s*/i, '').split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <h4 style={{ fontWeight: 600, margin: 0 }}>{(session.fullName || 'Patricia Gómez Salazar').replace(/^Dra\.\s*/i, '')}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {session.title || 'Coordinadora de Formación y Permanencia Académica'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tarjetas de Indicadores Clave (KPIs de la Institución) */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Estudiantes de mi Sede</span>
            <div className="kpi-value">{totalEvaluated}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <i className="fa-solid fa-caret-up"></i> Monitoreo Activo
            </span>
          </div>
          <i className="fa-solid fa-users-viewfinder kpi-icon"></i>
        </div>
        
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Riesgo Alto en Sede</span>
            <div className="kpi-value" style={{ color: 'var(--color-danger)' }}>{kpiHigh}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)' }}>
              <i className="fa-solid fa-triangle-exclamation"></i> Prioridad de Mejoramiento
            </span>
          </div>
          <i className="fa-solid fa-triangle-exclamation kpi-icon"></i>
        </div>

        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Planes de Mejoramiento</span>
            <div className="kpi-value" style={{ color: '#38bdf8' }}>{activePlansCount}</div>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
              <i className="fa-solid fa-clipboard-check"></i> Seguimiento Pedagógico
            </span>
          </div>
          <i className="fa-solid fa-clipboard-list kpi-icon"></i>
        </div>

        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Retención Proyectada</span>
            <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{retentionRate}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <i className="fa-solid fa-circle-check"></i> Meta Institucional
            </span>
          </div>
          <i className="fa-solid fa-heart-circle-check kpi-icon"></i>
        </div>
      </div>

      {/* Sección del Semáforo de Alertas Tempranas de la Institución */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontWeight: 600, margin: '0 0 4px 0' }}>Semáforo de Alertas Tempranas</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Calculado a partir de Asistencia/Fallas, Rendimiento Académico, Caracterización Socioeconómica y Simulador IA.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
              Riesgo Alto
            </button>
            <button 
              className={`btn ${filterRisk === 'medio' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterRisk !== 'medio' ? '#f59e0b' : '#fff' }}
              onClick={() => setFilterRisk('medio')}
            >
              Riesgo Medio
            </button>
            <button 
              className={`btn ${filterRisk === 'bajo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 12px', fontSize: '0.8rem', color: filterRisk !== 'bajo' ? '#10b981' : '#fff' }}
              onClick={() => setFilterRisk('bajo')}
            >
              Riesgo Bajo
            </button>
          </div>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Programa</th>
                <th>Asistencia / Promedio</th>
                <th>Semáforo (Probabilidad)</th>
                <th>Factor Clave Calculado</th>
                <th>Entrevista IA</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                let badgeClass = 'badge-success';
                let btnClass = 'btn-secondary';
                let actionText = 'Ver / Asignar Plan';
                
                if (student.risk === 'alto') {
                  badgeClass = 'badge-danger';
                  btnClass = 'btn-primary';
                  actionText = 'Crear Plan Prioritario';
                } else if (student.risk === 'medio') {
                  badgeClass = 'badge-warning';
                  actionText = 'Asignar Plan Preventivo';
                }

                return (
                  <tr key={student.id || index}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      {student.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>}
                    </td>
                    <td>{student.program}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{student.attendance ?? 85}%</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> · {student.academic_score ?? 75} pts</span>
                    </td>
                    <td><span className={`badge ${badgeClass}`}>{student.risk.toUpperCase()} ({student.score})</span></td>
                    <td style={{ 
                      color: student.risk === 'bajo' ? 'var(--text-muted)' : 'var(--text-main)', 
                      fontWeight: student.risk === 'bajo' ? 'normal' : 500 
                    }}>
                      {student.factor}
                    </td>
                    <td>
                      {student.interview_score ? (
                        <span style={{ fontWeight: 700, color: student.interview_score >= 75 ? '#34d399' : '#fbbf24' }}>
                          {student.interview_score}/100 pts
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pendiente</span>
                      )}
                    </td>
                    <td>
                      <button 
                        className={`btn ${btnClass}`} 
                        style={{ padding: '6px 14px', fontSize: '0.78rem' }} 
                        onClick={() => handleAssignImprovementPlan(student)}
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
