# ARQUITECTURA DE SOFTWARE Y ESTRUCTURA DE ARCHIVOS — TALENTLAB

Este documento define la estructura inicial del proyecto, los módulos clave, la configuración de infraestructura multi-tenant, y los esquemas de bases de datos para el desarrollo técnico de **TalentLab**.

---

## 1. Stack Tecnológico Propuesto

*   **Frontend (Aplicación Web/Móvil):**
    *   React 18 con Vite, react-router-dom para SPA, JavaScript moderno (ES6+) y CSS3 Vanilla (arquitectura modular con Custom Properties/Variables para tematización premium y modo oscuro).
    *   Cliente Supabase JS para interacción directa con base de datos en tiempo real (consultas, suscripciones).
*   **Backend & APIs:**
    *   **Node.js / Express:** API Gateway para autenticación, gestión multi-tenant, registros institucionales y middleware de seguridad.
    *   **Python (FastAPI/Flask):** Microservicio especializado para Machine Learning (clasificador supervisado *Random Forest* para predicción de deserción) y procesamiento de lenguaje natural (NLP) para el simulador interactivo de entrevistas.
*   **Base de Datos & Infraestructura Serverless:**
    *   **Supabase (PostgreSQL):** Base de datos relacional con aislamiento multi-tenant a través de políticas Row-Level Security (RLS) a nivel de esquema o filas.
    *   **Supabase Storage:** Para almacenar grabaciones de audio/video de simulaciones y reportes PDF institucionales.

---

## 2. Estructura de Directorios del Proyecto (Monorepo)

Proponemos la siguiente estructura organizada para modularizar de forma limpia los servicios de frontend, backend y base de datos:

```text
talentlab/
│
├── .github/                    # Workflows de CI/CD (despliegue en Supabase/Nube)
│
├── database/                   # Migraciones y esquemas de base de datos
│   ├── schema.sql              # Creación de tablas, relaciones y constraints
│   ├── rls_policies.sql        # Políticas de Seguridad de Nivel de Fila (RLS)
│   └── seed.sql                # Datos de prueba para desarrollo inicial
│
├── backend-ml/                 # Microservicio de Inteligencia Artificial (Python)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # Punto de entrada FastAPI
│   │   ├── models/             # Definición de modelos y serializadores
│   │   ├── services/
│   │   │   ├── prediction.py   # Implementación del clasificador Random Forest
│   │   │   └── nlp_eval.py     # Análisis semántico y evaluación de entrevistas
│   │   └── utils/
│   ├── requirements.txt        # Dependencias de Python (scikit-learn, numpy, pandas, fastapi)
│   └── Dockerfile              # Contenedorización del microservicio de IA
│
├── backend-api/                # API Gateway e Integraciones (Node.js)
│   ├── src/
│   │   ├── config/             # Configuración de entornos y Supabase Client
│   │   ├── middlewares/        # Validaciones, auth, y filtro tenant
│   │   ├── routes/             # Enrutamiento de endpoints
│   │   ├── controllers/        # Lógica de negocio (instituciones, alumnos, mentores)
│   │   └── index.js            # Inicializador de Express
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # Interfaz de Usuario Multi-tenant
│   ├── public/                 # Recursos estáticos (imágenes, fuentes, iconos)
│   ├── css/
│   │   ├── variables.css       # Tokens de diseño, tipografía y colores (Glassmorphism/Oscuro)
│   │   ├── components.css      # Estilos comunes reutilizables (botones, tarjetas, inputs)
│   │   └── main.css            # Estilos globales y layouts
│   ├── js/
│   │   ├── api.js              # Integraciones con backend-api y Supabase client
│   │   ├── auth.js             # Control de sesiones y roles
│   │   ├── dashboard.js        # Lógica del panel de administración (Semáforos de riesgo)
                # Lógica del simulador interactivo de entrevistas
│   │   └── utils.js
│   ├── components/             # Fragmentos HTML dinámicos
│   ├── index.html              # Página de bienvenida / Landing institucional
│   ├── login.html              # Pantalla de acceso unificada
│   ├── dashboard.html          # Dashboard de directivos (Semáforos / Alertas)
│   └── simulador.html          # Interfaz del estudiante (B2C) para entrenamiento con IA
│
└── README.md                   # Instrucciones generales de configuración local
```

---

## 3. Arquitectura del Modelo de Datos (PostgreSQL)

Para garantizar la seguridad de múltiples instituciones (**multi-tenant**), cada tabla principal incluye una relación con un `tenant_id` (ID de la institución), permitiendo aislar criptográficamente los datos de cada cliente.

### Tablas Principales:

1.  **`tenants` (Instituciones Educativas B2B):**
    *   `id` (UUID, Primary Key)
    *   `nombre` (VARCHAR)
    *   `dominio` (VARCHAR, único)
    *   `plan_suscripcion` (VARCHAR: 'basic', 'premium')
    *   `created_at` (TIMESTAMP)
2.  **`users` (Estudiantes, Mentores y Administradores):**
    *   `id` (UUID, Primary Key)
    *   `tenant_id` (UUID, Foreign Key)
    *   `email` (VARCHAR, único)
    *   `role` (VARCHAR: 'admin_tenant', 'student', 'mentor')
    *   `nombre_completo` (VARCHAR)
    *   `created_at` (TIMESTAMP)
3.  **`student_risk_profiles` (Datos del Algoritmo de Deserción):**
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, Foreign Key a `users`)
    *   `tenant_id` (UUID, Foreign Key)
    *   `probabilidad_desercion` (DECIMAL 0.00 a 1.00)
    *   `nivel_riesgo` (VARCHAR: 'alto', 'medio', 'bajo')
    *   `factores_clave` (JSONB: económico, académico, conectividad, etc.)
    *   `ultima_actualizacion` (TIMESTAMP)
4.  **`interview_simulations` (Registros del Simulador NLP):**
    *   `id` (UUID, Primary Key)
    *   `user_id` (UUID, Foreign Key a `users`)
    *   `tenant_id` (UUID, Foreign Key)
    *   `rol_objetivo` (VARCHAR, ej: "Desarrollador Junior")
    *   `feedback_general` (TEXT)
    *   `score_coherencia` (INTEGER, 1-100)
    *   `score_confianza` (INTEGER, 1-100)
    *   `grabacion_url` (VARCHAR, enlace al storage)
    *   `created_at` (TIMESTAMP)

---

## 4. Próximos Pasos (Flujo de Trabajo para Codificación)

Esperamos tus instrucciones para iniciar. Podemos abordar:
1.  **Módulo de Base de Datos:** Creación de los archivos SQL (`schema.sql` y políticas RLS).
2.  **Módulo de Frontend:** Maquetación premium y estructuración CSS con Custom Properties (`variables.css`, `main.css`).
3.  **Módulo de backend-ml:** Inicialización del microservicio Python con FastAPI y el modelo base *Random Forest* simulado.
