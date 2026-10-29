import React, { useState, useEffect } from 'react';

export default function Alumnos() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('todos');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);

  // Formulario de Creación / Edición
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    program: 'Tecnólogo en ADSO',
    attendance: 85,
    academic_score: 75,
    stratum: 2,
    has_financial_aid: 0,
    status: 'Activo'
  });

  const [notification, setNotification] = useState(null);
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const isSuperAdmin = session.role === 'super_admin';
  const myInstitution = session.institution || 'SENA - Centro de Tecnologías del Software';

  // Cargar estudiantes desde la API (aislados por institución si es Directivo)
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const instQuery = !isSuperAdmin && myInstitution
        ? `?institution=${encodeURIComponent(myInstitution)}`
        : '';
      const res = await fetch(`http://localhost:8000/api/students${instQuery}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.warn('Backend local no detectado:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [myInstitution, isSuperAdmin]);

  const showToast = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Crear Estudiante (POST)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        institution: !isSuperAdmin ? myInstitution : (formData.institution || myInstitution)
      };
      const res = await fetch('http://localhost:8000/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showToast(`Estudiante registrado exitosamente en ${payload.institution}.`);
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          program: 'Tecnólogo en ADSO',
          attendance: 85,
          academic_score: 75,
          stratum: 2,
          has_financial_aid: 0,
          status: 'Activo'
        });
        fetchStudents();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Error al registrar el estudiante');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    }
  };

  // Abrir Modal de Edición
  const handleEditClick = (student) => {
    setSelectedAlumno(student);
    setFormData({
      name: student.name,
      email: student.email,
      program: student.program,
      attendance: student.attendance || 80,
      academic_score: student.academic_score || 70,
      stratum: student.stratum || 2,
      has_financial_aid: student.has_financial_aid ? 1 : 0,
      status: student.status || 'Activo'
    });
    setShowEditModal(true);
  };

  // Actualizar Estudiante (PUT)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAlumno) return;
    try {
      const res = await fetch(`http://localhost:8000/api/students/${selectedAlumno.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast('Datos del estudiante actualizados correctamente.');
        setShowEditModal(false);
        fetchStudents();
      } else {
        alert('Error al actualizar el estudiante.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    }
  };

  // Eliminar Estudiante (DELETE)
  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`¿Está seguro de eliminar al estudiante ${name} del sistema institucional?`)) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/students/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`El estudiante ${name} fue eliminado del registro.`, 'warning');
        fetchStudents();
      } else {
        alert('Error al eliminar el estudiante.');
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  // Asignar Plan de Apoyo desde Modal
  const handleAssignSupportPlan = async (student) => {
    try {
      const res = await fetch('http://localhost:8000/api/plans/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Tutoría de Refuerzo y Auxilio - ${student.factor}`,
          student_id: student.id,
          assigned_to: student.name,
          type: student.factor.includes('Económico') ? 'Económico' : 'Académico',
          progress: 10,
          status: 'En Progreso'
        })
      });
      if (res.ok) {
        showToast(`Plan de contingencia asignado a ${student.name}.`);
        setSelectedAlumno(null);
      }
    } catch (err) {
      showToast('No se pudo conectar para registrar el plan.', 'error');
    }
  };

  // Filtrado reactivo
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'todos' || s.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  return (
    <>
      <header className="panel-header">
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px',
            borderRadius: '999px', background: isSuperAdmin ? 'rgba(245, 158, 11, 0.16)' : 'rgba(168, 85, 247, 0.16)',
            border: isSuperAdmin ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(168, 85, 247, 0.4)',
            color: isSuperAdmin ? '#fbbf24' : '#d8b4fe', fontSize: '0.74rem', fontWeight: 700, marginBottom: '6px'
          }}>
            <i className={`fa-solid ${isSuperAdmin ? 'fa-crown' : 'fa-building-columns'}`}></i>
            {isSuperAdmin ? 'ALCANCE GLOBAL MULTI-INSTITUCIÓN' : `INSTITUCIÓN ACTIVA: ${myInstitution.toUpperCase()}`}
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
            {isSuperAdmin ? 'Directorio Global de Estudiantes' : 'Estudiantes de mi Institución'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {isSuperAdmin
              ? 'Supervisión total de matrículas en todas las instituciones registradas.'
              : `Gestión y monitoreo de los estudiantes pertenecientes exclusivamente a ${myInstitution}.`}
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <i className="fa-solid fa-user-plus"></i> Matricular Estudiante en Sede
          </button>
        </div>
      </header>

      {/* Alerta / Notificación Toast */}
      {notification && (
        <div className={`alert ${notification.type === 'warning' ? 'alert-warning' : 'alert-success'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="card">
        {/* Barra de Filtros y Búsqueda */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div className="form-group" style={{ width: '320px', marginBottom: 0 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nombre, correo o programa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtrar Semáforo:</span>
            <button 
              className={`btn btn-secondary ${filterRisk === 'todos' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setFilterRisk('todos')}
            >
              Todos ({students.length})
            </button>
            <button 
              className={`btn btn-secondary ${filterRisk === 'alto' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              onClick={() => setFilterRisk('alto')}
            >
              Riesgo Alto
            </button>
            <button 
              className={`btn btn-secondary ${filterRisk === 'medio' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: '#f59e0b', color: '#f59e0b' }}
              onClick={() => setFilterRisk('medio')}
            >
              Riesgo Medio
            </button>
            <button 
              className={`btn btn-secondary ${filterRisk === 'bajo' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
              onClick={() => setFilterRisk('bajo')}
            >
              Riesgo Bajo
            </button>
          </div>
        </div>

        {/* Tabla de Matrícula CRUD */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre del Aprendiz</th>
                <th>Programa de Formación</th>
                <th>Correo Institucional</th>
                <th>Semáforo de Deserción</th>
                <th>Factor Clave</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                    <i className="fa-solid fa-spinner fa-spin"></i> Cargando base de datos de estudiantes...
                  </td>
                </tr>
              ) : filteredStudents.map((al) => (
                <tr key={al.id}>
                  <td>#{al.id}</td>
                  <td style={{ fontWeight: 600 }}>{al.name}</td>
                  <td>{al.program}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{al.email}</td>
                  <td>
                    <span className={`badge ${
                      al.risk === 'alto' ? 'badge-danger' : 
                      al.risk === 'medio' ? 'badge-warning' : 'badge-success'
                    }`}>
                      <i className={`fa-solid ${al.risk === 'alto' ? 'fa-triangle-exclamation' : al.risk === 'medio' ? 'fa-clock' : 'fa-circle-check'}`}></i>{' '}
                      {al.risk ? al.risk.toUpperCase() : 'BAJO'} ({al.risk_probability || al.score})
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{al.factor}</td>
                  <td>
                    <span className={`badge ${al.status === 'Activo' ? 'badge-success' : 'badge-warning'}`}>
                      {al.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.78rem', marginRight: '6px' }}
                      title="Ver Diagnóstico Completo"
                      onClick={() => setSelectedAlumno(al)}
                    >
                      <i className="fa-solid fa-eye"></i>
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.78rem', marginRight: '6px', color: 'var(--primary)' }}
                      title="Editar Datos"
                      onClick={() => handleEditClick(al)}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '0.78rem', color: 'var(--color-danger)' }}
                      title="Eliminar Estudiante"
                      onClick={() => handleDeleteStudent(al.id, al.name)}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No se encontraron estudiantes que coincidan con la búsqueda o filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: NUEVO ESTUDIANTE (CREATE) */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '560px', maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>

            <h2 style={{ marginBottom: '6px', fontSize: '1.4rem' }}>Registrar Nuevo Estudiante</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              El algoritmo de Machine Learning calculará su probabilidad de deserción automáticamente.
            </p>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="Ej: Andrés Felipe Gómez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Correo Institucional</label>
                <input 
                  type="email" 
                  className="form-control" 
                  required 
                  placeholder="Ej: afgomez@talentlab.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Programa de Formación</label>
                <select 
                  className="form-control"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                >
                  <option value="Tecnólogo en ADSO">Tecnólogo en ADSO</option>
                  <option value="Diseño Gráfico Digital">Diseño Gráfico Digital</option>
                  <option value="Desarrollo de Software">Desarrollo de Software</option>
                  <option value="Gestión de Redes y Telecomunicaciones">Gestión de Redes y Telecomunicaciones</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Tasa de Asistencia (%)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="10" 
                    max="100" 
                    value={formData.attendance}
                    onChange={(e) => setFormData({ ...formData, attendance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Rendimiento Académico (0-100)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0" 
                    max="100" 
                    value={formData.academic_score}
                    onChange={(e) => setFormData({ ...formData, academic_score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Estrato Socioeconómico</label>
                  <select 
                    className="form-control"
                    value={formData.stratum}
                    onChange={(e) => setFormData({ ...formData, stratum: parseInt(e.target.value) || 1 })}
                  >
                    <option value="1">Estrato 1 (Vulnerabilidad Alta)</option>
                    <option value="2">Estrato 2 (Vulnerabilidad Media)</option>
                    <option value="3">Estrato 3 (Medio)</option>
                    <option value="4">Estrato 4 o superior</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>¿Cuenta con Auxilio/Beca?</label>
                  <select 
                    className="form-control"
                    value={formData.has_financial_aid}
                    onChange={(e) => setFormData({ ...formData, has_financial_aid: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">No (Sin auxilio)</option>
                    <option value="1">Sí (Subsidio / Beca)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar y Calibrar IA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDITAR ESTUDIANTE (UPDATE) */}
      {showEditModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '560px', maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setShowEditModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>

            <h2 style={{ marginBottom: '6px', fontSize: '1.4rem' }}>Editar Datos del Estudiante</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Al modificar asistencia o notas, el nivel de riesgo del semáforo se recalcula en tiempo real.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Correo Institucional</label>
                <input 
                  type="email" 
                  className="form-control" 
                  required 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Asistencia (%)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.attendance}
                    onChange={(e) => setFormData({ ...formData, attendance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Rendimiento (0-100)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={formData.academic_score}
                    onChange={(e) => setFormData({ ...formData, academic_score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Estado de Matrícula</label>
                  <select 
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Riesgo">En Riesgo</option>
                    <option value="Inactivo">Inactivo / Retirado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Auxilio Financiero</label>
                  <select 
                    className="form-control"
                    value={formData.has_financial_aid}
                    onChange={(e) => setFormData({ ...formData, has_financial_aid: parseInt(e.target.value) || 0 })}
                  >
                    <option value="0">No (Sin auxilio)</option>
                    <option value="1">Sí (Con auxilio)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Actualizar Estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VER DIAGNÓSTICO DETALLADO */}
      {selectedAlumno && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '520px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedAlumno(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {selectedAlumno.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{selectedAlumno.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{selectedAlumno.email} | {selectedAlumno.program}</p>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>Diagnóstico del Semáforo de Deserción</h4>
              <p style={{ 
                fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 6px 0',
                color: selectedAlumno.risk === 'alto' ? 'var(--color-danger)' : selectedAlumno.risk === 'medio' ? '#f59e0b' : 'var(--color-success)' 
              }}>
                <i className={`fa-solid ${selectedAlumno.risk === 'alto' ? 'fa-triangle-exclamation' : selectedAlumno.risk === 'medio' ? 'fa-clock' : 'fa-circle-check'}`}></i>{' '}
                Riesgo {selectedAlumno.risk ? selectedAlumno.risk.toUpperCase() : 'BAJO'} ({selectedAlumno.risk_probability || selectedAlumno.score})
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                <strong>Factor Principal Detectado:</strong> {selectedAlumno.factor}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Asistencia Registrada</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedAlumno.attendance || 85}%</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rendimiento Académico</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{selectedAlumno.academic_score || 75}/100</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => setSelectedAlumno(null)}
              >
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 2 }} 
                onClick={() => handleAssignSupportPlan(selectedAlumno)}
              >
                <i className="fa-solid fa-file-signature"></i> Asignar Plan de Contingencia
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
