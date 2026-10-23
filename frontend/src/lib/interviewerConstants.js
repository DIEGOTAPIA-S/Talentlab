// Constantes y definiciones de evaluadores y pistas vocacionales
// Separadas de los componentes React para compatibilidad total con Fast Refresh en Vite

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

export const INTERVIEWER_PERSONAS = [
  {
    id: 'carolina',
    name: 'Dra. Carolina Ortiz',
    role: 'Psicóloga Organizacional & Selección',
    company: 'Agencia Pública de Empleo (APE)',
    track: 'transversal',
    trackLabel: 'Transversal (Todas las Carreras)',
    description: 'Evaluadora de competencias laborales universales: comunicación asertiva, resolución de conflictos, inteligencia emocional y método STAR.',
    gender: 'female',
    image: '/avatars/carolina.jpg',
    badgeColor: '#a855f7',
    accentColor: 'rgba(168, 85, 247, 0.25)',
    voicePitch: 1.15,
    voiceRate: 1.0
  },
  {
    id: 'david',
    name: 'David Morales',
    role: 'Coordinador de Prácticas & Gestión',
    company: 'Sector Administrativo y Servicios',
    track: 'gestion',
    trackLabel: 'Gestión Empresarial & Finanzas',
    description: 'Evaluación en organización de procesos, atención a usuarios/clientes, gestión de presupuestos, metas comerciales y proyectos empresariales.',
    gender: 'male',
    image: '/avatars/david.jpg',
    badgeColor: '#10b981',
    accentColor: 'rgba(16, 185, 129, 0.25)',
    voicePitch: 0.9,
    voiceRate: 0.95
  },
  {
    id: 'carlos',
    name: 'Carlos Mendoza',
    role: 'Instructor Líder TIC & Procesos',
    company: 'Centro de Tecnologías e Innovación',
    track: 'tecnologia',
    trackLabel: 'Tecnología, Procesos & TIC',
    description: 'Evaluación de proyectos formativos aplicados, lógica de procesos, herramientas digitales, automatización y solución metódica de problemas.',
    gender: 'male',
    image: '/avatars/carlos.jpg',
    badgeColor: '#06b6d4',
    accentColor: 'rgba(6, 182, 212, 0.25)',
    voicePitch: 1.0,
    voiceRate: 1.05
  }
];
