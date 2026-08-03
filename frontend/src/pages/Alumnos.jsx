import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Alumnos() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Datos simulados por ahora, en producción vendrán del backend
  const alumnosData = [
    { id: 1, name: 'Diego Tapia', program: 'Tecnólogo en ADSO', email: 'estudiante@talentlab.edu', status: 'Activo' },
    { id: 2, name: 'Camila Restrepo', program: 'Diseño Gráfico Digital', email: 'crestrepo@talentlab.edu', status: 'Activo' },
    { id: 3, name: 'Mateo Bermúdez', program: 'Diseño Gráfico Digital', email: 'mbermudez@talentlab.edu', status: 'Riesgo' },
    { id: 4, name: 'Juan Pérez García', program: 'Tecnólogo en ADSO', email: 'jperez@talentlab.edu', status: 'Inactivo' },
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
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => alert(`Abriendo perfil detallado e historial de ${al.name}`)}>
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
    </>
  );
}
