import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Simulador() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'ai', content: '¡Hola! Bienvenido a tu simulador de TalentLab. Soy tu reclutador virtual. Para iniciar, por favor descríbeme tu perfil profesional y tus principales fortalezas.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [score, setScore] = useState('--');
  const [feedbacks, setFeedbacks] = useState([]);
  const [showGuide, setShowGuide] = useState(true);
  
  const chatDisplayRef = useRef(null);

  useEffect(() => {
    const sessionData = JSON.parse(localStorage.getItem('user_session'));
    if (!sessionData || sessionData.role !== 'student') {
      navigate('/login');
      return;
    }
    setSession(sessionData);
  }, [navigate]);

  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages]);


  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    
    // Simulate thinking state
    setMessages(prev => [...prev, { role: 'ai', content: '...' }]);

    try {
      const response = await fetch('http://localhost:8000/api/interview/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session.tenant_id,
          message: text
        })
      });

      if (!response.ok) {
        throw new Error('Error en el servidor');
      }

      const data = await response.json();
      
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { role: 'ai', content: data.ai_response };
        return newArr;
      });

      setScore(data.metrics.score);
      setFeedbacks(prev => [data.metrics.feedback, ...prev].slice(0, 5));
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const newArr = [...prev];
        newArr[newArr.length - 1] = { role: 'ai', content: 'Lo siento, tuve un problema conectando con el servidor. ¿Podrías intentar de nuevo?' };
        return newArr;
      });
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setInputValue("Simulando dictado de voz... [Presiona de nuevo para enviar]");
    } else {
      if (inputValue.includes("Simulando dictado de voz")) {
        setInputValue("Soy un estudiante de prueba muy proactivo y trabajo bien en equipo.");
      }
    }
  };

  if (!session) return null;

  return (
    <>
      {/* Main Content */}
      <div style={{ padding: '30px' }}>
        <header className="panel-header">
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Entrenamiento de Entrevistas</h1>
            <p style={{ color: 'var(--text-muted)' }}>Practica de forma ilimitada y obtén retroalimentación de la IA en tiempo real.</p>
          </div>
          <div className="student-profile">
            <div className="avatar">
              {session.fullName.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h4 style={{ fontWeight: 600 }}>{session.fullName}</h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{session.institution}</span>
            </div>
          </div>
        </header>

        {/* Simulator Workspace */}
        <div className="simulator-layout">
          
          {/* Chat & Controls */}
          <div className="interview-box">
            <div className="chat-display" ref={chatDisplayRef}>
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role === 'ai' ? 'chat-bubble-ai' : 'chat-bubble-user'}`}>
                  {msg.content}
                </div>
              ))}
            </div>
            <div className="chat-controls">
              <input 
                type="text" 
                className="form-control" 
                style={{ flexGrow: 1 }} 
                placeholder="Escribe tu respuesta aquí o presiona el micrófono..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                className={`voice-btn ${isRecording ? 'recording' : ''}`} 
                onClick={toggleRecording}
                title="Grabar respuesta por voz"
              >
                <i className="fa-solid fa-microphone"></i>
              </button>
              <button className="btn btn-primary" onClick={handleSendMessage}>
                Enviar <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>

          {/* Live Evaluation Metrics */}
          <div className="metrics-panel">
            <div className="card">
              <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Calificación en Tiempo Real</h3>
              <div className="score-circle score-circle-success">{score}</div>
              <p style={{ textAlign: 'center', marginTop: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Puntaje acumulado de comunicación y coherencia
              </p>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Retroalimentación Detallada</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                {feedbacks.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Comienza la entrevista para ver las observaciones de la IA.</p>
                ) : (
                  feedbacks.map((fb, idx) => (
                    <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--primary)' }}>
                      <i className="fa-solid fa-comment-dots" style={{ marginRight: '8px', color: 'var(--primary)' }}></i>
                      {fb}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Guía Rápida */}
      {showGuide && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', 
          justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', position: 'relative' }}>
            <h2 style={{ marginBottom: '15px', color: 'var(--primary)' }}>
              <i className="fa-solid fa-rocket"></i> Guía Rápida del Simulador
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>
              Bienvenido al Simulador de Entrevistas. Aquí podrás practicar respuestas a preguntas comunes del sector productivo.
            </p>
            <ul style={{ color: 'var(--text-muted)', marginBottom: '20px', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li><strong>🎤 Modo Voz:</strong> Haz clic en el micrófono para simular que hablas.</li>
              <li><strong>⌨️ Modo Texto:</strong> Escribe tu respuesta y presiona Enviar.</li>
              <li><strong>📈 Calificación en Vivo:</strong> La IA analizará tu respuesta y te dará un puntaje de coherencia y comunicación.</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowGuide(false)}>
              ¡Entendido, empezar entrevista!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
