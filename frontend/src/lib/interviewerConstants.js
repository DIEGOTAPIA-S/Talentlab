// Constantes y definiciones de evaluadores y modalidades de entrevista en TalentLab
// 100% universal: Sin dependencias de agencias públicas ni marcas privadas.

// 1. LOS DOS MODOS / FILTROS PRINCIPALES DE ENTREVISTA
export const INTERVIEW_MODES = [
  {
    id: 'hr',
    name: 'Recursos Humanos & Talento',
    shortName: 'RRHH & Talento',
    icon: 'fa-user-tie',
    badgeColor: '#a855f7',
    accentColor: 'rgba(168, 85, 247, 0.25)',
    interviewerId: 'carolina',
    tagline: 'Empatía, autoconocimiento, comunicación asertiva y valores humanos',
    description: 'Conversación reflexiva sobre habilidades socioemocionales, resolución pacífica de conflictos, resiliencia y trabajo en equipo.',
    initialQuestion: '¡Hola! Qué gusto saludarte. Mi nombre es Carolina Ortiz y seré tu mentora y evaluadora en esta primera etapa de Habilidades Blandas. Más que una prueba rígida, quiero que tengamos una conversación cercana y tranquila para conocerte como persona: tus valores, tu vocación y cómo te relacionas con los demás. Para comenzar, cuéntame: ¿qué te motiva cada día en tu camino formativo y qué experiencia trabajando con otros te ha dejado un aprendizaje valioso que recuerdes con orgullo?',
    roleTarget: 'Evaluación de Talento Humano y Habilidades Blandas'
  },
  {
    id: 'technical',
    name: 'Técnica & Especialidad',
    shortName: 'Técnica & Especialidad',
    icon: 'fa-gears',
    badgeColor: '#06b6d4',
    accentColor: 'rgba(6, 182, 212, 0.25)',
    interviewerId: 'carlos',
    tagline: 'Dominio práctico y resolución técnica según tu especialidad',
    description: 'Evaluación técnica focalizada en las competencias de tu programa formativo: arquitectura, herramientas, metodologías y resolución metódica de incidentes.',
    roleTarget: 'Evaluación Técnica de Especialidad'
  }
];

// 2. PROGRAMAS / ESPECIALIDADES PARA LA ENTREVISTA TÉCNICA
export const TECHNICAL_PROGRAMS = [
  {
    id: 'software',
    name: 'Desarrollo de Software / ADSO / Sistemas',
    shortName: 'Software & Sistemas',
    icon: 'fa-code',
    badgeColor: '#06b6d4',
    initialQuestion: '¡Hola! Te doy la bienvenida a tu evaluación técnica en Desarrollo de Software y Sistemas. Soy el Ing. Carlos Mendoza. Para iniciar, cuéntame sobre el proyecto o sistema más relevante que hayas programado: ¿qué tecnologías empleaste, qué arquitectura definiste y qué problema resolviste?',
    roleTarget: 'Desarrollo de Software / ADSO / Sistemas'
  },
  {
    id: 'gestion',
    name: 'Gestión Empresarial, Contable & Administrativa',
    shortName: 'Gestión & Administración',
    icon: 'fa-chart-line',
    badgeColor: '#10b981',
    initialQuestion: '¡Hola! Te doy la bienvenida a tu evaluación técnica en Gestión Empresarial y Finanzas. Soy el Ing. Carlos Mendoza. Para comenzar, descríbeme un proceso operativo, administrativo o financiero que hayas analizado o mejorado: ¿qué indicadores utilizaste y qué impacto lograste?',
    roleTarget: 'Gestión Empresarial, Finanzas & Procesos'
  },
  {
    id: 'diseno',
    name: 'Diseño Gráfico, Multimedia & UI/UX',
    shortName: 'Diseño & Multimedia',
    icon: 'fa-palette',
    badgeColor: '#f59e0b',
    initialQuestion: '¡Hola! Te doy la bienvenida a tu evaluación técnica en Diseño Gráfico, Multimedia y UX/UI. Soy el Ing. Carlos Mendoza. Para iniciar, descríbeme un proyecto donde hayas interpretado las necesidades de un cliente o usuario: ¿qué herramientas utilizaste y cómo justificaste tus decisiones de diseño?',
    roleTarget: 'Diseño Gráfico, Multimedia & UI/UX'
  },
  {
    id: 'redes',
    name: 'Infraestructura, Redes & Telecomunicaciones',
    shortName: 'Redes & Infraestructura',
    icon: 'fa-network-wired',
    badgeColor: '#3b82f6',
    initialQuestion: '¡Hola! Te doy la bienvenida a tu evaluación técnica en Infraestructura y Redes. Soy el Ing. Carlos Mendoza. Para empezar, cuéntame sobre una experiencia configurando equipos de red, servidores o resolviendo un incidente de conectividad: ¿qué metodología aplicaste?',
    roleTarget: 'Infraestructura, Redes & TI'
  }
];

// 3. PERSONAS EVALUADORAS (Totalmente neutrales, sin entidades externas ni marcas)
export const INTERVIEWER_PERSONAS = [
  {
    id: 'carolina',
    name: 'Dra. Carolina Ortiz',
    role: 'Líder de Selección & Mentora Vocacional',
    company: 'Gestión de Talento & RRHH',
    mode: 'hr',
    description: 'Psicóloga y mentora experta en competencias socioemocionales: empatía, gestión de la frustración, comunicación asertiva y resolución dialogada de conflictos.',
    gender: 'female',
    image: '/avatars/carolina.jpg',
    badgeColor: '#a855f7',
    accentColor: 'rgba(168, 85, 247, 0.25)',
    voicePitch: 1.10,
    voiceRate: 0.98
  },
  {
    id: 'carlos',
    name: 'Ing. Carlos Mendoza',
    role: 'Evaluador Técnico de Especialidad',
    company: 'Panel de Evaluación Técnica',
    mode: 'technical',
    description: 'Especialista en proyectos aplicados, arquitectura técnica, herramientas de especialidad y resolución metódica de problemas según el programa.',
    gender: 'male',
    image: '/avatars/carlos.jpg',
    badgeColor: '#06b6d4',
    accentColor: 'rgba(6, 182, 212, 0.25)',
    voicePitch: 0.88,
    voiceRate: 1.02
  }
];

// Alias para compatibilidad con código legado que importe VOCATIONAL_TRACKS
export const VOCATIONAL_TRACKS = TECHNICAL_PROGRAMS;
