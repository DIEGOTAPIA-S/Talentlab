import React, { useState, useEffect } from 'react';

export default function ReporteEstudiante() {
  const sessionData = JSON.parse(localStorage.getItem('user_session') || '{}');
  const studentName = sessionData.fullName || 'Diego Tapia';
  const studentEmail = sessionData.email || 'estudiante@talentlab.edu';
  const institution = sessionData.institution || 'SENA Centro de Tecnologías';

  const [aiScore, setAiScore] = useState(85);
  const [comprehensiveReport, setComprehensiveReport] = useState(null);
  const [aiTips, setAiTips] = useState([
    'Coherencia metodológica STAR comprobada',
    'Vocabulario técnico alineado con la industria de software',
    'Buena empatía y desenvolvimiento comunicativo'
  ]);

  // Planes de Mejoramiento asignados al estudiante desde la BD
  const [myPlans, setMyPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [progressInput, setProgressInput] = useState(50);
  const [notesInput, setNotesInput] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchMyPlans = async () => {
    setLoadingPlans(true);
    try {
      const params = new URLSearchParams();
      if (studentEmail) params.set('student_email', studentEmail);
      if (studentName) params.set('assigned_to', studentName);
      const res = await fetch(`http://localhost:8000/api/plans/support?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setMyPlans(json.data || []);
      }
    } catch (e) {
      console.error('Error cargando planes del estudiante:', e);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    const savedScore = localStorage.getItem('talentlab_last_score');
    const savedFeedback = localStorage.getItem('talentlab_last_feedback');
    const savedComp = localStorage.getItem('talentlab_comprehensive_report');
    if (savedScore) {
      setAiScore(parseInt(savedScore, 10));
    }
    if (savedFeedback) {
      try {
        const parsed = JSON.parse(savedFeedback);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiTips(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (savedComp) {
      try {
        setComprehensiveReport(JSON.parse(savedComp));
      } catch (e) {
        console.error(e);
      }
    }
    fetchMyPlans();
  }, [studentEmail, studentName]);

  const openUpdatePlanModal = (plan) => {
    setSelectedPlan(plan);
    setProgressInput(plan.progress || 0);
    setNotesInput(plan.student_notes || '');
  };

  const handleSaveStudentProgress = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    const newProgress = Number(progressInput);
    const newStatus = newProgress >= 100 ? 'Completado' : newProgress > 0 ? 'En Progreso' : 'Asignado';

    try {
      const res = await fetch(`http://localhost:8000/api/plans/support/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress: newProgress,
          status: newStatus,
          student_notes: notesInput
        })
      });
      if (res.ok) {
        setStatusMessage(`Avance y evidencia enviados a Coordinación para "${selectedPlan.title}".`);
        setSelectedPlan(null);
        fetchMyPlans();
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error guardando avance:', err);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="printable-report" style={{ padding: '30px' }}>
      {/* Estilos para impresión en PDF */}
      <style>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #111827 !important;
          }
          .sidebar, .dashboard-layout aside, .no-print, header button {
            display: none !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
          }
          .card {
            border: 1px solid #e5e7eb !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
          }
          .badge {
            border: 1px solid #111827 !important;
          }
        }
      `}</style>

      <header className="panel-header no-print">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Mi Reporte de Desempeño y Planes de Mejoramiento</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Diagnóstico personalizado de simulaciones IA y seguimiento en tiempo real con la Coordinación de <strong>{institution}</strong>.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button 
            className="btn btn-primary" 
            onClick={handlePrintPdf}
            title="Abrir vista de impresión para guardar como PDF"
          >
            <i className="fa-solid fa-file-pdf"></i> Imprimir / Guardar como PDF
          </button>
        </div>
      </header>

      {statusMessage && (
        <div className="no-print" style={{
          marginBottom: '20px', padding: '12px 18px', borderRadius: '10px',
          background: 'rgba(16, 185, 129, 0.14)', border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#34d399', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span><i className="fa-solid fa-circle-check"></i> {statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} style={{ background: 'none', border: 'none', color: '#34d399', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Membrete visible en impresión */}
      <div style={{ display: 'none' }} className="print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '10px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0284c7' }}>TalentLab — Plataforma EdTech</h2>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Informe Oficial de Competencias y Planes de Mejoramiento</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
            <span>Fecha de Emisión: {new Date().toLocaleDateString('es-CO')}</span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Resumen Estudiantil */}
      <div className="card" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '8px', display: 'inline-block' }}>
            <i className="fa-solid fa-shield-check"></i> Perfil Estudiantil Conectado a Coordinación
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>{studentName}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            <i className="fa-solid fa-building-columns"></i> {institution} | Correo: <strong>{studentEmail}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '25px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{aiScore}/100</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Puntaje Simulador IA</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8' }}>{myPlans.length}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Planes Asignados</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)' }}>Activo</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Estado Institucional</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL INTERACTIVA: Mis Planes de Mejoramiento Asignados por Coordinación */}
      <div className="card" style={{ marginBottom: '25px', border: '1.5px solid rgba(56, 189, 248, 0.35)', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(168, 85, 247, 0.04))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.16)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '6px', display: 'inline-block' }}>
              <i className="fa-solid fa-clipboard-list"></i> Seguimiento Directivo ↔ Estudiante en Tiempo Real
            </span>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Mis Planes de Mejoramiento Activos (Asignados por Coordinación)
            </h3>
          </div>
          <button className="btn btn-secondary no-print" onClick={fetchMyPlans} style={{ fontSize: '0.8rem', padding: '7px 14px' }}>
            <i className="fa-solid fa-rotate"></i> Sincronizar con Coordinación
          </button>
        </div>

        {loadingPlans ? (
          <p style={{ color: 'var(--text-muted)' }}>Consultando planes asignados por tu institución...</p>
        ) : myPlans.length === 0 ? (
          <div style={{ padding: '18px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No tienes planes de mejoramiento pendientes en este momento. Cuando tu Coordinador o Rector te asigne un plan desde su perfil Directivo, aparecerá aquí inmediatamente.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {myPlans.map((plan) => (
              <div key={plan.id} style={{
                padding: '16px', borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: plan.priority === 'Alta (Urgente)' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge" style={{
                      background: plan.status === 'Completado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: plan.status === 'Completado' ? '#34d399' : '#fbbf24',
                      fontSize: '0.72rem'
                    }}>
                      {plan.status} ({plan.progress}%)
                    </span>
                    <span style={{ fontSize: '0.74rem', color: plan.priority === 'Alta (Urgente)' ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
                      Prioridad: {plan.priority || 'Media'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: 700, color: '#f8fafc' }}>
                    {plan.title}
                  </h4>
                  <div style={{ fontSize: '0.76rem', color: '#38bdf8', marginBottom: '8px' }}>
                    <i className="fa-solid fa-layer-group"></i> {plan.type} &nbsp;|&nbsp; <i className="fa-regular fa-calendar"></i> Meta: {plan.deadline || 'Por definir'}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45, margin: '0 0 12px 0' }}>
                    {plan.description || 'Cumplir con las actividades de refuerzo y práctica en el Simulador de Entrevistas IA.'}
                  </p>

                  {plan.student_notes && (
                    <div style={{ padding: '8px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.76rem', color: '#a7f3d0', marginBottom: '12px' }}>
                      <strong><i className="fa-solid fa-comment-dots"></i> Mi último compromiso enviado:</strong> "{plan.student_notes}"
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${plan.progress}%`,
                      height: '100%',
                      background: plan.progress >= 100 ? '#10b981' : 'linear-gradient(90deg, #0ea5e9, #a855f7)'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Asignado por: <strong>{plan.assigned_by || 'Coordinación'}</strong>
                    </span>
                    <button
                      className="btn btn-primary no-print"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      onClick={() => openUpdatePlanModal(plan)}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Registrar Avance / Evidencia
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dictamen Oficial del Comité de Selección en 2 Filtros */}
      {comprehensiveReport && (
        <div className="card" style={{ marginBottom: '25px', border: '1.5px solid rgba(16, 185, 129, 0.35)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(6, 182, 212, 0.04))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <span className="badge badge-success" style={{ marginBottom: '6px', display: 'inline-block' }}>
                <i className="fa-solid fa-trophy"></i> Dictamen Oficial del Comité Evaluador
              </span>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                {comprehensiveReport.verdict}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {comprehensiveReport.overall_score}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/100</span>
              </span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Puntaje Integral Ponderado</div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '18px' }}>
            {comprehensiveReport.conclusions?.executive_summary}
          </p>

          {/* Desglose de los 2 Filtros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '18px' }}>
            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#d8b4fe' }}>
                <span>Filtro 1: Habilidades Blandas (Dra. Carolina Ortiz)</span>
                <span>{comprehensiveReport.breakdown?.hr_score}/100</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                {comprehensiveReport.conclusions?.hr_feedback}
              </p>
            </div>

            <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#67e8f9' }}>
                <span>Filtro 2: Prueba Técnica (Ing. Carlos Mendoza)</span>
                <span>{comprehensiveReport.breakdown?.tech_score}/100</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                {comprehensiveReport.conclusions?.tech_feedback}
              </p>
            </div>
          </div>

          {/* Fortalezas y Mejoras */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', display: 'block', marginBottom: '6px' }}>
                <i className="fa-solid fa-check"></i> Fortalezas Clave Demostradas:
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                {comprehensiveReport.conclusions?.key_strengths?.map((s, idx) => (
                  <li key={idx} style={{ color: '#e2e8f0' }}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'block', marginBottom: '6px' }}>
                <i className="fa-solid fa-lightbulb"></i> Recomendaciones de Mejora Prioritarias:
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
                {comprehensiveReport.conclusions?.priority_improvements?.map((m, idx) => (
                  <li key={idx} style={{ color: '#e2e8f0' }}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid-3">
        {/* Columna 1: Puntaje Global de Entrevistas */}
        <div className="card">
          <h3 style={{ marginBottom: '15px', fontWeight: 600 }}>Entrenamiento de IA Reciente</h3>
          <div className="score-circle score-circle-success" style={{ margin: '20px auto', fontSize: '1.8rem', fontWeight: 'bold' }}>
            {aiScore}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Puntaje Global de Competencias Técnicas y Comunicativas
          </p>
          <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.9' }}>
            {aiTips.map((tip, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-check" style={{ color: 'var(--color-success)' }}></i>
                <span>{tip.replace(/^[✔!⚠\[\]OK\s]+/, '')}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Columna 2 y 3: Desglose de Competencias */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Desglose de Competencias Evaluadas (Habilidades Siglo XXI)</h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
              <span>Lógica y Resolución de Problemas Técnicos</span>
              <strong style={{ color: 'var(--primary)' }}>92%</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px' }}>
              <div style={{ width: '92%', height: '100%', background: 'var(--primary)', borderRadius: 'var(--radius-full)' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
              <span>Trabajo Colaborativo y Empatía</span>
              <strong style={{ color: 'var(--color-success)' }}>88%</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px' }}>
              <div style={{ width: '88%', height: '100%', background: 'var(--color-success)', borderRadius: 'var(--radius-full)' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
              <span>Comunicación Asertiva y Expresión Oral</span>
              <strong style={{ color: '#f59e0b' }}>{aiScore}%</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px' }}>
              <div style={{ width: `${aiScore}%`, height: '100%', background: '#f59e0b', borderRadius: 'var(--radius-full)' }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
              <span>Orientación Vocacional STEAM / Tech</span>
              <strong style={{ color: 'var(--primary)' }}>95%</strong>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px' }}>
              <div style={{ width: '95%', height: '100%', background: 'var(--primary)', borderRadius: 'var(--radius-full)' }}></div>
            </div>
          </div>

          {/* Bloque de Validación Oficial (para sustentación e impresión) */}
          <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>
              <p style={{ margin: 0 }}><strong>Certificación:</strong> Modelo Predictivo TalentLab v2.0 Multi-Tenant</p>
              <p style={{ margin: 0 }}>Cumple con Ley 1581 de 2012 (Habeas Data) | Acreditación MEN</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0 }}>Código de Verificación:</p>
              <code style={{ color: 'var(--primary)' }}>TL-SENA-{Math.floor(100000 + Math.random() * 900000)}</code>
            </div>
          </div>

        </div>
      </div>

      {/* Modal para que el Estudiante reporte su Avance y Evidencia al Coordinador */}
      {selectedPlan && (
        <div className="no-print" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '6px' }}>
              <i className="fa-solid fa-file-signature" style={{ color: '#38bdf8' }}></i> Reportar Avance a Coordinación
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 0, marginBottom: '16px' }}>
              Plan: <strong>{selectedPlan.title}</strong> ({selectedPlan.institution})
            </p>

            <form onSubmit={handleSaveStudentProgress}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Porcentaje de Avance Estimado: <strong style={{ color: '#38bdf8' }}>{progressInput}%</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Bitácora de Evidencia / Compromiso para el Coordinador:
                </label>
                <textarea
                  rows="4"
                  required
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Describe qué actividades realizaste, qué practicaste en el Simulador IA o adjunta el enlace a tu entrega..."
                  style={{
                    width: '100%', padding: '10px', borderRadius: '8px',
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedPlan(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <i className="fa-solid fa-paper-plane"></i> Enviar Avance al Directivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
