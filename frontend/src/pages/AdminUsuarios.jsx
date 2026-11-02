import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

const DEFAULT_INSTITUTIONS = [
  {
    id: 1,
    name: 'SENA - Centro de Tecnologías del Software',
    code_nit: 'NIT 899.999.034-1 · Cód. 9204',
    city: 'Medellín, Antioquia',
    address: 'Calle 51 # 57-70, Complejo Central',
    contact_name: 'Patricia Gómez Salazar',
    contact_email: 'director@talentlab.edu',
    contact_phone: '+57 (601) 546-1500',
    status: 'Activa',
    programs: ['Tecnólogo en ADSO', 'Desarrollo de Software', 'Diseño Gráfico Digital'],
    programsBreakdown: [
      { name: 'Tecnólogo en ADSO', studentsCount: 4, highRiskCount: 2 },
      { name: 'Desarrollo de Software', studentsCount: 1, highRiskCount: 0 },
      { name: 'Diseño Gráfico Digital', studentsCount: 1, highRiskCount: 0 }
    ],
    directivesCount: 1,
    directivesNames: ['Patricia Gómez Salazar'],
    studentsCount: 6,
    highRiskCount: 2,
    avgAcademic: 74.2
  },
  {
    id: 2,
    name: 'SENA - Centro de Comercio y Servicios',
    code_nit: 'NIT 899.999.034-2 · Cód. 9302',
    city: 'Medellín, Antioquia',
    address: 'Av. Ferrocarril # 51-20',
    contact_name: 'Dr. Hernán Darío Mejía',
    contact_email: 'rector@sena-cs.edu.co',
    contact_phone: '+57 (604) 576-0000',
    status: 'Activa',
    programs: ['Tecnólogo en Gestión Empresarial', 'Tecnólogo en Contabilidad y Finanzas'],
    programsBreakdown: [
      { name: 'Tecnólogo en Gestión Empresarial', studentsCount: 2, highRiskCount: 1 },
      { name: 'Tecnólogo en Contabilidad y Finanzas', studentsCount: 2, highRiskCount: 0 }
    ],
    directivesCount: 1,
    directivesNames: ['Dr. Hernán Darío Mejía'],
    studentsCount: 4,
    highRiskCount: 1,
    avgAcademic: 75.8
  },
  {
    id: 3,
    name: 'Institución Universitaria Tecnológica de Antioquia',
    code_nit: 'NIT 890.905.419-6 · SNIES 2812',
    city: 'Medellín, Antioquia',
    address: 'Calle 78B # 72A-220, Campus Robledo',
    contact_name: 'Dra. Claudia Marcela Vélez',
    contact_email: 'coordinador@udea-tec.edu.co',
    contact_phone: '+57 (604) 444-3700',
    status: 'Activa',
    programs: ['Ingeniería de Sistemas', 'Diseño Gráfico Digital'],
    programsBreakdown: [
      { name: 'Ingeniería de Sistemas', studentsCount: 2, highRiskCount: 1 },
      { name: 'Diseño Gráfico Digital', studentsCount: 2, highRiskCount: 0 }
    ],
    directivesCount: 1,
    directivesNames: ['Dra. Claudia Marcela Vélez'],
    studentsCount: 4,
    highRiskCount: 1,
    avgAcademic: 79.0
  }
];

const DEFAULT_PROGRAMS_FALLBACK = [
  'Tecnólogo en ADSO',
  'Desarrollo de Software',
  'Ingeniería de Sistemas',
  'Tecnólogo en Gestión Empresarial',
  'Tecnólogo en Contabilidad y Finanzas',
  'Diseño Gráfico Digital'
];

const STANDARD_CITIES = [
  'Medellín, Antioquia',
  'Bogotá D.C.',
  'Cali, Valle del Cauca',
  'Barranquilla, Atlántico',
  'Bucaramanga, Santander',
  'Cartagena, Bolívar',
  'Pereira, Risaralda',
  'Manizales, Caldas',
  'Armenia, Quindío',
  'Bello, Antioquia',
  'Envigado, Antioquia',
  'Itagüí, Antioquia',
  'Rionegro, Antioquia',
  'Sabaneta, Antioquia',
  'Apartadó, Antioquia',
  'Cúcuta, Norte de Santander',
  'Ibagué, Tolima',
  'Santa Marta, Magdalena',
  'Villavicencio, Meta',
  'Pasto, Nariño',
  'Montería, Córdoba',
  'Neiva, Huila',
  'Popayán, Cauca',
  'Tunja, Boyacá',
  'Valledupar, Cesar',
  'Sincelejo, Sucre',
  'Palmira, Valle del Cauca',
  'Buenaventura, Valle del Cauca',
  'Barrancabermeja, Santander',
  'Soacha, Cundinamarca',
  'Chía, Cundinamarca'
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'institutions' | 'staff' | 'students'
  const [search, setSearch] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('todas');

  const [staff, setStaff] = useState([]);
  const [students, setStudents] = useState([]);
  const [institutions, setInstitutions] = useState(DEFAULT_INSTITUTIONS);
  const [allInstNames, setAllInstNames] = useState(DEFAULT_INSTITUTIONS.map(i => i.name));
  const [kpis, setKpis] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalStudents: 0,
    totalInstitutions: 3,
    highRiskTotal: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [toast, setToast] = useState(null);

  // Modales de Gestión de Usuarios
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [customInstitution, setCustomInstitution] = useState('');

  // Modal y Estado de Gestión de Instituciones + Programas
  const [showInstModal, setShowInstModal] = useState(false);
  const [editingInst, setEditingInst] = useState(null); // null = crear, objeto = editar
  const [customCityInput, setCustomCityInput] = useState('');
  const [instFormData, setInstFormData] = useState({
    name: '',
    code_nit: '',
    city: 'Medellín, Antioquia',
    address: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    status: 'Activa',
    programs: ['Tecnólogo en ADSO']
  });
  const [newProgramModalInput, setNewProgramModalInput] = useState('');
  // Input inline rápido por tarjeta de institución: { [instId]: 'Nombre Programa' }
  const [inlineProgramInput, setInlineProgramInput] = useState({});

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
        if (data.institutions && data.institutions.length > 0) {
          setInstitutions(data.institutions);
        } else {
          setInstitutions([]);
        }
        if (data.allInstitutionNames && data.allInstitutionNames.length > 0) {
          setAllInstNames(data.allInstitutionNames);
        }
        setKpis(data.kpis || {});
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.warn('Error cargando ecosistema:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionFilter, search]);

  useEffect(() => {
    if (session) fetchEcosystem();
  }, [session, fetchEcosystem]);

  // Obtener programas disponibles para una institución dada
  const getProgramsForInstitution = (instName) => {
    const found = institutions.find(i => i.name === instName);
    if (found && Array.isArray(found.programs) && found.programs.length > 0) {
      return found.programs;
    }
    return DEFAULT_PROGRAMS_FALLBACK;
  };

  // --- CRUD DE INSTITUCIONES Y PROGRAMAS ---
  const handleOpenCreateInstitution = () => {
    setEditingInst(null);
    setNewProgramModalInput('');
    setCustomCityInput('');
    setInstFormData({
      name: '',
      code_nit: 'NIT 899.999.034-1',
      city: 'Medellín, Antioquia',
      address: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '+57 (604) 444-0000',
      status: 'Activa',
      programs: ['Tecnólogo en ADSO', 'Desarrollo de Software']
    });
    setShowInstModal(true);
  };

  const handleOpenEditInstitution = (inst) => {
    setEditingInst(inst);
    setNewProgramModalInput('');
    setCustomCityInput('');
    setInstFormData({
      name: inst.name || '',
      code_nit: inst.code_nit || '',
      city: inst.city || 'Medellín, Antioquia',
      address: inst.address || '',
      contact_name: inst.contact_name === 'Sin asignar' ? '' : (inst.contact_name || ''),
      contact_email: inst.contact_email || '',
      contact_phone: inst.contact_phone || '',
      status: inst.status || 'Activa',
      programs: Array.isArray(inst.programs) ? [...inst.programs] : []
    });
    setShowInstModal(true);
  };

  const handleAddProgramInModal = () => {
    const clean = newProgramModalInput.trim();
    if (!clean) return;
    if (!instFormData.programs.includes(clean)) {
      setInstFormData({
        ...instFormData,
        programs: [...instFormData.programs, clean]
      });
    }
    setNewProgramModalInput('');
  };

  const handleRemoveProgramInModal = (progName) => {
    setInstFormData({
      ...instFormData,
      programs: instFormData.programs.filter(p => p !== progName)
    });
  };

  const handleSaveInstitution = async (e) => {
    e.preventDefault();
    if (!instFormData.name.trim()) {
      alert('El nombre de la institución es obligatorio.');
      return;
    }

    // Si el usuario dejó escrito un programa en el input sin darle al botón "+", lo agregamos automáticamente
    let finalPrograms = [...instFormData.programs];
    if (newProgramModalInput.trim() && !finalPrograms.includes(newProgramModalInput.trim())) {
      finalPrograms.push(newProgramModalInput.trim());
    }

    const resolvedCity = instFormData.city === '__otra_ciudad__'
      ? (customCityInput.trim() || 'Medellín, Antioquia')
      : instFormData.city;

    const payload = {
      ...instFormData,
      name: instFormData.name.trim(),
      city: resolvedCity,
      programs: finalPrograms
    };

    try {
      const url = editingInst
        ? `${API}/api/admin/institutions/${editingInst.id}`
        : `${API}/api/admin/institutions`;
      const method = editingInst ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message || (editingInst ? 'Institución actualizada.' : 'Institución creada exitosamente.'));
        setShowInstModal(false);
        setEditingInst(null);
        fetchEcosystem();
      } else {
        alert(data.detail || 'No se pudo guardar la institución.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor al guardar la institución.');
    }
  };

  const handleDeleteInstitution = async (inst) => {
    const confirmMsg = inst.studentsCount > 0 || inst.directivesCount > 0
      ? `¿Confirmas eliminar la institución "${inst.name}"?\n\nAtención: Se eliminarán también sus ${inst.studentsCount} estudiante(s) y ${inst.directivesCount} directivo(s) asociados.`
      : `¿Confirmas eliminar la institución "${inst.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API}/api/admin/institutions/${inst.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        if (institutionFilter === inst.name) {
          setInstitutionFilter('todas');
        }
        notify(data.message || `Institución "${inst.name}" eliminada.`);
        fetchEcosystem();
      } else {
        alert(data.detail || 'No se pudo eliminar la institución.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor.');
    }
  };

  // Agregar o quitar un programa directamente desde la tarjeta de la institución
  const handleInlineAddProgram = async (inst) => {
    const key = inst.id || inst.name;
    const newProg = (inlineProgramInput[key] || '').trim();
    if (!newProg) return;

    const currentProgs = Array.isArray(inst.programs) ? inst.programs : [];
    if (currentProgs.includes(newProg)) {
      setInlineProgramInput({ ...inlineProgramInput, [key]: '' });
      return;
    }

    const updatedPrograms = [...currentProgs, newProg];
    try {
      const res = await fetch(`${API}/api/admin/institutions/${inst.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programs: updatedPrograms })
      });
      if (res.ok) {
        setInlineProgramInput({ ...inlineProgramInput, [key]: '' });
        notify(`Programa "${newProg}" agregado a ${inst.name}.`);
        fetchEcosystem();
      }
    } catch (err) {
      alert('No se pudo agregar el programa.');
    }
  };

  const handleInlineRemoveProgram = async (inst, progName, studentsInProg) => {
    if (studentsInProg > 0) {
      if (!window.confirm(`El programa "${progName}" tiene ${studentsInProg} estudiante(s) matriculado(s). ¿Deseas retirarlo del catálogo de oferta de la institución?`)) {
        return;
      }
    }
    const updatedPrograms = (inst.programs || []).filter(p => p !== progName);
    try {
      const res = await fetch(`${API}/api/admin/institutions/${inst.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programs: updatedPrograms })
      });
      if (res.ok) {
        notify(`Programa "${progName}" retirado de ${inst.name}.`);
        fetchEcosystem();
      }
    } catch (err) {
      alert('No se pudo actualizar la lista de programas.');
    }
  };

  // --- CRUD DE USUARIOS (DIRECTIVOS Y ESTUDIANTES) ---
  const openCreateModalWithRole = (defaultRole = 'admin_tenant', defaultInst = null) => {
    const chosenInst = defaultInst || (allInstNames[0] || 'SENA - Centro de Tecnologías del Software');
    const instPrograms = getProgramsForInstitution(chosenInst);
    setCustomInstitution('');
    setFormData({
      role: defaultRole,
      name: '',
      email: '',
      institution: chosenInst,
      title_or_program: defaultRole === 'student' ? (instPrograms[0] || 'Tecnólogo en ADSO') : 'Coordinador Académico Institucional',
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
            Administración centralizada de instituciones, programas formativos, directivos y estudiantes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.08)' }}
            onClick={handleOpenCreateInstitution}
          >
            <i className="fa-solid fa-building-columns"></i> Nueva Institución
          </button>
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
            <span className="kpi-label">Instituciones</span>
            <div className="kpi-value" style={{ color: '#fbbf24' }}>{kpis.totalInstitutions}</div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Sedes y convenios</span>
          </div>
          <i className="fa-solid fa-building-columns kpi-icon"></i>
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
            <i className="fa-solid fa-layer-group"></i> Vista General
          </button>
          <button
            className={`btn ${activeTab === 'institutions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('institutions')}
          >
            <i className="fa-solid fa-building-columns"></i> Instituciones y Programas ({institutions.length})
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
            placeholder="Buscar institución, programa, usuario o correo..."
            style={{ width: '270px', marginBottom: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* SECCIÓN DE TARJETAS DE INSTITUCIONES EDUCATIVAS Y SUS PROGRAMAS */}
      {(activeTab === 'all' || activeTab === 'institutions') && (
        <div style={{ marginBottom: '26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.16rem', fontWeight: 700, color: '#fbbf24', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-building-columns"></i> Instituciones Educativas y Programas de Formación ({institutions.length})
              </h3>
              <p style={{ fontSize: '0.81rem', color: 'var(--text-muted)', margin: 0 }}>
                Gestiona los datos de cada institución, sus contactos directivos y los programas académicos ofertados en cada sede.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#fbbf24', fontSize: '0.8rem' }}
              onClick={handleOpenCreateInstitution}
            >
              <i className="fa-solid fa-plus"></i> Agregar Institución
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '18px' }}>
            {institutions.map(inst => {
              const cardKey = inst.id || inst.name;
              const breakdown = inst.programsBreakdown && inst.programsBreakdown.length > 0
                ? inst.programsBreakdown
                : (inst.programs || []).map(p => ({ name: p, studentsCount: 0, highRiskCount: 0 }));

              const statusColor = inst.status === 'Inactiva'
                ? { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.35)' }
                : inst.status === 'En Convenio'
                  ? { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.35)' }
                  : { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.35)' };

              return (
                <div
                  key={cardKey}
                  className="card"
                  style={{
                    borderTop: '3px solid #f59e0b',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '14px'
                  }}
                >
                  <div>
                    {/* Cabecera de la Institución */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.06rem', fontWeight: 700, color: '#f8fafc', margin: '0 0 4px 0' }}>
                          {inst.name}
                        </h4>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                          <span><i className="fa-solid fa-id-card" style={{ color: '#fbbf24', marginRight: '4px' }}></i>{inst.code_nit || 'NIT Institucional'}</span>
                          <span><i className="fa-solid fa-location-dot" style={{ color: '#38bdf8', marginRight: '4px' }}></i>{inst.city || 'Medellín, Antioquia'}</span>
                        </div>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`,
                          flexShrink: 0
                        }}
                      >
                        {inst.status || 'Activa'}
                      </span>
                    </div>

                    {/* Bloque de Contacto Institucional y Sede */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.55)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '0.79rem',
                      marginBottom: '12px',
                      display: 'grid',
                      gap: '5px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-muted)' }}>
                          <i className="fa-solid fa-user-tie" style={{ color: '#c084fc', width: '16px' }}></i>
                          <strong style={{ color: '#e2e8f0' }}>Contacto:</strong> {inst.contact_name || 'Sin asignar'}
                        </span>
                        {inst.contact_phone && (
                          <span style={{ color: '#cbd5e1' }}>
                            <i className="fa-solid fa-phone" style={{ color: '#34d399', marginRight: '4px' }}></i>
                            {inst.contact_phone}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                        {inst.contact_email && (
                          <span style={{ color: '#94a3b8' }}>
                            <i className="fa-solid fa-envelope" style={{ color: '#38bdf8', width: '16px' }}></i>
                            {inst.contact_email}
                          </span>
                        )}
                        {inst.address && (
                          <span style={{ color: '#94a3b8' }}>
                            <i className="fa-solid fa-map-pin" style={{ color: '#f59e0b', marginRight: '4px' }}></i>
                            {inst.address}
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', paddingTop: '3px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <strong style={{ color: '#cbd5e1' }}>Directivos en plataforma ({inst.directivesCount || 0}):</strong>{' '}
                        {inst.directivesNames && inst.directivesNames.length > 0
                          ? inst.directivesNames.join(', ')
                          : 'Ningún directivo vinculado aún'}
                      </div>
                    </div>

                    {/* PROGRAMAS FORMATIVOS DENTRO DE LA INSTITUCIÓN */}
                    <div style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          <i className="fa-solid fa-graduation-cap" style={{ color: '#38bdf8', marginRight: '6px' }}></i>
                          Programas de Formación ({breakdown.length})
                        </span>
                      </div>

                      {breakdown.length === 0 ? (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '6px 0' }}>
                          No hay programas registrados aún en esta sede.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                          {breakdown.map(prog => (
                            <div
                              key={prog.name}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '6px 10px',
                                borderRadius: '7px',
                                background: 'rgba(15, 23, 42, 0.7)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: '0.8rem'
                              }}
                            >
                              <span style={{ fontWeight: 500, color: '#f1f5f9' }}>{prog.name}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 7px',
                                  borderRadius: '12px',
                                  background: 'rgba(56, 189, 248, 0.14)',
                                  color: '#38bdf8',
                                  fontWeight: 600
                                }}>
                                  {prog.studentsCount} est.
                                </span>
                                {prog.highRiskCount > 0 && (
                                  <span style={{
                                    fontSize: '0.71rem',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    background: 'rgba(239, 68, 68, 0.16)',
                                    color: '#f87171',
                                    fontWeight: 600
                                  }}>
                                    {prog.highRiskCount} riesgo
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleInlineRemoveProgram(inst, prog.name, prog.studentsCount)}
                                  title="Quitar programa de esta institución"
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '0 4px',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  <i className="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input rápido para agregar un nuevo programa a esta institución */}
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nuevo programa en esta sede..."
                          style={{ marginBottom: 0, padding: '6px 10px', fontSize: '0.78rem' }}
                          value={inlineProgramInput[cardKey] || ''}
                          onChange={(e) => setInlineProgramInput({ ...inlineProgramInput, [cardKey]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleInlineAddProgram(inst);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.76rem', whiteSpace: 'nowrap' }}
                          onClick={() => handleInlineAddProgram(inst)}
                        >
                          <i className="fa-solid fa-plus"></i> Programa
                        </button>
                      </div>
                    </div>

                    {/* KPIs Rápidos de la Institución */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>ESTUDIANTES</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8' }}>{inst.studentsCount}</div>
                      </div>
                      <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>PROGRAMAS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24' }}>{breakdown.length}</div>
                      </div>
                      <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>RIESGO ALTO</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>{inst.highRiskCount}</div>
                      </div>
                      <div style={{ padding: '8px 6px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>PROMEDIO</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{inst.avgAcademic}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Botonera CRUD de la Institución */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: '0.77rem', padding: '7px 10px' }}
                      onClick={() => handleOpenEditInstitution(inst)}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Editar Institución
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.77rem', padding: '7px 10px' }}
                      onClick={() => { setInstitutionFilter(inst.name); setActiveTab('students'); }}
                    >
                      <i className="fa-solid fa-users"></i> Ver Alumnos
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ fontSize: '0.77rem', padding: '7px 10px' }}
                      onClick={() => openCreateModalWithRole('student', inst.name)}
                    >
                      + Matricular
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: '0.77rem', padding: '7px 10px', color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }}
                      onClick={() => handleDeleteInstitution(inst)}
                      title="Eliminar institución"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TABLA DE DIRECTIVOS / ADMINISTRADORES */}
      {(activeTab === 'all' || activeTab === 'staff') && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#d8b4fe', margin: '0 0 4px 0' }}>
                <i className="fa-solid fa-user-shield"></i> Directivos, Coordinadores y Administradores ({staff.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Cada Directivo gestiona y monitorea únicamente a los estudiantes de su institución asignada.
              </p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(168, 85, 247, 0.5)', color: '#d8b4fe', fontSize: '0.8rem' }}
              onClick={() => openCreateModalWithRole('admin_tenant')}
            >
              <i className="fa-solid fa-plus"></i> Nuevo Directivo
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre y Correo</th>
                  <th>Rol</th>
                  <th>Institución / Sede</th>
                  <th>Cargo</th>
                  <th>Teléfono</th>
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
                      <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{u.phone || '—'}</td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 4px 0' }}>
                <i className="fa-solid fa-user-graduate"></i> Estudiantes por Institución y Programa ({students.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Cualquier alta, cambio de institución/programa o baja se sincroniza en tiempo real con el Directivo correspondiente.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {institutionFilter !== 'todas' && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setInstitutionFilter('todas')}
                >
                  Mostrar Todas las Instituciones
                </button>
              )}
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.8rem' }}
                onClick={() => openCreateModalWithRole('student', institutionFilter !== 'todas' ? institutionFilter : null)}
              >
                <i className="fa-solid fa-user-plus"></i> Nuevo Estudiante
              </button>
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

      {/* MODAL CREAR / EDITAR INSTITUCIÓN EDUCATIVA Y SUS PROGRAMAS */}
      {showInstModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 2100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '92vh', overflowY: 'auto', border: '1px solid rgba(245, 158, 11, 0.35)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px', color: '#fbbf24' }}>
              <i className="fa-solid fa-building-columns" style={{ marginRight: '8px' }}></i>
              {editingInst ? `Editar Institución: ${editingInst.name}` : 'Registrar Nueva Institución Educativa'}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Configura la información institucional, los datos de contacto y el catálogo de programas formativos de la sede.
            </p>

            <form onSubmit={handleSaveInstitution}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Nombre Oficial de la Institución / Sede</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej. SENA - Centro de Servicios de Salud"
                    value={instFormData.name}
                    onChange={(e) => setInstFormData({ ...instFormData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Estado del Convenio</label>
                  <select
                    className="form-control"
                    style={selectStyle}
                    value={instFormData.status}
                    onChange={(e) => setInstFormData({ ...instFormData, status: e.target.value })}
                  >
                    <option value="Activa" style={optionStyle}>Activa</option>
                    <option value="En Convenio" style={optionStyle}>En Convenio</option>
                    <option value="Inactiva" style={optionStyle}>Inactiva</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>NIT / Código Institucional</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. NIT 899.999.034-1"
                    value={instFormData.code_nit}
                    onChange={(e) => setInstFormData({ ...instFormData, code_nit: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Ciudad / Municipio</label>
                  <select
                    className="form-control"
                    style={selectStyle}
                    value={instFormData.city}
                    onChange={(e) => setInstFormData({ ...instFormData, city: e.target.value })}
                  >
                    {listWithCurrent(
                      STANDARD_CITIES,
                      instFormData.city !== '__otra_ciudad__' ? instFormData.city : null
                    ).map(c => (
                      <option key={c} value={c} style={optionStyle}>{c}</option>
                    ))}
                    <option value="__otra_ciudad__" style={optionStyle}>+ Otra ciudad / municipio...</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Dirección de la Sede</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Calle 51 # 57-70"
                    value={instFormData.address}
                    onChange={(e) => setInstFormData({ ...instFormData, address: e.target.value })}
                  />
                </div>
              </div>

              {instFormData.city === '__otra_ciudad__' && (
                <div className="form-group">
                  <label>Especificar Ciudad y Departamento</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    placeholder="Ej. Caucasia, Antioquia"
                    value={customCityInput}
                    onChange={(e) => setCustomCityInput(e.target.value)}
                  />
                </div>
              )}

              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#d8b4fe', marginBottom: '10px' }}>
                  <i className="fa-solid fa-address-book" style={{ marginRight: '6px' }}></i>
                  Datos de Contacto / Coordinación de la Institución
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nombre del Contacto / Rector</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ marginBottom: 0 }}
                      placeholder="Ej. Dra. Claudia Vélez"
                      value={instFormData.contact_name}
                      onChange={(e) => setInstFormData({ ...instFormData, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Correo de Contacto</label>
                    <input
                      type="email"
                      className="form-control"
                      style={{ marginBottom: 0 }}
                      placeholder="contacto@institucion.edu.co"
                      value={instFormData.contact_email}
                      onChange={(e) => setInstFormData({ ...instFormData, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Teléfono / PBX</label>
                    <input
                      type="text"
                      className="form-control"
                      style={{ marginBottom: 0 }}
                      placeholder="+57 (604) 444-3700"
                      value={instFormData.contact_phone}
                      onChange={(e) => setInstFormData({ ...instFormData, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Gestión de Programas Formativos dentro del Modal */}
              <div style={{
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.05)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                marginBottom: '16px'
              }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', color: '#38bdf8', marginBottom: '8px' }}>
                  <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px' }}></i>
                  Programas Académicos / Formativos de la Institución ({instFormData.programs.length})
                </label>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-control"
                    style={{ marginBottom: 0 }}
                    placeholder="Escribe el nombre de un programa (ej. Tecnólogo en Análisis de Datos)..."
                    value={newProgramModalInput}
                    onChange={(e) => setNewProgramModalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProgramInModal();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ whiteSpace: 'nowrap', borderColor: 'rgba(56, 189, 248, 0.45)', color: '#38bdf8' }}
                    onClick={handleAddProgramInModal}
                  >
                    <i className="fa-solid fa-plus"></i> Agregar Programa
                  </button>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {instFormData.programs.length === 0 ? (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Sin programas agregados. Usa el campo superior para añadir programas a esta institución.
                    </span>
                  ) : (
                    instFormData.programs.map(prog => (
                      <span
                        key={prog}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          fontSize: '0.8rem',
                          color: '#f8fafc'
                        }}
                      >
                        {prog}
                        <button
                          type="button"
                          onClick={() => handleRemoveProgramInModal(prog)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#f87171',
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: '0.85rem'
                          }}
                          title="Eliminar programa"
                        >
                          <i className="fa-solid fa-circle-xmark"></i>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowInstModal(false); setEditingInst(null); }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-floppy-disk"></i> {editingInst ? 'Guardar Cambios' : 'Crear Institución'}
                </button>
              </div>
            </form>
          </div>
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
                    const progs = getProgramsForInstitution(formData.institution);
                    setFormData({
                      ...formData,
                      role: r,
                      title_or_program: r === 'student' ? (progs[0] || 'Tecnólogo en ADSO') : 'Coordinador Académico Institucional'
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
                  onChange={(e) => {
                    const nextInst = e.target.value;
                    const nextProgs = getProgramsForInstitution(nextInst);
                    setFormData({
                      ...formData,
                      institution: nextInst,
                      title_or_program: formData.role === 'student' ? (nextProgs[0] || 'Tecnólogo en ADSO') : formData.title_or_program
                    });
                  }}
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
                    <label>Programa de Formación (Oferta de la Institución)</label>
                    <select
                      className="form-control"
                      style={selectStyle}
                      value={formData.title_or_program}
                      onChange={(e) => setFormData({ ...formData, title_or_program: e.target.value })}
                    >
                      {getProgramsForInstitution(formData.institution).map(prog => (
                        <option key={prog} value={prog} style={optionStyle}>{prog}</option>
                      ))}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
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
                  <div className="form-group">
                    <label>Teléfono de Contacto</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                  <label>Teléfono de Contacto</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Institución Asignada (Sede)</label>
                <select
                  className="form-control"
                  style={selectStyle}
                  value={formData.institution}
                  onChange={(e) => {
                    const nextInst = e.target.value;
                    const nextProgs = getProgramsForInstitution(nextInst);
                    setFormData({
                      ...formData,
                      institution: nextInst,
                      title_or_program: editingUser.role === 'student' ? (nextProgs[0] || formData.title_or_program) : formData.title_or_program
                    });
                  }}
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
                  {editingUser.role === 'student' ? (
                    <select
                      className="form-control"
                      style={selectStyle}
                      value={formData.title_or_program}
                      onChange={(e) => setFormData({ ...formData, title_or_program: e.target.value })}
                    >
                      {listWithCurrent(getProgramsForInstitution(formData.institution), formData.title_or_program).map(prog => (
                        <option key={prog} value={prog} style={optionStyle}>{prog}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title_or_program}
                      onChange={(e) => setFormData({ ...formData, title_or_program: e.target.value })}
                    />
                  )}
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

function listWithCurrent(list, currentVal) {
  const arr = Array.isArray(list) ? [...list] : [];
  if (currentVal && !arr.includes(currentVal)) {
    arr.unshift(currentVal);
  }
  return arr;
}
