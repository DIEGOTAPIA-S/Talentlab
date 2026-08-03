import React from 'react';

export default function Planes() {
  const planesData = [
    { id: 101, title: 'Apoyo Económico de Transporte', assignedTo: 'Diego Tapia', status: 'En Progreso', progress: 50 },
    { id: 102, title: 'Tutoría de Refuerzo Lógica', assignedTo: 'Camila Restrepo', status: 'Pendiente', progress: 0 },
    { id: 103, title: 'Revisión Psicológica (Desmotivación)', assignedTo: 'Mateo Bermúdez', status: 'Completado', progress: 100 },
  ];

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Planes de Apoyo</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de intervenciones y retención estudiantil.</p>
        </div>
      </header>

      <div className="grid-3">
        {planesData.map(plan => (
          <div key={plan.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <span className={`badge ${
                plan.status === 'Completado' ? 'badge-success' : 
                plan.status === 'En Progreso' ? 'badge-warning' : 'badge-danger'
              }`}>
                {plan.status}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ID: {plan.id}</span>
            </div>
            <h3 style={{ marginBottom: '10px' }}>{plan.title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
              <i className="fa-solid fa-user"></i> Asignado a: {plan.assignedTo}
            </p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${plan.progress}%`, 
                height: '100%', 
                background: 'var(--primary)',
                transition: 'width 0.5s ease'
              }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progreso</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{plan.progress}%</span>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => alert(`Gestionando el plan: ${plan.title} para ${plan.assignedTo}`)}>
                Gestionar Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
