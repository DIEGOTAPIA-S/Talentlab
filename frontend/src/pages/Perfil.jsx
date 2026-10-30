import React, { useState, useEffect } from 'react';

export default function Perfil() {
  const [session, setSession] = useState({});
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

    const role = sessionData.role || 'student';
    const rawFullName =
      sessionData.fullName ||
      (role === 'super_admin'
        ? 'Carlos Alberto Ramírez'
        : role === 'admin_tenant'
        ? 'Patricia Gómez Salazar'
        : 'Diego Tapia');

    let cleanFullName = rawFullName.replace(/^Dra\.\s*/i, '');
    if (cleanFullName === 'Patricia Gómez') cleanFullName = 'Patricia Gómez Salazar';

    const rawInstitution =
      sessionData.institution ||
      (role === 'super_admin'
        ? 'Dirección General'
        : 'SENA - Centro de Tecnologías del Software');
    const cleanInstitution = rawInstitution.includes('Gobierno Global')
      ? 'Dirección General'
      : rawInstitution;

    const rawTitle =
      sessionData.title ||
      (role === 'super_admin'
        ? 'Administrador General'
        : role === 'admin_tenant'
        ? 'Coordinadora de Formación y Permanencia Académica'
        : 'Aprendiz Tecnólogo en ADSO');
    const cleanTitle = rawTitle.replace(/\s*\(Super Admin\)/i, '');

    const rawDepartment =
      sessionData.department ||
      (role === 'super_admin'
        ? 'Administración de Plataforma'
        : role === 'admin_tenant'
        ? 'Coordinación de Formación Profesional'
        : 'Etapa Lectiva SENA');
    const cleanDepartment = rawDepartment.includes('Multi-Tenant')
      ? 'Administración de Plataforma'
      : rawDepartment;

    setFormData({
      fullName: cleanFullName,
      email:
        sessionData.email ||
        (role === 'super_admin'
          ? 'admin@talentlab.edu'
          : role === 'admin_tenant'
          ? 'director@talentlab.edu'
          : 'estudiante@talentlab.edu'),
      institution: cleanInstitution,
      title: cleanTitle,
      phone:
        sessionData.phone ||
        (role === 'super_admin'
          ? '+57 300 910 2030'
          : role === 'admin_tenant'
          ? '+57 (601) 546-1500'
          : '+57 312 411 7048'),
      department: cleanDepartment,
      password: ''
    });
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
        showToast('Información de perfil actualizada exitosamente.');
      } else {
        alert('Error al guardar cambios.');
      }
    } catch (e) {
      alert('Error de conexión con el servidor.');
    }
  };

  const isSuperAdmin = session.role === 'super_admin';
  const isDirectivo = session.role === 'admin_tenant';

  const roleBadgeLabel = isSuperAdmin
    ? 'ADMINISTRADOR GENERAL'
    : isDirectivo
    ? 'DIRECTIVO INSTITUCIONAL'
    : 'ESTUDIANTE / APRENDIZ';

  return (
    <div style={{ maxWidth: '920px' }}>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px' }}>Mi Perfil</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Gestión de datos personales, información de contacto y credenciales de acceso.
          </p>
        </div>
      </header>

      {toast && (
        <div
          className={`alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}
        >
          <i className="fa-solid fa-circle-check"></i>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Tarjeta de Resumen de Identidad del Usuario */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              color: '#fff'
            }}
          >
            {formData.fullName
              ? formData.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
              : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                className="badge"
                style={{
                  fontSize: '0.76rem',
                  background: isSuperAdmin
                    ? 'rgba(245, 158, 11, 0.16)'
                    : isDirectivo
                    ? 'rgba(168, 85, 247, 0.16)'
                    : 'rgba(6, 182, 212, 0.16)',
                  color: isSuperAdmin ? '#fbbf24' : isDirectivo ? '#d8b4fe' : '#38bdf8',
                  border: isSuperAdmin
                    ? '1px solid rgba(245, 158, 11, 0.35)'
                    : isDirectivo
                    ? '1px solid rgba(168, 85, 247, 0.35)'
                    : '1px solid rgba(6, 182, 212, 0.35)'
                }}
              >
                <i
                  className={`fa-solid ${
                    isSuperAdmin ? 'fa-user-shield' : isDirectivo ? 'fa-building-columns' : 'fa-user-graduate'
                  }`}
                ></i>{' '}
                {roleBadgeLabel}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', margin: '2px 0' }}>{formData.fullName}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
              {formData.title} · {formData.email}
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            <i className="fa-solid fa-circle-check"></i> Cuenta Activa
          </span>
        </div>
      </div>

      {/* Formulario de Edición de Perfil */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-user-pen" style={{ color: 'var(--primary)' }}></i>
          Información de la Cuenta
        </h3>

        <form onSubmit={handleProfileSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
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
              <label>Correo Electrónico</label>
              <input
                type="email"
                className="form-control"
                required
                value={formData.email}
                readOnly
                style={{ opacity: 0.75, cursor: 'not-allowed' }}
              />
            </div>

            {!isSuperAdmin && (
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
            )}

            <div className="form-group">
              <label>Cargo o Programa</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

          <div className="form-group" style={{ marginTop: '4px' }}>
            <label>Actualizar Contraseña (Opcional)</label>
            <input
              type="password"
              className="form-control"
              placeholder="Dejar en blanco para mantener la contraseña actual"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '11px 24px' }}>
              <i className="fa-solid fa-floppy-disk"></i> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
