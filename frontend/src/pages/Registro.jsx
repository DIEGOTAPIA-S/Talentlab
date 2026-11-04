import { API_BASE_URL } from '../config/api';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TalentLabLogo from '../components/TalentLabLogo';

const API = API_BASE_URL;

const DEFAULT_INSTITUTIONS = [
  {
    name: 'SENA - Centro de Tecnologías del Software',
    programs: ['Tecnólogo en ADSO', 'Desarrollo de Software', 'Diseño Gráfico Digital']
  },
  {
    name: 'SENA - Centro de Comercio y Servicios',
    programs: ['Tecnólogo en Gestión Empresarial', 'Tecnólogo en Contabilidad y Finanzas']
  },
  {
    name: 'Institución Universitaria Tecnológica de Antioquia',
    programs: ['Ingeniería de Sistemas', 'Diseño Gráfico Digital']
  }
];

export default function Registro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialRole = searchParams.get('role') === 'admin_tenant' ? 'admin_tenant' : 'student';
  const [activeRole, setActiveRole] = useState(initialRole);

  const [catalogInstitutions, setCatalogInstitutions] = useState(DEFAULT_INSTITUTIONS);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+57 312 000 0000');
  const [institution, setInstitution] = useState(DEFAULT_INSTITUTIONS[0].name);
  const [customInstitution, setCustomInstitution] = useState('');
  const [program, setProgram] = useState(DEFAULT_INSTITUTIONS[0].programs[0]);
  const [title, setTitle] = useState('Coordinador Académico Institucional');
  const [stratum, setStratum] = useState(2);
  const [financialAid, setFinancialAid] = useState(0);

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/public/catalog`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.institutions && data.institutions.length > 0) {
          setCatalogInstitutions(data.institutions);
          const firstInst = data.institutions[0];
          setInstitution(firstInst.name);
          if (firstInst.programs && firstInst.programs.length > 0) {
            setProgram(firstInst.programs[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  const currentInstObj = catalogInstitutions.find(i => i.name === institution) || catalogInstitutions[0];
  const availablePrograms = currentInstObj?.programs?.length
    ? currentInstObj.programs
    : ['Tecnólogo en ADSO', 'Desarrollo de Software', 'Tecnólogo en Gestión Empresarial'];

  const handleInstitutionSelect = (instName) => {
    setInstitution(instName);
    const found = catalogInstitutions.find(i => i.name === instName);
    if (found && found.programs && found.programs.length > 0) {
      setProgram(found.programs[0]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    const finalInst = institution === '__nueva__'
      ? customInstitution.trim()
      : institution;

    if (!name.trim() || !email.trim() || !password.trim() || !finalInst) {
      setError('Por favor completa todos los campos obligatorios para registrar tu cuenta.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: activeRole,
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          institution: finalInst,
          program: program,
          title: title,
          phone: phone,
          stratum: Number(stratum) || 2,
          has_financial_aid: Number(financialAid) || 0
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.detail || 'No se pudo crear la cuenta.');
        setSubmitting(false);
        return;
      }

      localStorage.setItem('user_session', JSON.stringify(data));
      if (data.role === 'student') {
        navigate('/simulador');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor al registrar la cuenta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-layout">
      {/* Lado Izquierdo: Branding Visual */}
      <div className="login-visuals">
        <div
          className="login-branding"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            padding: '0 32px'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '16px'
            }}
          >
            <TalentLabLogo size={64} />
            <h1 style={{ margin: 0, fontSize: '3.2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Talent<span>Lab</span>
            </h1>
          </div>

          <div
            style={{
              width: '72px',
              height: '3px',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #38bdf8, #8b5cf6, #ec4899)',
              marginBottom: '16px'
            }}
          />

          <p
            style={{
              fontSize: '1.35rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              color: '#f8fafc',
              margin: '0 0 24px 0',
              textAlign: 'center'
            }}
          >
            “Detecta. Prepara. Conecta.”
          </p>

          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <i className="fa-solid fa-arrow-left"></i> Volver a la Página Principal
          </Link>
        </div>
      </div>

      {/* Lado Derecho: Formulario Limpio de Registro */}
      <div className="login-container" style={{ overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link
            to="/"
            style={{
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <i className="fa-solid fa-house"></i> Inicio
          </Link>

          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#cbd5e1',
              textDecoration: 'none'
            }}
          >
            ¿Ya tienes cuenta? <span style={{ color: '#38bdf8', fontWeight: 700 }}>Iniciar Sesión</span>
          </Link>
        </div>

        <div className="login-header" style={{ marginBottom: '18px' }}>
          <h2>Crear Cuenta Nueva</h2>
          <p>Diligencia tus datos para ingresar al ecosistema TalentLab</p>
        </div>

        {/* Selector de Rol */}
        <div className="role-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
          <div
            className={`role-option ${activeRole === 'student' ? 'active' : ''}`}
            onClick={() => setActiveRole('student')}
            style={{ padding: '12px 8px' }}
          >
            <i className="fa-solid fa-user-graduate"></i>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Soy Estudiante / Aprendiz</span>
          </div>
          <div
            className={`role-option ${activeRole === 'admin_tenant' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin_tenant')}
            style={{ padding: '12px 8px' }}
          >
            <i className="fa-solid fa-building-columns"></i>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Soy Directivo / Coordinador</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', marginBottom: '16px' }}>
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Nombre Completo</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Laura Sofía Restrepo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Correo Institucional</label>
              <input
                type="email"
                className="form-control"
                placeholder="usuario@institucion.edu.co"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label>Institución Educativa / Sede</label>
            <select
              className="form-control"
              style={{ backgroundColor: '#0f172a', color: '#f8fafc', colorScheme: 'dark' }}
              value={institution}
              onChange={(e) => handleInstitutionSelect(e.target.value)}
            >
              {catalogInstitutions.map(inst => (
                <option key={inst.name} value={inst.name} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                  {inst.name}
                </option>
              ))}
              {activeRole === 'admin_tenant' && (
                <option value="__nueva__" style={{ backgroundColor: '#0f172a', color: '#38bdf8' }}>
                  + Registrar Nueva Institución Educativa...
                </option>
              )}
            </select>
          </div>

          {institution === '__nueva__' && (
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Nombre de la Nueva Institución</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. SENA - Centro de Servicios de Salud"
                value={customInstitution}
                onChange={(e) => setCustomInstitution(e.target.value)}
                required
              />
            </div>
          )}

          {activeRole === 'student' ? (
            <>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Programa de Formación / Carrera</label>
                <select
                  className="form-control"
                  style={{ backgroundColor: '#0f172a', color: '#f8fafc', colorScheme: 'dark' }}
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                >
                  {availablePrograms.map(prog => (
                    <option key={prog} value={prog} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                      {prog}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Estrato Socioeconómico</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0f172a', color: '#f8fafc', colorScheme: 'dark' }}
                    value={stratum}
                    onChange={(e) => setStratum(Number(e.target.value))}
                  >
                    <option value={1}>Estrato 1</option>
                    <option value={2}>Estrato 2</option>
                    <option value={3}>Estrato 3</option>
                    <option value={4}>Estrato 4+</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Auxilio / Beca Transporte</label>
                  <select
                    className="form-control"
                    style={{ backgroundColor: '#0f172a', color: '#f8fafc', colorScheme: 'dark' }}
                    value={financialAid}
                    onChange={(e) => setFinancialAid(Number(e.target.value))}
                  >
                    <option value={0}>No cuenta con auxilio</option>
                    <option value={1}>Sí cuenta con auxilio</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Cargo Directivo</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              border: 'none',
              marginTop: '8px'
            }}
          >
            {submitting ? 'Creando Cuenta...' : 'Crear Cuenta e Ingresar'} <i className="fa-solid fa-user-check"></i>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>¿Ya tienes una cuenta registrada? </span>
          <Link to="/login" style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, textDecoration: 'none' }}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
