import React from 'react';
import { INTERVIEWER_PERSONAS } from '../lib/interviewerConstants';

export { INTERVIEWER_PERSONAS };

export default function InterviewerAvatar({ 
  personaId = 'carlos', 
  isSpeaking = false, 
  isListening = false, 
  isThinking = false 
}) {
  const persona = INTERVIEWER_PERSONAS.find(p => p.id === personaId) || INTERVIEWER_PERSONAS[0];

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      background: '#0f172a',
      borderRadius: '14px'
    }}>
      {/* Imagen Fotorrealista Estática del Evaluador (sin parpadeo ni movimiento) */}
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img 
          src={persona.image} 
          alt={persona.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>

      {/* Degradado inferior para lectura limpia del nombre y cargo */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '42%',
        background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.35) 60%, transparent 100%)',
        pointerEvents: 'none'
      }} />

      {/* Indicador discreto de audio cuando el entrevistador habla */}
      {isSpeaking && (
        <div style={{
          position: 'absolute',
          bottom: '14px',
          right: '14px',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(6, 182, 212, 0.25)',
          border: '1.5px solid #06b6d4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#22d3ee'
        }}>
          <i className="fa-solid fa-volume-high"></i>
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
        <i className={`fa-solid ${isSpeaking ? 'fa-volume-high' : isThinking ? 'fa-brain' : 'fa-circle'}`} 
           style={{ color: isSpeaking ? '#22d3ee' : isThinking ? '#fbbf24' : '#34d399', fontSize: '0.6rem' }}></i>
        {isSpeaking ? 'Entrevistador Hablando (Tiempo en Pausa)' : isThinking ? 'Analizando Respuesta...' : isListening ? 'Escuchando tu Respuesta' : 'En Línea'}
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
