import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000';

const riskColors = {
  alto: { bg: 'rgba(239,68,68,0.15)', fg: '#f87171', label: 'RIESGO ALTO' },
  medio: { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', label: 'RIESGO MEDIO' },
  bajo: { bg: 'rgba(16,185,129,0.15)', fg: '#34d399', label: 'RIESGO BAJO' }
};

function RiskBar({ high, medium, low, total }) {
  const pct = (n) => (total ? (n / total) * 100 : 0);
  return (
    <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}
      title={`Alto ${high} · Medio ${medium} · Bajo ${low}`}>
      <div style={{ width: `${pct(high)}%`, background: '#ef4444' }} />
      <div style={{ width: `${pct(medium)}%`, background: '#f59e0b' }} />
      <div style={{ width: `${pct(low)}%`, background: '#10b981' }} />
    </div>
  );
}

function MiniMetric({ label, value, suffix = '' }) {
  return (
    <div style={{ flex: 1, minWidth: '90px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{value === null || value === undefined ? '--' : `${value}${suffix}`}</div>
    </div>
  );
}

export default function Consolidado() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [institution, setInstitution] = useState('todas');
  const [program, setProgram] = useState('todos');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (!s || s.role !== 'admin_tenant') { navigate('/login'); return; }
    setSession(s);
  }, [navigate]);

  const load = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ institution, program }).toString();
      const res = await fetch(`${API}/api/dashboard/consolidated?${qs}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError('No se pudo conectar con el backend (puerto 8000). Inícialo con iniciar_talentlab.bat.');
    }
  }, [institution, program]);

  useEffect(() => { if (session) load(); }, [session, load]);

  const exportCSV = () => {
    if (!data) return;
    const header = ['Institución', 'Programa', 'Estudiante', 'Asistencia %', 'Promedio', 'Riesgo', 'Entrevista IA'];
    const lines = data.students.map(s => [s.institution, s.program, s.name, s.attendance, s.academic_score, s.risk, s.interviewScore ?? '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const blob = new Blob(['\ufeff' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'consolidado_talentlab.csv';
    a.click();
  };

  if (!session) return null;
  const sum = data?.summary;

  return (
    <div style={{ padding: '30px' }}>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Consolidado Global de Estudiantes</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Vista agregada por institución y por programa de formación: riesgo de deserción, desempeño académico y resultados del simulador de entrevistas.
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV} disabled={!data}>
          <i className="fa-solid fa-file-csv"></i> Exportar CSV
        </button>
      </header>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid #ef4444', marginBottom: '20px' }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444' }}></i> {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'end', marginBottom: '22px' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Institución</label>
          <select className="form-control" value={institution} onChange={e => setInstitution(e.target.value)}>
            <option value="todas">Todas las instituciones</option>
            {data?.filters.institutions.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Programa / Carrera</label>
          <select className="form-control" value={program} onChange={e => setProgram(e.target.value)}>
            <option value="todos">Todos los programas</option>
            {data?.filters.programs.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button className="btn btn-secondary" onClick={() => { setInstitution('todas'); setProgram('todos'); }}>
          <i className="fa-solid fa-rotate-left"></i> Limpiar
        </button>
      </div>

      {!sum && data && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No hay estudiantes para la combinación de filtros seleccionada.
        </div>
      )}

      {sum && (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="card kpi-card"><div>
              <span className="kpi-label">Estudiantes</span>
              <div className="kpi-value">{sum.total}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {data.byInstitution.length} institución(es) · {data.byProgram.length} programa(s)
              </span>
            </div></div>
            <div className="card kpi-card"><div>
              <span className="kpi-label">En Riesgo Alto</span>
              <div className="kpi-value" style={{ color: '#f87171' }}>{sum.high}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {Math.round((sum.high / sum.total) * 100)}% del total filtrado
              </span>
            </div></div>
            <div className="card kpi-card"><div>
              <span className="kpi-label">Asistencia Prom.</span>
              <div className="kpi-value">{sum.avgAttendance}%</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Promedio académico {sum.avgScore}</span>
            </div></div>
            <div className="card kpi-card"><div>
              <span className="kpi-label">Entrevista IA Prom.</span>
              <div className="kpi-value" style={{ color: 'var(--secondary)' }}>{sum.avgInterview ?? '--'}<small style={{ fontSize: '0.9rem' }}>/100</small></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sum.interviewedStudents} estudiante(s) evaluado(s)</span>
            </div></div>
          </div>

          {/* Por institución */}
          <h2 style={{ margin: '28px 0 14px', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-building-columns" style={{ color: 'var(--primary)' }}></i> Por Institución
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {data.byInstitution.map(inst => (
              <div className="card" key={inst.institution}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{inst.institution}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {inst.total} estudiantes · {inst.programs.length} programa(s)
                    </span>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => setExpanded(e => ({ ...e, [inst.institution]: !e[inst.institution] }))}>
                    <i className={`fa-solid ${expanded[inst.institution] ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i> Programas
                  </button>
                </div>
                <RiskBar {...inst} />
                <div style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', margin: '6px 0 14px', color: 'var(--text-muted)' }}>
                  <span style={{ color: '#f87171' }}>● Alto {inst.high}</span>
                  <span style={{ color: '#fbbf24' }}>● Medio {inst.medium}</span>
                  <span style={{ color: '#34d399' }}>● Bajo {inst.low}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <MiniMetric label="Asistencia" value={inst.avgAttendance} suffix="%" />
                  <MiniMetric label="Prom. académico" value={inst.avgScore} />
                  <MiniMetric label="Entrevista IA" value={inst.avgInterview} />
                  <MiniMetric label="Gramática" value={inst.avgGrammar} />
                  <MiniMetric label="Leng. corporal" value={inst.avgBodyLanguage} />
                  <MiniMetric label="Alineación" value={inst.avgAlignment} />
                </div>

                {expanded[inst.institution] && (
                  <div style={{ marginTop: '16px', overflowX: 'auto' }}>
                    <table className="table" style={{ width: '100%' }}>
                      <thead><tr>
                        <th>Programa</th><th>Estudiantes</th><th>Riesgo (A/M/B)</th><th>Asistencia</th><th>Entrevista IA</th>
                      </tr></thead>
                      <tbody>
                        {inst.programs.map(p => (
                          <tr key={p.program}>
                            <td>{p.program}</td>
                            <td>{p.total}</td>
                            <td>{p.high} / {p.medium} / {p.low}</td>
                            <td>{p.avgAttendance}%</td>
                            <td>{p.avgInterview ?? '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Por programa (todas las instituciones) */}
          <h2 style={{ margin: '28px 0 14px', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--secondary)' }}></i> Por Programa / Carrera
          </h2>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr>
                <th>Programa</th><th>Estudiantes</th><th>Distribución de riesgo</th><th>Asistencia</th><th>Prom.</th><th>Entrevista IA</th>
              </tr></thead>
              <tbody>
                {data.byProgram.map(p => (
                  <tr key={p.program}>
                    <td><strong>{p.program}</strong></td>
                    <td>{p.total}</td>
                    <td style={{ minWidth: '180px' }}><RiskBar {...p} /></td>
                    <td>{p.avgAttendance}%</td>
                    <td>{p.avgScore}</td>
                    <td>{p.avgInterview ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Listado detallado */}
          <h2 style={{ margin: '28px 0 14px', fontSize: '1.2rem' }}>
            <i className="fa-solid fa-list" style={{ color: 'var(--primary)' }}></i> Listado Consolidado
          </h2>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead><tr>
                <th>Estudiante</th><th>Institución</th><th>Programa</th><th>Asistencia</th><th>Entrevista IA</th><th>Riesgo</th>
              </tr></thead>
              <tbody>
                {data.students.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.institution}</td>
                    <td>{s.program}</td>
                    <td>{s.attendance}%</td>
                    <td>{s.interviewScore ?? '--'}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                        background: riskColors[s.risk]?.bg, color: riskColors[s.risk]?.fg, border: `1px solid ${riskColors[s.risk]?.fg}` }}>
                        {riskColors[s.risk]?.label || s.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
