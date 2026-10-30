import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

const DEFAULT_INSTITUTIONS = [
  'SENA - Centro de Tecnologías del Software',
  'SENA - Centro de Comercio y Servicios',
  'Institución Universitaria Tecnológica de Antioquia'
];

const selectStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  colorScheme: 'dark'
};

const optionStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc'
};

export default function AdminUsuarios() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'staff' | 'students' | 'institutions'
  const [search, setSearch] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('todas');

  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [allInstNames, setAllInstNames] = useState(DEFAULT_INSTITUTIONS);
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalStudents: 0,
    totalInstitutions: 0,
    highRiskTotal: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [toast, setToast] = useState(null);

  // Modales de Gestión
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [customInstitution, setCustomInstitution] = useState('');

  const [formData, setFormData] = useState({
    role: 'admin_tenant',
    name: '',
    email: '',
    institution: 'SENA - Centro de Tecnologías del Software',
    title_or_program: 'Coordinador Académico Institucional',
    phone: '+57 300 000 0000',
    department: 'Coordinación Académica',
    attendance: 88,
    academic_score: 78,
    stratum: 2,
    has_financial_aid: 0,
    status: 'Activo'
  });

  const notify = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (!s || (s.role !== 'super_admin' && s.role !== 'admin_tenant')) {
      navigate('/login');
      return;
    }
    setSession(s);
  }, [navigate]);

  const fetchEcosystem = useCallback(async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({
        institution: institutionFilter,
        search: search
      }).toString();
      const res = await fetch(`${API}/api/admin/users?${qs}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff || []);
        setStudents(data.students || []);
        setInstitutions(data.institutions || []);
        if (data.allInstitutionNames && data.allInstitutionNames.length > 0) {
          setAllInstNames(data.allInstitutionNames);
        }
        setKpis(data.kpis || {});
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.warn('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionFilter, search]);

  useEffect(() => {
    if (session) fetchEcosystem();
  }, [session, fetchEcosystem]);

  const openCreateModalWithRole = (defaultRole = 'admin_tenant', defaultInst = 'SENA - Centro de Tecnologías del Software') => {
    setCustomInstitution('');
    setFormData({
      role: defaultRole,
      name: '',
      email: '',
      institution: defaultInst,
      title_or_program: defaultRole === 'student' ? 'Tecnólogo en ADSO' : 'Coordinador Académico Institucional',
      phone: '+57 310 450 2030',
      department: defaultRole === 'student' ? 'Formación Profesional' : 'Coordinación Académica',
      attendance: 88,
      academic_score: 78,
      stratum: 2,
      has_financial_aid: 0,
      status: 'Activo'
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const targetInst = formData.institution === '__otra__' ? customInstitution.trim() : formData.institution;
    if (!targetInst) {
      alert('Por favor especifica el nombre de la institución.');
      return;
    }

    try {
      const res = await fetch(`${API}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          institution: targetInst
        })
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message || 'Usuario registrado exitosamente.');
        setShowCreateModal(false);
        fetchEcosystem();
      } else {
        alert(data.detail || 'No se pudo registrar el usuario.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor backend.');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setCustomInstitution('');
    const cleanInst = user.institution && user.institution.includes('Gobierno Global')
      ? 'Dirección General'
      : user.institution;
    setFormData({
      role: user.role,
      name: user.name,
      email: user.email,
      institution: cleanInst,
      title_or_program: (user.titleOrProgram || user.program || '').replace(/\s*\(Super Admin\)/i, ''),
      phone: user.phone || '+57 300 000 0000',
      department: user.department || 'Coordinación Académica',
      attendance: user.attendance ?? 85,
      academic_score: user.academic_score ?? 75,
      stratum: user.stratum ?? 2,
      has_financial_aid: user.has_financial_aid ? 1 : 0,
      status: user.status || 'Activo'
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    const targetInst = formData.institution === '__otra__' ? customInstitution.trim() : formData.institution;
    if (!targetInst) {
      alert('Por favor especifica el nombre de la institución.');
      return;
    }

    try {
      let res;
      if (editingUser.role === 'student') {
        res = await fetch(`${API}/api/students/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            program: formData.title_or_program,
            institution: targetInst,
            attendance: Number(formData.attendance),
            academic_score: Number(formData.academic_score),
            stratum: Number(formData.stratum),
            has_financial_aid: Number(formData.has_financial_aid),
            status: formData.status
          })
        });
      } else {
        res = await fetch(`${API}/api/admin/users/staff/${encodeURIComponent(editingUser.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role,
            institution: targetInst,
            title_or_program: formData.title_or_program,
            phone: formData.phone,
            department: formData.department,
            status: formData.status
          })
        });
      }

      if (res.ok) {
        notify('Datos del usuario actualizados correctamente.');
        setShowEditModal(false);
        setEditingUser(null);
        fetchEcosystem();
      } else {
        const err = await res.json();
        alert(err.detail || 'Error al actualizar usuario.');
      }
    } catch (err) {
      alert('Error de conexión con el backend.');
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.email === 'admin@talentlab.edu') {
      alert('La cuenta principal de Administrador General no puede ser eliminada.');
      return;
    }
    const label = user.role === 'student' ? 'estudiante' : 'directivo';
    if (!window.confirm(`¿Confirmas eliminar al ${label} "${user.name}" (${user.institution})?`)) {
      return;
    }

    try {
      let res;
      if (user.role === 'student') {
        res = await fetch(`${API}/api/students/${user.id}`, { method: 'DELETE' });
      } else {
        res = await fetch(`${API}/api/admin/users/staff/${encodeURIComponent(user.email)}`, { method: 'DELETE' });
      }
      if (res.ok) {
        notify(`Usuario "${user.name}" eliminado.`);
        fetchEcosystem();
      } else {
        const err = await res.json();
        alert(err.detail || 'No se pudo eliminar.');
      }
    } catch (err) {
      alert('Error al conectar con el servidor.');
    }
  };

  if (!session) return null;

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(16, 185, 129, 0.96)', color: '#fff',
          padding: '14px 22px', borderRadius: '10px', fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toast.msg}</span>
        </div>
      )}

      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 700, marginBottom: '6px' }}>
            Gestión de Usuarios e Instituciones
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Administración centralizada de directivos, coordinadores y estudiantes por institución educativa.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(168, 85, 247, 0.5)', color: '#d8b4fe' }}
            onClick={() => openCreateModalWithRole('admin_tenant')}
          >
            <i className="fa-solid fa-user-tie"></i> Nuevo Directivo
          </button>
          <button
            className="btn btn-primary"
            onClick={() => openCreateModalWithRole('student')}
          >
            <i className="fa-solid fa-user-plus"></i> Nuevo Estudiante
          </button>
        </div>
      </header>

      {/* KPIs Globales */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: '22px' }}>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Total Usuarios</span>
            <div className="kpi-value">{kpis.totalUsers}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--color-success)' }}>Usuarios registrados</span>
          </div>
          <i className="fa-solid fa-users kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Directivos y Admins</span>
            <div className="kpi-value" style={{ color: '#c084fc' }}>{kpis.totalStaff}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Rectores y Coordinadores</span>
          </div>
          <i className="fa-solid fa-user-shield kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Estudiantes</span>
            <div className="kpi-value" style={{ color: '#38bdf8' }}>{kpis.totalStudents}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>En seguimiento activo</span>
          </div>
          <i className="fa-solid fa-user-graduate kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Instituciones</span>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{kpis.totalInstitutions}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sedes vinculadas</span>
          </div>
          <i className="fa-solid fa-building-columns kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Riesgo Alto</span>
            <div className="kpi-value" style={{ color: '#f87171' }}>{kpis.highRiskTotal}</div>
            <span style={{ fontSize: '0.74rem', color: '#f87171' }}>Atención prioritaria</span>
          </div>
          <i className="fa-solid fa-triangle-exclamation kpi-icon"></i>
        </div>
      </div>

      {/* Panel de Recomendaciones del Sistema */}
      {recommendations.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', border: '1px solid rgba(245, 158, 11, 0.25)', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', color: '#fde68a', margin: 0 }}>
              <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#f59e0b' }}></i>
              Recomendaciones del Sistema
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Análisis sobre {kpis.totalInstitutions} instituciones activas
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {recommendations.map((rec) => {
              const borderCol = rec.severity === 'alta' ? '#ef4444' : rec.severity === 'media' ? '#f59e0b' : '#10b981';
              return (
                <div key={rec.id} style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  borderLeft: `4px solid ${borderCol}`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                      <i className={`fa-solid ${rec.icon}`} style={{ color: borderCol }}></i>
                      {rec.title}
                    </div>
                    <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                      {rec.description}
                    </p>
                  </div>
                  <div>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.75rem' }}
                      onClick={() => {
                        if (rec.actionType === 'open_create_director') {
                          openCreateModalWithRole('admin_tenant');
                        } else if (rec.actionPath) {
                          navigate(rec.actionPath);
                        }
                      }}
                    >
                      {rec.actionLabel} <i className="fa-solid fa-arrow-right" style={{ marginLeft: '4px' }}></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra de Pestañas y Filtros */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="fa-solid fa-layer-group"></i> Todos ({staff.length + students.length})
          </button>
          <button
            className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('staff')}
          >
            <i className="fa-solid fa-user-tie"></i> Directivos ({staff.length})
          </button>
          <button
            className={`btn ${activeTab === 'students' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('students')}
          >
            <i className="fa-solid fa-user-graduate"></i> Estudiantes ({students.length})
          </button>
          <button
            className={`btn ${activeTab === 'institutions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('institutions')}
          >
            <i className="fa-solid fa-building-columns"></i> Instituciones ({institutions.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          <select
            className="form-control"
            style={{ ...selectStyle, width: 'auto', minWidth: '250px', marginBottom: 0 }}
            value={institutionFilter}
            onChange={(e) => setInstitutionFilter(e.target.value)}
          >
            <option value="todas" style={optionStyle}>Todas las Instituciones ({allInstNames.length})</option>
            {allInstNames.map(inst => (
              <option key={inst} value={inst} style={optionStyle}>{inst}</option>
            ))}
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre, correo, cargo o programa..."
            style={{ width: '260px', marginBottom: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLA DE DIRECTIVOS / ADMINISTRADORES */}
      {(activeTab === 'all' || activeTab === 'staff') && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#d8b4fe', margin: '0 0 4px 0' }}>
                <i className="fa-solid fa-user-shield"></i> Directivos, Coordinadores y Administradores
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Cada Directivo gestiona y monitorea únicamente a los estudiantes de su institución asignada.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre y Correo</th>
                  <th>Rol</th>
                  <th>Institución / Sede</th>
                  <th>Cargo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(u => {
                  const cleanInst = u.institution && u.institution.includes('Gobierno Global')
                    ? 'Dirección General'
                    : u.institution;
                  const cleanTitle = (u.titleOrProgram || '').replace(/\s*\(Super Admin\)/i, '');
                  return (
                    <tr key={u.uid}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: u.role === 'super_admin' ? 'rgba(245, 158, 11, 0.16)' : 'rgba(168, 85, 247, 0.16)',
                          color: u.role === 'super_admin' ? '#fbbf24' : '#d8b4fe',
                          border: u.role === 'super_admin' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(168, 85, 247, 0.35)'
                        }}>
                          {u.role === 'super_admin' ? 'Administrador' : 'Directivo'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{cleanInst}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>{cleanTitle}</td>
                      <td>
                        <span style={{ color: u.status === 'Inactivo' ? '#f87171' : 'var(--color-success)', fontSize: '0.82rem', fontWeight: 600 }}>
                          ● {u.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                            onClick={() => handleOpenEdit(u)}
                          >
                            <i className="fa-solid fa-pen"></i> Editar
                          </button>
                          {u.email !== 'admin@talentlab.edu' && (
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }}
                              onClick={() => handleDeleteUser(u)}
                              title="Eliminar usuario"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLA DE ESTUDIANTES */}
      {(activeTab === 'all' || activeTab === 'students') && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 4px 0' }}>
                <i className="fa-solid fa-user-graduate"></i> Estudiantes por Institución ({students.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Cualquier alta, cambio de sede o baja se refleja automáticamente en el panel del Directivo correspondiente.
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Institución / Sede</th>
                  <th>Programa</th>
                  <th>Asistencia / Promedio</th>
                  <th>Entrevista IA</th>
                  <th>Planes</th>
                  <th>Riesgo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => (
                  <tr key={st.uid}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{st.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{st.email}</div>
                    </td>
                    <td style={{ fontSize: '0.83rem', color: '#cbd5e1' }}>{st.institution}</td>
                    <td style={{ fontSize: '0.84rem' }}>{st.program}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{st.attendance}%</span> · <span style={{ color: '#94a3b8' }}>{st.academic_score} pts</span>
                    </td>
                    <td>
                      {st.interview_score ? (
                        <span style={{ fontWeight: 700, color: st.interview_score >= 75 ? '#34d399' : '#fbbf24' }}>
                          {st.interview_score}/100
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Pendiente</span>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: st.plans_count > 0 ? 'rgba(6, 182, 212, 0.16)' : 'rgba(255,255,255,0.06)',
                        color: st.plans_count > 0 ? '#22d3ee' : '#94a3b8'
                      }}>
                        {st.plans_count} Plan(es)
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${st.risk === 'alto' ? 'badge-danger' : st.risk === 'medio' ? 'badge-warning' : 'badge-success'}`}>
                        {st.risk.toUpperCase()} ({st.risk_probability})
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                          onClick={() => handleOpenEdit(st)}
                          title="Editar o transferir de institución"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }}
                          onClick={() => handleDeleteUser(st)}
                          title="Eliminar estudiante"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA DE INSTITUCIONES / SEDES */}
      {activeTab === 'institutions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
          {institutions.map(inst => (
            <div key={inst.name} className="card" style={{ borderTop: '3px solid #a855f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0 }}>{inst.name}</h3>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>Activa</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                <strong>Directivo a cargo:</strong> {inst.directivesNames.length > 0 ? inst.directivesNames.join(', ') : 'Sin Coordinador asignado'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ESTUDIANTES</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{inst.studentsCount}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RIESGO ALTO</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f87171' }}>{inst.highRiskCount}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PROMEDIO</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399' }}>{inst.avgAcademic}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, fontSize: '0.78rem' }}
                  onClick={() => { setInstitutionFilter(inst.name); setActiveTab('students'); }}
                >
                  Ver Estudiantes
                </button>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => openCreateModalWithRole('student', inst.name)}
                >
                  + Matricular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR USUARIO */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
              <i className="fa-solid fa-user-plus" style={{ color: 'var(--primary)' }}></i> Registrar Nuevo Usuario
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              El usuario quedará habilitado de inmediato y vinculado a la institución seleccionada.
            </p>

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Tipo de Perfil</label>
                <select
                  className="form-control"
                  style={selectStyle}
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    setFormData({
                      ...formData,
                      role: r,
                      title_or_program: r === 'student' ? 'Tecnólogo en ADSO' : 'Coordinador Académico Institucional'
                    });
                  }}
                >
                  <option value="admin_tenant" style={optionStyle}>Directivo / Coordinador Institucional</option>
                  <option value="student" style={optionStyle}>Estudiante / Aprendiz</option>
                  <option value="super_admin" style={optionStyle}>Administrador General</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej. Laura Marcela Gómez"
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
                    placeholder="usuario@institucion.edu.co"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Institución Educativa (Sede)</label>
                <select
                  className="form-control"
                  style={selectStyle}
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                >
                  {allInstNames.map(inst => (
                    <option key={inst} value={inst} style={optionStyle}>{inst}</option>
                  ))}
                  <option value="__otra__" style={optionStyle}>+ Registrar Nueva Institución Educativa...</option>
                </select>
              </div>

              {formData.institution === '__otra__' && (
                <div className="form-group">
                  <label>Nombre de la Nueva Institución</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej. SENA - Centro de Servicios de Salud"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                  />
                </div>
              )}

              {formData.role === 'student' ? (
                <>
                  <div className="form-group">
                    <label>Programa de Formación</label>
                    <select
                      className="form-control"
                      style={selectStyle}
                      value={formData.title_or_program}
                      onChange={(e) => setFormData({ ...formData, title_or_program: e.target.value })}
                    >
                      <option value="Tecnólogo en ADSO" style={optionStyle}>Tecnólogo en ADSO</option>
                      <option value="Desarrollo de Software" style={optionStyle}>Desarrollo de Software</option>
                      <option value="Ingeniería de Sistemas" style={optionStyle}>Ingeniería de Sistemas</option>
                      <option value="Tecnólogo en Gestión Empresarial" style={optionStyle}>Tecnólogo en Gestión Empresarial</option>
                      <option value="Tecnólogo en Contabilidad y Finanzas" style={optionStyle}>Tecnólogo en Contabilidad y Finanzas</option>
                      <option value="Diseño Gráfico Digital" style={optionStyle}>Diseño Gráfico Digital</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label>Asistencia (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.attendance}
                        onChange={(e) => setFormData({ ...formData, attendance: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Promedio (0-100)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.academic_score}
                        onChange={(e) => setFormData({ ...formData, academic_score: Number(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Estrato</label>
                      <select
                        className="form-control"
                        style={selectStyle}
                        value={formData.stratum}
                        onChange={(e) => setFormData({ ...formData, stratum: Number(e.target.value) })}
                      >
                        {[1, 2, 3, 4, 5, 6].map(s => (
                          <option key={s} value={s} style={optionStyle}>Estrato {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Cargo Directivo</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={formData.title_or_program}
                      onChange={(e) => setFormData({ ...formData, title_or_program: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Dependencia / Área</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px' }}>
              <i className="fa-solid fa-user-pen" style={{ color: 'var(--primary)' }}></i> Editar Usuario: {editingUser.name}
            </h3>

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
                <label>Institución Asignada (Sede)</label>
                <select
                  className="form-control"
                  style={selectStyle}
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                >
                  {editingUser.role === 'super_admin' && (
                    <option value="Dirección General" style={optionStyle}>Dirección General</option>
                  )}
                  {allInstNames.map(inst => (
                    <option key={inst} value={inst} style={optionStyle}>{inst}</option>
                  ))}
                  <option value="__otra__" style={optionStyle}>+ Registrar Nueva Institución Educativa...</option>
                </select>
              </div>

              {formData.institution === '__otra__' && (
                <div className="form-group">
                  <label>Nombre de la Nueva Institución</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej. SENA - Centro de Servicios de Salud"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>{editingUser.role === 'student' ? 'Programa de Formación' : 'Cargo Institucional'}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.title_or_program}
                    onChange={(e) => setFormData({ ...formData, title_or_program: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <select
                    className="form-control"
                    style={selectStyle}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Activo" style={optionStyle}>Activo</option>
                    <option value="Riesgo" style={optionStyle}>En Riesgo</option>
                    <option value="Inactivo" style={optionStyle}>Inactivo</option>
                  </select>
                </div>
              </div>

              {editingUser.role === 'student' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Asistencia (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.attendance}
                      onChange={(e) => setFormData({ ...formData, attendance: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Promedio Académico (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="form-control"
                      value={formData.academic_score}
                      onChange={(e) => setFormData({ ...formData, academic_score: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
