import React, { useState, useEffect } from 'react';

export default function Mentorias() {
  const sessionData = JSON.parse(localStorage.getItem('user_session') || '{}');
  const studentName = sessionData.fullName || 'Diego Tapia';
  const studentEmail = sessionData.email || 'estudiante@talentlab.edu';

  const [activeTab, setActiveTab] = useState('match'); // 'match' o 'sessions'
  const [goal, setGoal] = useState('Preparación para Etapa Productiva y Entrevistas Técnicas');
  const [matchedMentors, setMatchedMentors] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [sessions, setSessions] = useState([]);

  // Modal para agendar
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookingTopic, setBookingTopic] = useState('Revisión de Arquitectura de Software y Portafolio');
  const [bookingDate, setBookingDate] = useState('2026-10-28');
  const [bookingTime, setBookingTime] = useState('16:00');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Cargar sesiones agendadas
  const fetchSessions = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/mentorships/my-sessions?student_email=${encodeURIComponent(studentEmail)}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.warn('API no disponible para sesiones:', e);
    }
  };

  useEffect(() => {
    fetchSessions();
    runAiMatch();
  }, []);

  // Algoritmo de Emparejamiento con IA
  const runAiMatch = async () => {
    setIsMatching(true);
    try {
      const res = await fetch('http://localhost:8000/api/mentorships/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_program: 'Tecnólogo en ADSO',
          goal: goal,
          priorities: ['React', 'FastAPI', 'Entrevistas Técnicas']
        })
      });
      if (res.ok) {
        const data = await res.json();
        setMatchedMentors(data.matches || []);
      }
    } catch (e) {
      console.warn('Fallo emparejamiento API:', e);
    } finally {
      setIsMatching(false);
    }
  };

  // Agendar Sesión
  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      const res = await fetch('http://localhost:8000/api/mentorships/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_email: studentEmail,
          mentor_id: selectedMentor.id,
          topic: bookingTopic,
          scheduled_date: bookingDate,
          scheduled_time: bookingTime
        })
      });

      if (res.ok) {
        showToast(`¡Sesión agendada exitosamente con ${selectedMentor.name}!`);
        setSelectedMentor(null);
        fetchSessions();
        setActiveTab('sessions');
      } else {
        alert('No se pudo agendar la mentoría.');
      }
    } catch (e) {
      alert('Error de conexión con el servidor.');
    }
  };

  return (
    <>
      <header className="panel-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Emparejamiento Inteligente de Mentorías (IA)</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            El algoritmo de IA analiza tus fortalezas y te conecta con egresados destacados del SENA en la industria.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'match' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('match')}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i> Buscar Mentores con IA
          </button>
          <button 
            className={`btn ${activeTab === 'sessions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('sessions')}
          >
            <i className="fa-solid fa-calendar-check"></i> Mis Sesiones ({sessions.length})
          </button>
        </div>
      </header>

      {toast && (
        <div className={`alert ${toast.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <i className="fa-solid fa-circle-check"></i>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* VISTA 1: EMPAREJAMIENTO DE MENTORÍAS CON IA */}
      {activeTab === 'match' && (
        <div>
          {/* Panel de calibración del objetivo */}
          <div className="card" style={{ marginBottom: '25px', background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(139,92,246,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-microchip" style={{ color: 'var(--primary)' }}></i>
              Parámetros de Búsqueda del Algoritmo Vocacional
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
                  ¿En qué área requieres orientación prioritaria?
                </label>
                <select 
                  className="form-control" 
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="Preparación para Etapa Productiva y Entrevistas Técnicas">Preparación para Etapa Productiva y Entrevistas Técnicas</option>
                  <option value="Arquitectura Web, React & FastAPI">Arquitectura Frontend (React, Vite, CSS)</option>
                  <option value="Python, Microservicios y PostgreSQL">Desarrollo Backend (Python, APIs y Bases de Datos)</option>
                  <option value="Git, Docker y Pruebas Unitarias">DevOps, Control de Versiones y Buenas Prácticas</option>
                  <option value="Inserción Laboral, Salarios y Negociación">Inserción Laboral, Hoja de Vida y Salarios</option>
                </select>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={runAiMatch}
                disabled={isMatching}
                style={{ height: '42px', minWidth: '200px' }}
              >
                {isMatching ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Analizando Afinidad...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt"></i> Calibrar Coincidencias con IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Lista de Mentores Emparejados */}
          <div className="grid-3">
            {matchedMentors.map((mentor) => (
              <div 
                key={mentor.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  border: mentor.affinity_num >= 92 ? '2px solid rgba(16,185,129,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '5px 10px' }}>
                      <i className="fa-solid fa-sparkles"></i> {mentor.affinity} Match con tu Perfil
                    </span>
                    <span style={{ color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      <i className="fa-solid fa-star"></i> {mentor.rating}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.1rem' 
                    }}>
                      {mentor.avatar}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: '0 0 2px 0' }}>{mentor.name}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                        <i className="fa-solid fa-building"></i> {mentor.role} en <strong>{mentor.company}</strong>
                      </p>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Especialidad:</span>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', margin: '2px 0 0 0' }}>
                      {mentor.specialty}
                    </p>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Razones del Match IA:</span>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '5px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      {mentor.reasons.map((r, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="fa-solid fa-circle-check" style={{ color: 'var(--color-success)', fontSize: '0.75rem' }}></i>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={() => setSelectedMentor(mentor)}
                >
                  <i className="fa-solid fa-calendar-plus"></i> Agendar Mentoría 1 a 1
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 2: MIS SESIONES CONFIRMADAS */}
      {activeTab === 'sessions' && (
        <div>
          {sessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
              <i className="fa-solid fa-calendar-xmark" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '15px' }}></i>
              <h3>No tienes mentorías agendadas actualmente</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '10px auto 20px auto' }}>
                Usa el motor de emparejamiento con IA para reservar una sesión con un egresado del SENA.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab('match')}>
                Buscar Mentores
              </button>
            </div>
          ) : (
            <div className="grid-2">
              {sessions.map((sess) => (
                <div key={sess.id} className="card" style={{ borderLeft: '4px solid var(--color-success)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-success">
                      <i className="fa-solid fa-circle-check"></i> {sess.status}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-calendar-day"></i> {sess.date} — {sess.time}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>{sess.topic}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    <i className="fa-solid fa-user-tie"></i> Mentor: <strong>{sess.mentorName}</strong>
                  </p>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a 
                      href={sess.meetLink} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-primary" 
                      style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                    >
                      <i className="fa-solid fa-video"></i> Unirse a la Sesión (Meet)
                    </a>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => alert('Recordatorio sincronizado con tu correo institucional.')}
                    >
                      <i className="fa-solid fa-bell"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA AGENDAR SESIÓN */}
      {selectedMentor && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '92%', position: 'relative' }}>
            <button 
              onClick={() => setSelectedMentor(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
            >&times;</button>

            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>Agendar Sesión de Mentoría</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Mentor: <strong>{selectedMentor.name}</strong> ({selectedMentor.role} en {selectedMentor.company})
            </p>

            <form onSubmit={handleBookSession}>
              <div className="form-group">
                <label>Tema o Pregunta Principal para el Mentor</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required 
                  value={bookingTopic}
                  onChange={(e) => setBookingTopic(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Fecha de la Sesión</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    required 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Hora Propuesta</label>
                  <select 
                    className="form-control"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  >
                    <option value="10:00">10:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="18:00">06:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '6px', margin: '15px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-circle-info" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>
                Se creará automáticamente un enlace seguro de Google Meet para la videollamada.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedMentor(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Confirmar y Agendar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
