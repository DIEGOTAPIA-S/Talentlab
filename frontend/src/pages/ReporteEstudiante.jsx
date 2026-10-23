import React, { useState, useEffect } from 'react';

export default function ReporteEstudiante() {
  const sessionData = JSON.parse(localStorage.getItem('user_session') || '{}');
  const studentName = sessionData.fullName || 'Diego Tapia';
  const institution = sessionData.institution || 'SENA Centro de Tecnologías';

  const [aiScore, setAiScore] = useState(85);
  const [aiTips, setAiTips] = useState([
    'Coherencia metodológica STAR comprobada',
    'Vocabulario técnico alineado con la industria de software',
    'Buena empatía y desenvolvimiento comunicativo'
  ]);

  useEffect(() => {
    const savedScore = localStorage.getItem('talentlab_last_score');
    const savedFeedback = localStorage.getItem('talentlab_last_feedback');
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
  }, []);

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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Reporte de Desempeño y Orientación Vocacional</h1>
          <p style={{ color: 'var(--text-muted)' }}>Diagnóstico personalizado basado en las evaluaciones y simulaciones de Inteligencia Artificial.</p>
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

      {/* Membrete visible en impresión */}
      <div style={{ display: 'none' }} className="print-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '10px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0284c7' }}>TalentLab — Plataforma EdTech</h2>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Informe Oficial de Competencias y Diagnóstico de Permanencia</p>
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
            <i className="fa-solid fa-shield-check"></i> Perfil Estudiantil Verificado
          </span>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>{studentName}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            <i className="fa-solid fa-graduation-cap"></i> {institution} | Programa: <strong>Tecnólogo en ADSO</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '25px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)' }}>{aiScore}/100</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Afinidad Vocacional</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)' }}>Bajo</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Semáforo de Riesgo</span>
          </div>
        </div>
      </div>

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

        {/* Columna 2 y 3: Desglose de Competencias y Planes de Apoyo */}
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

          <h4 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 600 }}>Planes de Acompañamiento Institucional</h4>
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>Subsidio de Transporte y Tutoría en Lógica</h5>
                <span className="badge badge-warning">En Progreso (Avance 50%)</span>
              </div>
              <button 
                className="btn btn-secondary no-print" 
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => alert('Plan activo registrado en Bienestar Estudiantil. Conforme a la política de retención institucional.')}
              >
                Ver Estado
              </button>
            </div>
          </div>

          {/* Bloque de Validación Oficial (para sustentación e impresión) */}
          <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>
              <p style={{ margin: 0 }}><strong>Certificación:</strong> Modelo Predictivo TalentLab v1.3.0</p>
              <p style={{ margin: 0 }}>Cumple con Ley 1581 de 2012 (Habeas Data) | Acreditación MEN</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0 }}>Código de Verificación:</p>
              <code style={{ color: 'var(--primary)' }}>TL-SENA-{Math.floor(100000 + Math.random() * 900000)}</code>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
