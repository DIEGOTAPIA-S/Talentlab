import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const API = 'http://localhost:8000';

export default function Planes() {
  const location = useLocation();
  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const isSuperAdmin = session.role === 'super_admin';
  const myInstitution = session.institution || 'SENA - Centro de Tecnologías del Software';
  const coordinatorName = (session.fullName || 'Patricia Gómez Salazar').replace(/^Dra\.\s*/i, '');

  const [plans, setPlans] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterType, setFilterType] = useState('todos');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [progressVal, setProgressVal] = useState(50);
  const [statusVal, setStatusVal] = useState('En Progreso');
  const [editDescVal, setEditDescVal] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const [newPlanForm, setNewPlanForm] = useState({
    student_id: '',
    assigned_to: '',
    student_email: '',
    title: '',
    type: 'Académico / Técnico',
    priority: 'Alta',
    deadline: '2026-11-20',
    description: ''
  });

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchPlansAndStudents = useCallback(async () => {
    try {
      setLoading(true);
      const instQuery = !isSuperAdmin && myInstitution
        ? `?institution=${encodeURIComponent(myInstitution)}`
        : '';

      const [plansRes, studentsRes] = await Promise.all([
        fetch(`${API}/api/plans/support${instQuery}`),
        fetch(`${API}/api/students${instQuery}`)
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
      }
      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        setStudentsList(sData.students || []);
      }
    } catch (e) {
      console.warn('Error cargando planes de mejoramiento:', e);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, myInstitution]);

  useEffect(() => {
    fetchPlansAndStudents();
  }, [fetchPlansAndStudents]);

  // Si viene redirigido desde el Dashboard con ?studentId=...&studentName=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stId = params.get('studentId');
    const stName = params.get('studentName');
    if ((stId || stName) && studentsList.length > 0) {
      const matched = studentsList.find(s => String(s.id) === String(stId) || s.name === stName);
      if (matched) {
        setNewPlanForm(prev => ({
          ...prev,
          student_id: matched.id,
          assigned_to: matched.name,
          student_email: matched.email,
          title: `Plan de Mejoramiento: Nivelación Integral (${matched.program})`,
          description: `1. Revisión del factor crítico detectado (${matched.factor}).\n2. Entrenamiento práctico en el Simulador de Entrevistas IA.\n3. Seguimiento de entregas con coordinación académica.`
        }));
        setShowCreateModal(true);
      }
    }
  }, [location.search, studentsList]);

  const handleSelectStudentInForm = (stId) => {
    const st = studentsList.find(s => String(s.id) === String(stId));
    if (!st) {
      setNewPlanForm({ ...newPlanForm, student_id: stId });
      return;
    }
    setNewPlanForm({
      ...newPlanForm,
      student_id: st.id,
      assigned_to: st.name,
      student_email: st.email,
      priority: st.risk === 'alto' ? 'Alta' : 'Media'
    });
  };

  const handleSuggestWithAI = async () => {
    if (!newPlanForm.student_id) {
      alert('Selecciona primero al estudiante para que la IA analice su historial.');
      return;
    }
    try {
      setIsGeneratingAi(true);
      const res = await fetch(`${API}/api/plans/suggest-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: Number(newPlanForm.student_id) })
      });
      if (res.ok) {
        const suggestion = await res.json();
        setNewPlanForm(prev => ({
          ...prev,
          title: suggestion.title,
          type: suggestion.type,
          priority: suggestion.priority,
          description: suggestion.description
        }));
        notify('✨ Propuesta de Plan de Mejoramiento generada con IA según las métricas del estudiante.');
      }
    } catch (e) {
      alert('No se pudo generar la sugerencia automática.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlanForm.assigned_to && !newPlanForm.student_id) {
      alert('Por favor selecciona un estudiante.');
      return;
    }

    try {
      const res = await fetch(`${API}/api/plans/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlanForm,
          student_id: newPlanForm.student_id ? Number(newPlanForm.student_id) : null,
          institution: myInstitution,
          assigned_by: coordinatorName,
          progress: 0,
          status: 'En Progreso'
        })
      });
      if (res.ok) {
        notify('Plan de Mejoramiento creado y enviado al perfil del estudiante.');
        setShowCreateModal(false);
        setNewPlanForm({
          student_id: '',
          assigned_to: '',
          student_email: '',
          title: '',
          type: 'Académico / Técnico',
          priority: 'Alta',
          deadline: '2026-11-20',
          description: ''
        });
        fetchPlansAndStudents();
      }
    } catch (e) {
      alert('Error al guardar el Plan de Mejoramiento.');
    }
  };

  const handleManageClick = (plan) => {
    setSelectedPlan(plan);
    setProgressVal(plan.progress);
    setStatusVal(plan.status);
    setEditDescVal(plan.description || '');
  };

  const handleSavePlanUpdate = async () => {
    if (!selectedPlan) return;
    try {
      const res = await fetch(`${API}/api/plans/support/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: parseInt(progressVal, 10),
          status: parseInt(progressVal, 10) >= 100 ? 'Completado' : statusVal,
          description: editDescVal
        })
      });
      if (res.ok) {
        notify('Seguimiento del Plan de Mejoramiento actualizado con éxito.');
        setSelectedPlan(null);
        fetchPlansAndStudents();
      }
    } catch (e) {
      console.warn('Error al actualizar plan:', e);
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!window.confirm(`¿Confirmas eliminar el Plan de Mejoramiento de ${plan.assignedTo}?`)) return;
    try {
      const res = await fetch(`${API}/api/plans/support/${plan.id}`, { method: 'DELETE' });
      if (res.ok) {
        notify('Plan de Mejoramiento eliminado.');
        fetchPlansAndStudents();
      }
    } catch (e) {
      alert('Error al eliminar plan.');
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchStatus = filterStatus === 'todos' || p.status === filterStatus;
    const matchType = filterType === 'todos' || p.type === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (p.assignedTo || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  const totalCount = plans.length;
  const inProgressCount = plans.filter(p => p.status !== 'Completado').length;
  const completedCount = plans.filter(p => p.status === 'Completado').length;
  const highPriorityCount = plans.filter(p => p.priority === 'Alta' && p.status !== 'Completado').length;

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: 'rgba(16, 185, 129, 0.96)', color: '#fff',
          padding: '14px 22px', borderRadius: '10px', fontWeight: 600,
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toast}</span>
        </div>
      )}

      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>
            Planes de Mejoramiento
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Asignación y monitoreo de planes de nivelación técnica, habilidades blandas y permanencia estudiantil.
          </p>
        </div>

        <div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ padding: '12px 20px', fontWeight: 700 }}
          >
            <i className="fa-solid fa-plus-circle"></i> Asignar Plan
          </button>
        </div>
      </header>

      {/* KPIs de Planes de Mejoramiento */}
      <div className="kpi-grid" style={{ marginBottom: '22px' }}>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Planes Asignados</span>
            <div className="kpi-value">{totalCount}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>En {isSuperAdmin ? 'todas las sedes' : 'mi institución'}</span>
          </div>
          <i className="fa-solid fa-file-signature kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">En Ejecución Activa</span>
            <div className="kpi-value" style={{ color: '#38bdf8' }}>{inProgressCount}</div>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Seguimiento con aprendices</span>
          </div>
          <i className="fa-solid fa-spinner kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Prioridad Alta</span>
            <div className="kpi-value" style={{ color: '#f87171' }}>{highPriorityCount}</div>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Mitigación de deserción</span>
          </div>
          <i className="fa-solid fa-bolt kpi-icon"></i>
        </div>
        <div className="card kpi-card">
          <div>
            <span className="kpi-label">Planes Cumplidos</span>
            <div className="kpi-value" style={{ color: 'var(--color-success)' }}>{completedCount}</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>Competencias superadas</span>
          </div>
          <i className="fa-solid fa-circle-check kpi-icon"></i>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="card" style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['todos', 'En Progreso', 'Pendiente', 'Completado'].map(st => (
            <button
              key={st}
              className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '7px 14px' }}
              onClick={() => setFilterStatus(st)}
            >
              {st === 'todos' ? 'Todos los Estados' : st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto', marginBottom: 0 }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="todos">Todas las Dimensiones</option>
            <option value="Académico / Técnico">Académico / Técnico</option>
            <option value="Habilidades Blandas y Entrevista">Habilidades Blandas y Entrevista</option>
            <option value="Permanencia y Bienestar">Permanencia y Bienestar</option>
            <option value="Psicosocial / Vocacional">Psicosocial / Vocacional</option>
          </select>

          <input
            type="text"
            className="form-control"
            placeholder="Buscar por estudiante o actividad..."
            style={{ width: '250px', marginBottom: 0 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Listado de Planes de Mejoramiento */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {filteredPlans.map(plan => {
          const isCompleted = plan.status === 'Completado' || plan.progress >= 100;
          const prioColor = plan.priority === 'Alta' ? '#f87171' : plan.priority === 'Media' ? '#fbbf24' : '#34d399';
          return (
            <div key={plan.id} className="card" style={{
              borderLeft: `4px solid ${isCompleted ? '#10b981' : prioColor}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.18)', color: '#d8b4fe' }}>
                      <i className="fa-solid fa-layer-group"></i> {plan.type}
                    </span>
                    <span className="badge" style={{
                      background: plan.priority === 'Alta' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                      color: prioColor
                    }}>
                      Prioridad {plan.priority || 'Alta'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <i className="fa-regular fa-calendar"></i> Fecha límite: <strong>{plan.deadline || '2026-11-30'}</strong>
                    </span>
                    {isSuperAdmin && (
                      <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>· <i className="fa-solid fa-building-columns"></i> {plan.institution}</span>
                    )}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{plan.title}</h3>
                  <div style={{ fontSize: '0.86rem', color: '#cbd5e1', marginTop: '4px' }}>
                    <strong>Estudiante:</strong> <span style={{ color: '#38bdf8', fontWeight: 600 }}>{plan.assignedTo}</span>
                    {plan.studentEmail && <span style={{ color: 'var(--text-muted)' }}> ({plan.studentEmail})</span>}
                    <span style={{ color: 'var(--text-muted)', marginLeft: '12px' }}>
                      · Asignado por: {plan.assignedBy || 'Coordinación Académica'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge ${isCompleted ? 'badge-success' : plan.status === 'Pendiente' ? 'badge-danger' : 'badge-warning'}`}>
                    {plan.status} ({plan.progress}%)
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                    onClick={() => handleManageClick(plan)}
                  >
                    <i className="fa-solid fa-sliders"></i> Evaluar / Actualizar
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '7px 10px', fontSize: '0.8rem', color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }}
                    onClick={() => handleDeletePlan(plan)}
                    title="Eliminar Plan"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>

              {/* Descripción de compromisos */}
              {plan.description && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.55)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  fontSize: '0.84rem',
                  color: '#cbd5e1',
                  whiteSpace: 'pre-line',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: '#94a3b8', display: 'block', fontSize: '0.73rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Compromisos y Actividades del Plan de Mejoramiento:
                  </strong>
                  {plan.description}
                </div>
              )}

              {/* Evidencia o nota registrada por el propio estudiante desde su perfil */}
              {plan.studentNotes && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  fontSize: '0.82rem',
                  color: '#a5f3fc'
                }}>
                  <i className="fa-solid fa-comment-dots" style={{ marginRight: '6px' }}></i>
                  <strong>Evidencia / Reporte del Estudiante ({plan.assignedTo}):</strong> "{plan.studentNotes}"
                </div>
              )}

              {/* Barra de Progreso */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '9px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${plan.progress}%`,
                    height: '100%',
                    background: isCompleted ? 'var(--color-success)' : 'var(--primary)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, minWidth: '45px', textAlign: 'right' }}>{plan.progress}%</span>
              </div>
            </div>
          );
        })}

        {filteredPlans.length === 0 && !loading && (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <i className="fa-solid fa-clipboard-question" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', marginBottom: '12px' }}></i>
            <h3>No hay Planes de Mejoramiento con esos filtros</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Haz clic en "+ Asignar Plan de Mejoramiento" para crear un plan para un estudiante de tu institución.
            </p>
          </div>
        )}
      </div>

      {/* MODAL CREAR NUEVO PLAN DE MEJORAMIENTO */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '660px', maxHeight: '90vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
              <i className="fa-solid fa-clipboard-check" style={{ color: 'var(--primary)' }}></i> Asignar Nuevo Plan de Mejoramiento
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Este plan aparecerá inmediatamente en la sesión del estudiante seleccionado para que realice sus actividades y registre avances.
            </p>

            <form onSubmit={handleCreatePlan}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <label style={{ margin: 0 }}>Estudiante ({isSuperAdmin ? 'Todas las sedes' : myInstitution})</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ borderColor: '#f59e0b', color: '#fde68a', padding: '5px 12px', fontSize: '0.78rem' }}
                    onClick={handleSuggestWithAI}
                    disabled={isGeneratingAi}
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> {isGeneratingAi ? 'Analizando...' : 'Autocompletar Plan con IA'}
                  </button>
                </div>
                <select
                  className="form-control"
                  style={{ width: '100%', marginTop: '4px' }}
                  required
                  value={newPlanForm.student_id}
                  onChange={(e) => handleSelectStudentInForm(e.target.value)}
                >
                  <option value="">-- Selecciona un estudiante --</option>
                  {studentsList.map(st => (
                    <option key={st.id} value={st.id}>
                      {st.name} — {st.program} (Riesgo {st.risk.toUpperCase()} · {st.academic_score} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Título del Plan de Mejoramiento</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="Ej. Plan de Mejoramiento: Nivelación en Arquitectura de Software y Método STAR"
                  value={newPlanForm.title}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label>Dimensión / Tipo</label>
                  <select
                    className="form-control"
                    value={newPlanForm.type}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, type: e.target.value })}
                  >
                    <option value="Académico / Técnico">Académico / Técnico</option>
                    <option value="Habilidades Blandas y Entrevista">Habilidades Blandas y Entrevista</option>
                    <option value="Permanencia y Bienestar">Permanencia y Bienestar</option>
                    <option value="Psicosocial / Vocacional">Psicosocial / Vocacional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prioridad</label>
                  <select
                    className="form-control"
                    value={newPlanForm.priority}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, priority: e.target.value })}
                  >
                    <option value="Alta">Alta (Urgente)</option>
                    <option value="Media">Media (Preventiva)</option>
                    <option value="Baja">Baja (Refuerzo)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha Límite</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newPlanForm.deadline}
                    onChange={(e) => setNewPlanForm({ ...newPlanForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Actividades de Nivelación, Compromisos y Entregables</label>
                <textarea
                  className="form-control"
                  rows="4"
                  required
                  placeholder="Describe los compromisos concretos que debe cumplir el estudiante..."
                  value={newPlanForm.description}
                  onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-paper-plane"></i> Asignar Plan al Estudiante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EVALUAR Y ACTUALIZAR SEGUIMIENTO */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <h3 style={{ marginBottom: '6px', fontSize: '1.2rem', fontWeight: 700 }}>
              Evaluar Avance del Plan de Mejoramiento
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Estudiante: <strong style={{ color: '#fff' }}>{selectedPlan.assignedTo}</strong> · {selectedPlan.title}
            </p>

            <div className="form-group">
              <label>Estado del Plan</label>
              <select
                className="form-control"
                value={statusVal}
                onChange={(e) => {
                  const st = e.target.value;
                  setStatusVal(st);
                  if (st === 'Completado') setProgressVal(100);
                }}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado (100%)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Porcentaje de Cumplimiento: <strong>{progressVal}%</strong></label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={progressVal} 
                onChange={(e) => setProgressVal(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--primary)', marginTop: '6px' }}
              />
            </div>

            <div className="form-group">
              <label>Compromisos / Observaciones del Coordinador</label>
              <textarea
                className="form-control"
                rows="3"
                value={editDescVal}
                onChange={(e) => setEditDescVal(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedPlan(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleSavePlanUpdate}>
                Guardar Calificación de Avance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
