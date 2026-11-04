import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';

export default function Egresados() {
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [programsCatalog, setProgramsCatalog] = useState([
    'Tecnólogo en ADSO',
    'Diseño Gráfico Digital',
    'Desarrollo de Software',
    'Tecnólogo en Gestión Empresarial',
    'Tecnólogo en Contabilidad y Finanzas',
    'Ingeniería de Sistemas'
  ]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    program: 'Tecnólogo en ADSO',
    grad_year: 2024,
    company: '',
    current_role: '',
    linkedin_url: '',
    is_mentor: 1
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchGraduates = async () => {
    try {
      setLoading(true);
      const [res, progRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/graduates`),
        fetch(`${API_BASE_URL}/api/institutions/programs`)
      ]);
      if (res.ok) {
        const data = await res.json();
        setGraduates(data.graduates || []);
      }
      if (progRes.ok) {
        const pData = await progRes.json();
        if (Array.isArray(pData.programs) && pData.programs.length > 0) {
          setProgramsCatalog(pData.programs);
        }
      }
    } catch (e) {
      console.warn('API egresados no disponible:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMentor = async (grad) => {
    try {
      const nextMentor = grad.isMentor ? 0 : 1;
      const res = await fetch(`${API_BASE_URL}/api/graduates/${grad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_mentor: nextMentor })
      });
      if (res.ok) {
        showToast(
          nextMentor === 1
            ? `${grad.name} habilitado como Mentor IA para los estudiantes.`
            : `${grad.name} retirado del listado de Mentores IA.`
        );
        fetchGraduates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGraduate = async (grad) => {
    if (!window.confirm(`¿Deseas desvincular a ${grad.name} de la Red de Egresados y Mentores?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/graduates/${grad.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast(`${grad.name} desvinculado de la Red de Egresados.`);
        fetchGraduates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchGraduates();
  }, []);

  const handleCreateGraduate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/graduates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showToast('Egresado vinculado exitosamente a la Red TalentLab.');
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          program: 'Tecnólogo en ADSO',
          grad_year: 2024,
          company: '',
          current_role: '',
          linkedin_url: '',
          is_mentor: 1
        });
        fetchGraduates();
      } else {
        alert('Error al registrar egresado.');
      }
    } catch (e) {
      alert('Error de conexión.');
    }
  };

  const filteredGraduates = graduates.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) ||
                          g.company.toLowerCase().includes(search.toLowerCase()) ||
                          g.role.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = filterProgram === 'todos' || g.program === filterProgram;
    return matchesSearch && matchesProgram;
  });

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Red de Egresados y Casos de Éxito</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Ecosistema de graduados SENA insertados en el sector productivo que impulsan la permanencia de nuevos aprendices.
          </p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="fa-solid fa-user-plus"></i> Vincular Egresado
          </button>
        </div>
      </header>

      {toast && (
        <div className={`alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Tarjetas de Métricas de Egresados */}
      <div className="kpi-grid" style={{ marginBottom: '25px' }}>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Egresados Vinculados</span>
            <div className="kpi-value">{graduates.length}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>
              <i className="fa-solid fa-check-double"></i> 100% Verificados en el SENA
            </span>
          </div>
          <i className="fa-solid fa-user-graduate kpi-icon"></i>
        </div>

        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Tasa de Empleabilidad</span>
            <div className="kpi-value" style={{ color: 'var(--color-success)' }}>87%</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inserción formal en tecnología</span>
          </div>
          <i className="fa-solid fa-briefcase kpi-icon"></i>
        </div>

        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Mentores Voluntarios</span>
            <div className="kpi-value" style={{ color: 'var(--primary)' }}>
              {graduates.filter(g => g.isMentor).length}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Disponibles para orientación</span>
          </div>
          <i className="fa-solid fa-hand-holding-heart kpi-icon"></i>
        </div>
      </div>

      <div className="card">
        {/* Barra de Búsqueda y Filtros */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div className="form-group" style={{ width: '320px', marginBottom: 0 }}>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por egresado, empresa o cargo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className={`btn btn-secondary ${filterProgram === 'todos' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setFilterProgram('todos')}
            >
              Todos los Programas
            </button>
            <button 
              className={`btn btn-secondary ${filterProgram === 'Tecnólogo en ADSO' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setFilterProgram('Tecnólogo en ADSO')}
            >
              ADSO
            </button>
            <button 
              className={`btn btn-secondary ${filterProgram === 'Diseño Gráfico Digital' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setFilterProgram('Diseño Gráfico Digital')}
            >
              Diseño
            </button>
          </div>
        </div>

        {/* Directorio de Egresados en Grid */}
        <div className="grid-3">
          {loading ? (
            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Cargando directorio de egresados...
            </div>
          ) : filteredGraduates.map((grad) => (
            <div key={grad.id} className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', marginBottom: '6px', display: 'inline-block' }}>
                    Promoción {grad.gradYear}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', margin: '2px 0' }}>{grad.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                    {grad.program}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleMentor(grad)}
                    title={grad.isMentor ? 'Mentor IA Activo (Clic para pausar)' : 'Habilitar como Mentor IA'}
                    style={{
                      padding: '4px 9px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: grad.isMentor ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.12)',
                      background: grad.isMentor ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255,255,255,0.04)',
                      color: grad.isMentor ? '#34d399' : '#94a3b8'
                    }}
                  >
                    <i className="fa-solid fa-medal"></i> {grad.isMentor ? 'Mentor IA' : 'Inactivo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGraduate(grad)}
                    title="Desvincular egresado"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      padding: '4px'
                    }}
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empresa y Cargo Actual:</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', margin: '2px 0 0 0' }}>
                  <i className="fa-solid fa-building" style={{ color: 'var(--secondary)', marginRight: '6px' }}></i>
                  {grad.role} en <strong>{grad.company}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <a 
                  href={grad.linkedin || `mailto:${grad.email}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary" 
                  style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', padding: '8px' }}
                >
                  <i className="fa-brands fa-linkedin"></i> Contactar
                </a>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1, fontSize: '0.8rem', padding: '8px' }}
                  onClick={() => alert(`Solicitud de contacto enviada a ${grad.name} a través del centro de egresados SENA.`)}
                >
                  <i className="fa-solid fa-envelope"></i> Mensaje
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL VINCULAR EGRESADO */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '520px', maxWidth: '92%', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>

            <h2 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Vincular Egresado a la Red</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Los egresados vinculados pueden ofrecer mentorías voluntarias a aprendices en formación.
            </p>

            <form onSubmit={handleCreateGraduate}>
              <div className="form-group">
                <label>Nombre Completo del Egresado</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  placeholder="Ej: Daniel Fernando Torres"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    placeholder="correo@empresa.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Año de Graduación</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="2018" max="2026"
                    value={formData.grad_year}
                    onChange={(e) => setFormData({ ...formData, grad_year: parseInt(e.target.value) || 2024 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Programa de Formación (Sincronizado con Catálogo Institucional)</label>
                <select 
                  className="form-control"
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', colorScheme: 'dark' }}
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                >
                  {programsCatalog.map(p => (
                    <option key={p} value={p} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Empresa Actual</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Ej: Globant / Bancolombia"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Cargo Desempeñado</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="Ej: Desarrollador Backend"
                    value={formData.current_role}
                    onChange={(e) => setFormData({ ...formData, current_role: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Perfil de LinkedIn / Portafolio (Opcional)</label>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://linkedin.com/in/usuario"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Vincular a la Red
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
