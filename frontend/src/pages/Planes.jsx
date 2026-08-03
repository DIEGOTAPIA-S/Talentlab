import React, { useState } from 'react';

export default function Planes() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [progress, setProgress] = useState(0);

  const planesData = [
    { id: 101, title: 'Apoyo Económico de Transporte', assignedTo: 'Diego Tapia', status: 'En Progreso', progress: 50 },
    { id: 102, title: 'Tutoría de Refuerzo Lógica', assignedTo: 'Camila Restrepo', status: 'Pendiente', progress: 0 },
    { id: 103, title: 'Revisión Psicológica (Desmotivación)', assignedTo: 'Mateo Bermúdez', status: 'Completado', progress: 100 },
  ];

  const handleManageClick = (plan) => {
    setSelectedPlan(plan);
    setProgress(plan.progress);
  };

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
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleManageClick(plan)}>
                Gestionar Plan
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Gestionar Plan */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedPlan(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            <h2 style={{ marginBottom: '5px' }}>{selectedPlan.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Estudiante: <strong>{selectedPlan.assignedTo}</strong>
            </p>
            
            <div className="form-group">
              <label className="form-label">Estado de la Intervención</label>
              <select className="form-control">
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso" selected>En Progreso</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Progreso del Plan: {progress}%</label>
              <input 
                type="range" 
                min="0" max="100" 
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                style={{ width: '100%', cursor: 'pointer', marginTop: '10px' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Notas de Seguimiento</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Ej. El estudiante recibió el subsidio correctamente..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedPlan(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                alert("Cambios guardados con éxito en la base de datos.");
                setSelectedPlan(null);
              }}>Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
