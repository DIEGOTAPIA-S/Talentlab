import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewerAvatar, { INTERVIEWER_PERSONAS } from '../components/InterviewerAvatar';
import { BodyAndVoiceAnalyzer } from '../lib/bodyAnalysis';

const API = 'http://localhost:8000';
const BARS = 56;

const AXES = [
  { key: 'grammar', label: 'Gramática y Sintaxis', icon: 'fa-spell-check',
    hint: (v) => v >= 85 ? 'Excelente estructuración gramatical. Uso de terminología técnica claro y preciso.' : v >= 72 ? 'Buena redacción. Cuida la puntuación y el hilo argumental.' : 'Mejora la concordancia y la estructura de tus respuestas.' },
  { key: 'bodyLanguage', label: 'Lenguaje Corporal y Postura (IA Óptica)', icon: 'fa-face-smile',
    hint: (v) => v >= 85 ? 'Excelente postura erguida, mirada firme a la cámara y calidez gestual.' : v >= 72 ? 'Buen porte. Intenta centrarte más en la cámara y sonreír al inicio.' : 'Ajusta la altura de la cámara y mantén contacto visual constante.' },
  { key: 'alignment', label: 'Alineación de Respuestas (Método STAR)', icon: 'fa-chart-line',
    hint: (v) => v >= 85 ? 'Respuesta estructurada (Situación, Tarea, Acción, Resultado medible).' : v >= 72 ? 'Buen relato. Intenta cuantificar el resultado de tu proyecto.' : 'Utiliza el marco STAR para ordenar tus vivencias técnicas.' }
];

const Q_TITLE = 'P: ';

export const VOCATIONAL_TRACKS = [
  {
    id: 'transversal',
    name: 'Transversal (Todas las Carreras)',
    shortName: 'Transversal (Todas)',
    icon: 'fa-globe',
    badgeColor: '#a855f7',
    recommendedPersona: 'carolina',
    initialQuestion: '¡Bienvenido/a a tu simulación de entrevista! Cuéntanos sobre una situación desafiante que hayas superado durante tu formación académica o en un proyecto, y cómo lograste resolverla.',
    roleTarget: 'Competencias Laborales Transversales'
  },
  {
    id: 'gestion',
    name: 'Gestión Empresarial & Finanzas',
    shortName: 'Gestión & Finanzas',
    icon: 'fa-briefcase',
    badgeColor: '#10b981',
    recommendedPersona: 'david',
    initialQuestion: '¡Bienvenido/a! Describe una situación donde hayas tenido que coordinar recursos, atender a un usuario o cliente exigente, o cumplir una meta administrativa.',
    roleTarget: 'Prácticas en Gestión Empresarial, Finanzas o Servicios'
  },
  {
    id: 'tecnologia',
    name: 'Tecnología, Procesos & TIC',
    shortName: 'TIC & Software',
    icon: 'fa-laptop-code',
    badgeColor: '#06b6d4',
    recommendedPersona: 'carlos',
    initialQuestion: '¡Bienvenido/a! Describe un proyecto o reto técnico donde hayas tenido que investigar una solución, resolver un problema complejo o implementar una mejora de procesos.',
    roleTarget: 'Prácticas en Análisis y Desarrollo de Software (ADSO) / TIC'
  },
  {
    id: 'diseno',
    name: 'Diseño, Multimedia & Comunicación',
    shortName: 'Diseño & Medios',
    icon: 'fa-palette',
    badgeColor: '#f59e0b',
    recommendedPersona: 'carolina',
    initialQuestion: '¡Bienvenido/a! Cuéntanos sobre un proyecto donde debiste interpretar las necesidades de una audiencia o cliente para estructurar una propuesta visual creativa.',
    roleTarget: 'Prácticas en Diseño Gráfico Digital / Medios'
  }
];

export default function Simulador() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [selectedTrackId, setSelectedTrackId] = useState('transversal');
  const [messages, setMessages] = useState([
    { role: 'ai', content: VOCATIONAL_TRACKS[0].initialQuestion }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [score, setScore] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [tips, setTips] = useState([]);
  const [showGuide, setShowGuide] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Persona y Banco de Voces
  const [selectedPersonaId, setSelectedPersonaId] = useState('carolina');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState('');
  const [voiceRate, setVoiceRate] = useState(1.0);
  const [voicePitch, setVoicePitch] = useState(1.0);

  // Cámara, Micrófono y Análisis Biométrico
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [levels, setLevels] = useState(() => Array(BARS).fill(4));

  // Biometría en tiempo real
  const [liveBio, setLiveBio] = useState({
    posture: 88,
    eyeContact: 90,
    smile: 82,
    cadenceWpm: 0,
    fillersCount: 0,
    summaryScore: 87
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const recogRef = useRef(null);
  const chatRef = useRef(null);
  const analyzerRef = useRef(null);

  const selectedPersona = INTERVIEWER_PERSONAS.find(p => p.id === selectedPersonaId) || INTERVIEWER_PERSONAS[0];

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (!s || s.role !== 'student') { navigate('/login'); return; }
    setSession(s);

    // Autodetectar según programa formativo del estudiante
    const prog = (s.program || s.title || '').toLowerCase();
    let initialTrack = 'transversal';
    if (prog.includes('adso') || prog.includes('software') || prog.includes('sistemas') || prog.includes('tecnología')) {
      initialTrack = 'tecnologia';
    } else if (prog.includes('gestión') || prog.includes('gestion') || prog.includes('contabilidad') || prog.includes('finanzas') || prog.includes('comercio')) {
      initialTrack = 'gestion';
    } else if (prog.includes('diseño') || prog.includes('diseno') || prog.includes('multimedia')) {
      initialTrack = 'diseno';
    }

    const savedTrack = localStorage.getItem('talentlab_interview_track') || initialTrack;
    setSelectedTrackId(savedTrack);
    const trackObj = VOCATIONAL_TRACKS.find(t => t.id === savedTrack) || VOCATIONAL_TRACKS[0];
    setMessages([{ role: 'ai', content: trackObj.initialQuestion }]);

    const savedPersona = localStorage.getItem('talentlab_interviewer_persona') || trackObj.recommendedPersona;
    setSelectedPersonaId(savedPersona);

    const savedVoice = localStorage.getItem('talentlab_voice_name');
    if (savedVoice) setSelectedVoiceName(savedVoice);
  }, [navigate]);

  const handleSelectTrack = (trackId) => {
    setSelectedTrackId(trackId);
    localStorage.setItem('talentlab_interview_track', trackId);
    const trackObj = VOCATIONAL_TRACKS.find(t => t.id === trackId) || VOCATIONAL_TRACKS[0];
    if (messages.length <= 1) {
      setMessages([{ role: 'ai', content: trackObj.initialQuestion }]);
      setSelectedPersonaId(trackObj.recommendedPersona);
      localStorage.setItem('talentlab_interviewer_persona', trackObj.recommendedPersona);
    }
  };

  // Carga y sincronización del banco de voces del sistema operativo / navegador
  useEffect(() => {
    const updateVoices = () => {
      if (!window.speechSynthesis) return;
      const all = window.speechSynthesis.getVoices();
      if (!all || all.length === 0) return;

      // Filtrar preferencialmente voces en español
      const spanish = all.filter(v => v.lang.toLowerCase().startsWith('es'));
      const sorted = spanish.length > 0 ? spanish : all;
      setAvailableVoices(sorted);

      if (!selectedVoiceName && sorted.length > 0) {
        // Seleccionar por defecto voz colombiana o latinoamericana si existe
        const preferred = sorted.find(v => v.lang === 'es-CO' || v.name.includes('Colombia') || v.name.includes('Sabina')) || sorted[0];
        setSelectedVoiceName(preferred.name);
      }
    };

    updateVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceName]);

  useEffect(() => { 
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; 
  }, [messages, isThinking]);

  const currentQuestion = [...messages].reverse().find(m => m.role === 'ai')?.content || '';

  // ---- Inicialización del analizador óptico y cámara ----
  const stopStream = useCallback(() => {
    if (analyzerRef.current) {
      analyzerRef.current.stop();
      analyzerRef.current = null;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const toggleCamera = async () => {
    if (camOn) { 
      stopStream(); 
      setCamOn(false); 
      return; 
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Iniciar el analizador de postura y mirada en vivo
        const analyzer = new BodyAndVoiceAnalyzer(videoRef.current);
        analyzerRef.current = analyzer;
        analyzer.start((metrics) => {
          setLiveBio(metrics);
        });
      }
      setCamOn(true); 
      setCamError(null);
    } catch (e) {
      setCamError('No se pudo acceder a la cámara. Revisa los permisos del navegador.');
    }
  };

  // ---- Audio y Grabación ----
  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    recogRef.current?.stop?.();
    recogRef.current = null;
    setLevels(Array(BARS).fill(4));
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        analyser.getByteFrequencyData(buf);
        setLevels(Array.from({ length: BARS }, (_, i) => 4 + (buf[i % buf.length] / 255) * 80));
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (e) {
      const tick = () => {
        setLevels(Array.from({ length: BARS }, () => 6 + Math.random() * 60));
        rafRef.current = setTimeout(tick, 120);
      };
      tick();
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.lang = 'es-CO'; 
      r.continuous = true; 
      r.interimResults = true;
      r.onresult = (ev) => {
        let txt = '';
        for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
        setInputValue(txt);

        // Analizar cadencia y muletillas en tiempo real
        if (analyzerRef.current) {
          const updated = analyzerRef.current.analyzeSpeech(txt, seconds + 1);
          setLiveBio(updated);
        }
      };
      r.onerror = () => {};
      r.start();
      recogRef.current = r;
    }
    setSeconds(0);
    setIsRecording(true);
  };

  const toggleRecording = () => {
    if (isRecording) { 
      stopAudio(); 
      setIsRecording(false); 
    } else if (micOn) { 
      startRecording(); 
    }
  };

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => () => { 
    stopStream(); 
    stopAudio(); 
    window.speechSynthesis?.cancel(); 
  }, [stopStream, stopAudio]);

  // ---- Síntesis de Voz del Entrevistador ----
  const speak = (text) => {
    if (!window.speechSynthesis || !micOn) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    
    // Asignar voz configurada
    if (selectedVoiceName && availableVoices.length > 0) {
      const matched = availableVoices.find(v => v.name === selectedVoiceName);
      if (matched) u.voice = matched;
    }
    u.lang = 'es-CO';
    u.rate = voiceRate;
    u.pitch = voicePitch;

    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const testVoice = (text = 'Hola, soy tu evaluador virtual de TalentLab. La simulación está lista.') => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoiceName && availableVoices.length > 0) {
      const matched = availableVoices.find(v => v.name === selectedVoiceName);
      if (matched) u.voice = matched;
    }
    u.rate = voiceRate;
    u.pitch = voicePitch;
    window.speechSynthesis.speak(u);
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isThinking) return;
    if (isRecording) { stopAudio(); setIsRecording(false); }
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInputValue('');
    setIsThinking(true);

    try {
      const currentTrack = VOCATIONAL_TRACKS.find(t => t.id === selectedTrackId) || VOCATIONAL_TRACKS[0];
      const res = await fetch(`${API}/api/interview/simulate`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          userResponse: text, 
          student_id: session?.email,
          area: selectedTrackId,
          role_target: currentTrack.roleTarget
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const aiText = data.ai_response || 'Respuesta procesada.';

      // Fusionar el análisis óptico y vocal real con la rúbrica NLP
      const realBodyScore = Math.round(
        (data.breakdown?.bodyLanguage || 80) * 0.45 + (liveBio.summaryScore || 85) * 0.55
      );

      const bd = {
        grammar: data.breakdown?.grammar || 88,
        bodyLanguage: realBodyScore,
        alignment: data.breakdown?.alignment || 85
      };

      const finalCalculated = Math.round((bd.grammar + bd.bodyLanguage + bd.alignment) / 3);

      const updatedTips = [...(data.tips || [])];
      if (liveBio.cadenceWpm > 0) {
        updatedTips.push(`🎤 Cadencia registrada: ${liveBio.cadenceWpm} palabras por minuto (Rango óptimo: 110-150 ppm).`);
      }
      if (liveBio.fillersCount > 0) {
        updatedTips.push(`⚠ Se identificaron ${liveBio.fillersCount} muletillas en la respuesta.`);
      } else {
        updatedTips.push(`✔ Excelente fluidez verbal, sin muletillas perceptibles.`);
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
      setScore(finalCalculated);
      setBreakdown(bd);
      setTips(updatedTips);
      speak(aiText);

      localStorage.setItem('talentlab_last_score', finalCalculated);
      localStorage.setItem('talentlab_last_feedback', JSON.stringify(updatedTips));
      localStorage.setItem('talentlab_last_breakdown', JSON.stringify(bd));
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'No pude conectarme con el backend (puerto 8000). Verifica que esté en ejecución e inténtalo de nuevo.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const finish = () => { 
    stopStream(); 
    stopAudio(); 
    window.speechSynthesis?.cancel(); 
    navigate('/mi-reporte'); 
  };

  if (!session) return null;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const initials = (session.fullName || 'E').split(' ').map(n => n[0]).slice(0, 2).join('');

  const panel = { background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' };
  const ctrlBtn = (active, danger) => ({
    display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '999px',
    border: `1px solid ${danger ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.12)'}`,
    background: danger ? 'rgba(239,68,68,0.15)' : active ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
    color: danger ? '#f87171' : 'var(--text-main)', cursor: 'pointer', fontSize: '0.88rem'
  });

  return (
    <>
      <style>{`
        @keyframes pulseRing { 0%{box-shadow:0 0 0 0 rgba(6,182,212,.5)} 100%{box-shadow:0 0 0 18px rgba(6,182,212,0)} }
        @keyframes blink { 50% { opacity: .3 } }
        .badge-live-ai {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #34d399;
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 6px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
      `}</style>
      <div style={{ padding: '24px 30px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '22px', alignItems: 'start' }}>
        
        {/* ---- Columna principal ---- */}
        <div style={{ ...panel, padding: '22px' }}>
          
          {/* Selector de Área Vocacional / Carrera (Multidisciplinario) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-graduation-cap" style={{ marginRight: '6px', color: 'var(--primary)' }}></i>
                Área / Carrera:
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {VOCATIONAL_TRACKS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTrack(t.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: `1.5px solid ${selectedTrackId === t.id ? t.badgeColor : 'rgba(255,255,255,0.1)'}`,
                      background: selectedTrackId === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      color: selectedTrackId === t.id ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: selectedTrackId === t.id ? 700 : 500,
                      transition: 'all 0.2s'
                    }}
                    title={t.name}
                  >
                    <i className={`fa-solid ${t.icon}`} style={{ color: t.badgeColor }}></i>
                    {t.shortName}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Orientado a estudiantes de cualquier programa o tecnólogo
            </div>
          </div>

          {/* Selector Rápido de Entrevistador Real con Retratos */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-users-viewfinder" style={{ marginRight: '6px', color: 'var(--secondary)' }}></i>
                Entrevistador Asignado:
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {INTERVIEWER_PERSONAS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPersonaId(p.id);
                      localStorage.setItem('talentlab_interviewer_persona', p.id);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${selectedPersonaId === p.id ? p.badgeColor : 'rgba(255,255,255,0.1)'}`,
                      background: selectedPersonaId === p.id ? p.accentColor : 'rgba(255,255,255,0.03)',
                      color: selectedPersonaId === p.id ? '#fff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: selectedPersonaId === p.id ? 700 : 500,
                      transition: 'all 0.2s'
                    }}
                    title={`${p.name} - ${p.role} (${p.company})`}
                  >
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                    {p.name} <span style={{ opacity: 0.7, fontSize: '0.74rem' }}>({p.company})</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowVoiceModal(true)}
            >
              <i className="fa-solid fa-sliders"></i> Banco de Voces IA
            </button>
          </div>

          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '18px', lineHeight: 1.35 }}>
            <span style={{ color: 'var(--secondary)' }}>{Q_TITLE}</span>{currentQuestion}
          </h1>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            
            {/* 1. Vista del Estudiante (Webcam o Foto de Perfil + HUD Óptico) */}
            <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '14px', overflow: 'hidden', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: camOn ? 'block' : 'none' }} 
              />
              
              {!camOn && (
                <div style={{ position: 'absolute', inset: 0 }}>
                  <img 
                    src="/avatars/student.jpg" 
                    alt="Estudiante" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 14px 10px',
                    background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, transparent 100%)'
                  }}>
                    <span style={{ fontSize: '0.74rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-video-slash"></i> Cámara en reposo · Pulsa "Cámara y Biometría" para encender tu webcam
                    </span>
                  </div>
                </div>
              )}

              {/* HUD Biométrico en Vivo (Cuando la cámara está encendida) */}
              {camOn && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 10 }}>
                  <span className="badge-live-ai">
                    <i className="fa-solid fa-circle" style={{ color: '#10b981', fontSize: '0.5rem', animation: 'blink 1s infinite' }}></i>
                    Análisis Óptico en Vivo
                  </span>
                  <div style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '3px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div><strong>Postura:</strong> {liveBio.posture}% {liveBio.posture >= 80 ? '✔ Erguida' : '⚠ Reajustar'}</div>
                    <div><strong>Mirada:</strong> {liveBio.eyeContact}% {liveBio.eyeContact >= 80 ? '✔ Contacto Directo' : '⚠ Mira a la cámara'}</div>
                    <div><strong>Empatía:</strong> {liveBio.smile}% {liveBio.smile >= 80 ? '✔ Amable' : '· Relajada'}</div>
                  </div>
                </div>
              )}

              <span style={{ position: 'absolute', left: '10px', bottom: '10px', padding: '4px 10px', background: 'rgba(0,0,0,0.65)', borderRadius: '8px', fontSize: '0.78rem', backdropFilter: 'blur(4px)', zIndex: 10 }}>
                Tú ({session.fullName || 'Estudiante'})
              </span>
            </div>

            {/* 2. Entrevistador Real (Persona Fotográfica Humana con Animación Órganica) */}
            <div style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '14px', overflow: 'hidden', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
              <InterviewerAvatar 
                personaId={selectedPersonaId}
                isSpeaking={speaking}
                isListening={isRecording}
                isThinking={isThinking}
              />
            </div>

          </div>

          {/* Estado de grabación + visualizador de onda vocal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 4px 6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div>
              {liveBio.cadenceWpm > 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                  <i className="fa-solid fa-gauge"></i> Cadencia: {liveBio.cadenceWpm} ppm
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>{isRecording ? `Grabando voz… (${mm}:${ss})` : 'Micrófono en espera'}</span>
              {isRecording && <span style={{ padding: '2px 9px', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 700, fontSize: '0.75rem', animation: 'blink 1.2s infinite' }}>● REC</span>}
            </div>
          </div>

          <div style={{ height: '70px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {levels.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h * 0.8}px`, borderRadius: '3px', transition: 'height .08s',
                background: `linear-gradient(180deg, hsl(${150 + (i / BARS) * 50},80%,55%), hsl(${190 + (i / BARS) * 30},80%,45%))`, opacity: isRecording ? 1 : 0.35 }} />
            ))}
          </div>

          {/* Transcripción */}
          <div ref={chatRef} style={{ maxHeight: '130px', overflowY: 'auto', margin: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '8px 12px', borderRadius: '12px', fontSize: '0.86rem',
                background: m.role === 'user' ? 'rgba(6,182,212,0.15)' : 'rgba(139,92,246,0.15)'
              }}>{m.content}</div>
            ))}
            {isThinking && (
              <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <i className="fa-solid fa-spinner fa-spin"></i> El evaluador de IA está procesando tu respuesta…
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <input className="form-control" style={{ flexGrow: 1 }} value={inputValue}
              placeholder="Escribe tu respuesta o presiona Grabar para dictarla con tu micrófono…"
              onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button className="btn btn-primary" onClick={handleSend} disabled={isThinking}>
              Enviar <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          {/* Controles de la entrevista */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            <button style={ctrlBtn(isRecording)} onClick={toggleRecording} disabled={!micOn} title="Grabar respuesta por voz">
              <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i> {isRecording ? 'Detener' : 'Grabar Voz'}
            </button>
            <button style={ctrlBtn(!micOn)} onClick={() => { if (micOn && isRecording) { stopAudio(); setIsRecording(false); } if (micOn) window.speechSynthesis?.cancel(); setMicOn(m => !m); }}>
              <i className={`fa-solid ${micOn ? 'fa-microphone-slash' : 'fa-microphone'}`}></i> {micOn ? 'Silenciar' : 'Activar audio'}
            </button>
            <button style={ctrlBtn(camOn)} onClick={toggleCamera}>
              <i className={`fa-solid ${camOn ? 'fa-video-slash' : 'fa-video'}`}></i> {camOn ? 'Apagar Cámara' : 'Cámara y Biometría'}
            </button>
            <button style={ctrlBtn(false, true)} onClick={finish}>
              <i className="fa-solid fa-xmark"></i> Finalizar Entrevista
            </button>
            <button style={{ ...ctrlBtn(false), marginLeft: 'auto' }} onClick={() => setShowGuide(true)}>
              <i className="fa-solid fa-circle-question"></i> Guía
            </button>
          </div>
        </div>

        {/* ---- Panel Lateral: Retroalimentación de IA ---- */}
        <aside style={{ ...panel, padding: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, background: 'linear-gradient(90deg,var(--secondary),var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            Retroalimentación de IA
          </h2>
          <div style={{ height: '5px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', margin: '10px 0 18px' }}>
            <div style={{ width: `${score || 0}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg,var(--secondary),var(--primary))', transition: 'width .6s' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '3.2rem', fontWeight: 800, color: 'var(--secondary)', lineHeight: 1 }}>
              {score ?? '--'}<span style={{ fontSize: '1.3rem', color: 'var(--text-muted)', fontWeight: 400 }}> / 100</span>
            </div>
            <div style={{ fontWeight: 600, marginTop: '4px' }}>Puntaje General</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {score === null ? 'Responde la pregunta para iniciar la evaluación biométrica y técnica.' : score >= 85 ? '¡Excelente desempeño técnico y actitudinal!' : score >= 75 ? '¡Buen progreso! Sigue afianzando tus respuestas.' : 'Sigue practicando, vas por buen camino.'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {AXES.map(ax => {
              const v = breakdown?.[ax.key];
              return (
                <div key={ax.key} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      <i className={`fa-solid ${ax.icon}`} style={{ color: 'var(--secondary)', marginRight: '8px' }}></i>{ax.label}
                    </span>
                    <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{v ?? '--'}/100</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', marginBottom: '8px' }}>
                    <div style={{ width: `${v || 0}%`, height: '100%', borderRadius: '3px', background: 'var(--secondary)', transition: 'width .6s' }} />
                  </div>
                  <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>{v ? ax.hint(v) : 'Pendiente de evaluación.'}</p>
                </div>
              );
            })}
          </div>

          {tips.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                Observaciones del Motor de IA:
              </span>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {tips.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          )}

          <div style={{ marginTop: '16px', padding: '10px', background: 'rgba(6,182,212,0.06)', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.2)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <i className="fa-solid fa-shield-halved" style={{ color: 'var(--secondary)', marginRight: '5px' }}></i>
            <strong>Privacidad y SENA:</strong> El procesamiento de postura y voz se ejecuta localmente en tu navegador. Ninguna imagen o video es transmitido a servidores externos.
          </div>
        </aside>
      </div>

      {/* Modal: Banco de Voces y Configuración del Evaluador 3D */}
      {showVoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '560px', maxWidth: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                <i className="fa-solid fa-sliders" style={{ color: 'var(--primary)', marginRight: '8px' }}></i>
                Configuración de Evaluador 3D y Banco de Voces
              </h2>
              <button onClick={() => setShowVoiceModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* 1. Selección de Persona */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Selecciona la Persona del Entrevistador 3D:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {INTERVIEWER_PERSONAS.map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setSelectedPersonaId(p.id);
                      localStorage.setItem('talentlab_interviewer_persona', p.id);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: `2px solid ${selectedPersonaId === p.id ? p.colors.accent : 'rgba(255,255,255,0.08)'}`,
                      background: selectedPersonaId === p.id ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: p.colors.accent }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{p.role}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', opacity: 0.85 }}>{p.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Banco de Voces */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Banco de Voces del Sistema (Síntesis Neural / Local):
              </label>
              <select 
                className="form-control" 
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value);
                  localStorage.setItem('talentlab_voice_name', e.target.value);
                }}
              >
                {availableVoices.map((v, idx) => (
                  <option key={idx} value={v.name}>
                    {v.name} ({v.lang}) {v.default ? '★ Recomendada' : ''}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                {availableVoices.length} voces disponibles detectadas en tu navegador / sistema operativo.
              </span>
            </div>

            {/* 3. Parámetros de Modulación de Voz */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Velocidad de Habla: {voiceRate}x
                </label>
                <input 
                  type="range" 
                  min="0.7" 
                  max="1.4" 
                  step="0.05"
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Tono / Frecuencia: {voicePitch}x
                </label>
                <input 
                  type="range" 
                  min="0.7" 
                  max="1.3" 
                  step="0.05"
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Botón de Prueba */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => testVoice(`Hola, soy ${selectedPersona.name}. Te doy la bienvenida a tu simulación técnica en TalentLab.`)}
              >
                <i className="fa-solid fa-volume-high"></i> Probar Voz
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowVoiceModal(false)}
              >
                Guardar y Aplicar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Guía Rápida */}
      {showGuide && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '520px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '15px', color: 'var(--primary)' }}><i className="fa-solid fa-rocket"></i> Guía Rápida del Simulador</h2>
            <ul style={{ color: 'var(--text-muted)', marginBottom: '20px', paddingLeft: '20px', lineHeight: 1.7 }}>
              <li><strong>Avatar 3D:</strong> Reacciona en tiempo real sincronizando la mandíbula con la voz (Lip-Sync) y asiente cuando hablas.</li>
              <li><strong>Cámara y Biometría:</strong> Activa tu webcam para recibir retroalimentación instantánea de postura, contacto visual y sonrisa.</li>
              <li><strong>Banco de Voces:</strong> Configura entre evaluadores masculino/femenino y ajusta la cadencia según la empresa meta.</li>
              <li><strong>Método STAR:</strong> Ordena tus respuestas en Situación, Tarea, Acción y Resultado cuantificable.</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowGuide(false)}>Entendido</button>
          </div>
        </div>
      )}
    </>
  );
}
