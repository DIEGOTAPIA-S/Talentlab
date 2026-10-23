import React, { useState, useEffect } from 'react';

export default function Planes() {
  const [activeTab, setActiveTab] = useState('b2b'); // 'b2b' o 'apoyo'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [progress, setProgress] = useState(50);

  const planesB2B = [
    {
      id: 'semillero',
      title: 'Plan Básico Institucional',
      price: '$4,500,000 COP / año',
      licenses: 'Hasta 250 Estudiantes',
      badge: 'Modelo Base SENA',
      features: [
        'Semáforo Predictivo de Deserción con IA',
        'Simulador de Entrevistas Vocacionales (Texto)',
        'Dashboard para Directivos y Orientadores',
        'Soporte Técnico Digital'
      ]
    },
    {
      id: 'pro',
      title: 'Plan Escala Institucional',
      price: '$4,500,000 COP / licencia institucional',
      licenses: 'Hasta 600 Estudiantes',
      badge: 'Recomendado para Colegios',
      featured: true,
      features: [
        'Todas las características del Plan Básico',
        'Simulador con Reconocimiento de Voz',
        'Reportes de competencias en PDF con QR',
        'Acompañamiento psicopedagógico bimensual',
        'Soporte prioritario 24/7'
      ]
    },
    {
      id: 'social',
      title: 'Plan Social Impacto SENA',
      price: '$0 COP (100% Gratuito)',
      licenses: 'Escuelas Públicas Vulnerables',
      badge: 'Responsabilidad Social',
      features: [
        'Licencia 100% donada por TalentLab',
        'Pruebas vocacionales ilimitadas con IA',
        'Articulación con programas técnicos SENA',
        'Talleres de inserción laboral juvenil'
      ]
    }
  ];

  const [planesApoyo, setPlanesApoyo] = useState([
    { id: 101, title: 'Apoyo Económico de Transporte', assignedTo: 'Diego Tapia', status: 'En Progreso', progress: 50 },
    { id: 102, title: 'Tutoría de Refuerzo en Lógica', assignedTo: 'Camila Restrepo', status: 'Pendiente', progress: 0 },
    { id: 103, title: 'Revisión Psicopedagógica (Desmotivación)', assignedTo: 'Mateo Bermúdez', status: 'Completado', progress: 100 },
  ]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/plans/support');
        if (res.ok) {
          const data = await res.json();
          if (data.plans && data.plans.length > 0) {
            setPlanesApoyo(data.plans);
          }
        }
      } catch (e) {
        console.warn('API planes no disponible, usando locales:', e);
      }
    };
    loadPlans();
  }, [activeTab]);

  const handleManageClick = (plan) => {
    setSelectedPlan(plan);
    setProgress(plan.progress);
  };

  const handleSavePlanUpdate = async (statusVal) => {
    if (!selectedPlan) return;
    try {
      await fetch(`http://localhost:8000/api/plans/support/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: parseInt(progress, 10), status: statusVal || selectedPlan.status })
      });
      setPlanesApoyo(prev => prev.map(p => p.id === selectedPlan.id ? { ...p, progress: parseInt(progress, 10), status: statusVal || p.status } : p));
    } catch (e) {
      console.warn('Error al actualizar plan:', e);
    }
    alert('Seguimiento actualizado con éxito.');
    setSelectedPlan(null);
  };

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Planes y Modelos de Suscripción</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de licencias B2B institucionales y planes de intervención de bienestar estudiantil.</p>
        </div>

        {/* Selector de Pestañas */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'b2b' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('b2b')}
          >
            <i className="fa-solid fa-briefcase"></i> Suscripciones B2B (Estudio Financiero)
          </button>
          <button 
            className={`btn ${activeTab === 'apoyo' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('apoyo')}
          >
            <i className="fa-solid fa-hand-holding-heart"></i> Planes de Acompañamiento
          </button>
        </div>
      </header>

      {/* VISTA 1: PLANES B2B INSTITUCIONALES */}
      {activeTab === 'b2b' && (
        <div className="grid-3" style={{ marginTop: '20px' }}>
          {planesB2B.map(plan => (
            <div 
              key={plan.id} 
              className="card" 
              style={{ 
                border: plan.featured ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                position: 'relative' 
              }}
            >
              {plan.featured && (
                <span className="badge badge-success" style={{ position: 'absolute', top: '15px', right: '15px' }}>
                  Más Popular
                </span>
              )}
              <span className="badge badge-warning" style={{ marginBottom: '10px', display: 'inline-block' }}>
                {plan.badge}
              </span>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{plan.title}</h3>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '5px' }}>
                {plan.price}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Capacidad: <strong>{plan.licenses}</strong>
              </p>

              <hr style={{ borderColor: 'rgba(255,255,255,0.08)', marginBottom: '15px' }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 25px 0', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.8' }}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-check" style={{ color: 'var(--color-success)', fontSize: '0.8rem' }}></i>
                    {feat}
                  </li>
                ))}
              </ul>

              <button 
                className={`btn ${plan.featured ? 'btn-primary' : 'btn-secondary'}`} 
                style={{ width: '100%' }}
                onClick={() => alert(`Plan seleccionado: ${plan.title}. Parámetros cotizados según la estructura de ventas de TalentLab.`)}
              >
                {plan.id === 'social' ? 'Solicitar Beca Social' : 'Cotizar Licencia Institucional'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VISTA 2: PLANES DE APOYO A ESTUDIANTES */}
      {activeTab === 'apoyo' && (
        <div className="grid-3" style={{ marginTop: '20px' }}>
          {planesApoyo.map(plan => (
            <div key={plan.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <span className={`badge ${
                  plan.status === 'Completado' ? 'badge-success' : 
                  plan.status === 'En Progreso' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {plan.status}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ID: #{plan.id}</span>
              </div>
              <h3 style={{ marginBottom: '10px' }}>{plan.title}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
                <i className="fa-solid fa-user-graduate"></i> Asignado a: <strong>{plan.assignedTo}</strong>
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${plan.progress}%`, 
                  height: '100%', 
                  background: 'var(--primary)',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avance de la Intervención</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{plan.progress}%</span>
              </div>
              
              <div style={{ marginTop: '20px' }}>
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => handleManageClick(plan)}>
                  Gestionar Plan <i className="fa-solid fa-pen-to-square"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Gestionar Plan */}
      {selectedPlan && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedPlan(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>
            
            <h2 style={{ marginBottom: '5px' }}>{selectedPlan.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Estudiante: <strong>{selectedPlan.assignedTo}</strong>
            </p>
            
            <div className="form-group">
              <label className="form-label">Estado de la Intervención</label>
              <select 
                className="form-control" 
                defaultValue={selectedPlan.status || "En Progreso"}
                id="planStatusSelect"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Completado">Completado</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Progreso del Plan: {progress}%</label>
              <input 
                type="range" 
                min="0" max="100" 
                value={progress}
                onChange={(e) => setProgress(e.target.value)}
                style={{ width: '100%', cursor: 'pointer', marginTop: '10px' }}
              />
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label">Notas de Seguimiento Psicopedagógico</label>
              <textarea 
                className="form-control" 
                rows="3" 
                placeholder="Ej. El estudiante asistió a la sesión de orientación y se ajustó el plan de permanencia..."
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedPlan(null)}>Cancelar</button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }} 
                onClick={() => {
                  const sel = document.getElementById('planStatusSelect');
                  handleSavePlanUpdate(sel ? sel.value : selectedPlan.status);
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
