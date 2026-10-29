import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import InterviewerAvatar from '../components/InterviewerAvatar';
import { BodyAndVoiceAnalyzer } from '../lib/bodyAnalysis';
import { INTERVIEW_MODES, TECHNICAL_PROGRAMS, INTERVIEWER_PERSONAS, VOCATIONAL_TRACKS } from '../lib/interviewerConstants';

const API = 'http://localhost:8000';
const BARS = 56;
const MAX_ANSWER_SECONDS = 90; // Estándar de la industria HR Tech (HireVue/Modern Hire: 90s máx por respuesta)
const TOTAL_INTERVIEW_SECONDS = 360; // 6 minutos en total para los dos filtros (3 min RH + 3 min Técnico)

const AXES = [
  { key: 'grammar', label: 'Gramática y Sintaxis', icon: 'fa-spell-check',
    hint: (v) => v >= 85 ? 'Excelente estructuración gramatical y riqueza de vocabulario.' : v >= 70 ? 'Buena redacción. Cuida la puntuación y el hilo argumental.' : v >= 55 ? 'Mejora la concordancia y la estructura sintáctica.' : '⚠ Crítico: Frases inconexas o caracteres desordenados.' },
  { key: 'bodyLanguage', label: 'Lenguaje Corporal y Fluidez (IA Óptica)', icon: 'fa-face-smile',
    hint: (v) => v >= 85 ? 'Excelente postura erguida, mirada firme a la cámara y cadencia fluida.' : v >= 70 ? 'Buen porte. Intenta centrarte más en la cámara y regular la cadencia.' : v >= 55 ? 'Ajusta la altura de la cámara y mantén contacto visual constante.' : '⚠ Postura encorvada o pérdida prolongada de contacto visual.' },
  { key: 'alignment', label: 'Alineación de Respuestas (Método STAR)', icon: 'fa-chart-line',
    hint: (v) => v >= 85 ? 'Respuesta estructurada (Situación, Tarea, Acción, Resultado medible).' : v >= 70 ? 'Buen relato. Intenta cuantificar el resultado con métricas o evidencias.' : v >= 55 ? 'Respuesta general. Describe tu acción concreta e impacto individual.' : '⚠ Crítico: Respuesta evasiva o desalineada de la pregunta.' }
];

const Q_TITLE = 'P: ';

export default function Simulador() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => {
    const s = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (s && s.role === 'student') return s;
    return {
      fullName: 'Diego Alfonso Tapia Salazar',
      email: 'diego@talentlab.co',
      program: 'Tecnología en Análisis y Desarrollo de Software (ADSO)',
      role: 'student'
    };
  });
  
  // Modalidades y Filtros de Entrevista
  const [interviewMode, setInterviewMode] = useState('hr'); // 'hr' (RH) | 'technical' (Técnica)
  const [technicalProgram, setTechnicalProgram] = useState('software'); // 'software', 'gestion', 'redes', 'diseno'
  const [selectedTrackId, setSelectedTrackId] = useState('software');
  
  const [messages, setMessages] = useState([
    { role: 'ai', content: INTERVIEW_MODES[0].initialQuestion }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [score, setScore] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [tips, setTips] = useState([]);
  const [showGuide, setShowGuide] = useState(false);

  // Proceso Secuencial de Selección (2 Filtros + Conclusiones)
  const [interviewStage, setInterviewStage] = useState('stage1_hr'); // 'stage1_hr' | 'stage2_tech' | 'concluded'
  const [hrTurns, setHrTurns] = useState(0);
  const [techTurns, setTechTurns] = useState(0);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState(TOTAL_INTERVIEW_SECONDS);
  const [hrScoresList, setHrScoresList] = useState([]);
  const [techScoresList, setTechScoresList] = useState([]);
  const [hrMessagesList, setHrMessagesList] = useState([]);
  const [techMessagesList, setTechMessagesList] = useState([]);
  const [conclusionReport, setConclusionReport] = useState(null);
  const [showConclusionModal, setShowConclusionModal] = useState(false);
  const [isConcluding, setIsConcluding] = useState(false);

  // Persona y Voces del Evaluador
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
  const [timeWarning, setTimeWarning] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [countdown, setCountdown] = useState(null); // null | 3 | 2 | 1 | '¡En Vivo!'
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
  const speechTextRef = useRef('');
  const silenceTimerRef = useRef(null);
  const isRecordingRef = useRef(false);
  const handleSendRef = useRef(null);
  const handleConcludeRef = useRef(null);

  const selectedPersona = INTERVIEWER_PERSONAS.find(p => p.id === selectedPersonaId) || INTERVIEWER_PERSONAS[0];

  useEffect(() => {
    let s = JSON.parse(localStorage.getItem('user_session') || 'null');
    if (!s || s.role !== 'student') {
      s = {
        fullName: 'Diego Alfonso Tapia Salazar',
        email: 'diego@talentlab.co',
        program: 'Tecnología en Análisis y Desarrollo de Software (ADSO)',
        role: 'student'
      };
      localStorage.setItem('user_session', JSON.stringify(s));
    }
    setSession(s);

    // Autodetectar especialidad técnica según programa formativo del estudiante
    const sessionProg = (s.program || s.title || '').toLowerCase();
    let detectedProg = 'software';
    if (sessionProg.includes('adso') || sessionProg.includes('software') || sessionProg.includes('sistemas') || sessionProg.includes('tecnología') || sessionProg.includes('tecnologia') || sessionProg.includes('programación') || sessionProg.includes('programacion')) {
      detectedProg = 'software';
    } else if (sessionProg.includes('red') || sessionProg.includes('telecom') || sessionProg.includes('infraestructura')) {
      detectedProg = 'redes';
    } else if (sessionProg.includes('gestión') || sessionProg.includes('gestion') || sessionProg.includes('contabilidad') || sessionProg.includes('finanzas') || sessionProg.includes('comercio') || sessionProg.includes('administración') || sessionProg.includes('administracion')) {
      detectedProg = 'gestion';
    } else if (sessionProg.includes('diseño') || sessionProg.includes('diseno') || sessionProg.includes('multimedia')) {
      detectedProg = 'diseno';
    }

    // Para aprendices/estudiantes en formación, su especialidad se enlaza directamente a su ficha/carrera (ADSO -> software)
    const finalProg = (s.role === 'student' && s.program) ? detectedProg : (localStorage.getItem('talentlab_technical_program') || detectedProg);
    setTechnicalProgram(finalProg);
    setSelectedTrackId(finalProg);
    localStorage.setItem('talentlab_technical_program', finalProg);

    const savedMode = localStorage.getItem('talentlab_interview_mode') || 'hr';
    setInterviewMode(savedMode);

    if (savedMode === 'hr') {
      setSelectedPersonaId('carolina');
      const hrMode = INTERVIEW_MODES.find(m => m.id === 'hr') || INTERVIEW_MODES[0];
      setMessages([{ role: 'ai', content: hrMode.initialQuestion }]);
    } else {
      setSelectedPersonaId('carlos');
      const techProg = TECHNICAL_PROGRAMS.find(p => p.id === finalProg) || TECHNICAL_PROGRAMS[0];
      setMessages([{ role: 'ai', content: techProg.initialQuestion }]);
    }

    const savedVoice = localStorage.getItem('talentlab_voice_name');
    if (savedVoice) setSelectedVoiceName(savedVoice);
  }, [navigate]);

  const handleSelectMode = (modeId) => {
    setInterviewMode(modeId);
    localStorage.setItem('talentlab_interview_mode', modeId);
    if (modeId === 'hr') {
      setSelectedPersonaId('carolina');
      localStorage.setItem('talentlab_interviewer_persona', 'carolina');
      const hrMode = INTERVIEW_MODES.find(m => m.id === 'hr') || INTERVIEW_MODES[0];
      if (messages.length <= 1) {
        setMessages([{ role: 'ai', content: hrMode.initialQuestion }]);
      }
    } else {
      setSelectedPersonaId('carlos');
      localStorage.setItem('talentlab_interviewer_persona', 'carlos');
      const techProg = TECHNICAL_PROGRAMS.find(p => p.id === technicalProgram) || TECHNICAL_PROGRAMS[0];
      if (messages.length <= 1) {
        setMessages([{ role: 'ai', content: techProg.initialQuestion }]);
      }
    }
  };

  const handleSelectProgram = (progId) => {
    setTechnicalProgram(progId);
    setSelectedTrackId(progId);
    localStorage.setItem('talentlab_technical_program', progId);
    const techProg = TECHNICAL_PROGRAMS.find(p => p.id === progId) || TECHNICAL_PROGRAMS[0];
    if (messages.length <= 1) {
      setMessages([{ role: 'ai', content: techProg.initialQuestion }]);
    }
  };

  const handleSelectTrack = handleSelectProgram;

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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    recogRef.current?.stop?.();
    recogRef.current = null;
    setLevels(Array(BARS).fill(4));
    isRecordingRef.current = false;
  }, []);

  const startRecording = async () => {
    speechTextRef.current = '';
    setInputValue('');
    isRecordingRef.current = true;
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
        const clean = txt.trim();
        speechTextRef.current = clean;
        setInputValue(clean);

        // Analizar cadencia y muletillas en tiempo real
        if (analyzerRef.current) {
          const updated = analyzerRef.current.analyzeSpeech(clean, seconds + 1);
          setLiveBio(updated);
        }

        // Auto-envío inteligente tras 2.4 segundos de silencio una vez iniciada la respuesta
        if (clean.split(/\s+/).length >= 3) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (isRecordingRef.current) {
              const toSend = (speechTextRef.current || '').trim();
              if (toSend.length > 0 && handleSendRef.current) {
                stopAudio();
                setIsRecording(false);
                handleSendRef.current(toSend);
              }
            }
          }, 2400);
        }
      };
      r.onend = () => {
        if (isRecordingRef.current) {
          const captured = (speechTextRef.current || '').trim();
          if (captured.split(/\s+/).length >= 3 && handleSendRef.current) {
            stopAudio();
            setIsRecording(false);
            handleSendRef.current(captured);
          }
        }
      };
      r.onerror = () => {};
      r.start();
      recogRef.current = r;
    }
    setSeconds(0);
    setTimeWarning(null);
    setIsRecording(true);
  };

  const toggleRecording = () => {
    if (isRecording) { 
      stopAudio(); 
      setIsRecording(false);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      const recorded = (speechTextRef.current || inputValue || '').trim();
      if (recorded.length > 0 && handleSendRef.current) {
        handleSendRef.current(recorded);
      }
    } else if (micOn) { 
      speechTextRef.current = '';
      setInputValue('');
      setTimeWarning(null);
      startRecording(); 
    }
  };

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => {
      setSeconds(s => {
        const next = s + 1;
        if (next >= MAX_ANSWER_SECONDS) {
          stopAudio();
          setIsRecording(false);
          const recorded = (speechTextRef.current || inputValue || '').trim();
          if (recorded.length > 0 && handleSendRef.current) {
            setTimeWarning('⏱ ¡Tiempo límite de 90s alcanzado! Enviando respuesta automáticamente...');
            handleSendRef.current(recorded);
          } else {
            setTimeWarning('⏱ ¡Tiempo límite de 90s alcanzado! No se detectó audio en tu respuesta.');
          }
          return MAX_ANSWER_SECONDS;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRecording, stopAudio]);

  // Temporizador Global de la Entrevista (6 minutos máx)
  useEffect(() => {
    if (!hasStarted || interviewStage === 'concluded' || showConclusionModal) return;
    const t = setInterval(() => {
      setTotalSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(t);
          if (handleConcludeRef.current) {
            handleConcludeRef.current();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [hasStarted, interviewStage, showConclusionModal]);

  useEffect(() => () => { 
    stopStream(); 
    stopAudio(); 
    window.speechSynthesis?.cancel(); 
  }, [stopStream, stopAudio]);

  // ---- Detección y Afinación de Voz Diferenciada por Evaluador (Carolina vs. Carlos) ----
  const getPersonaVoiceConfig = (personaId) => {
    const isCarolina = (personaId || selectedPersonaId) === 'carolina';
    const femaleKeywords = ['sabina', 'helena', 'laura', 'paulina', 'monica', 'mónica', 'zira', 'lucia', 'lucía', 'hilda', 'sofia', 'sofía', 'elena', 'maria', 'maría', 'female'];
    const maleKeywords = ['pablo', 'raul', 'raúl', 'jorge', 'david', 'carlos', 'alonso', 'diego', 'gonzalo', 'mateo', 'tomas', 'tomás', 'manuel', 'javier', 'male'];

    const spanishVoices = availableVoices.filter(v => (v.lang || '').toLowerCase().startsWith('es'));
    const candidatePool = spanishVoices.length > 0 ? spanishVoices : availableVoices;

    let matchedVoice = null;
    if (isCarolina) {
      matchedVoice = candidatePool.find(v => femaleKeywords.some(k => (v.name || '').toLowerCase().includes(k)));
      if (!matchedVoice && candidatePool.length > 0) matchedVoice = candidatePool[0];
      return {
        voice: matchedVoice,
        pitch: 1.12,  // Timbre cálido, femenino y cercano para la Dra. Carolina Ortiz
        rate: 0.98    // Cadencia humana, empática y reflexiva
      };
    } else {
      matchedVoice = candidatePool.find(v => maleKeywords.some(k => (v.name || '').toLowerCase().includes(k)));
      if (!matchedVoice && candidatePool.length > 1) {
        matchedVoice = candidatePool.find(v => v !== candidatePool[0]) || candidatePool[1];
      } else if (!matchedVoice && candidatePool.length > 0) {
        matchedVoice = candidatePool[0];
      }
      return {
        voice: matchedVoice,
        pitch: 0.86,  // Timbre firme, masculino y técnico para el Ing. Carlos Mendoza
        rate: 1.02    // Cadencia ágil y rigurosa de ingeniería
      };
    }
  };

  // ---- Síntesis de Voz del Entrevistador ----
  const speak = (text, targetPersona = selectedPersonaId) => {
    if (!window.speechSynthesis || !micOn) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    
    const config = getPersonaVoiceConfig(targetPersona);
    if (config.voice) {
      u.voice = config.voice;
    } else if (selectedVoiceName && availableVoices.length > 0) {
      const matched = availableVoices.find(v => v.name === selectedVoiceName);
      if (matched) u.voice = matched;
    }
    u.lang = 'es-CO';
    u.rate = config.rate;
    u.pitch = config.pitch;

    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const testVoice = (text = 'Hola, soy tu evaluador virtual de TalentLab. La simulación está lista.', targetPersona = selectedPersonaId) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const config = getPersonaVoiceConfig(targetPersona);
    if (config.voice) u.voice = config.voice;
    u.rate = config.rate;
    u.pitch = config.pitch;
    window.speechSynthesis.speak(u);
  };

  const playBeep = (freq = 440, duration = 0.12) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const handleStartInterviewWithCountdown = () => {
    if (countdown !== null) return;
    
    // Si la cámara no está activa, intentar encenderla para la biometría
    if (!camOn) {
      toggleCamera();
    }

    setCountdown(3);
    playBeep(440, 0.15);

    setTimeout(() => {
      setCountdown(2);
      playBeep(523.25, 0.15);
      setTimeout(() => {
        setCountdown(1);
        playBeep(659.25, 0.15);
        setTimeout(() => {
          setCountdown('¡En Vivo!');
          playBeep(880, 0.35);
          setTimeout(() => {
            setCountdown(null);
            setHasStarted(true);
            setInterviewStage('stage1_hr');
            setInterviewMode('hr');
            setSelectedPersonaId('carolina');
            setHrTurns(0);
            setTechTurns(0);
            setTotalSecondsLeft(TOTAL_INTERVIEW_SECONDS);
            setHrScoresList([]);
            setTechScoresList([]);
            setHrMessagesList([]);
            setTechMessagesList([]);
            setShowConclusionModal(false);
            setConclusionReport(null);

            // La Dra. Carolina Ortiz lee en voz alta su pregunta inicial de RH con timbre cálido
            const hrInitQ = INTERVIEW_MODES.find(m => m.id === 'hr')?.initialQuestion || messages[0]?.content;
            if (hrInitQ) {
              setMessages([{ role: 'ai', content: hrInitQ }]);
              speak(hrInitQ, 'carolina');
            }
          }, 700);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleConcludeProcess = async () => {
    if (isConcluding) return;
    setIsConcluding(true);
    stopAudio();
    stopStream();
    window.speechSynthesis?.cancel();

    try {
      const avgHr = hrScoresList.length > 0 
        ? Math.round(hrScoresList.reduce((a, b) => a + b, 0) / hrScoresList.length) 
        : (score || 82);
      const avgTech = techScoresList.length > 0 
        ? Math.round(techScoresList.reduce((a, b) => a + b, 0) / techScoresList.length) 
        : (score || 82);

      const activeProgramObj = TECHNICAL_PROGRAMS.find(p => p.id === technicalProgram) || TECHNICAL_PROGRAMS[0];
      const targetRole = `Proceso Integral (2 Filtros) - ${activeProgramObj.name}`;

      const res = await fetch(`${API}/api/interview/conclude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: session?.email,
          technical_program: technicalProgram,
          role_target: targetRole,
          hr_messages: hrMessagesList,
          tech_messages: techMessagesList,
          hr_score: avgHr,
          tech_score: avgTech,
          bio_metrics: { ...liveBio, camOn },
          is_hostile: (score || 100) <= 25
        })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setConclusionReport(data);
      setInterviewStage('concluded');
      setShowConclusionModal(true);

      // Persistir reporte consolidado
      localStorage.setItem('talentlab_comprehensive_report', JSON.stringify(data));
      localStorage.setItem('talentlab_last_score', data.overall_score);
      const feedbackItems = [
        data.conclusions?.executive_summary,
        ...(data.conclusions?.key_strengths?.map(s => `✔ Fortaleza: ${s}`) || []),
        ...(data.conclusions?.priority_improvements?.map(m => `💡 Mejora: ${m}`) || [])
      ].filter(Boolean);
      localStorage.setItem('talentlab_last_feedback', JSON.stringify(feedbackItems));
      localStorage.setItem('talentlab_last_breakdown', JSON.stringify(data.breakdown));

      speak(`Felicitaciones. Has culminado ambos filtros del proceso de selección. Tu calificación consolidada es de ${data.overall_score} sobre cien.`, 'carlos');
    } catch (e) {
      console.error('Error concluyendo entrevista:', e);
      // Respaldo local
      const fallbackReport = {
        overall_score: score || 82,
        verdict: (score || 82) >= 85 ? 'CONTRATABLE / RECOMENDADO CON HONORES' : 'APTO / RECOMENDADO CON PLAN DE MEJORA',
        verdict_badge: (score || 82) >= 85 ? 'success' : 'warning',
        breakdown: breakdown || { hr_score: 82, tech_score: 82, body_language: 80, grammar: 85 },
        bio_metrics: { ...liveBio, camOn },
        conclusions: {
          executive_summary: 'El candidato culminó el proceso de selección demostrando un sólido balance entre competencias actitudinales y criterio técnico.',
          hr_feedback: 'Dra. Carolina Ortiz: Buena articulación bajo metodología STAR y madurez para resolver desafíos.',
          tech_feedback: 'Ing. Carlos Mendoza: Criterio metodológico acorde al perfil y capacidad de análisis.',
          key_strengths: ['Estructuración STAR', 'Disposición al aprendizaje', 'Lenguaje corporal adecuado'],
          priority_improvements: ['Cuantificar métricas de impacto en proyectos', 'Profundizar en patrones de escalabilidad']
        }
      };
      setConclusionReport(fallbackReport);
      setInterviewStage('concluded');
      setShowConclusionModal(true);
    } finally {
      setIsConcluding(false);
    }
  };
  handleConcludeRef.current = handleConcludeProcess;

  const handleSend = async (overrideText = null) => {
    const rawText = typeof overrideText === 'string' ? overrideText : inputValue;
    const text = (rawText || '').trim();
    if (!text || isThinking) return;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (isRecording) { stopAudio(); setIsRecording(false); }
    speechTextRef.current = '';
    setInputValue('');
    setTimeWarning(null);
    setIsThinking(true);

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);

    const activeProgramObj = TECHNICAL_PROGRAMS.find(p => p.id === technicalProgram) || TECHNICAL_PROGRAMS[0];
    const isHrStage = (interviewStage === 'stage1_hr');

    if (isHrStage) {
      setHrMessagesList(prev => [...prev, userMsg]);
    } else {
      setTechMessagesList(prev => [...prev, userMsg]);
    }

    try {
      const activeRoleTarget = isHrStage
        ? 'Recursos Humanos y Habilidades Blandas'
        : activeProgramObj.roleTarget;

      const res = await fetch(`${API}/api/interview/simulate`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text, 
          userResponse: text, 
          student_id: session?.email,
          interview_mode: isHrStage ? 'hr' : 'technical',
          technical_program: technicalProgram,
          area: isHrStage ? 'hr' : technicalProgram,
          role_target: activeRoleTarget,
          history: messages.slice(-6)
        })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const aiText = data.ai_response || 'Respuesta procesada.';

      // Fusionar el análisis óptico y vocal real con la rúbrica NLP
      const realBodyScore = camOn
        ? Math.round((data.breakdown?.bodyLanguage || 80) * 0.45 + (liveBio.summaryScore || 85) * 0.55)
        : 50;

      const bd = {
        grammar: data.breakdown?.grammar || 88,
        bodyLanguage: realBodyScore,
        alignment: data.breakdown?.alignment || 85
      };

      const finalCalculated = Math.round((bd.grammar + bd.bodyLanguage + bd.alignment) / 3);

      const updatedTips = [...(data.tips || [])];
      if (!camOn) {
        updatedTips.push('⚠ Cámara desactivada: Se aplicó penalización en Lenguaje Corporal (50/100). Activa la cámara para registrar contacto visual y postura.');
      } else {
        updatedTips.push(`✔ Biometría óptica activa: Contacto visual (${liveBio.eyeContact}%) y Postura (${liveBio.posture}%).`);
      }
      if (liveBio.cadenceWpm > 0) {
        updatedTips.push(`🎤 Cadencia registrada: ${liveBio.cadenceWpm} palabras por minuto (Rango óptimo: 110-150 ppm).`);
      }
      if (liveBio.fillersCount > 0) {
        updatedTips.push(`⚠ Se identificaron ${liveBio.fillersCount} muletillas en la respuesta.`);
      } else {
        updatedTips.push(`✔ Excelente fluidez verbal, sin muletillas perceptibles.`);
      }

      setScore(finalCalculated);
      setBreakdown(bd);
      setTips(updatedTips);

      localStorage.setItem('talentlab_last_score', finalCalculated);
      localStorage.setItem('talentlab_last_feedback', JSON.stringify(updatedTips));
      localStorage.setItem('talentlab_last_breakdown', JSON.stringify(bd));

      // --- AVANCE SECUENCIAL POR FILTROS CON PROTECCIÓN DE CALIDAD ---
      if (data.is_hostile) {
        // Conducta hostil / agresión: Reprobación ética inmediata sin avanzar turnos ni traspasar a técnica
        setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
        speak(aiText, isHrStage ? 'carolina' : 'carlos');
      } else if (data.is_clarification) {
        // Pregunta de orientación del candidato (ej. "¿por qué?"): La evaluadora orienta amablemente sin consumir turno de evaluación
        setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
        speak(aiText, isHrStage ? 'carolina' : 'carlos');
      } else if (isHrStage) {
        setHrScoresList(prev => [...prev, finalCalculated]);
        const nextHr = hrTurns + 1;
        setHrTurns(nextHr);

        if (nextHr >= 2) {
          // Completado Filtro 1 (RH) -> Dra. Carolina realiza traspaso contextual según desempeño real
          const allHr = [...hrScoresList, finalCalculated];
          const avgHr = Math.round(allHr.reduce((a, b) => a + b, 0) / allHr.length);
          
          let handoverText = '';
          if (avgHr >= 70) {
            handoverText = (
              "¡Excelente desempeño en tus respuestas de Habilidades Blandas! Has demostrado madurez comunicativa, empatía y criterio para trabajar en equipo. Con esto completamos el Filtro 1 de Recursos Humanos. " +
              `A continuación, te transfiero a la sala de evaluación con el Ing. Carlos Mendoza, Evaluador Técnico Senior, quien liderará tu prueba técnica en ${activeProgramObj.name}. ¡Muchos éxitos!`
            );
          } else {
            handoverText = (
              "Con esto completamos las preguntas del Filtro 1 de Recursos Humanos y Habilidades Blandas. Toma en cuenta las observaciones recibidas para continuar fortaleciendo tus competencias de comunicación asertiva. " +
              `A continuación, te transfiero a la sala de evaluación con el Ing. Carlos Mendoza, Evaluador Técnico Senior, para tu prueba técnica en ${activeProgramObj.name}. ¡Adelante!`
            );
          }
          setMessages(prev => [...prev, { role: 'ai', content: handoverText }]);
          speak(handoverText, 'carolina');

          // Transición al Filtro 2
          setTimeout(() => {
            setInterviewStage('stage2_tech');
            setInterviewMode('technical');
            setSelectedPersonaId('carlos');
            const techQ1 = activeProgramObj.initialQuestion;
            setMessages(prev => [...prev, { role: 'ai', content: techQ1 }]);
            speak(techQ1, 'carlos');
          }, 3800);
        } else {
          // Pregunta 2 de RH
          setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
          speak(aiText, 'carolina');
        }
      } else {
        // En Filtro 2 (Técnico)
        setTechScoresList(prev => [...prev, finalCalculated]);
        const nextTech = techTurns + 1;
        setTechTurns(nextTech);

        if (nextTech >= 2) {
          // Completado Filtro 2 (Técnico) -> Concluir entrevista y generar dictamen integral
          const closingText = (
            "Muchas gracias por tu exposición técnica. Hemos completado exitosamente ambos filtros del proceso de selección. " +
            "El Comité Evaluador de TalentLab está generando tu calificación integral y las conclusiones finales..."
          );
          setMessages(prev => [...prev, { role: 'ai', content: closingText }]);
          speak(closingText, 'carlos');

          setTimeout(() => {
            handleConcludeProcess();
          }, 2600);
        } else {
          // Pregunta 2 Técnica
          setMessages(prev => [...prev, { role: 'ai', content: aiText }]);
          speak(aiText, 'carlos');
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', content: 'No pude conectarme con el backend (puerto 8000). Verifica que esté en ejecución e inténtalo de nuevo.' }]);
    } finally {
      setIsThinking(false);
    }
  };
  handleSendRef.current = handleSend;

  const finish = () => { 
    handleConcludeProcess();
  };

  const handleRestart = () => {
    stopStream();
    stopAudio();
    window.speechSynthesis?.cancel();
    setInterviewStage('stage1_hr');
    setInterviewMode('hr');
    setSelectedPersonaId('carolina');
    setHrTurns(0);
    setTechTurns(0);
    setTotalSecondsLeft(TOTAL_INTERVIEW_SECONDS);
    setHrScoresList([]);
    setTechScoresList([]);
    setHrMessagesList([]);
    setTechMessagesList([]);
    setConclusionReport(null);
    setShowConclusionModal(false);
    setIsConcluding(false);

    const initialQ = INTERVIEW_MODES.find(m => m.id === 'hr')?.initialQuestion || INTERVIEW_MODES[0].initialQuestion;
    setMessages([{ role: 'ai', content: initialQ }]);
    setInputValue('');
    setScore(null);
    setBreakdown(null);
    setTips([]);
    setSeconds(0);
    setTimeWarning(null);
    setHasStarted(false);
    setCountdown(null);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const totalMm = String(Math.floor(totalSecondsLeft / 60)).padStart(2, '0');
  const totalSs = String(totalSecondsLeft % 60).padStart(2, '0');
  const initials = (session?.fullName || 'DT').split(' ').map(n => n[0]).slice(0, 2).join('');

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
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
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

      {/* Overlay de Conteo Regresivo 3, 2, 1 */}
      {countdown !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.92)',
          backdropFilter: 'blur(16px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          userSelect: 'none',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            fontSize: '0.88rem',
            fontWeight: 700,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fa-solid fa-video" style={{ animation: 'blink 1s infinite' }}></i>
            Calibrando Biometría & Audio
          </div>

          <div style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)',
            border: `3px solid ${countdown === 1 ? '#10b981' : countdown === 2 ? '#38bdf8' : countdown === 3 ? '#a855f7' : '#34d399'}`,
            boxShadow: `0 0 50px ${countdown === 1 ? 'rgba(16, 185, 129, 0.45)' : countdown === 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(168, 85, 247, 0.45)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: typeof countdown === 'number' ? '5.8rem' : '2.2rem',
            fontWeight: 900,
            color: '#fff',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {countdown}
          </div>

          <div style={{
            marginTop: '28px',
            fontSize: '1rem',
            fontWeight: 600,
            color: '#cbd5e1',
            maxWidth: '380px',
            textAlign: 'center',
            lineHeight: 1.4
          }}>
            {countdown === 3 && 'Ajusta tu postura erguida y respira profundo.'}
            {countdown === 2 && 'Mira fijamente a la cámara para conectar con el evaluador.'}
            {countdown === 1 && '¡Todo listo! Escucha con atención la pregunta.'}
            {countdown === '¡En Vivo!' && '🚀 ¡Simulación en vivo iniciada!'}
          </div>
        </div>
      )}
      <div style={{ padding: '24px 30px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '22px', alignItems: 'start' }}>
        
        {/* ---- Columna principal ---- */}
        <div style={{ ...panel, padding: '22px' }}>
          
          {/* Stepper del Proceso de Selección Secuencial (2 Filtros + Conclusiones) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 18px',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            flexWrap: 'wrap'
          }}>
            {/* Paso 1: Filtro RH */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: interviewStage === 'stage1_hr' ? 1 : (hrTurns >= 2 ? 0.9 : 0.45)
            }}>
              <span style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: hrTurns >= 2 ? '#10b981' : (interviewStage === 'stage1_hr' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.06)'),
                border: `2px solid ${hrTurns >= 2 ? '#10b981' : (interviewStage === 'stage1_hr' ? '#a855f7' : 'rgba(255,255,255,0.18)')}`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                {hrTurns >= 2 ? <i className="fa-solid fa-check"></i> : '1'}
              </span>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: interviewStage === 'stage1_hr' ? '#d8b4fe' : '#f1f5f9' }}>
                  Filtro 1: Habilidades Blandas
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  Dra. Carolina Ortiz · {Math.min(hrTurns, 2)}/2 preguntas
                </div>
              </div>
            </div>

            <i className="fa-solid fa-chevron-right" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}></i>

            {/* Paso 2: Filtro Técnico */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: interviewStage === 'stage2_tech' ? 1 : (techTurns >= 2 ? 0.9 : 0.45)
            }}>
              <span style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: techTurns >= 2 ? '#10b981' : (interviewStage === 'stage2_tech' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255,255,255,0.06)'),
                border: `2px solid ${techTurns >= 2 ? '#10b981' : (interviewStage === 'stage2_tech' ? '#06b6d4' : 'rgba(255,255,255,0.18)')}`,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                {techTurns >= 2 ? <i className="fa-solid fa-check"></i> : '2'}
              </span>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: interviewStage === 'stage2_tech' ? '#38bdf8' : '#f1f5f9' }}>
                  Filtro 2: Prueba Técnica
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  Ing. Carlos Mendoza · {Math.min(techTurns, 2)}/2 preguntas
                </div>
              </div>
            </div>

            <i className="fa-solid fa-chevron-right" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}></i>

            {/* Paso 3: Conclusiones */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              opacity: interviewStage === 'concluded' ? 1 : 0.45
            }}>
              <span style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: interviewStage === 'concluded' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.06)',
                border: `2px solid ${interviewStage === 'concluded' ? '#f59e0b' : 'rgba(255,255,255,0.18)'}`,
                color: interviewStage === 'concluded' ? '#fbbf24' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.82rem',
                fontWeight: 700
              }}>
                <i className="fa-solid fa-trophy"></i>
              </span>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: interviewStage === 'concluded' ? '#fbbf24' : '#f1f5f9' }}>
                  Calificación y Conclusiones
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  Dictamen Final del Comité
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
              {!hasStarted ? (
                <button 
                  className="btn btn-primary" 
                  style={{ 
                    padding: '8px 18px', 
                    fontSize: '0.82rem', 
                    fontWeight: 700, 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    border: 'none',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    cursor: 'pointer'
                  }}
                  onClick={handleStartInterviewWithCountdown}
                  title="Comenzar entrevista con conteo regresivo 3, 2, 1"
                >
                  <i className="fa-solid fa-play"></i> Iniciar Entrevista (3, 2, 1)
                </button>
              ) : (
                <>
                  {conclusionReport && (
                    <button
                      onClick={() => setShowConclusionModal(true)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fa-solid fa-trophy"></i> Ver Conclusiones
                    </button>
                  )}
                  <span style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    padding: '5px 12px', 
                    borderRadius: '20px', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399', 
                    fontSize: '0.78rem', 
                    fontWeight: 700 
                  }}>
                    <i className="fa-solid fa-circle" style={{ fontSize: '0.45rem', animation: 'blink 1.2s infinite' }}></i>
                    En Vivo
                  </span>
                </>
              )}

              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleRestart}
                title="Reiniciar la simulación desde el Filtro 1"
              >
                <i className="fa-solid fa-rotate-left"></i> Reiniciar
              </button>
            </div>
          </div>

          {/* Temporizadores Duales: Tiempo Total de Entrevista (6 min) y Límite por Respuesta (90s) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {/* Temporizador Global de la Entrevista */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-regular fa-hourglass-half" style={{ color: '#38bdf8' }}></i> Tiempo Total de Entrevista:
                </span>
                <span style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: totalSecondsLeft < 60 ? '#f87171' : totalSecondsLeft < 120 ? '#fbbf24' : '#38bdf8'
                }}>
                  {totalMm}:{totalSs} / 06:00
                </span>
              </div>
              <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((totalSecondsLeft / TOTAL_INTERVIEW_SECONDS) * 100, 100)}%`,
                  height: '100%',
                  background: totalSecondsLeft < 60 ? '#ef4444' : totalSecondsLeft < 120 ? '#f59e0b' : '#38bdf8',
                  transition: 'width 1s linear'
                }} />
              </div>
            </div>

            {/* Temporizador por Respuesta Activa (90s) */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-microphone" style={{ color: isRecording ? '#10b981' : 'var(--text-muted)' }}></i> Límite de Respuesta:
                </span>
                <span style={{
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: seconds > 75 ? '#f87171' : seconds > 50 ? '#fbbf24' : '#10b981'
                }}>
                  {mm}:{ss} / 01:30
                </span>
              </div>
              <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min((seconds / MAX_ANSWER_SECONDS) * 100, 100)}%`,
                  height: '100%',
                  background: seconds > 75 ? '#ef4444' : seconds > 50 ? '#f59e0b' : '#10b981',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Ficha del Evaluador Activo según el Filtro Secuencial */}
          {interviewStage === 'stage2_tech' ? (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(6, 182, 212, 0.06)', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img 
                    src="/avatars/carlos.jpg" 
                    alt="Ing. Carlos Mendoza" 
                    style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #06b6d4' }} 
                  />
                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#67e8f9' }}>Ing. Carlos Mendoza</span>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>· Evaluador Técnico Senior (Filtro 2: Pregunta {Math.min(techTurns + 1, 2)} de 2)</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.73rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', fontWeight: 600 }}>
                  Foco: Arquitectura, Metodología & Resolución de Incidentes
                </span>
              </div>

              {/* Selector de Especialidad para el Filtro Técnico */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Especialidad a Evaluar:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {TECHNICAL_PROGRAMS.map(tp => {
                    const isProgActive = technicalProgram === tp.id;
                    return (
                      <button
                        key={tp.id}
                        onClick={() => handleSelectProgram(tp.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: `1.5px solid ${isProgActive ? tp.badgeColor : 'rgba(255,255,255,0.1)'}`,
                          background: isProgActive ? 'rgba(6, 182, 212, 0.22)' : 'rgba(255,255,255,0.03)',
                          color: isProgActive ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer',
                          fontSize: '0.76rem',
                          fontWeight: isProgActive ? 700 : 500,
                          transition: 'all 0.2s'
                        }}
                      >
                        <i className={`fa-solid ${tp.icon}`} style={{ color: tp.badgeColor }}></i>
                        {tp.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '12px 16px', background: 'rgba(168, 85, 247, 0.06)', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.25)', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img 
                  src="/avatars/carolina.jpg" 
                  alt="Dra. Carolina Ortiz" 
                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #a855f7' }} 
                />
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#d8b4fe' }}>Dra. Carolina Ortiz</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>· Especialista Senior en Talento Humano (Filtro 1: Pregunta {Math.min(hrTurns + 1, 2)} de 2)</span>
                </div>
              </div>
              <span style={{ fontSize: '0.73rem', padding: '3px 10px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#d8b4fe', fontWeight: 600 }}>
                Enfoque: Método STAR, Habilidades Blandas, Comunicación y Ética
              </span>
            </div>
          )}

          {/* Banner de Inicio de Entrevista (3, 2, 1) */}
          {!hasStarted && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '18px',
              padding: '12px 18px',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12))',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.28)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#34d399',
                  fontSize: '1rem'
                }}>
                  <i className="fa-solid fa-hourglass-start"></i>
                </span>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>
                    Simulación en Espera: ¿Listo para comenzar?
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Ajusta tu postura, enfócate y presiona el botón para iniciar con conteo regresivo de 3, 2, 1.
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartInterviewWithCountdown}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'transform 0.2s'
                }}
              >
                <i className="fa-solid fa-play"></i> Comenzar Entrevista (3, 2, 1)
              </button>
            </div>
          )}

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
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px',
                    color: '#94a3b8',
                    fontSize: '1.5rem'
                  }}>
                    <i className="fa-solid fa-user-graduate"></i>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f1f5f9', marginBottom: '3px' }}>
                    {session?.fullName || 'Estudiante'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                    {session?.program || 'Tecnología en Desarrollo de Software'}
                  </div>

                  <button 
                    onClick={toggleCamera}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(6, 182, 212, 0.35)',
                      transition: 'transform 0.2s'
                    }}
                  >
                    <i className="fa-solid fa-video"></i> Activar Cámara & Biometría
                  </button>

                  <div style={{ marginTop: '10px', fontSize: '0.69rem', color: '#64748b', maxWidth: '270px', lineHeight: 1.35 }}>
                    <i className="fa-solid fa-shield-halved" style={{ marginRight: '4px', color: '#38bdf8' }}></i>
                    Análisis óptico 100% local en tu navegador (privado y seguro)
                  </div>
                  <div style={{ marginTop: '4px', fontSize: '0.67rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>Cámara requerida para calificar Lenguaje Corporal (33%)</span>
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
                Tú ({session?.fullName || 'Estudiante'})
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

          {/* Estado de grabación, límite de tiempo (90s) y visualizador */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 4px 6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '0.82rem', 
                fontWeight: 700, 
                color: seconds > 75 ? '#f87171' : seconds > 50 ? '#fbbf24' : '#38bdf8',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <i className="fa-regular fa-clock"></i>
                {isRecording ? `Tiempo: ${mm}:${ss} / 01:30` : seconds > 0 ? `Duración: ${mm}:${ss} / 01:30` : 'Límite: 90s por respuesta'}
              </span>
              {liveBio.cadenceWpm > 0 && (
                <span style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}>
                  <i className="fa-solid fa-gauge"></i> {liveBio.cadenceWpm} ppm
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isRecording ? (
                <span style={{ 
                  padding: '3px 10px', 
                  borderRadius: '6px', 
                  background: seconds > 75 ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.15)', 
                  color: seconds > 75 ? '#fca5a5' : '#f87171', 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  animation: 'blink 1.2s infinite' 
                }}>
                  ● REC ({MAX_ANSWER_SECONDS - seconds}s restantes)
                </span>
              ) : (
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  {seconds > 0 ? 'Grabación finalizada' : 'Micrófono en espera'}
                </span>
              )}
            </div>
          </div>

          {/* Barra de progreso de tiempo límite de respuesta */}
          <div style={{ height: '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', margin: '2px 4px 8px' }}>
            <div style={{ 
              width: `${Math.min((seconds / MAX_ANSWER_SECONDS) * 100, 100)}%`, 
              height: '100%', 
              borderRadius: '3px', 
              background: seconds > 75 
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)' 
                : seconds > 50 
                ? 'linear-gradient(90deg, #10b981, #f59e0b)' 
                : 'linear-gradient(90deg, #06b6d4, #10b981)', 
              transition: 'width 0.3s ease' 
            }} />
          </div>

          {timeWarning && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              margin: '6px 4px 10px', 
              padding: '8px 12px', 
              borderRadius: '8px', 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.3)', 
              color: '#fca5a5', 
              fontSize: '0.76rem' 
            }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f87171' }}></i>
              <span>{timeWarning}</span>
            </div>
          )}

          <div style={{ height: '65px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {levels.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h * 0.8}px`, borderRadius: '3px', transition: 'height .08s',
                background: `linear-gradient(180deg, hsl(${150 + (i / BARS) * 50},80%,55%), hsl(${190 + (i / BARS) * 30},80%,45%))`, opacity: isRecording ? 1 : 0.35 }} />
            ))}
          </div>

          {/* Transcripción e Indicador de Motor IA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '10px 4px 6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span><i className="fa-solid fa-comments"></i> Diálogo de la Simulación:</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '6px',
              fontSize: '0.71rem',
              fontWeight: 600,
              background: 'rgba(6, 182, 212, 0.12)',
              color: '#22d3ee',
              border: '1px solid rgba(6, 182, 212, 0.25)'
            }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Motor IA TalentLab (Activo)
            </span>
          </div>

          <div ref={chatRef} style={{ maxHeight: '130px', overflowY: 'auto', margin: '6px 0 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
              placeholder={isRecording ? "🎙 Escuchando tu voz... Habla con naturalidad (se enviará automáticamente)..." : "Escribe tu respuesta o presiona Grabar Voz para dictarla..."}
              onChange={e => setInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
            <button className="btn btn-primary" onClick={() => handleSend()} disabled={isThinking || !inputValue.trim()}>
              Enviar <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>

          {/* Controles de la entrevista */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
            <button 
              style={{
                ...ctrlBtn(isRecording),
                ...(isRecording ? {
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.28), rgba(6, 182, 212, 0.28))',
                  border: '1.5px solid #10b981',
                  color: '#34d399',
                  fontWeight: 700,
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.45)'
                } : {})
              }} 
              onClick={toggleRecording} 
              disabled={!micOn} 
              title={isRecording ? "Haz clic para finalizar y enviar tu respuesta de inmediato" : "Grabar respuesta por voz"}
            >
              <i className={`fa-solid ${isRecording ? 'fa-paper-plane' : 'fa-microphone'}`}></i> 
              {isRecording ? 'Detener y Enviar' : 'Grabar Voz'}
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
            <strong>Privacidad y Protección de Datos:</strong> El procesamiento de postura y voz se ejecuta localmente en tu navegador. Ninguna imagen o video es transmitido a servidores externos.
          </div>
        </aside>
      </div>

      {/* Modal: Guía Rápida */}
      {showGuide && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="card" style={{ width: '520px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '15px', color: 'var(--primary)' }}><i className="fa-solid fa-rocket"></i> Guía Rápida del Simulador</h2>
            <ul style={{ color: 'var(--text-muted)', marginBottom: '20px', paddingLeft: '20px', lineHeight: 1.7 }}>
              <li><strong>Evaluadores con IA:</strong> Simulaciones realistas de Recursos Humanos (Dra. Carolina Ortiz con método STAR) y evaluación técnica por especialidad formativa (Ing. Carlos Mendoza).</li>
              <li><strong>Cámara y Biometría Óptica:</strong> Activa tu cámara para calificar postura erguida, contacto visual directo y empatía facial en tiempo real de forma 100% privada en tu navegador.</li>
              <li><strong>Respuesta de Voz Fluida:</strong> Al presionar "Grabar Voz", habla con libertad. Tu respuesta se transcribe y se envía automáticamente al terminar de hablar o al presionar "Detener y Enviar".</li>
              <li><strong>Método STAR:</strong> Estructura tus intervenciones en Situación, Tarea, Acción concreta y Resultado cuantificable.</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowGuide(false)}>Entendido</button>
          </div>
        </div>
      )}

      {/* Modal: Calificación Integral y Conclusiones del Comité */}
      {showConclusionModal && conclusionReport && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '840px',
            maxWidth: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#0f172a',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(16, 185, 129, 0.15)',
            color: '#f8fafc',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '18px', marginBottom: '20px' }}>
              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: conclusionReport.verdict_badge === 'danger' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: conclusionReport.verdict_badge === 'danger' ? '#fca5a5' : '#34d399',
                  border: `1px solid ${conclusionReport.verdict_badge === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                  marginBottom: '8px'
                }}>
                  <i className="fa-solid fa-trophy"></i> Proceso de Selección Culminado (2 Filtros)
                </span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '2px 0 6px', color: '#fff' }}>
                  Dictamen Integral & Conclusiones del Comité
                </h2>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Evaluación oficial consolidada tras culminar el Filtro 1 (Recursos Humanos) y Filtro 2 (Prueba Técnica).
                </p>
              </div>
              <button 
                onClick={() => setShowConclusionModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Puntaje Global y Veredicto */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: '20px',
              alignItems: 'center',
              padding: '18px 22px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: '15px' }}>
                <div style={{ fontSize: '3.6rem', fontWeight: 900, lineHeight: 1, color: conclusionReport.overall_score >= 85 ? '#34d399' : conclusionReport.overall_score >= 70 ? '#38bdf8' : '#f87171' }}>
                  {conclusionReport.overall_score}
                  <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '4px' }}>
                  Puntaje Global Ponderado
                </div>
              </div>
              <div>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: conclusionReport.overall_score >= 85 ? '#34d399' : conclusionReport.overall_score >= 70 ? '#38bdf8' : '#f87171'
                }}>
                  Veredicto Institucional:
                </span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, margin: '4px 0 8px', color: '#fff' }}>
                  {conclusionReport.verdict}
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {conclusionReport.conclusions?.executive_summary}
                </p>
              </div>
            </div>

            {/* Desglose de los 2 Filtros Evaluados */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Filtro 1: RH */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(168, 85, 247, 0.06)', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/avatars/carolina.jpg" alt="Dra. Carolina" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #a855f7' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d8b4fe' }}>Filtro 1: Habilidades Blandas</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#d8b4fe' }}>
                    {conclusionReport.breakdown?.hr_score}/100
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {conclusionReport.conclusions?.hr_feedback}
                </p>
              </div>

              {/* Filtro 2: Técnico */}
              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/avatars/carlos.jpg" alt="Ing. Carlos" style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid #06b6d4' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#67e8f9' }}>Filtro 2: Prueba Técnica</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#67e8f9' }}>
                    {conclusionReport.breakdown?.tech_score}/100
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.79rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {conclusionReport.conclusions?.tech_feedback}
                </p>
              </div>
            </div>

            {/* Fortalezas y Oportunidades de Mejora */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <i className="fa-solid fa-circle-check"></i> Fortalezas Clave Demostradas:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  {conclusionReport.conclusions?.key_strengths?.map((s, idx) => (
                    <li key={idx} style={{ color: '#e2e8f0' }}>{s}</li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <i className="fa-solid fa-lightbulb"></i> Recomendaciones de Mejora:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.76rem', color: '#94a3b8', lineHeight: 1.6 }}>
                  {conclusionReport.conclusions?.priority_improvements?.map((m, idx) => (
                    <li key={idx} style={{ color: '#e2e8f0' }}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '18px' }}>
              <button
                onClick={handleRestart}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff',
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-rotate-right"></i> Iniciar Nueva Simulación
              </button>

              <button
                onClick={() => {
                  setShowConclusionModal(false);
                  navigate('/mi-reporte');
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <i className="fa-solid fa-file-pdf"></i> Ver Reporte Oficial Completo y Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Conclusión en Progreso */}
      {isConcluding && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(3, 7, 18, 0.92)',
          backdropFilter: 'blur(14px)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          gap: '16px'
        }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            border: '4px solid rgba(6,182,212,0.2)',
            borderTopColor: '#06b6d4',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' }}>
            Consolidando Calificación y Conclusiones del Comité...
          </div>
          <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
            Sintetizando desempeño en Habilidades Blandas, Prueba Técnica y Biometría.
          </div>
        </div>
      )}
    </>
  );
}
