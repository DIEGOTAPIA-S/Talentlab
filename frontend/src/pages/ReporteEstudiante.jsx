import React from 'react';

export default function ReporteEstudiante() {
  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Mi Reporte de Desempeño</h1>
          <p style={{ color: 'var(--text-muted)' }}>Resumen de tus entrevistas y planes de apoyo.</p>
        </div>
      </header>

      <div className="grid-3">
        <div className="card">
          <h3 style={{ marginBottom: '10px' }}>Última Entrevista IA</h3>
          <div className="score-circle score-circle-success" style={{ margin: '20px auto' }}>78</div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Puntaje de Comunicación</p>
        </div>

        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '10px' }}>Mis Planes de Apoyo</h3>
          <div style={{ marginTop: '20px' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '5px' }}>Apoyo Económico de Transporte</h4>
            <span className="badge badge-warning" style={{ marginBottom: '10px', display: 'inline-block' }}>En Progreso</span>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `50%`, height: '100%', background: 'var(--primary)' }}></div>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '10px' }}>
              Progreso: 50%. Siguiente paso: Entregar documentación en Bienestar.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
