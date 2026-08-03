import React from 'react';

export default function Mentorias() {
  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Mis Mentorías</h1>
          <p style={{ color: 'var(--text-muted)' }}>Conecta con egresados que superaron tus mismos retos.</p>
        </div>
      </header>

      <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <i className="fa-solid fa-graduation-cap" style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '20px' }}></i>
        <h2 style={{ marginBottom: '10px' }}>No tienes mentorías asignadas</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto', marginBottom: '30px' }}>
          Basado en tu perfil, TalentLab te recomendará egresados de tu programa que puedan ofrecerte orientación académica o profesional.
        </p>
        <button className="btn btn-primary" onClick={() => alert("Función de emparejamiento con IA próximamente.")}>
          <i className="fa-solid fa-magnifying-glass"></i> Buscar Mentores
        </button>
      </div>
    </>
  );
}
