import React, { useState, useEffect } from 'react';

export default function Perfil() {
  const [session, setSession] = useState({});
  const [dbStatus, setDbStatus] = useState(null);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    institution: '',
    title: '',
    phone: '',
    department: '',
    password: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem('user_session') || '{}');
    setSession(sessionData);

    const rawFullName = sessionData.fullName || (sessionData.role === 'admin_tenant' ? 'Patricia Gómez Salazar' : 'Diego Tapia');
    let cleanFullName = rawFullName.replace(/^Dra\.\s*/i, '');
    if (cleanFullName === 'Patricia Gómez') cleanFullName = 'Patricia Gómez Salazar';

    setFormData({
      fullName: cleanFullName,
      email: sessionData.email || (sessionData.role === 'admin_tenant' ? 'director@talentlab.edu' : 'estudiante@talentlab.edu'),
      institution: sessionData.institution || 'SENA - Centro de Tecnologías del Software',
      title: sessionData.title || (sessionData.role === 'admin_tenant' ? 'Coordinadora de Formación y Permanencia Académica' : 'Aprendiz Tecnólogo en ADSO'),
      phone: sessionData.phone || (sessionData.role === 'admin_tenant' ? '+57 (601) 546-1500' : '+57 312 411 7048'),
      department: sessionData.department || (sessionData.role === 'admin_tenant' ? 'Coordinación de Formación Profesional' : 'Etapa Lectiva SENA'),
      password: ''
    });

    // Consultar estado técnico de la base de datos
    const loadStatus = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/system/status');
        if (res.ok) {
          const data = await res.json();
          setDbStatus(data);
        }
      } catch (e) {
        console.warn('API de estado no disponible:', e);
      }
    };
    loadStatus();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Actualizar sesión local para reflejar el nombre en todo el sistema
        const updatedSession = {
          ...session,
          fullName: formData.fullName,
          institution: formData.institution,
          title: formData.title,
          phone: formData.phone,
          department: formData.department
        };
        localStorage.setItem('user_session', JSON.stringify(updatedSession));
        setSession(updatedSession);
        showToast('Perfil institucional actualizado exitosamente.');
      } else {
        alert('Error al guardar cambios.');
      }
    } catch (e) {
      alert('Error de conexión con el servidor.');
    }
  };

  const isAdmin = session.role === 'admin_tenant';

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Perfil de Usuario y Configuración</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Administración de credenciales, datos institucionales y diagnóstico técnico del sistema.
          </p>
        </div>
      </header>

      {toast && (
        <div className={`alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Tarjeta de Resumen de Identidad del Usuario */}
      <div className="card" style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.6rem', color: '#fff' 
          }}>
            {formData.fullName ? formData.fullName.split(' ').map(n => n[0]).slice(0, 2).join('') : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className={`badge ${isAdmin ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.82rem' }}>
                <i className={`fa-solid ${isAdmin ? 'fa-shield-halved' : 'fa-user-graduate'}`}></i>{' '}
                {isAdmin ? 'PERFIL: ADMINISTRADOR INSTITUCIONAL' : 'PERFIL: APRENDIZ SENA'}
              </span>
              <span className="badge badge-warning" style={{ fontSize: '0.78rem' }}>
                {isAdmin ? 'COORDINADOR DE CENTRO' : 'ETAPA PRODUCTIVA'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.5rem', margin: '2px 0' }}>{formData.fullName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
              <i className="fa-solid fa-building-columns"></i> {formData.institution} | {formData.title}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Nivel de Acceso:</span>
          <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
            <i className="fa-solid fa-lock-open"></i> {isAdmin ? 'Control Total Multi-tenant' : 'Acceso de Usuario'}
          </span>
        </div>
      </div>

      <div className="grid-2">
        {/* Formulario de Edición de Perfil */}
        <div className="card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-user-pen" style={{ color: 'var(--primary)' }}></i>
            Editar Información Institucional
          </h3>

          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Correo Electrónico Institucional</label>
              <input 
                type="email" 
                className="form-control" 
                required 
                value={formData.email}
                readOnly
                style={{ opacity: 0.8, cursor: 'not-allowed' }}
                title="El correo principal identifica tu tenant y no puede ser alterado directamente."
              />
            </div>

            <div className="form-group">
              <label>Institución o Centro de Formación</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Cargo o Título Profesional</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Teléfono de Contacto</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

            <div className="form-group">
              <label>Actualizar Contraseña / Clave de Acceso (Opcional)</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Dejar en blanco para mantener la actual"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
              <i className="fa-solid fa-floppy-disk"></i> Guardar Cambios de Perfil
            </button>
          </form>
        </div>

        {/* Ficha Técnica de la Base de Datos y Arquitectura */}
        <div>
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-database" style={{ color: 'var(--secondary)' }}></i>
              Diagnóstico de Base de Datos y Servidor
            </h3>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Motor de Base de Datos Activo:</span>
                <strong style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>
                  <i className="fa-solid fa-circle-check"></i> SQLite 3.45 Relacional Embebido
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Archivo de Almacenamiento:</span>
                <code style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>database/talentlab.db</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Compatibilidad Cloud:</span>
                <span style={{ fontSize: '0.85rem' }}>PostgreSQL v15 (Supabase / Neon)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Script para Modelado SENA:</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>MySQL Workbench DDL (.sql)</span>
              </div>
            </div>

            <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-muted)' }}>
              Tablas Relacionales Conectadas ({dbStatus?.database?.tables ? Object.keys(dbStatus.database.tables).length : 5}):
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-table" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                students: <strong>{dbStatus?.database?.tables?.students || 7} reg.</strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-table" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                support_plans: <strong>{dbStatus?.database?.tables?.support_plans || 3} reg.</strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-table" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                mentors: <strong>{dbStatus?.database?.tables?.mentors || 4} reg.</strong>
              </div>
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
                <i className="fa-solid fa-table" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                graduates: <strong>{dbStatus?.database?.tables?.graduates || 6} reg.</strong>
              </div>
            </div>
          </div>

          {/* Tarjeta de Seguridad y Respaldo */}
          <div className="card" style={{ border: '1px solid rgba(16,185,129,0.3)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-shield-check"></i> Respaldo Local para Sustentación
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.6' }}>
              El sistema guarda automáticamente todas las altas de alumnos, planes y evaluaciones en el archivo local <code>database/talentlab.db</code>. Esto garantiza que durante la presentación ante el comité del SENA el software funcionará de forma ininterrumpida sin depender de conexiones a internet externas.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
