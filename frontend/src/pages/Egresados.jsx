import React from 'react';

export default function Egresados() {
  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Red de Egresados</h1>
          <p style={{ color: 'var(--text-muted)' }}>Conecta a los estudiantes actuales con casos de éxito.</p>
        </div>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <i className="fa-solid fa-network-wired" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
        <h2 style={{ marginBottom: '10px' }}>Módulo en Construcción</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto', marginBottom: '30px' }}>
          La Red de Contacto con Egresados será un espacio donde los estudiantes en riesgo de deserción podrán 
          recibir mentorías de alumnos que ya se graduaron de su mismo programa.
        </p>
        <button className="btn btn-primary" onClick={() => alert("Función de invitaciones próximamente.")}>
          <i className="fa-solid fa-envelope"></i> Invitar Egresado
        </button>
      </div>
    </>
  );
}
