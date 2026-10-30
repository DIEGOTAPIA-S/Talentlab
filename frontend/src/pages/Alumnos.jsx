import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const EMOTIONAL_OPTIONS = [
  'Estable',
  'Estrés / Cruce Estudio-Trabajo',
  'Desmotivación Vocacional',
  'Crisis Personal / Emocional'
];

// Función local de previsualización en vivo (idéntica al motor del backend)
function previewRiskCalculation(attendance, academic_score, stratum, has_financial_aid, emotional_status) {
  const candidates = [];
  const att = Number(attendance) || 0;
  const acad = Number(academic_score) || 0;
  const str = Number(stratum) || 2;
  const aid = Number(has_financial_aid) || 0;
  const emo = emotional_status || 'Estable';

  let attW = 0.02;
  if (att < 70) {
    attW = 0.35;
    candidates.push([0.35, 'Inasistencias Críticas (<70%)']);
  } else if (att < 82) {
    attW = 0.18;
    candidates.push([0.18, 'Fallas Recurrentes de Asistencia']);
  }

  let acadW = 0.02;
  if (acad < 60) {
    acadW = 0.32;
    candidates.push([0.32, 'Académico (Rezago Crítico <60 pts)']);
  } else if (acad < 76) {
    acadW = 0.17;
    candidates.push([0.17, 'Académico (Refuerzo en Competencias)']);
  }

  let socW = 0.02;
  if ((str === 1 || str === 2) && !aid) {
    socW = 0.26;
    candidates.push([0.26, 'Económico (Transporte / Sin Auxilio)']);
  } else if (str === 3 && !aid) {
    socW = 0.10;
    candidates.push([0.10, 'Económico (Requiere Apoyo Bienestar)']);
  }

  let emoW = 0.02;
  if (emo.includes('Crisis')) {
    emoW = 0.32;
    candidates.push([0.32, 'Emocional (Alerta Psicosocial / Actitudinal)']);
  } else if (emo.includes('Desmotivación')) {
    emoW = 0.24;
    candidates.push([0.24, 'Personal (Desmotivación Vocacional)']);
  } else if (emo.includes('Estrés') || emo.includes('Trabajo')) {
    emoW = 0.22;
    candidates.push([0.22, 'Tiempo (Cruce Estudio y Trabajo)']);
  }

  const prob = Math.min(Math.max(attW + acadW + socW + emoW, 0.08), 0.98);
  candidates.sort((a, b) => b[0] - a[0]);

  let level = 'bajo';
  let factor = 'Desempeño Estable';
  if (prob >= 0.68) {
    level = 'alto';
    factor = candidates.length ? candidates[0][1] : 'Vulnerabilidad Múltiple';
  } else if (prob >= 0.38) {
    level = 'medio';
    factor = candidates.length ? candidates[0][1] : 'Alerta Preventiva';
  }

  return {
    level,
    probPct: `${Math.round(prob * 100)}%`,
    factor
  };
}

export default function Alumnos() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('todos');
  const [showMethodology, setShowMethodology] = useState(false);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState(null);

  // Formulario de Creación / Edición con los 4 Pilares
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    program: 'Tecnólogo en ADSO',
    attendance: 85,
    absences_count: 3,
    academic_score: 75,
    stratum: 2,
    has_financial_aid: 0,
    emotional_status: 'Estable',
    status: 'Activo'
  });

  const [notification, setNotification] = useState(null);
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const isSuperAdmin = session.role === 'super_admin';
  const myInstitution = session.institution || 'SENA - Centro de Tecnologías del Software';

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
    setTimeout(() => setNotification(null), 4500);
  };

  // Sincronizar fallas <-> porcentaje de asistencia (base 25 sesiones por trimestre)
  const handleAbsencesChange = (fallasVal) => {
    const f = Math.max(0, Math.min(25, parseInt(fallasVal, 10) || 0));
    const calcAtt = Math.max(10, Math.round(((25 - f) / 25) * 100));
    setFormData({ ...formData, absences_count: f, attendance: calcAtt });
  };

  const handleAttendanceChange = (attVal) => {
    const a = Math.max(10, Math.min(100, parseFloat(attVal) || 0));
    const calcFallas = Math.max(0, Math.round(((100 - a) / 100) * 25));
    setFormData({ ...formData, attendance: a, absences_count: calcFallas });
  };

  // Descargar plantilla CSV de ejemplo para importación masiva
  const handleDownloadCsvTemplate = () => {
    const header = 'nombre,correo,programa,asistencia,fallas,promedio,estrato,auxilio,estado_emocional';
    const rows = [
      'Laura Sofía Méndez,lsmendez@talentlab.edu,Tecnólogo en ADSO,64,9,58,1,No,Estrés / Cruce Estudio-Trabajo',
      'Carlos Andrés Pineda,capineda@talentlab.edu,Desarrollo de Software,78,5,71,2,Si,Desmotivación Vocacional',
      'Valentina Ortiz,vortiz@talentlab.edu,Tecnólogo en ADSO,94,1,89,3,Si,Estable'
    ];
    const blob = new Blob(['\ufeff' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'plantilla_carga_estudiantes_talentlab.csv';
    a.click();
  };

  // Importar archivo CSV (SOFIA Plus / Sistema Académico)
  const handleCsvUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      alert('El archivo CSV está vacío o no contiene filas de estudiantes.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const parsedRows = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 2) continue;
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] ?? '';
      });
      parsedRows.push(rowObj);
    }

    try {
      const res = await fetch('http://localhost:8000/api/students/import-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: myInstitution,
          rows: parsedRows
        })
      });
      if (res.ok) {
        const result = await res.json();
        showToast(result.message);
        fetchStudents();
      } else {
        alert('Error al procesar el archivo CSV.');
      }
    } catch (err) {
      alert('Error de conexión con el servidor al importar CSV.');
    } finally {
      e.target.value = '';
    }
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
        showToast(`Estudiante registrado y Semáforo IA calculado en ${payload.institution}.`);
        setShowCreateModal(false);
        setFormData({
          name: '',
          email: '',
          program: 'Tecnólogo en ADSO',
          attendance: 85,
          absences_count: 3,
          academic_score: 75,
          stratum: 2,
          has_financial_aid: 0,
          emotional_status: 'Estable',
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
      attendance: student.attendance ?? 85,
      absences_count: student.absences_count ?? Math.max(0, Math.round(((100 - (student.attendance || 85)) / 100) * 25)),
      academic_score: student.academic_score ?? 75,
      stratum: student.stratum ?? 2,
      has_financial_aid: student.has_financial_aid ? 1 : 0,
      emotional_status: student.emotional_status || 'Estable',
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
        showToast('Factores actualizados y Semáforo de Deserción recalculado en tiempo real.');
        setShowEditModal(false);
        setSelectedAlumno(null);
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
    if (!window.confirm(`¿Confirmas eliminar al estudiante ${name} del registro institucional?`)) {
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

  // Ir a crear Plan de Mejoramiento para el estudiante seleccionado
  const handleAssignSupportPlan = (student) => {
    setSelectedAlumno(null);
    navigate(`/planes?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`);
  };

  // Filtrado reactivo
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = filterRisk === 'todos' || s.risk === filterRisk;
    return matchesSearch && matchesRisk;
  });

  const livePreview = previewRiskCalculation(
    formData.attendance,
    formData.academic_score,
    formData.stratum,
    formData.has_financial_aid,
    formData.emotional_status
  );

  return (
    <>
      <header className="panel-header" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
            {isSuperAdmin ? 'Directorio de Estudiantes' : 'Estudiantes y Factores de Riesgo'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {isSuperAdmin
              ? 'Supervisión general de matrículas y niveles de riesgo en las instituciones vinculadas.'
              : `Monitoreo de factores académicos, asistencia, bienestar y Simulador IA en ${myInstitution}.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowMethodology(!showMethodology)}
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
          >
            <i className="fa-solid fa-circle-info"></i> {showMethodology ? 'Ocultar Modelo de Cálculo' : '¿Cómo se calcula el Semáforo?'}
          </button>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleCsvUpload}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            title="Cargar archivo CSV con fallas, notas y bienestar desde SOFIA Plus / LMS"
          >
            <i className="fa-solid fa-file-csv"></i> Importar CSV
          </button>

          <button className="btn btn-primary" onClick={() => { setSelectedAlumno(null); setShowCreateModal(true); }}>
            <i className="fa-solid fa-user-plus"></i> Nuevo Estudiante
          </button>
        </div>
      </header>

      {/* Panel Explicativo del Motor de Riesgo y Fuentes de Alimentación */}
      {showMethodology && (
        <div className="card" style={{ marginBottom: '24px', border: '1px solid rgba(56, 189, 248, 0.35)', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#38bdf8', margin: '0 0 4px 0' }}>
                <i className="fa-solid fa-microchip"></i> Motor Multifactorial del Semáforo de Deserción (4 Fuentes de Datos)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                El nivel de riesgo (Bajo, Medio, Alto) y el <strong>Factor Clave</strong> no son estáticos: se calculan automáticamente combinando estas 4 dimensiones:
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              onClick={handleDownloadCsvTemplate}
            >
              <i className="fa-solid fa-download"></i> Descargar Plantilla CSV (SOFIA Plus)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #ef4444' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                1. Asistencia y Fallas (Peso 35%)
              </div>
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                <strong>Fuente:</strong> Reporte de fallas (CSV) o registro del instructor. Menos de 70% de asistencia activa alerta por <em>Inasistencias Críticas</em>.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #f59e0b' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                2. Rendimiento Académico (Peso 30%)
              </div>
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                <strong>Fuente:</strong> Promedio de juicios evaluativos (0-100 pts). Un promedio menor a 60 pts activa alerta por <em>Rezago Académico</em>.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #a855f7' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                3. Socioeconómico (Peso 20%)
              </div>
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                <strong>Fuente:</strong> Ficha de matrícula (Estrato 1-6 y Auxilio/Beca). Estrato 1 o 2 sin auxilio activa alerta <em>Económica (Transporte)</em>.
              </p>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', borderLeft: '3px solid #06b6d4' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: '4px' }}>
                4. Emocional y Simulador IA (Peso 15-30%)
              </div>
              <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.45 }}>
                <strong>Fuente:</strong> Se actualiza <strong>automáticamente</strong> cuando el alumno presenta el <em>Simulador de Entrevistas IA</em> (Filtro 1 RRHH) o por novedad de Bienestar.
              </p>
            </div>
          </div>
        </div>
      )}

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

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtrar Semáforo:</span>
            <button 
              className={`btn ${filterRisk === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
              onClick={() => setFilterRisk('todos')}
            >
              Todos ({students.length})
            </button>
            <button 
              className={`btn ${filterRisk === 'alto' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--color-danger)', color: filterRisk === 'alto' ? '#fff' : 'var(--color-danger)' }}
              onClick={() => setFilterRisk('alto')}
            >
              Riesgo Alto
            </button>
            <button 
              className={`btn ${filterRisk === 'medio' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: '#f59e0b', color: filterRisk === 'medio' ? '#fff' : '#f59e0b' }}
              onClick={() => setFilterRisk('medio')}
            >
              Riesgo Medio
            </button>
            <button 
              className={`btn ${filterRisk === 'bajo' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '6px 12px', borderColor: 'var(--color-success)', color: filterRisk === 'bajo' ? '#fff' : 'var(--color-success)' }}
              onClick={() => setFilterRisk('bajo')}
            >
              Riesgo Bajo
            </button>
          </div>
        </div>

        {/* Tabla de Estudiantes y Factores Calculados */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Programa</th>
                <th>Asistencia / Fallas</th>
                <th>Promedio / Simulador IA</th>
                <th>Estado Emocional / Bienestar</th>
                <th>Semáforo de Deserción</th>
                <th>Factor Clave Calculado</th>
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
                  <td>
                    <div style={{ fontWeight: 600 }}>{al.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{al.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.86rem' }}>{al.program}</div>
                    {isSuperAdmin && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{al.institution}</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: al.attendance < 75 ? '#f87171' : '#e2e8f0' }}>
                      {al.attendance}%
                    </span>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'block' }}>
                      {al.absences_count ?? Math.max(0, Math.round((100 - al.attendance) / 4))} fallas reg.
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{al.academic_score} pts</span>
                    <span style={{ fontSize: '0.76rem', color: al.interview_score ? '#38bdf8' : 'var(--text-muted)', display: 'block' }}>
                      IA: {al.interview_score ? `${al.interview_score}/100` : 'Pendiente'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.78rem',
                      color: (al.emotional_status || 'Estable') === 'Estable' ? '#34d399' : '#fbbf24',
                      fontWeight: 500
                    }}>
                      {al.emotional_status || 'Estable'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      al.risk === 'alto' ? 'badge-danger' : 
                      al.risk === 'medio' ? 'badge-warning' : 'badge-success'
                    }`}>
                      <i className={`fa-solid ${al.risk === 'alto' ? 'fa-triangle-exclamation' : al.risk === 'medio' ? 'fa-clock' : 'fa-circle-check'}`}></i>{' '}
                      {al.risk ? al.risk.toUpperCase() : 'BAJO'} ({al.risk_probability || al.score})
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: al.risk === 'bajo' ? 'var(--text-muted)' : '#f8fafc', fontWeight: al.risk === 'bajo' ? 400 : 500 }}>
                    {al.factor}
                  </td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '5px 10px', fontSize: '0.76rem', marginRight: '6px' }}
                      title="Ver Desglose de los 4 Pilares de Riesgo"
                      onClick={() => setSelectedAlumno(al)}
                    >
                      <i className="fa-solid fa-eye"></i> Detalle
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '5px 10px', fontSize: '0.76rem', marginRight: '6px', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}
                      title="Editar manualmente Fallas, Notas, Auxilio o Estado Emocional"
                      onClick={() => handleEditClick(al)}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Editar Factores
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '5px 9px', fontSize: '0.76rem', color: 'var(--color-danger)' }}
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

      {/* MODAL 1: NUEVO ESTUDIANTE CON LOS 4 PILARES Y PREVISUALIZACIÓN */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.78)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
            <button 
              onClick={() => setShowCreateModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>

            <h2 style={{ marginBottom: '4px', fontSize: '1.35rem' }}>Registrar Estudiante y Factores Base</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '18px' }}>
              Ingresa los datos iniciales de matrícula y bienestar; el Semáforo calculará el riesgo en tiempo real.
            </p>

            <form onSubmit={handleCreateSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
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
                    placeholder="usuario@institucion.edu.co"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Programa de Formación</label>
                <select 
                  className="form-control"
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                >
                  <option value="Tecnólogo en ADSO">Tecnólogo en ADSO</option>
                  <option value="Desarrollo de Software">Desarrollo de Software</option>
                  <option value="Diseño Gráfico Digital">Diseño Gráfico Digital</option>
                  <option value="Tecnólogo en Gestión Empresarial">Tecnólogo en Gestión Empresarial</option>
                  <option value="Tecnólogo en Contabilidad y Finanzas">Tecnólogo en Contabilidad y Finanzas</option>
                  <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label>Fallas Acumuladas</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="0" 
                    max="25" 
                    value={formData.absences_count}
                    onChange={(e) => handleAbsencesChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Asistencia Calculada (%)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    min="10" 
                    max="100" 
                    value={formData.attendance}
                    onChange={(e) => handleAttendanceChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Promedio Académico (0-100)</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label>Estrato Socioeconómico</label>
                  <select 
                    className="form-control"
                    value={formData.stratum}
                    onChange={(e) => setFormData({ ...formData, stratum: parseInt(e.target.value, 10) || 1 })}
                  >
                    <option value="1">Estrato 1 (Vulnerabilidad Alta)</option>
                    <option value="2">Estrato 2 (Vulnerabilidad Media)</option>
                    <option value="3">Estrato 3 (Medio)</option>
                    <option value="4">Estrato 4 o superior</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>¿Cuenta con Auxilio / Beca?</label>
                  <select 
                    className="form-control"
                    value={formData.has_financial_aid}
                    onChange={(e) => setFormData({ ...formData, has_financial_aid: parseInt(e.target.value, 10) || 0 })}
                  >
                    <option value="0">No (Sin auxilio)</option>
                    <option value="1">Sí (Subsidio / Transporte)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Factor Emocional / Bienestar</label>
                  <select
                    className="form-control"
                    value={formData.emotional_status}
                    onChange={(e) => setFormData({ ...formData, emotional_status: e.target.value })}
                  >
                    {EMOTIONAL_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Previsualización en Vivo del Semáforo */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '4px'
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    Resultado en Vivo del Motor Predictivo:
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    Factor Clave: {livePreview.factor}
                  </strong>
                </div>
                <span className={`badge ${livePreview.level === 'alto' ? 'badge-danger' : livePreview.level === 'medio' ? 'badge-warning' : 'badge-success'}`}>
                  RIESGO {livePreview.level.toUpperCase()} ({livePreview.probPct})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar Estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ACTUALIZAR FACTORES DEL ESTUDIANTE (FALLAS, NOTAS, SOCIOECONÓMICO, EMOCIONAL) */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.78)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', position: 'relative' }}>
            <button 
              onClick={() => { setShowEditModal(false); setSelectedAlumno(null); }}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>

            <h2 style={{ marginBottom: '4px', fontSize: '1.35rem' }}>Actualizar Factores y Novedades del Estudiante</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '18px' }}>
              Registra novedades de fallas, notas, auxilios o valoración emocional de Bienestar para recalcular el Semáforo.
            </p>

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
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
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label>Fallas Acumuladas</label>
                  <input 
                    type="number" 
                    min="0"
                    max="25"
                    className="form-control" 
                    value={formData.absences_count}
                    onChange={(e) => handleAbsencesChange(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Asistencia (%)</label>
                  <input 
                    type="number" 
                    min="10"
                    max="100"
                    className="form-control" 
                    value={formData.attendance}
                    onChange={(e) => handleAttendanceChange(e.target.value)}
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
                    onChange={(e) => setFormData({ ...formData, academic_score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label>Estrato Socioeconómico</label>
                  <select
                    className="form-control"
                    value={formData.stratum}
                    onChange={(e) => setFormData({ ...formData, stratum: parseInt(e.target.value, 10) || 2 })}
                  >
                    <option value="1">Estrato 1</option>
                    <option value="2">Estrato 2</option>
                    <option value="3">Estrato 3</option>
                    <option value="4">Estrato 4+</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Auxilio Financiero / Transporte</label>
                  <select 
                    className="form-control"
                    value={formData.has_financial_aid}
                    onChange={(e) => setFormData({ ...formData, has_financial_aid: parseInt(e.target.value, 10) || 0 })}
                  >
                    <option value="0">No (Sin auxilio)</option>
                    <option value="1">Sí (Con auxilio)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Factor Emocional / Bienestar</label>
                  <select
                    className="form-control"
                    value={formData.emotional_status}
                    onChange={(e) => setFormData({ ...formData, emotional_status: e.target.value })}
                  >
                    {EMOTIONAL_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Previsualización en Vivo del Semáforo */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '4px'
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block' }}>
                    Nuevo Diagnóstico Calculado:
                  </span>
                  <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                    Factor Clave: {livePreview.factor}
                  </strong>
                </div>
                <span className={`badge ${livePreview.level === 'alto' ? 'badge-danger' : livePreview.level === 'medio' ? 'badge-warning' : 'badge-success'}`}>
                  RIESGO {livePreview.level.toUpperCase()} ({livePreview.probPct})
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowEditModal(false); setSelectedAlumno(null); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Guardar y Recalcular Semáforo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VER DIAGNÓSTICO DETALLADO DE LOS 4 PILARES */}
      {selectedAlumno && !showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.78)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', position: 'relative', boxSizing: 'border-box' }}>
            <button 
              onClick={() => setSelectedAlumno(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                {selectedAlumno.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{selectedAlumno.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                  {selectedAlumno.email} · {selectedAlumno.program}
                </p>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px 16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Resultado del Semáforo de Deserción:</span>
                <span className={`badge ${selectedAlumno.risk === 'alto' ? 'badge-danger' : selectedAlumno.risk === 'medio' ? 'badge-warning' : 'badge-success'}`}>
                  RIESGO {selectedAlumno.risk?.toUpperCase()} ({selectedAlumno.risk_probability || selectedAlumno.score})
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#f8fafc', margin: 0 }}>
                <strong>Factor Clave Predominante:</strong> {selectedAlumno.factor}
              </p>
            </div>

            {/* Desglose de los 4 Pilares que alimentan el cálculo */}
            <h4 style={{ fontSize: '0.86rem', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Desglose de Factores que Alimentan este Diagnóstico:
            </h4>

            <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>1. Asistencia e Inasistencias (Reporte Académico)</span>
                  <strong>{selectedAlumno.attendance}% ({selectedAlumno.absences_count ?? 2} fallas)</strong>
                </div>
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedAlumno.attendance}%`, height: '100%', background: selectedAlumno.attendance < 75 ? '#ef4444' : '#10b981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>2. Rendimiento Académico (Juicios Evaluativos)</span>
                  <strong>{selectedAlumno.academic_score}/100 pts</strong>
                </div>
                <div style={{ height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedAlumno.academic_score}%`, height: '100%', background: selectedAlumno.academic_score < 65 ? '#ef4444' : '#38bdf8' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>3. Caracterización Socioeconómica (Matrícula)</span>
                  <strong>Estrato {selectedAlumno.stratum || 2} · {selectedAlumno.has_financial_aid ? 'Con Auxilio' : 'Sin Auxilio'}</strong>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span>4. Factor Emocional y Simulador de Entrevista IA</span>
                  <strong style={{ color: (selectedAlumno.emotional_status || 'Estable') === 'Estable' ? '#34d399' : '#fbbf24' }}>
                    {selectedAlumno.emotional_status || 'Estable'} (IA: {selectedAlumno.interview_score ? `${selectedAlumno.interview_score}/100` : 'Pendiente'})
                  </strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }} 
                onClick={() => handleEditClick(selectedAlumno)}
              >
                <i className="fa-solid fa-sliders"></i> Actualizar Factores
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1.5 }} 
                onClick={() => handleAssignSupportPlan(selectedAlumno)}
              >
                <i className="fa-solid fa-clipboard-check"></i> Crear Plan de Mejoramiento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
