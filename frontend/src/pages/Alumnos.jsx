import React, { useState } from 'react';

export default function Alumnos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  
  // Datos simulados por ahora, en producción vendrán del backend
  const alumnosData = [
    { id: 1, name: 'Diego Tapia', program: 'Tecnólogo en ADSO', email: 'estudiante@talentlab.edu', status: 'Activo', risk: 'ALTO (85%)', factor: 'Económico (Transporte)' },
    { id: 2, name: 'Camila Restrepo', program: 'Diseño Gráfico Digital', email: 'crestrepo@talentlab.edu', status: 'Activo', risk: 'BAJO (20%)', factor: 'Estable' },
    { id: 3, name: 'Mateo Bermúdez', program: 'Diseño Gráfico Digital', email: 'mbermudez@talentlab.edu', status: 'Riesgo', risk: 'MEDIO (68%)', factor: 'Personal (Desmotivación)' },
    { id: 4, name: 'Juan Pérez García', program: 'Tecnólogo en ADSO', email: 'jperez@talentlab.edu', status: 'Inactivo', risk: 'ALTO (42%)', factor: 'Económico (Matrícula)' },
  ];

  const filteredAlumnos = alumnosData.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.program.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Alumnos Registrados</h1>
          <p style={{ color: 'var(--text-muted)' }}>Directorio general de matrícula y estado actual.</p>
        </div>
      </header>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div className="form-group" style={{ width: '300px', marginBottom: 0 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nombre o programa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary">
            <i className="fa-solid fa-plus"></i> Importar CSV
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Programa</th>
                <th>Correo Institucional</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlumnos.map((al) => (
                <tr key={al.id}>
                  <td>#{al.id}</td>
                  <td style={{ fontWeight: 500 }}>{al.name}</td>
                  <td>{al.program}</td>
                  <td>{al.email}</td>
                  <td>
                    <span className={`badge ${
                      al.status === 'Activo' ? 'badge-success' : 
                      al.status === 'Riesgo' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {al.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => setSelectedAlumno(al)}>
                      Ver Perfil
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAlumnos.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No se encontraron alumnos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ver Perfil */}
      {selectedAlumno && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedAlumno(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            <h2 style={{ marginBottom: '5px' }}>{selectedAlumno.name}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{selectedAlumno.email} | {selectedAlumno.program}</p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>Nivel de Riesgo (ML)</h4>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: selectedAlumno.risk.includes('ALTO') ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                <i className="fa-solid fa-triangle-exclamation"></i> {selectedAlumno.risk}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Factor: {selectedAlumno.factor}</p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '5px' }}>Última Simulación IA</h4>
              <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>Puntaje: 78/100</p>
              <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px', marginTop: '5px' }}>
                <li>Buena presentación inicial de perfil.</li>
                <li>Podría detallar más sus habilidades técnicas.</li>
              </ul>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
              alert("Plan de apoyo creado y notificado al estudiante.");
              setSelectedAlumno(null);
            }}>
              Asignar Plan de Apoyo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
