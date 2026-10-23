import React, { useState, useEffect } from 'react';

export default function Egresados() {
  const [graduates, setGraduates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('todos');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

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
      const res = await fetch('http://localhost:8000/api/graduates');
      if (res.ok) {
        const data = await res.json();
        setGraduates(data.graduates || []);
      }
    } catch (e) {
      console.warn('API egresados no disponible:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraduates();
  }, []);

  const handleCreateGraduate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/graduates', {
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
                {grad.isMentor && (
                  <span title="Mentor Voluntario Activo" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                    <i className="fa-solid fa-medal"></i>
                  </span>
                )}
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
                <label>Programa de Formación SENA</label>
                <select 
                  className="form-control"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                >
                  <option value="Tecnólogo en ADSO">Tecnólogo en ADSO</option>
                  <option value="Diseño Gráfico Digital">Diseño Gráfico Digital</option>
                  <option value="Desarrollo de Software">Desarrollo de Software</option>
                  <option value="Gestión de Redes">Gestión de Redes</option>
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
