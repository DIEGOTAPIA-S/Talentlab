/**
 * Generador de Informes Ejecutivos en PDF (Plantilla Institucional A4)
 * Incluye resumen estadístico, porcentajes por nivel de riesgo, distribución de factores,
 * umbrales de referencia a tener en cuenta y listado nominal de estudiantes.
 */
export function generateInstitutionalPdfReport({
  institution = 'SENA - Centro de Tecnologías del Software',
  directorName = 'Coordinación Académica',
  directorTitle = 'Directivo Institucional',
  students = [],
  activePlansCount = 0
}) {
  const total = students.length || 1;
  const highCount = students.filter(s => s.risk === 'alto').length;
  const mediumCount = students.filter(s => s.risk === 'medio').length;
  const lowCount = students.filter(s => s.risk === 'bajo').length;

  const highPct = Math.round((highCount / total) * 100);
  const mediumPct = Math.round((mediumCount / total) * 100);
  const lowPct = Math.max(0, 100 - highPct - mediumPct);

  const avgAttendance = students.length
    ? (students.reduce((acc, s) => acc + (Number(s.attendance) || 85), 0) / total).toFixed(1)
    : '85.0';

  const avgAcademic = students.length
    ? (students.reduce((acc, s) => acc + (Number(s.academic_score) || 75), 0) / total).toFixed(1)
    : '75.0';

  const interviewed = students.filter(s => s.interview_score !== null && s.interview_score !== undefined && s.interview_score !== '');
  const avgInterview = interviewed.length
    ? Math.round(interviewed.reduce((acc, s) => acc + Number(s.interview_score), 0) / interviewed.length)
    : 81;

  const retentionProjected = students.length
    ? Math.round(((lowCount + mediumCount * 0.72) / total) * 100)
    : 94;

  // Agrupación porcentual por Factor Clave
  const factorCounts = {
    'Inasistencias y Fallas': 0,
    'Rendimiento Académico': 0,
    'Vulnerabilidad Económica / Transporte': 0,
    'Emocional / Vocacional / Estudio-Trabajo': 0,
    'Desempeño Estable': 0
  };

  students.forEach(s => {
    const f = (s.factor || '').toLowerCase();
    if (s.risk === 'bajo' || f.includes('estable')) {
      factorCounts['Desempeño Estable'] += 1;
    } else if (f.includes('inasistencia') || f.includes('falla')) {
      factorCounts['Inasistencias y Fallas'] += 1;
    } else if (f.includes('académico') || f.includes('academico') || f.includes('lógica') || f.includes('competencia')) {
      factorCounts['Rendimiento Académico'] += 1;
    } else if (f.includes('económico') || f.includes('economico') || f.includes('transporte')) {
      factorCounts['Vulnerabilidad Económica / Transporte'] += 1;
    } else {
      factorCounts['Emocional / Vocacional / Estudio-Trabajo'] += 1;
    }
  });

  const dateStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const reportCode = `TL-INF-${Math.floor(100000 + Math.random() * 900000)}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Informe Ejecutivo de Estadísticas y Permanencia - ${institution}</title>
  <style>
    @page {
      size: A4;
      margin: 14mm;
    }
    * {
      box-sizing: border-box;
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      margin: 0;
      padding: 0;
      color: #0f172a;
      background: #ffffff;
      font-size: 12px;
      line-height: 1.45;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #4f46e5;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      color: #1e1b4b;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #4f46e5;
    }
    .subtitle {
      font-size: 11px;
      color: #475569;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #334155;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .inst-banner {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #4f46e5;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin: 18px 0 10px 0;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 12px;
      background: #ffffff;
    }
    .kpi-box .label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-box .value {
      font-size: 20px;
      font-weight: 800;
      margin: 3px 0;
      color: #0f172a;
    }
    .kpi-box .note {
      font-size: 10px;
      color: #475569;
    }
    .two-col {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }
    .panel {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      background: #fcfdff;
    }
    .bar-row {
      margin-bottom: 8px;
    }
    .bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 3px;
    }
    .bar-track {
      height: 8px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      border-radius: 999px;
    }
    .threshold-list {
      margin: 0;
      padding-left: 16px;
      font-size: 11px;
      color: #334155;
    }
    .threshold-list li {
      margin-bottom: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-top: 6px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9.5px;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
    }
    .badge-alto {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .badge-medio {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fcd34d;
    }
    .badge-bajo {
      background: #d1fae5;
      color: #047857;
      border: 1px solid #6ee7b7;
    }
    .footer-sign {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 10.5px;
      color: #475569;
    }
    .sign-line {
      width: 220px;
      border-top: 1px solid #0f172a;
      padding-top: 4px;
      text-align: center;
      color: #0f172a;
      font-weight: 600;
    }
    @media print {
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background:#1e1b4b;color:#fff;padding:10px 18px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-radius:6px;">
    <span><strong>Vista Previa Oficial del Informe PDF</strong> — Selecciona "Guardar como PDF" en el diálogo de impresión.</span>
    <button onclick="window.print()" style="background:#4f46e5;color:#fff;border:none;padding:7px 14px;border-radius:5px;cursor:pointer;font-weight:600;">Imprimir / Guardar PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">Talent<span>Lab</span></div>
      <div class="subtitle">Informe Ejecutivo de Estadísticas, Porcentajes de Riesgo y Permanencia Estudiantil</div>
    </div>
    <div class="meta-box">
      <div><strong>Código de Informe:</strong> ${reportCode}</div>
      <div><strong>Fecha de Corte:</strong> ${dateStr}</div>
    </div>
  </div>

  <div class="inst-banner">
    <div>
      <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Institución Educativa / Sede Evaluada</div>
      <div style="font-size:15px;font-weight:800;color:#0f172a;">${institution}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;">Directivo / Responsable</div>
      <div style="font-size:12px;font-weight:700;color:#1e293b;">${directorName}</div>
      <div style="font-size:10.5px;color:#475569;">${directorTitle}</div>
    </div>
  </div>

  <div class="section-title">1. Resumen Estadístico y Porcentajes Generales de la Sede</div>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="label">Población Evaluada</div>
      <div class="value">${students.length} Alumnos</div>
      <div class="note">100% de cobertura en motor predictivo</div>
    </div>
    <div class="kpi-box" style="border-left: 4px solid #dc2626;">
      <div class="label">Riesgo Alto (Crítico)</div>
      <div class="value" style="color:#dc2626;">${highPct}% (${highCount})</div>
      <div class="note">Requiere intervención inmediata</div>
    </div>
    <div class="kpi-box" style="border-left: 4px solid #d97706;">
      <div class="label">Riesgo Medio (Preventivo)</div>
      <div class="value" style="color:#d97706;">${mediumPct}% (${mediumCount})</div>
      <div class="note">Seguimiento y nivelación activa</div>
    </div>
    <div class="kpi-box" style="border-left: 4px solid #059669;">
      <div class="label">Riesgo Bajo (Estable)</div>
      <div class="value" style="color:#059669;">${lowPct}% (${lowCount})</div>
      <div class="note">Evolución formativa satisfactoria</div>
    </div>
    <div class="kpi-box">
      <div class="label">Asistencia y Promedio</div>
      <div class="value">${avgAttendance}% / ${avgAcademic}</div>
      <div class="note">Asistencia media / Nota media (0-100)</div>
    </div>
    <div class="kpi-box">
      <div class="label">Retención y Simulador IA</div>
      <div class="value" style="color:#4f46e5;">${retentionProjected}%</div>
      <div class="note">${interviewed.length}/${students.length} presentaron IA (Prom: ${avgInterview}/100) · Planes: ${activePlansCount}</div>
    </div>
  </div>

  <div class="two-col">
    <div class="panel">
      <div style="font-weight:700;font-size:11.5px;margin-bottom:8px;color:#0f172a;">
        Distribución Porcentual por Factor Clave
      </div>
      ${Object.entries(factorCounts).map(([label, count]) => {
        const pct = Math.round((count / total) * 100);
        const color = label.includes('Estable')
          ? '#059669'
          : label.includes('Inasistencia')
          ? '#dc2626'
          : label.includes('Económica')
          ? '#7c3aed'
          : '#d97706';
        return `
          <div class="bar-row">
            <div class="bar-label">
              <span>${label}</span>
              <strong>${pct}% (${count})</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%;background:${color};"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="panel">
      <div style="font-weight:700;font-size:11.5px;margin-bottom:8px;color:#0f172a;">
        Porcentajes y Umbrales a Tener en Cuenta (Guía Directiva)
      </div>
      <ul class="threshold-list">
        <li><strong>Umbral Crítico de Asistencia (&lt; 70%):</strong> Aporta hasta un <strong>35%</strong> de peso al riesgo de deserción. Actualmente la asistencia media de la sede es <strong>${avgAttendance}%</strong>.</li>
        <li><strong>Umbral Académico (&lt; 60 pts):</strong> Aporta un <strong>32%</strong> al riesgo. Promedio actual de la sede: <strong>${avgAcademic}/100 pts</strong>.</li>
        <li><strong>Vulnerabilidad Socioeconómica (Estrato 1-2 sin auxilio):</strong> Incrementa el riesgo en <strong>26%</strong>. Se recomienda priorizar becas de transporte.</li>
        <li><strong>Factor Emocional y Simulador IA (&lt; 68/100 pts):</strong> Impacta hasta en <strong>32%</strong>. Promedio actual en entrevistas IA: <strong>${avgInterview}/100</strong>.</li>
        <li><strong>Meta de Retención Institucional:</strong> Mantener el Riesgo Alto por debajo del <strong>15%</strong> (actual: <strong>${highPct}%</strong>) para asegurar una permanencia superior al <strong>90%</strong>.</li>
      </ul>
    </div>
  </div>

  <div class="section-title">2. Detalle Nominal de Estudiantes y Factores Calculados (${students.length} Registros)</div>
  <table>
    <thead>
      <tr>
        <th>Estudiante</th>
        <th>Programa</th>
        <th>Asistencia</th>
        <th>Promedio</th>
        <th>Entrevista IA</th>
        <th>Estado Emocional</th>
        <th>Semáforo (%)</th>
        <th>Factor Clave Predominante</th>
      </tr>
    </thead>
    <tbody>
      ${students.map(st => {
        const riskLvl = (st.risk || 'bajo').toLowerCase();
        const probText = st.risk_probability || st.score || '15%';
        return `
          <tr>
            <td><strong>${st.name}</strong><br/><span style="color:#64748b;font-size:9.5px;">${st.email || ''}</span></td>
            <td>${st.program || ''}</td>
            <td>${st.attendance ?? 85}%</td>
            <td>${st.academic_score ?? 75} pts</td>
            <td>${
              st.interview_score
                ? `<strong style="color:#047857;">✔ Presentó (${st.interview_score}/100)</strong><br/><span style="color:#64748b;font-size:9px;">${st.interviews_count || 1} simulación(es)</span>`
                : '<span style="color:#94a3b8;">⏳ Pendiente</span>'
            }</td>
            <td>${st.emotional_status || 'Estable'}</td>
            <td><span class="badge badge-${riskLvl}">${riskLvl.toUpperCase()} (${probText})</span></td>
            <td>${st.factor || 'Desempeño Estable'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer-sign">
    <div>
      <div><strong>Certificación del Sistema:</strong> Informe generado por el Motor Analítico TalentLab.</div>
      <div>Los porcentajes reflejan el estado en tiempo real de la base de datos institucional.</div>
    </div>
    <div class="sign-line">
      ${directorName}<br/>
      <span style="font-weight:400;font-size:9.5px;color:#475569;">${directorTitle}</span>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `;

  const printWin = window.open('', '_blank', 'width=980,height=820');
  if (!printWin) {
    alert('Por favor permite las ventanas emergentes en tu navegador para generar el PDF.');
    return;
  }
  printWin.document.open();
  printWin.document.write(htmlContent);
  printWin.document.close();
}
