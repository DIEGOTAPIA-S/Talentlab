import React from 'react';

export default function TalentLabLogo({ size = 56 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 18px rgba(124, 58, 237, 0.45))'
      }}
    >
      <defs>
        <linearGradient id="tlBgGrad" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b4b" />
          <stop offset="55%" stopColor="#311068" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="tlStrokeGrad" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="tlAccentGrad" x1="16" y1="14" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="tlLiquidGrad" x1="20" y1="34" x2="44" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Escudo Hexagonal / Squircle de Fondo */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="16"
        fill="url(#tlBgGrad)"
        stroke="url(#tlStrokeGrad)"
        strokeWidth="2.4"
      />

      {/* Halo interno sutil */}
      <circle cx="32" cy="32" r="21" stroke="url(#tlStrokeGrad)" strokeOpacity="0.18" strokeWidth="1.2" strokeDasharray="3 3" />

      {/* Birrete / Red Neuronal Superior (Talento & Educación) */}
      <path
        d="M32 13L46 19.5L32 26L18 19.5L32 13Z"
        fill="url(#tlAccentGrad)"
        fillOpacity="0.28"
        stroke="#38bdf8"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      {/* Matraz de Laboratorio / Núcleo IA */}
      <path
        d="M27.5 24.5V31.2L19.8 43.2C18.5 45.2 19.9 47.8 22.3 47.8H41.7C44.1 47.8 45.5 45.2 44.2 43.2L36.5 31.2V24.5"
        stroke="url(#tlStrokeGrad)"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Energía / Fluido de IA dentro del matraz */}
      <path
        d="M22.2 41.5C25.5 39.8 28.5 42.8 32 41.2C35.5 39.6 38.5 41.8 41.8 41.2L43.2 43.5C44.1 45 43.1 46.6 41.4 46.6H22.6C20.9 46.6 19.9 45 20.8 43.5L22.2 41.5Z"
        fill="url(#tlLiquidGrad)"
      />

      {/* 3 Nodos Brillantes: Detecta · Prepara · Conecta */}
      <circle cx="27" cy="37" r="2.1" fill="#38bdf8" />
      <circle cx="35.5" cy="34.5" r="1.8" fill="#e879f9" />
      <circle cx="32" cy="19.5" r="2.2" fill="#f8fafc" />
    </svg>
  );
}
