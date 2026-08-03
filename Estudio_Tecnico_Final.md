# 3.0 ESTUDIO TÉCNICO

El estudio técnico de **TalentLab** tiene como objetivo determinar las especificaciones de ingeniería del software, los requerimientos de infraestructura y los procesos operativos necesarios para garantizar la prestación estable, segura y eficiente del servicio bajo un modelo de distribución SaaS (Software as a Service) multi-tenant. Esta sección detalla la definición de nuestro Producto Mínimo Viable (MVP) y establece la Ficha Técnica oficial del producto tecnológico.

---

## 3.1. PRODUCTO O SERVICIO MÍNIMO VIABLE (MVP)

Con base en el diagnóstico de la demanda actual y la encuesta aplicada a directivos y estudiantes del sector educativo en Bogotá, se ha delimitado el alcance funcional de la plataforma en su primera fase de comercialización. El Producto Mínimo Viable (MVP) se enfoca en resolver de manera directa dos problemáticas críticas: la deserción estudiantil temprana y las deficiencias de los estudiantes para afrontar entrevistas de trabajo.

El MVP de **TalentLab** consta de dos módulos interactivos principales integrados bajo una arquitectura web escalable y robusta, con seguridad por aislamiento a nivel de base de datos.

### 3.1.1. Módulos Core del MVP

1. **Módulo Semáforo de Deserción Académica (Directivos y Docentes):**
   * **Propósito:** Ofrecer alertas tempranas al personal administrativo y de bienestar estudiantil sobre estudiantes con alta probabilidad de abandonar sus estudios.
   * **Funcionamiento técnico:** Un algoritmo predictivo de clasificación (basado en *Random Forest*) analiza variables de entrada agregadas (tasa de asistencia, promedio académico acumulado, estrato socioeconómico, estado financiero de la matrícula y participación en actividades de tutoría) y categoriza a cada estudiante en tres niveles de riesgo visuales:
     * **Riesgo Alto (Semáforo Rojo):** Probabilidad de deserción > 75%. Requiere intervención prioritaria e inmediata.
     * **Riesgo Medio (Semáforo Amarillo):** Probabilidad entre 40% y 75%. Requiere seguimiento y asignación de tutoría preventiva.
     * **Riesgo Bajo (Semáforo Verde):** Probabilidad < 40%. Estudiante en estado óptimo o bajo control.
   * **Interfaz de Usuario:** Panel directivo responsivo que incluye visualizaciones gráficas del comportamiento de la deserción por cohorte y filtros dinámicos por programa académico.

2. **Módulo Simulador de Entrevistas Laborales con IA (Estudiantes):**
   * **Propósito:** Entrenar y capacitar a los estudiantes para sus primeras interacciones con el mercado laboral real, disminuyendo la brecha de empleabilidad.
   * **Funcionamiento técnico:** Una interfaz interactiva basada en el Procesamiento de Lenguaje Natural (PLN). El simulador plantea preguntas contextualizadas según el área técnica o profesional seleccionada por el estudiante. El usuario responde en tiempo real mediante texto (o transcripción de audio), y el motor de IA analiza semánticamente la coherencia, el uso de terminología técnica y la respuesta.
   * **Retroalimentación instantánea:** Al finalizar la simulación, el sistema retorna:
     * Un puntaje de desempeño global (0 a 100).
     * Un análisis detallado de fortalezas en la respuesta.
     * Acciones puntuales de mejora o respuestas sugeridas de referencia para futuras entrevistas.

### 3.1.2. Matriz de Alineación: Necesidades del Cliente vs. Características del MVP

| Necesidad Detectada en el Mercado | Módulo / Característica del MVP | Beneficio Directo para la Institución / Estudiante |
| :--- | :--- | :--- |
| **Bajo porcentaje de permanencia** en los primeros semestres académicos de carreras técnicas y profesionales. | Semáforo de riesgo predictivo con alertas en tiempo real. | Identificación a tiempo de estudiantes vulnerables para aplicar planes de contingencia antes de que formalicen su retiro. |
| **Poco personal de bienestar** institucional para realizar seguimiento individual a miles de estudiantes. | Consola centralizada con filtros dinámicos de clasificación de riesgo. | Optimización del tiempo del personal psicopedagógico, dirigiéndose específicamente al grupo de estudiantes en "Riesgo Alto". |
| **Dificultad de los estudiantes para ingresar al mercado laboral** por nerviosismo o mala estructuración de respuestas en entrevistas. | Simulador interactivo de entrevistas con retroalimentación automática basada en IA. | Entrenamiento autónomo e ilimitado para el estudiante, lo que incrementa su tasa de contratación y éxito laboral en procesos de selección. |
| **Falta de indicadores cuantitativos de empleabilidad** exigidos por entes de acreditación del Ministerio de Educación Nacional (MEN). | Reporte histórico de desempeño en simulaciones y estadísticas de preparación de egresados. | Información de soporte y evidencias métricas para sustentar los procesos de Acreditación de Alta Calidad institucional. |

---

## 3.2. FICHA TÉCNICA DEL PRODUCTO O SERVICIO


A continuación, se define formalmente la especificación técnica completa de la plataforma digital **TalentLab v1.0.0**. Este documento unifica en una sola matriz estructurada los requerimientos de ingeniería de software, tecnologías aplicadas, condiciones operativas, normatividad legal e impacto ambiental, sirviendo como el estándar oficial de calidad y desarrollo del proyecto.

### Ficha Técnica Unificada del Sistema (TalentLab v1.0.0)

| Dimensión / Variable | Variable Técnica | Especificación Técnica y Detalle del Prototipo |
| :--- | :--- | :--- |
| **Identificación General** | **Nombre del Producto** | TalentLab — Plataforma Inteligente de Acompañamiento Estudiantil |
| | **Slogan / Tagline** | *Detecta. Prepara. Conecta.* |
| | **Versión del Software** | 1.0.0 (Fase Producto Mínimo Viable - MVP) |
| | **Tipo de Distribución** | Software como Servicio (SaaS) interactivo en la nube. |
| | **Modelo de Monetización** | Suscripción Anual B2B (Licencia multi-tenant para instituciones privadas) y Acceso Social Gratuito para colegios oficiales de bachillerato. |
| | **Actividad Económica** | Clasificación Industrial Internacional Uniforme (CIIU): **6201** (Desarrollo de sistemas informáticos), **6202** (Consultoría informática) y **6311** (Hosting y procesamiento de datos). |
| **Arquitectura de Software** | **Modelo Arquitectónico** | Cliente-Servidor desacoplada. Frontend SPA (Single Page Application) que consume una API RESTful centralizada, con aislamiento multi-tenant lógico. |
| | **Lenguajes de Programación** | **JavaScript (ES6+)** para la capa de presentación (Frontend), **Python (v3.11.4)** para la lógica de negocio y APIs (Backend), y **SQL (PostgreSQL v15)** para la base de datos relacional. |
| | **Framework Frontend & UI** | **React.js (v18.2.0)** compilado con **Vite (v5.x)**. Ruteo con **React Router DOM (v6.x)**. Estilos desarrollados en **CSS3 Vanilla** mediante variables globales (Modo Oscuro, Glassmorphism, fuentes Google Fonts: Inter y Outfit). |
| | **Framework Backend & Servidor**| **FastAPI (v0.100.0)** para el desarrollo de la API con tipado estático por **Pydantic (v2)**. Servidor ASGI **Uvicorn (v0.22.0)** para la ejecución y enrutamiento de peticiones. |
| | **Base de Datos & Auth** | **Supabase (PostgreSQL v15)**. Gestión de usuarios y sesiones vía **Supabase Auth** usando **JWT (JSON Web Tokens)** con tiempo de expiración de 1 hora. Aislamiento de datos con **RLS (Row-Level Security)**. |
| | **Algoritmos de IA y ML** | **Semáforo de Deserción:** **Scikit-learn (v1.3.0)** ejecutando el algoritmo supervisado *Random Forest Classifier*.<br>**Simulador de Entrevistas:** Procesamiento de Lenguaje Natural (PLN) utilizando **NLTK (v3.8.1)** o **spaCy (v3.6.0)** para análisis de coherencia semántica. |
| **Requisitos del Cliente** | **Navegadores Soportados** | **Google Chrome** (v100+), **Mozilla Firefox** (v100+), **Microsoft Edge** (v100+) y **Apple Safari** (v15+). Se requiere versión estable y actualizada con soporte HTML5. |
| | **Velocidad de Internet** | *Mínima requerida:* 5 Mbps de bajada / 2 Mbps de subida (ancho de banda básico).<br>*Óptima recomendada:* 10 Mbps de bajada en adelante para transmisiones estables de audio y reconocimiento de voz en el simulador. |
| | **Hardware Mínimo (Usuario)** | Computador de escritorio o portátil con procesador Dual-Core a 1.8 GHz (Intel Core i3 / AMD Ryzen 3), memoria RAM mínima de 4 GB, pantalla con resolución mínima de 1280x720 px. |
| | **Periféricos Requeridos** | Teclado físico o táctil, monitor y **micrófono funcional** (integrado o externo) con permisos habilitados en el navegador para la captura de respuestas de voz en el simulador. |
| **Logística e Infraestructura**| **Empaque y Embalaje** | No aplica empaque físico. Distribución y entrega 100% digital a través de acceso web seguro por protocolo HTTPS (`https://app.talentlab.co` o subdominios autorizados). |
| | **Almacenamiento Cloud** | Cuota de almacenamiento de **50 GB por institución educativa (tenant)** en *Supabase Storage* para el resguardo de históricos, logs y registros de entrevistas. |
| | **Copias de Seguridad (Backup)**| Backups automáticos diarios de la base de datos relacional con una política de retención histórica de 30 días calendario y redundancia geográfica en la nube. |
| | **Despliegue y CI/CD** | Pipeline de integración y distribución continua automatizado en **GitHub Actions**, desplegando imágenes en contenedores **Docker** sobre infraestructura cloud. |
| **Calidad y Mantenimiento** | **SLA de Disponibilidad** | Garantía de disponibilidad mensual del servicio técnico del **99.9% (Uptime)**, soportado por balanceadores de carga automáticos y alta tolerancia a fallos. |
| | **Precisión de IA** | Exactitud predictiva objetivo (*Accuracy*) superior al **88%** en el modelo de Machine Learning para la prevención de deserción escolar. |
| | **Garantías y Soporte** | Soporte técnico correctivo ante fallos y bugs críticos (SLA de 4 horas hábiles para severidad alta) e instalación de parches y actualizaciones de software automáticas sin cobro adicional. |
| **Seguridad y Marco Legal** | **Protocolos de Cifrado** | Encriptación de datos en tránsito usando **TLS 1.3 (HTTPS)** y cifrado en reposo para bases de datos y archivos multimedia mediante algoritmo **AES-256**. |
| | **Protección de Datos** | Cumplimiento estricto de la **Ley 1581 de 2012 (Habeas Data)** y el Decreto 1377 de 2013 en Colombia. Requiere aceptación de términos y consentimiento expreso del usuario al ingresar. |
| **Sostenibilidad Ambiental**| **Impacto de Infraestructura** | Green Hosting: Alojamiento en centros de datos cloud (AWS/GCP) que operan con certificaciones de uso de **energía 100% renovable** y compensación de carbono. |
| | **Impacto Ecológico Directo** | Cero Papel: Reducción del **98%** en el consumo de papel de las oficinas de bienestar universitario al digitalizar el registro de tutorías, alertas predictivas e informes de egresados. |

---

## 3.3. DESCRIPCIÓN DEL PROCESO

El proceso de producción, implantación y operación de la plataforma SaaS de **TalentLab** está diseñado bajo principios de ingeniería ágil y entrega de servicios digitales en la nube. A continuación, se describen de manera secuencial cada una de las actividades del proceso de cara a las instituciones educativas (B2B) y los estudiantes (B2C), detallando la asignación de recursos humanos, tecnológicos y operativos.

### 3.3.1. Tabla Secuencial de Actividades del Proceso

| Actividad / Fase | Descripción y Procedimiento Operativo | Tiempo Estimado | Cargos Involucrados | Cantidad de Personal | Equipos y Herramientas | Responsabilidad (Propia vs. Tercero) |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| **1. Negociación y Cierre Contractual B2B** | Presentación de la propuesta comercial a la institución, concertación de términos, firma del acuerdo de suscripción anual y firma del acuerdo de confidencialidad para el tratamiento de datos. | 5 días hábiles | Director Comercial / CTO | 1 persona (TalentLab) | Computador portátil, CRM HubSpot, Adobe Sign / DocuSign. | **Propia** |
| **2. Aprovisionamiento técnico del Tenant** | Creación y aislamiento lógico del entorno del cliente en la base de datos Supabase, configuración del subdominio personalizado de acceso (`https://[institucion].talentlab.co`) y habilitación de credenciales para el administrador institucional. | 4 horas hábiles | Director de Tecnología (CTO) | 1 persona (TalentLab) | Consola de Supabase, Docker, Git/GitHub, script de migración SQL. | **Propia** (Soportada en infraestructura cloud de *Supabase* como tercero). |
| **3. Carga Inicial de Datos y Calibración de IA** | Carga de los registros académicos e históricos socioeconómicos de los estudiantes (formato CSV anonimizado) aportados por bienestar estudiantil, y ejecución del script de entrenamiento inicial del modelo *Random Forest* para calibrar el semáforo. | 8 horas hábiles | Analista de Datos / Ingeniero de Preventa | 1 persona (TalentLab) | Jupyter Notebooks, Pandas, Scikit-learn, Google Drive. | **Propia** (Los datos son provistos por el cliente). |
| **4. Onboarding y Capacitación de Usuarios** | Realización de talleres interactivos de capacitación en línea para directores y mentores (uso de dashboards y alertas) y despliegue del manual digital para los estudiantes (uso del simulador de entrevistas). | 2 días hábiles | Ingeniero de Soporte Académico | 1 persona (TalentLab) | Computador portátil, Google Meet o Zoom, guías PDF e infografías. | **Propia** |
| **5. Operación Diaria: Semáforo de Deserción** | Ingesta automatizada de reportes semanales de notas, inasistencias y estados de pagos de la institución. Procesamiento en backend de FastAPI para actualizar el estado del semáforo predictivo (Riesgo Alto, Medio, Bajo). | Continuo (Tiempo de respuesta < 2s) | Módulo de Backend (Automatizado) | 0 personas (Procesamiento automático) | API FastAPI, Servidor Uvicorn, base de datos Supabase, queries SQL. | **Propia** (Monitoreo técnico a cargo de TalentLab). |
| **6. Operación Diaria: Simulador de Entrevistas** | Acceso de estudiantes a la sección del simulador en React, formulación adaptativa de preguntas del banco de datos por área profesional y análisis semántico por Procesamiento de Lenguaje Natural (PLN) para la generación instantánea de feedback. | Continuo (Evaluación en < 3s) | Módulo de IA (Automatizado) | 0 personas (Procesamiento automático) | Frontend React, APIs de procesamiento NLP (Hugging Face / OpenAI). | **Propia** (Consumo y enrutamiento) con APIs provistas por el **Tercero**. |
| **7. Soporte Técnico Postventa (PQRSD)** | Recepción, clasificación y resolución de reportes de bugs, dudas de usuario o fallos de acceso a través del portal de ayuda. Monitoreo del cumplimiento de SLA del 99.9%. | Continuo (Resolución según severidad en < 24h) | Ingeniero de Soporte Técnico | 1 persona (TalentLab) | Freshdesk, Chat de Soporte WhatsApp Business, consola de errores del backend. | **Propia** |

### 3.3.2. Procesos Tercerizados (Outsourcing)

Para optimizar los costos marginales de operación y asegurar una infraestructura de clase mundial, TalentLab delega en proveedores tecnológicos especializados las tareas no nucleares de mantenimiento de hardware físico:
1.  **Hosting y Base de Datos (Supabase / AWS):** El mantenimiento físico del hardware de servidores, la redundancia eléctrica y la climatización de los centros de datos recaen enteramente sobre los proveedores. TalentLab es exclusivamente responsable del diseño lógico, consultas SQL, seguridad a nivel de software y políticas de control de accesos (RLS).
2.  **Motor de Reconocimiento y APIs NLP (Hugging Face / OpenAI):** La infraestructura computacional para procesar y evaluar los modelos grandes de lenguaje en la simulación de entrevistas se terceriza a través del consumo de APIs estables, permitiendo a TalentLab centrarse en la lógica de evaluación pedagógica y el diseño de la interfaz de usuario.

### 3.3.3. Diagrama de Flujo del Proceso

El siguiente diagrama detalla la ruta de flujo operativo, desde la firma del contrato comercial B2B hasta el ciclo continuo de operación y soporte de TalentLab:

```mermaid
graph TD
    A["Inicio: Firma de Contrato Comercial B2B"] --> B["Aprovisionamiento de base de datos en Supabase"]
    B --> C["Carga de datos académicos históricos (CSV)"]
    C --> D["Entrenamiento y calibración del modelo Random Forest (IA)"]
    D --> E["Taller de capacitación a directivos y estudiantes"]
    E --> F["INICIO DE OPERACIÓN DE LA PLATAFORMA"]
    F --> G{¿Qué acción realiza el usuario?}
    
    G -->|Directivo/Mentor| H["Revisa semáforo de riesgo predictivo"]
    H --> I{¿Hay riesgo detectado?}
    I -->|Sí: Rojo / Amarillo| J["Activa protocolo de tutoría pedagógica"]
    I -->|No: Verde| F
    
    G -->|Estudiante| K["Accede al simulador interactivo de entrevistas"]
    K --> L["Completa la sesión de preguntas con NLP"]
    L --> M["Recibe retroalimentación automática y sugerencias"]
    M --> F
    
    J --> N["Registra ticket de soporte o reporte en Freshdesk"]
    M --> N
    N --> O["Resolución por Ingeniero de Soporte (SLA < 24h)"]
    O --> F
```

---

## 3.4. LOCALIZACIÓN DEL PROYECTO

La localización estratégica de TalentLab está proyectada para aprovechar al máximo las redes de conectividad del ecosistema tecnológico, el talento humano calificado en desarrollo de software y la proximidad con el mercado objetivo comercial.

### 3.4.1. Ubicación Geográfica Propuesta
La empresa establecerá su centro de operaciones administrativas y de ingeniería en la siguiente dirección estratégica:
*   **País:** Colombia
*   **Departamento:** Cundinamarca
*   **Ciudad:** Bogotá D.C.
*   **Localidad:** Chapinero (Zona financiera y de servicios tecnológicos)

### 3.4.2. Justificación de la Localización

1.  **Cercanía al Mercado Objetivo (Demanda):** Bogotá concentra la mayor densidad de instituciones de educación superior privadas y centros de educación técnica y tecnológica de Colombia (más de 120 instituciones activas). La localidad de Chapinero se caracteriza por ser el epicentro de importantes universidades de la ciudad (Universidad Pedagógica Nacional, Universidad Javeriana, Universidad Piloto de Colombia, Politécnico Grancolombiano, Corporación Universitaria de Asturias, entre otras), lo que reduce los costos de desplazamiento comercial para las visitas de preventa presenciales y el relacionamiento cara a cara con rectores y directores de permanencia.
2.  **Acceso a Talento Humano Calificado (Oferta):** Bogotá es el clúster de tecnología y desarrollo de software más grande del país. Esto asegura un flujo continuo de ingenieros de sistemas, desarrolladores frontend/backend y científicos de datos calificados provenientes de instituciones líderes, listos para integrarse al equipo a medida que el software requiera escalar.
3.  **Infraestructura de Conectividad:** La zona elegida cuenta con infraestructuras de telecomunicaciones de fibra óptica redundante de alta disponibilidad, indispensables para las operaciones de despliegue continuo de servidores y las comunicaciones en tiempo real de soporte técnico.

### 3.4.3. Normatividad del Plan de Ordenamiento Territorial (POT) de Bogotá

La operación física de TalentLab se acopla a la normatividad local de planificación urbana, regida bajo el **Decreto 555 de 2021 (Plan de Ordenamiento Territorial - POT de Bogotá "Bogotá Reverdece 2022-2035")**:

*   **Clasificación de Uso del Suelo:** Las actividades de desarrollo de sistemas informáticos, consultoría y procesamiento de datos (actividades CIIU 6201, 6202 y 6311) se encuadran dentro de **Servicios Profesionales de Bajo Impacto** y no residenciales molestos. De acuerdo con el POT, el establecimiento de oficinas administrativas y centros de diseño de software está plenamente permitido en áreas comerciales y zonas de uso mixto.
*   **Impacto Ambiental Urbano:** La sede de la empresa se limitará a oficinas de carácter administrativo, de diseño y reuniones estratégicas, por lo cual **no genera emisiones de ruido, contaminación del aire, residuos peligrosos o vertimientos industriales perjudiciales**. La empresa cumple con creces las normativas de la Secretaría Distrital de Ambiente aplicables a zonas urbanas comerciales.
*   **Estrategia Híbrida de Movilidad y Teletrabajo:** El POT de Bogotá incentiva la descentralización del transporte y el cuidado de la huella ecológica de movilidad. Alineado con esto, TalentLab adoptará una modalidad de **trabajo híbrido (80% teletrabajo / 20% presencial)**. Esto permite operar en una oficina pequeña de 40 metros cuadrados para tareas gerenciales, reduciendo el consumo de energía presencial, los tiempos de desplazamiento de los ingenieros y disminuyendo las emisiones asociadas al transporte urbano de la ciudad.

---

## 3.5. NECESIDADES Y REQUERIMIENTOS

Para asegurar una puesta en marcha coordinada y una operación continua con altos estándares de calidad, se requiere una combinación estructurada de recursos físicos, mobiliario ergonómico, hardware informático e infraestructura de servicios cloud (maquinaria lógica). A continuación, se detallan estos requerimientos clasificados por áreas y su respectiva valorización comercial.

### 3.5.1. Locaciones e Instalaciones

La empresa operará bajo un modelo administrativo centralizado de oficina única en Bogotá, localidad de Chapinero. Para esto, se ha proyectado el arrendamiento de una oficina física de **40 metros cuadrados** dentro de un complejo empresarial o coworking equipado (como WeWork o Regus).

*   **Canon de Arrendamiento Mensual:** **COP $1,800,000** (Incluye servicios de energía eléctrica, agua potable, aseo diario, vigilancia 24/7, acceso a áreas comunes y conexión a internet empresarial de alta velocidad por fibra óptica).
*   **Contrato:** Arrendamiento anual corporativo.

#### Plano de Distribución de Áreas de Trabajo

El espacio se ha diseñado ergonómicamente para optimizar el flujo de trabajo de desarrollo de software y las reuniones comerciales, distribuyendo las áreas de la siguiente manera:

```
+-------------------------------------------------------------+
|                          ACCESO                             |
+---------+----------------------------+----------------------+
|         |                            |                      |
|         |      ÁREA DE DESARROLLO    |     CAFETERÍA        |
|  RECEPC.|      (4 Workstations)      |      Y BIENESTAR     |
|  (Desk) |      [PC1]      [PC2]      |                      |
|         |                            |   +--------+         |
|         |      [PC3]      [PC4]      |   | Cafet. |  [Baño] |
|         |                            |   +--------+         |
+---------+----------------------------+----------------------+
|                                      |                      |
|          SALA DE REUNIONES           |      ARCHIVADOR      |
|           Y ONBOARDING B2B           |         Y            |
|       +----------------------+       |      SERVICIOS       |
|       |        Mesa          |       |                      |
|       +----------------------+       |                      |
+--------------------------------------+----------------------+
```

### 3.5.2. Maquinaria, Equipo y Herramientas

Por ser una empresa proveedora de software basada en tecnologías EdTech e Inteligencia Artificial, **no se requiere maquinaria física, equipos industriales ni herramientas mecánicas**. La "maquinaria" de TalentLab está compuesta por infraestructura virtual e intangibles alojados en la nube.

| Tipo de Herramienta / Servicio | Características Técnicas | Cantidad | Costo Mensual (COP) | Costo Anual Consolidado (COP) | Función en el Proceso |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Bases de Datos Cloud (Supabase)** | PostgreSQL gestionado, backups diarios integrados, capacidad para 100 mil registros en base de datos. Plan Pro. | 1 | $100,000 | $1,200,000 | Almacenamiento seguro de notas, asistencia y datos multi-tenant de usuarios. |
| **Servidores de API (Render / AWS)** | Hosting del backend en FastAPI, procesamiento asíncrono y autoescalamiento. | 1 | $60,000 | $720,000 | Recepción y procesamiento de peticiones lógicas del semáforo e IA. |
| **Procesamiento de IA y PLN (OpenAI)** | APIs para el simulador de entrevistas (análisis semántico de las respuestas). | Variable | $120,000 | $1,440,000 | Motor cognitivo del simulador de entrevistas para estudiantes. |
| **Herramientas de Programación (IDE)** | VS Code, Git, Docker (entorno local). | Ilimitado | $0 | $0 | Herramientas libres para codificación y contenedorización. |
| **TOTALES MAQUINARIA LÓGICA** | **Servicios de Nube Año 1** | | **$280,000** | **$3,360,000** | |

### 3.5.3. Muebles y Enseres de Operación

Mobiliario requerido para la puesta en marcha física de la oficina, enfocado en cumplir las directrices de salud ocupacional y ergonomía:

| Elemento / Mobiliario | Características Técnicas | Cantidad | Costo Unitario (COP) | Costo Total (COP) | Función en el Proceso |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Sillas Ergonómicas** | Asiento ajustable en altura, soporte lumbar ajustable, ruedas de nailon y apoyabrazos. | 4 | $450,000 | $1,800,000 | Postura correcta del equipo técnico durante jornadas de trabajo. |
| **Escritorios Modulares** | Superficie de madera aglomerada de 120x60 cm con pasacables y estructura metálica. | 4 | $300,000 | $1,200,000 | Estaciones de desarrollo y diseño UI de la plataforma. |
| **Mesa de Juntas** | Mesa ovalada en melamina para 4-6 personas. | 1 | $500,000 | $500,000 | Presentaciones B2B con rectores y reuniones de planeación técnica. |
| **Sillas Auxiliares de Reunión** | Silla fija sin ruedas, tapizada en tela lavable. | 4 | $150,000 | $600,000 | Acompañamiento en reuniones de la sala de juntas. |
| **Tablero Acrílico de Vidrio** | Tablero magnético de 120x90 cm. | 1 | $150,000 | $150,000 | Lluvia de ideas, diagramación física de base de datos y flujos. |
| **Archivador Metálico** | Archivador de 3 gavetas con cerradura de seguridad. | 1 | $250,000 | $250,000 | Custodia de contratos físicos y carpetas legales de la empresa. |
| **TOTAL MUEBLES Y ENSERES** | **Inversión Inicial Única** | | | **$4,500,000** | |

### 3.5.4. Equipos de Oficina

Hardware informático, conectividad y redes requeridos para la oficina administrativa y el desarrollo del software:

| Equipo Tecnológico | Especificaciones Técnicas Recomendadas | Cantidad | Costo Unitario (COP) | Costo Total (COP) | Función en el Proceso |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Laptops de Desarrollo** | Procesador Intel Core i7 / AMD Ryzen 7, 16 GB de Memoria RAM, 512 GB SSD. Pantalla Full HD. | 2 | $3,800,000 | $7,600,000 | Equipos principales para programación en React y FastAPI. |
| **Monitores Secundarios** | Monitor de 24 pulgadas Full HD con entrada HDMI / DisplayPort. | 2 | $550,000 | $1,100,000 | Mejora en la visualización de código y bases de datos a doble pantalla. |
| **Router Dual-Band** | Enrutador comercial AC1200 Gigabit con WiFi 5/6 de largo alcance. | 1 | $250,000 | $250,000 | Redundancia y estabilidad en la red interna de la oficina. |
| **Impresora Multifuncional** | Impresora láser en blanco y negro con escáner e impresión doble cara automática. | 1 | $900,000 | $900,000 | Impresión de contratos comerciales y digitalización de reportes de PQRSD. |
| **TOTAL EQUIPOS DE COMPUTO** | **Inversión Inicial Única** | | | **$9,850,000** | |

### 3.5.5. Materias Primas e Insumos Requeridos

En el modelo de negocio SaaS (Software como Servicio), **no existen materias primas físicas** (como plástico, metal o madera). Las materias primas del producto digital están constituidas por el **consumo de infraestructura de procesamiento cloud por cada unidad de producto comercializada** (es decir, por cada institución que adquiere la licencia B2B).

*   **Unidad de Producto:** 1 Suscripción Anual B2B de una Institución Educativa.
*   **Estimación de Insumos por Cliente (Mensual):** Basado en un promedio de 1,000 estudiantes activos por institución.

#### Costo Unitario de Insumos Digitales por Licencia Activa (Mensual)

| Insumo Digital / Recurso | Función Técnica | Cantidad Estimada | Costo Unitario Mensual (COP) | Justificación del Consumo |
| :--- | :--- | :--- | :---: | :--- |
| **Procesamiento API NLP** | API de análisis cognitivo de respuestas en simulador. | ~3,000 llamadas al mes | $15,000 | Evaluar la concordancia semántica de las respuestas de estudiantes en el simulador. |
| **Almacenamiento Supabase** | Espacio en la nube para audio, video y reportes PDF. | 4 GB por cliente / mes | $8,500 | Registro histórico de evidencias de aprendizaje y reportes del semáforo. |
| **Tráfico SMTP (Emails)** | Envío de correos de alerta automáticos a mentores y padres. | 2,000 emails / mes | $2,500 | Comunicación de alertas críticas del semáforo y credenciales de acceso. |
| **TOTAL CONSUMO MENSUAL** | **Insumo por Cliente / Mes** | | **$26,000** | **Representa el 6.9% del precio mensualizado de la licencia.** |

*   **Presupuesto Consolidado de Insumos (Año 1):** Con una meta de ventas de doce (12) licencias en el primer año:
    $$\text{Insumo Anual} = \text{COP } \$26,000 \times 12 \text{ clientes} \times 12 \text{ meses} = \text{COP } \$3,744,000 \text{ al año.}$$
*   **Justificación de Viabilidad:** Al requerir un costo variable por cliente de solo COP $26,000 al mes (frente a un ingreso por cliente de COP $375,000 mensualizados), el producto garantiza un margen bruto operativo por licencia del **93.1%**, demostrando la altísima rentabilidad y escalabilidad del SaaS.

### 3.5.6. Fuentes y Referencias de Costos y Especificaciones

A continuación, se relacionan bajo las normas **APA (7ª edición)** las fuentes de información secundarias y los portales oficiales de consulta externa utilizados para sustentar los precios de mercado, las especificaciones técnicas del hardware, el mobiliario y la normatividad legal e inmobiliaria aplicadas al estudio técnico del proyecto:

*   Alcaldía Mayor de Bogotá. (2021). *Decreto 555 de 2021: Por el cual se adopta la revisión general del Plan de Ordenamiento Territorial de Bogotá D.C.* Secretaría Distrital de Planeación. Registro Distrital No. 7310. https://www.sdp.gov.co/normatividad/pot/decreto-555-de-2021
*   Alkosto. (2026). *Computadores portátiles corporativos y monitores externos.* Portal comercial Alkosto Colombia. https://www.alkosto.com/computadores-tablets/portatiles/c/BI_104_ALKOS
*   Congreso de la República de Colombia. (2012, 17 de octubre). *Ley 1581 de 2012: Por la cual se dictan disposiciones generales para la protección de datos personales.* Diario Oficial No. 48.587. http://www.secretariasenado.gov.co/senado/basedoc/ley_1581_2012.html
*   Dell Technologies Colombia. (2026). *Portátiles empresariales Dell Vostro y accesorios de visualización.* Dell Colombia. https://www.dell.com/es-co/work/shop/scc/sc/laptops
*   Homecenter Colombia. (2026). *Mobiliario de oficina, impresoras láser multifuncionales y enrutadores de red inalámbricos.* Sodimac Colombia. https://www.homecenter.com.co/homecenter-co/category/cat10068/oficina/
*   OpenAI. (2026). *API pricing: Cost per token for language models (GPT-3.5 and GPT-4o).* OpenAI Developer Platform. https://openai.com/pricing
*   Regus Colombia. (2026). *Oficinas privadas y espacios de trabajo flexible en Bogotá (Chapinero).* Regus Group. https://www.regus.com/es-co/colombia/bogota
*   Supabase Inc. (2026). *Supabase pricing plans: Database, user auth, and storage costs.* Supabase Platform. https://supabase.com/pricing
*   Tugó. (2026). *Mobiliario de oficina ergonómico y escritorios modulares.* Tugó Proyectos. https://www.tugo.co/oficina
*   WeWork Colombia. (2026). *Espacios de oficina privados y compartidos en Bogotá (Calle 72).* WeWork Inc. https://www.wework.com/es-CO/l/bogota



