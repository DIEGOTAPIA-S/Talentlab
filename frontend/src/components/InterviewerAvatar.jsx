import React, { useEffect, useState } from 'react';
import { INTERVIEWER_PERSONAS } from '../lib/interviewerConstants';

export { INTERVIEWER_PERSONAS };

export default function InterviewerAvatar({ 
  personaId = 'carlos', 
  isSpeaking = false, 
  isListening = false, 
  isThinking = false 
}) {
  const persona = INTERVIEWER_PERSONAS.find(p => p.id === personaId) || INTERVIEWER_PERSONAS[0];
  const [blink, setBlink] = useState(false);

  // Ciclo periódico de parpadeo realista cada 3.6 segundos
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3600);

    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      background: '#0f172a',
      borderRadius: '14px'
    }}>
      <style>{`
        @keyframes avatarBreathe {
          0%, 100% { transform: scale(1.02) translateY(0px); }
          50% { transform: scale(1.035) translateY(-3px); }
        }
        @keyframes speakNod {
          0%, 100% { transform: scale(1.03) translateY(0px) rotate(0deg); }
          25% { transform: scale(1.04) translateY(-4px) rotate(0.4deg); }
          75% { transform: scale(1.03) translateY(-1px) rotate(-0.4deg); }
        }
        @keyframes listenAttentive {
          0%, 100% { transform: scale(1.025) translateY(0px) rotate(0deg); }
          50% { transform: scale(1.035) translateY(-2px) rotate(0.6deg); }
        }
        @keyframes soundWaveRipple {
          0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.6); }
          70% { box-shadow: 0 0 0 16px rgba(6, 182, 212, 0); }
          100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
        }
      `}</style>

      {/* Imagen Fotorrealista de la Persona con Animación Órganica */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: isSpeaking 
          ? 'speakNod 1.4s ease-in-out infinite' 
          : isListening 
          ? 'listenAttentive 2.4s ease-in-out infinite' 
          : 'avatarBreathe 4s ease-in-out infinite'
      }}>
        <img 
          src={persona.image} 
          alt={persona.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            filter: isThinking ? 'brightness(0.92)' : 'none',
            transition: 'filter 0.3s'
          }}
        />

        {/* Efecto de Párpados / Parpadeo Orgánico */}
        {blink && (
          <div style={{
            position: 'absolute',
            top: '32%',
            left: '42%',
            width: '16%',
            height: '4px',
            backgroundColor: 'rgba(30, 20, 15, 0.45)',
            borderRadius: '50%',
            filter: 'blur(1px)',
            pointerEvents: 'none'
          }} />
        )}
      </div>

      {/* Degradado cinematográfico inferior para lectura de subtítulos */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '45%',
        background: 'linear-gradient(to top, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.4) 60%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Onda acústica sobre el avatar cuando está hablando */}
      {isSpeaking && (
        <div style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.25)',
          border: '2px solid #06b6d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#22d3ee',
          animation: 'soundWaveRipple 1.2s infinite'
        }}>
          <i className="fa-solid fa-volume-high fa-beat"></i>
        </div>
      )}

      {/* Badge superior derecho de estado */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        padding: '4px 11px',
        borderRadius: '999px',
        fontSize: '0.74rem',
        fontWeight: 600,
        background: isSpeaking 
          ? 'rgba(6, 182, 212, 0.35)' 
          : isThinking 
          ? 'rgba(245, 158, 11, 0.35)' 
          : 'rgba(16, 185, 129, 0.35)',
        border: `1px solid ${isSpeaking ? '#06b6d4' : isThinking ? '#f59e0b' : '#10b981'}`,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
      }}>
        <i className={`fa-solid ${isSpeaking ? 'fa-volume-high' : isThinking ? 'fa-brain fa-spin' : 'fa-circle'}`} 
           style={{ color: isSpeaking ? '#22d3ee' : isThinking ? '#fbbf24' : '#34d399', fontSize: '0.6rem' }}></i>
        {isSpeaking ? 'Entrevistador Hablando' : isThinking ? 'Analizando Respuesta...' : isListening ? 'Escuchando Respuesta' : 'En Línea'}
      </div>

      {/* Etiqueta inferior con nombre y rol */}
      <div style={{
        position: 'absolute',
        left: '12px',
        bottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div style={{
          padding: '5px 12px',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: persona.badgeColor }}></span>
            {persona.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {persona.role} · <strong style={{ color: persona.badgeColor }}>{persona.company}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
