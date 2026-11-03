import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TalentLabLogo from '../components/TalentLabLogo';

export default function Landing() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (saved && saved.email) {
      setSession(saved);
    }
  }, []);

  const handleContinueSession = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    if (session.role === 'student') navigate('/simulador');
    else if (session.role === 'super_admin') navigate('/admin/usuarios');
    else navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 12% 12%, rgba(139, 92, 246, 0.18), transparent 42%), radial-gradient(circle at 88% 18%, rgba(6, 182, 212, 0.15), transparent 45%), #070b14',
      color: '#f8fafc',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflowX: 'hidden'
    }}>
      {/* NAVBAR INSTITUCIONAL */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(16px)',
        background: 'rgba(7, 11, 20, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '14px 32px'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: '#f8fafc' }}>
            <TalentLabLogo size={42} />
            <div>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Talent<span style={{ color: '#8b5cf6' }}>Lab</span>
              </span>
              <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Detecta · Prepara · Conecta
              </span>
            </div>
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '26px', flexWrap: 'wrap' }}>
            <a href="#nosotros" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}>Nosotros</a>
            <a href="#mision-vision" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}>Misión y Visión</a>
            <a href="#soluciones" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}>Qué Hacemos</a>
            <a href="#comunidad" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}>Comunidad</a>
            <a href="#planes" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500 }}>Planes</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {session ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleContinueSession}
                style={{ padding: '9px 18px', fontSize: '0.86rem' }}
              >
                <i className="fa-solid fa-gauge-high" style={{ marginRight: '6px' }}></i>
                Ir a mi Panel ({session.fullName?.split(' ')[0] || 'Activo'})
              </button>
            ) : null}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
              style={{ padding: '9px 18px', fontSize: '0.86rem' }}
            >
              <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: '6px' }}></i>
              Iniciar Sesión
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/registro')}
              style={{
                padding: '9px 18px',
                fontSize: '0.86rem',
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                border: 'none'
              }}
            >
              <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>
              Crear Cuenta
            </button>
          </div>
        </div>
      </header>

      {/* HERO PRINCIPAL (ENFOQUE HUMANO, COMERCIAL E INSTITUCIONAL) */}
      <section style={{ maxWidth: '1240px', margin: '0 auto', padding: '68px 32px 52px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '44px',
          alignItems: 'center'
        }}>
          {/* Columna Izquierda */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(139, 92, 246, 0.14)',
              border: '1px solid rgba(139, 92, 246, 0.35)',
              color: '#c4b5fd',
              fontSize: '0.78rem',
              fontWeight: 700,
              marginBottom: '20px'
            }}>
              <i className="fa-solid fa-sparkles"></i>
              INNOVACIÓN EDUCATIVA Y ÉXITO PROFESIONAL
            </div>

            <h1 style={{
              fontSize: 'clamp(2.25rem, 4vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              margin: '0 0 18px 0'
            }}>
              Acompañamos a cada estudiante desde el aula hasta su{' '}
              <span style={{
                background: 'linear-gradient(90deg, #38bdf8, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                primer empleo
              </span>
            </h1>

            <p style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              color: '#f1f5f9',
              margin: '0 0 14px 0',
              letterSpacing: '0.02em'
            }}>
              “Detecta. Prepara. Conecta.”
            </p>

            <p style={{
              fontSize: '1.02rem',
              color: '#94a3b8',
              lineHeight: 1.7,
              margin: '0 0 28px 0'
            }}>
              En <strong>TalentLab</strong> unimos la educación con las oportunidades del mundo real. Ayudamos a las instituciones educativas a cuidar la permanencia de sus jóvenes y empoderamos a los estudiantes con entrenamientos de entrevistas y mentorías personalizadas para que den el salto a la vida laboral con total confianza.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/registro')}
                style={{
                  padding: '13px 28px',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  border: 'none',
                  boxShadow: '0 10px 25px -5px rgba(139, 92, 246, 0.45)'
                }}
              >
                <i className="fa-solid fa-rocket" style={{ marginRight: '8px' }}></i>
                Comenzar Gratis Ahora
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/login')}
                style={{ padding: '13px 24px', fontSize: '0.96rem', fontWeight: 600 }}
              >
                <i className="fa-solid fa-right-to-bracket" style={{ marginRight: '8px' }}></i>
                Ya tengo una cuenta
              </button>
            </div>

            {/* Indicadores de Impacto (Marketing & Valor Institucional) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '16px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>+92%</div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Meta de Permanencia Estudiantil</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7' }}>24/7</div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Práctica de Entrevistas con IA</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>1 a 1</div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Mentoría con Profesionales</div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Inspiracional y Amigable */}
          <div style={{
            background: 'linear-gradient(160deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.92))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.45)'
          }}>
            <div style={{ marginBottom: '18px' }}>
              <span style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#38bdf8'
              }}>
                Experiencia TalentLab
              </span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '4px 0 0 0', color: '#f8fafc' }}>
                El puente entre tu formación y tu futuro profesional
              </h3>
            </div>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(56, 189, 248, 0.22)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-heart-pulse"></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Bienestar y Permanencia Estudiantil
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Identificamos a tiempo cuando un estudiante necesita apoyo académico, vocacional o de bienestar para que nadie se quede atrás.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(168, 85, 247, 0.22)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-comments"></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Entrenamiento Realista de Entrevistas
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Practica tus respuestas por voz y cámara con nuestros entrevistadores virtuales y recibe consejos prácticos para brillar ante cualquier empresa.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '16px',
                borderRadius: '14px',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(16, 185, 129, 0.22)',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.15rem',
                  flexShrink: 0
                }}>
                  <i className="fa-solid fa-handshake-angle"></i>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.96rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Red de Egresados y Mentores
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    Conecta con graduados que ya trabajan en la industria y recibe orientación cercana para impulsar tu carrera profesional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN NOSOTROS (QUIÉNES SOMOS) */}
      <section id="nosotros" style={{ maxWidth: '1240px', margin: '0 auto', padding: '52px 32px' }}>
        <div className="card" style={{
          padding: '40px 36px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 27, 75, 0.55))',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          borderRadius: '20px'
        }}>
          <div style={{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
            <span style={{
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#38bdf8',
              fontWeight: 700
            }}>
              Quiénes Somos
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '10px 0 18px 0' }}>
              Sobre Nosotros · TalentLab
            </h2>
            <p style={{ fontSize: '1.02rem', color: '#e2e8f0', lineHeight: 1.75, marginBottom: '16px' }}>
              Somos una iniciativa colombiana de innovación educativa que nació con una convicción clara: <strong>el talento de nuestros jóvenes merece llegar hasta el final de su formación y encontrar un lugar en el mundo laboral</strong>.
            </p>
            <p style={{ fontSize: '0.96rem', color: '#94a3b8', lineHeight: 1.75, margin: 0 }}>
              Sabemos que muchos estudiantes enfrentan retos académicos, económicos o emocionales durante su carrera, y que al graduarse suelen enfrentarse al temor de su primera entrevista de trabajo. Por eso creamos <strong>TalentLab</strong>: una plataforma cercana, intuitiva y humana que apoya a las instituciones educativas en el cuidado de su comunidad estudiantil y prepara a cada aprendiz para alcanzar sus metas profesionales.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN MISIÓN, VISIÓN Y VALORES CORPORATIVOS */}
      <section id="mision-vision" style={{ maxWidth: '1240px', margin: '0 auto', padding: '36px 32px 52px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a855f7', fontWeight: 700 }}>
            Identidad Institucional
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>
            Nuestra Misión, Visión y Valores
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            El propósito que guía cada paso de nuestra organización en favor de la educación y la empleabilidad juvenil.
          </p>
        </div>

        {/* Misión y Visión */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          <div className="card" style={{ borderTop: '4px solid #8b5cf6', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(139, 92, 246, 0.16)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                <i className="fa-solid fa-bullseye"></i>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Nuestra Misión</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
              Transformar el bienestar y el éxito profesional estudiantil en Colombia a través de soluciones tecnológicas accesibles e inteligentes que detectan oportunamente el riesgo de deserción académica, entrenan habilidades laborales prácticas mediante simulaciones interactivas y conectan a los estudiantes con egresados y mentores, reduciendo las brechas de permanencia y empleabilidad con alto impacto social.
            </p>
          </div>

          <div className="card" style={{ borderTop: '4px solid #06b6d4', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'rgba(6, 182, 212, 0.16)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem'
              }}>
                <i className="fa-solid fa-eye"></i>
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>Nuestra Visión</h3>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.94rem', lineHeight: 1.7, margin: 0 }}>
              Consolidarnos para el año 2031 como la plataforma educativa líder en acompañamiento estudiantil y preparación laboral en la región andina, articulando una red activa de más de 150 instituciones educativas aliadas y beneficiando a más de 100.000 estudiantes y egresados mediante el acceso equitativo a la inteligencia artificial.
            </p>
          </div>
        </div>

        {/* Valores Institucionales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <i className="fa-solid fa-hand-holding-heart" style={{ fontSize: '1.5rem', color: '#f472b6', marginBottom: '10px' }}></i>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Empatía y Compromiso</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
              Ponemos al estudiante en el centro, comprendiendo sus retos personales y acompañando su proceso formativo.
            </p>
          </div>

          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <i className="fa-solid fa-lightbulb" style={{ fontSize: '1.5rem', color: '#fbbf24', marginBottom: '10px' }}></i>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Innovación con Propósito</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
              Ponemos la inteligencia artificial al servicio de la educación de forma sencilla, cercana y fácil de usar.
            </p>
          </div>

          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <i className="fa-solid fa-award" style={{ fontSize: '1.5rem', color: '#38bdf8', marginBottom: '10px' }}></i>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Excelencia Profesional</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
              Fortalecemos tanto las habilidades humanas como el talento técnico que hoy demandan las empresas.
            </p>
          </div>

          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <i className="fa-solid fa-shield-halved" style={{ fontSize: '1.5rem', color: '#34d399', marginBottom: '10px' }}></i>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Confianza y Privacidad</h4>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
              Protegemos la información de cada institución y estudiante bajo los más altos estándares de seguridad y Habeas Data.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN QUÉ HACEMOS: DETECTA · PREPARA · CONECTA */}
      <section id="soluciones" style={{ maxWidth: '1240px', margin: '0 auto', padding: '44px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 700 }}>
            Nuestra Propuesta de Valor
          </span>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0' }}>
            ¿Cómo Funciona TalentLab?
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            Un recorrido integral en tres etapas para garantizar que cada estudiante culmine sus estudios y alcance el éxito laboral.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '22px' }}>
          <div className="card" style={{ borderTop: '3px solid #ef4444' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '14px' }}>
              <i className="fa-solid fa-compass"></i>
            </div>
            <h3 style={{ fontSize: '1.22rem', fontWeight: 700, marginBottom: '8px' }}>1. Detecta a Tiempo</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.65 }}>
              A través de nuestro <strong>Semáforo de Bienestar y Permanencia</strong>, los orientadores y coordinadores identifican de manera temprana a los jóvenes que requieren acompañamiento académico, socioeconómico o motivacional, activando planes de apoyo personalizados.
            </p>
          </div>

          <div className="card" style={{ borderTop: '3px solid #38bdf8' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '14px' }}>
              <i className="fa-solid fa-microphone-lines"></i>
            </div>
            <h3 style={{ fontSize: '1.22rem', fontWeight: 700, marginBottom: '8px' }}>2. Prepara para el Empleo</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Nuestro <strong>Simulador de Entrevistas con IA</strong> permite a los estudiantes perder el miedo escénico practicando entrevistas de habilidades blandas y conocimientos específicos de su carrera, recibiendo retroalimentación constructiva al instante.
            </p>
          </div>

          <div className="card" style={{ borderTop: '3px solid #10b981' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '14px' }}>
              <i className="fa-solid fa-users-rays"></i>
            </div>
            <h3 style={{ fontSize: '1.22rem', fontWeight: 700, marginBottom: '8px' }}>3. Conecta con el Futuro</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.65 }}>
              Acercamos a los estudiantes con una <strong>Red de Egresados Mentores</strong> que ya se desempeñan en el sector productivo, facilitando sesiones de orientación vocacional, consejos prácticos y preparación para su etapa productiva.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN COMUNIDAD EDUCATIVA */}
      <section id="comunidad" style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#34d399', fontWeight: 700 }}>
            Para Quién es TalentLab
          </span>
          <h2 style={{ fontSize: '1.95rem', fontWeight: 800, margin: '8px 0' }}>
            Diseñado para Toda la Comunidad Educativa
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            Elige tu perfil para crear tu cuenta o iniciar sesión en la plataforma.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          {/* Estudiantes */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
            <div>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', marginBottom: '12px', display: 'inline-block' }}>
                🎓 Estudiantes y Aprendices
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Impulsa tu Talento y Empleabilidad</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '14px' }}>
                Entrena a tu propio ritmo para tus entrevistas de práctica o primer empleo, conoce tus fortalezas y recibe el acompañamiento de mentores de tu carrera.
              </p>
              <ul style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.75, paddingLeft: '18px', marginBottom: '22px' }}>
                <li>Simulacros de entrevista por voz y cámara con IA.</li>
                <li>Reporte personalizado de fortalezas y plan de mejora.</li>
                <li>Agenda mentorías gratuitas con egresados destacados.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, fontSize: '0.84rem' }}
                onClick={() => navigate('/registro?role=student')}
              >
                Crear Cuenta de Estudiante
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.84rem' }}
                onClick={() => navigate('/login?role=student')}
              >
                Iniciar Sesión
              </button>
            </div>
          </div>

          {/* Instituciones y Directivos */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '26px' }}>
            <div>
              <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', marginBottom: '12px', display: 'inline-block' }}>
                🏛️ Instituciones y Coordinadores
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>Fortalece la Permanencia y el Éxito Escolar</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '14px' }}>
                Cuenta con indicadores claros sobre el bienestar de tus estudiantes, asigna planes de acompañamiento oportunos y haz seguimiento a su preparación laboral.
              </p>
              <ul style={{ color: '#cbd5e1', fontSize: '0.86rem', lineHeight: 1.75, paddingLeft: '18px', marginBottom: '22px' }}>
                <li>Panel de alertas tempranas y seguimiento estudiantil.</li>
                <li>Gestión sencilla de planes de apoyo y nivelación.</li>
                <li>Informes ejecutivos descargables en PDF para tu sede.</li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, fontSize: '0.84rem' }}
                onClick={() => navigate('/registro?role=admin_tenant')}
              >
                Vincular mi Institución
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1, fontSize: '0.84rem' }}
                onClick={() => navigate('/login?role=admin_tenant')}
              >
                Acceso Directivos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE PLANES INSTITUCIONALES */}
      <section id="planes" style={{ maxWidth: '1240px', margin: '0 auto', padding: '44px 32px 68px' }}>
        <div style={{ textAlign: 'center', marginBottom: '34px' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fbbf24', fontWeight: 700 }}>
            Planes y Convenios
          </span>
          <h2 style={{ fontSize: '1.95rem', fontWeight: 800, margin: '8px 0' }}>
            Soluciones al Alcance de Cada Institución
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            Contamos con planes diseñados para colegios, centros de formación técnica e instituciones de educación superior, incluyendo nuestro programa de impacto social.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.12rem', fontWeight: 700 }}>Plan Semillero Básico</h3>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#38bdf8', margin: '10px 0' }}>
              $4.500.000 <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>COP / Anual</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '16px' }}>
              Ideal para colegios técnicos e instituciones que inician su estrategia de prevención de deserción.
            </p>
            <ul style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.7, paddingLeft: '18px', marginBottom: '20px' }}>
              <li>Hasta 250 estudiantes acompañados</li>
              <li>Semáforo Preventivo de Permanencia</li>
              <li>Simulador de Entrevistas con IA</li>
              <li>Panel para Coordinación y Bienestar</li>
            </ul>
            <button type="button" className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/registro?role=admin_tenant')}>
              Solicitar Plan Semillero
            </button>
          </div>

          <div className="card" style={{ border: '2px solid #8b5cf6', position: 'relative' }}>
            <span style={{
              position: 'absolute',
              top: '-12px',
              right: '20px',
              background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '999px'
            }}>
              RECOMENDADO
            </span>
            <h3 style={{ fontSize: '1.12rem', fontWeight: 700 }}>Plan Institucional Avanzado</h3>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#c084fc', margin: '10px 0' }}>
              $4.500.000 <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>COP / Licencia Anual</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '16px' }}>
              Cobertura integral con simulador por voz, reportes ejecutivos en PDF y red activa de egresados mentores.
            </p>
            <ul style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.7, paddingLeft: '18px', marginBottom: '20px' }}>
              <li>Hasta 600 estudiantes evaluados</li>
              <li>Simulador con Voz Latina y Retroalimentación</li>
              <li>Informes Ejecutivos Institucionales en PDF</li>
              <li>Red de Egresados Mentores y Planes de Apoyo</li>
            </ul>
            <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/registro?role=admin_tenant')}>
              Vincular Institución
            </button>
          </div>

          <div className="card" style={{ borderTop: '3px solid #10b981' }}>
            <h3 style={{ fontSize: '1.12rem', fontWeight: 700 }}>Plan Social SENA / Impacto Público</h3>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#34d399', margin: '10px 0' }}>
              100% Subsidiado <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>Gratuito</span>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8', marginBottom: '16px' }}>
              Acceso solidario para aprendices y centros de formación pública comprometidos con la empleabilidad juvenil.
            </p>
            <ul style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.7, paddingLeft: '18px', marginBottom: '20px' }}>
              <li>Acceso gratuito para aprendices en formación</li>
              <li>Preparación práctica para Etapa Productiva</li>
              <li>Mentoría con profesionales egresados</li>
              <li>Acompañamiento vocacional continuo</li>
            </ul>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', borderColor: 'rgba(16,185,129,0.4)', color: '#34d399' }} onClick={() => navigate('/registro?role=student')}>
              Crear Cuenta Gratuita
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER INSTITUCIONAL */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(7, 11, 20, 0.98)',
        padding: '48px 32px 32px'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '36px',
          marginBottom: '36px'
        }}>
          {/* Columna 1: Identidad Corporativa */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <TalentLabLogo size={36} />
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f8fafc' }}>
                Talent<span style={{ color: '#8b5cf6' }}>Lab</span> S.A.S.
              </span>
            </div>
            <p style={{ color: '#c4b5fd', fontSize: '0.86rem', fontWeight: 600, margin: '0 0 10px 0' }}>
              “Detecta. Prepara. Conecta.”
            </p>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.6, margin: 0 }}>
              Plataforma tecnológica de acompañamiento estudiantil, prevención de deserción y preparación laboral con inteligencia artificial.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 14px 0' }}>
              Navegación Institucional
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '0.85rem' }}>
              <li>
                <a href="#nosotros" style={{ color: '#94a3b8', textDecoration: 'none' }}>Sobre Nosotros</a>
              </li>
              <li>
                <a href="#mision-vision" style={{ color: '#94a3b8', textDecoration: 'none' }}>Misión, Visión y Valores</a>
              </li>
              <li>
                <a href="#soluciones" style={{ color: '#94a3b8', textDecoration: 'none' }}>Propuesta de Valor</a>
              </li>
              <li>
                <a href="#planes" style={{ color: '#94a3b8', textDecoration: 'none' }}>Planes y Convenio Social</a>
              </li>
            </ul>
          </div>

          {/* Columna 3: Contáctanos */}
          <div id="contacto">
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f1f5f9', margin: '0 0 14px 0' }}>
              Contáctanos
            </h4>
            <div style={{ display: 'grid', gap: '10px', fontSize: '0.85rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-envelope" style={{ color: '#38bdf8', width: '16px' }}></i>
                <span>contacto@talentlab.com.co</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-phone" style={{ color: '#34d399', width: '16px' }}></i>
                <span>Móvil / WhatsApp: +57 310 619 2125</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: '#f472b6', width: '16px' }}></i>
                <span>Bogotá D.C. · Colombia</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fa-solid fa-clock" style={{ color: '#fbbf24', width: '16px' }}></i>
                <span>Lunes a Viernes: 8:00 a.m. - 6:00 p.m.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Línea Divisoria y Derechos Reservados */}
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          fontSize: '0.82rem',
          color: '#64748b'
        }}>
          <div>
            © {new Date().getFullYear()} <strong>TalentLab S.A.S.</strong> Todos los derechos reservados.
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span>Cumplimiento Ley 1581 de 2012 (Habeas Data)</span>
            <Link to="/login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Acceso a Plataforma</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
