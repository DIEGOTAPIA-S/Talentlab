import os
import re
import json
import random
import sqlite3
from datetime import datetime
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import httpx
from dotenv import load_dotenv

# Cargar variables de entorno opcionales
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
load_dotenv()

# Rutas de base de datos local SQLite (Persistencia garantizada sin depender de Wi-Fi)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "database", "talentlab.db")

# Configuración de cliente Supabase (opcional para modo híbrido en la nube)
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Modo Híbrido: Cliente Supabase inicializado.")
    except Exception as e:
        print(f"Aviso Supabase: {e}. El sistema funcionará con SQLite local resiliente.")

# --- INICIALIZACIÓN DE BASE DE DATOS LOCAL SQLITE ---
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Tabla de Estudiantes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            program TEXT NOT NULL,
            attendance REAL DEFAULT 85.0,
            academic_score REAL DEFAULT 75.0,
            stratum INTEGER DEFAULT 2,
            has_financial_aid INTEGER DEFAULT 0,
            risk_level TEXT NOT NULL,
            risk_probability REAL NOT NULL,
            primary_factor TEXT NOT NULL,
            status TEXT DEFAULT 'Activo',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Tabla de Planes de Apoyo Pedagógico/Institucional
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS support_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            student_id INTEGER,
            assigned_to TEXT NOT NULL,
            type TEXT NOT NULL,
            progress INTEGER DEFAULT 0,
            status TEXT DEFAULT 'En Progreso',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 3. Tabla de Evaluaciones / Historial de Entrevistas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interview_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_email TEXT NOT NULL,
            score INTEGER NOT NULL,
            role_target TEXT,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 4. Tabla de Mentores Egresados (Emparejamiento IA)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mentors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            program TEXT NOT NULL,
            company TEXT NOT NULL,
            role_title TEXT NOT NULL,
            specialty TEXT NOT NULL,
            experience_years INTEGER DEFAULT 2,
            rating REAL DEFAULT 4.9,
            sessions_completed INTEGER DEFAULT 10,
            avatar_initials TEXT,
            available INTEGER DEFAULT 1
        )
    ''')

    # 5. Tabla de Sesiones de Mentoría Agendadas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS mentorship_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            student_email TEXT NOT NULL,
            mentor_id INTEGER NOT NULL,
            mentor_name TEXT NOT NULL,
            topic TEXT NOT NULL,
            scheduled_date TEXT NOT NULL,
            scheduled_time TEXT NOT NULL,
            meet_link TEXT,
            status TEXT DEFAULT 'Confirmada',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 6. Tabla de Red de Egresados (Directorio de Empleabilidad SENA)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS graduates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            program TEXT NOT NULL,
            grad_year INTEGER NOT NULL,
            company TEXT NOT NULL,
            current_role TEXT NOT NULL,
            linkedin_url TEXT,
            is_mentor INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Activo en Industria',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 7. Tabla de Perfiles del Sistema
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_profiles (
            email TEXT PRIMARY KEY,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            institution TEXT NOT NULL,
            title TEXT,
            phone TEXT,
            department TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migraciones idempotentes (bases ya existentes)
    def _add_column(table, column, ddl):
        cols = [c[1] for c in cursor.execute(f'PRAGMA table_info({table})').fetchall()]
        if column not in cols:
            cursor.execute(f'ALTER TABLE {table} ADD COLUMN {column} {ddl}')

    _add_column('students', 'institution', "TEXT DEFAULT 'SENA - Centro de Tecnologías del Software'")
    _add_column('students', 'emotional_status', "TEXT DEFAULT 'Estable'")
    _add_column('students', 'absences_count', "INTEGER DEFAULT 1")
    _add_column('interview_history', 'grammar', 'INTEGER')
    _add_column('interview_history', 'body_language', 'INTEGER')
    _add_column('interview_history', 'alignment', 'INTEGER')
    _add_column('system_profiles', 'status', "TEXT DEFAULT 'Activo'")
    _add_column('system_profiles', 'password', "TEXT DEFAULT '123456'")
    _add_column('support_plans', 'student_email', "TEXT DEFAULT ''")
    _add_column('support_plans', 'institution', "TEXT DEFAULT 'SENA - Centro de Tecnologías del Software'")
    _add_column('support_plans', 'description', "TEXT DEFAULT ''")
    _add_column('support_plans', 'deadline', "TEXT DEFAULT '2026-11-30'")
    _add_column('support_plans', 'priority', "TEXT DEFAULT 'Alta'")
    _add_column('support_plans', 'assigned_by', "TEXT DEFAULT 'Coordinación Académica'")
    _add_column('support_plans', 'student_notes', "TEXT DEFAULT ''")
    cursor.execute("UPDATE students SET institution = 'SENA - Centro de Tecnologías del Software' WHERE institution IS NULL OR institution = ''")
    cursor.execute("UPDATE students SET emotional_status = 'Desmotivación Vocacional' WHERE primary_factor LIKE '%Desmotivación%' AND (emotional_status IS NULL OR emotional_status = 'Estable')")
    cursor.execute("UPDATE students SET emotional_status = 'Estrés / Cruce Estudio-Trabajo' WHERE primary_factor LIKE '%Tiempo%' AND (emotional_status IS NULL OR emotional_status = 'Estable')")
    cursor.execute("UPDATE students SET absences_count = MAX(0, CAST(ROUND((100.0 - attendance) / 4.0) AS INTEGER)) WHERE absences_count IS NULL OR absences_count <= 1")

    # Semilla inicial con datos del Estudio Técnico si la tabla está vacía
    cursor.execute('SELECT COUNT(*) FROM students')
    if cursor.fetchone()[0] == 0:
        initial_students = [
            ("Juan Pérez García", "jperez@talentlab.edu", "Tecnólogo en ADSO", 62.0, 58.0, 1, 0, "alto", 0.82, "Económico (Transporte/Matrícula)", "Activo"),
            ("Camila Restrepo", "crestrepo@talentlab.edu", "Tecnólogo en ADSO", 65.0, 60.0, 2, 0, "alto", 0.78, "Tiempo (Estudio y Trabajo)", "Activo"),
            ("Diego Tapia", "estudiante@talentlab.edu", "Tecnólogo en ADSO", 78.0, 72.0, 2, 1, "medio", 0.55, "Académico (Rendimiento Lógica)", "Activo"),
            ("Mateo Bermúdez", "mbermudez@talentlab.edu", "Diseño Gráfico Digital", 80.0, 70.0, 3, 0, "medio", 0.48, "Personal (Desmotivación Vocacional)", "Riesgo"),
            ("Daniela Rojas", "drojas@talentlab.edu", "Tecnólogo en ADSO", 95.0, 91.0, 3, 1, "bajo", 0.18, "Desempeño Estable", "Activo"),
            ("Estefanía Herrera", "eherrera@talentlab.edu", "Desarrollo de Software", 98.0, 94.0, 2, 1, "bajo", 0.12, "Desempeño Estable", "Activo")
        ]
        cursor.executemany('''
            INSERT INTO students (name, email, program, attendance, academic_score, stratum, has_financial_aid, risk_level, risk_probability, primary_factor, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', initial_students)

    # Semilla de otras instituciones/programas para el consolidado del administrador
    cursor.execute("SELECT COUNT(*) FROM students WHERE institution <> 'SENA - Centro de Tecnologías del Software'")
    if cursor.fetchone()[0] == 0:
        extra_students = [
            ("Sara Londoño", "slondono@sena-agro.edu.co", "Tecnólogo en Gestión Empresarial", 88.0, 82.0, 2, 0, "bajo", 0.22, "Desempeño Estable", "Activo", "SENA - Centro de Comercio y Servicios"),
            ("Julián Cardona", "jcardona@sena-cs.edu.co", "Tecnólogo en Gestión Empresarial", 64.0, 59.0, 1, 0, "alto", 0.80, "Económico (Transporte/Matrícula)", "Riesgo", "SENA - Centro de Comercio y Servicios"),
            ("Natalia Quintero", "nquintero@sena-cs.edu.co", "Tecnólogo en Contabilidad y Finanzas", 79.0, 73.0, 2, 1, "medio", 0.50, "Académico (Rendimiento Lógica)", "Activo", "SENA - Centro de Comercio y Servicios"),
            ("Sebastián Ocampo", "socampo@sena-cs.edu.co", "Tecnólogo en Contabilidad y Finanzas", 93.0, 89.0, 3, 1, "bajo", 0.15, "Desempeño Estable", "Activo", "SENA - Centro de Comercio y Servicios"),
            ("Valeria Mejía", "vmejia@udea-tec.edu.co", "Ingeniería de Sistemas", 91.0, 86.0, 3, 0, "bajo", 0.17, "Desempeño Estable", "Activo", "Institución Universitaria Tecnológica de Antioquia"),
            ("Andrés Giraldo", "agiraldo@udea-tec.edu.co", "Ingeniería de Sistemas", 68.0, 61.0, 2, 0, "alto", 0.74, "Tiempo (Estudio y Trabajo)", "Riesgo", "Institución Universitaria Tecnológica de Antioquia"),
            ("Laura Zapata", "lzapata@udea-tec.edu.co", "Diseño Gráfico Digital", 82.0, 77.0, 2, 0, "medio", 0.46, "Personal (Desmotivación Vocacional)", "Activo", "Institución Universitaria Tecnológica de Antioquia"),
            ("Camilo Arango", "carango@udea-tec.edu.co", "Diseño Gráfico Digital", 96.0, 92.0, 3, 1, "bajo", 0.10, "Desempeño Estable", "Activo", "Institución Universitaria Tecnológica de Antioquia")
        ]
        cursor.executemany('''
            INSERT INTO students (name, email, program, attendance, academic_score, stratum, has_financial_aid, risk_level, risk_probability, primary_factor, status, institution)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', extra_students)

    # Entrevistas con desglose para estudiantes sin historial desglosado
    cursor.execute("SELECT email FROM students")
    import random as _rnd
    _rnd.seed(7)
    for (em,) in cursor.fetchall():
        cursor.execute("SELECT COUNT(*) FROM interview_history WHERE student_email = ? AND grammar IS NOT NULL", (em,))
        if cursor.fetchone()[0] == 0:
            for _ in range(_rnd.randint(1, 2)):
                g, b, a = _rnd.randint(70, 95), _rnd.randint(62, 90), _rnd.randint(65, 94)
                cursor.execute('''
                    INSERT INTO interview_history (student_email, score, role_target, feedback, grammar, body_language, alignment)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (em, round((g + b + a) / 3), "Practicante / Etapa Productiva", "Entrevista de práctica registrada", g, b, a))

    # Semilla y migración de Planes de Mejoramiento Académico y Competencias
    cursor.execute("SELECT COUNT(*) FROM support_plans WHERE description IS NOT NULL AND description <> ''")
    if cursor.fetchone()[0] == 0:
        cursor.execute("DELETE FROM support_plans")
        initial_plans = [
            (
                "Plan de Mejoramiento: Expresión Oral, Método STAR y Arquitectura",
                3, "Diego Tapia", "estudiante@talentlab.edu",
                "SENA - Centro de Tecnologías del Software",
                "Habilidades Blandas y Entrevista",
                "Fortalecer la estructuración de respuestas bajo metodología STAR (Situación, Tarea, Acción, Resultado) y sustentar decisiones de arquitectura de software para etapa productiva.",
                "2026-11-15", "Media", "Patricia Gómez Salazar",
                "He practicado 2 simulaciones con la Dra. Carolina y mejoré mi fluidez verbal.",
                65, "En Progreso"
            ),
            (
                "Plan de Mejoramiento: Nivelación en Algoritmia y Compromiso de Asistencia",
                2, "Camila Restrepo", "crestrepo@talentlab.edu",
                "SENA - Centro de Tecnologías del Software",
                "Académico / Técnico",
                "Desarrollo de taller práctico de lógica de programación en Python, entrega de 3 ejercicios de estructuras de datos y acuerdo de asistencia mínima del 85%.",
                "2026-11-10", "Alta", "Patricia Gómez Salazar",
                "Taller 1 entregado al instructor técnico.",
                35, "En Progreso"
            ),
            (
                "Plan de Mejoramiento: Mitigación de Riesgo Académico y Tutoría Par",
                1, "Juan Pérez García", "jperez@talentlab.edu",
                "SENA - Centro de Tecnologías del Software",
                "Permanencia y Bienestar",
                "Asignación de monitor académico par para nivelación en bases de datos SQL y flexibilización de cronograma de entregas formativas.",
                "2026-11-08", "Alta", "Patricia Gómez Salazar",
                "",
                15, "Pendiente"
            ),
            (
                "Plan de Mejoramiento: Reorientación Vocacional y Portafolio UI/UX",
                4, "Mateo Bermúdez", "mbermudez@talentlab.edu",
                "SENA - Centro de Tecnologías del Software",
                "Psicosocial / Vocacional",
                "Sesión de mentoría con egresado de la industria creativa y entrega de prototipo interactivo de diseño de interfaces.",
                "2026-10-25", "Media", "Patricia Gómez Salazar",
                "Prototipo validado y sesión de mentoría completada con éxito.",
                100, "Completado"
            ),
            (
                "Plan de Mejoramiento: Refuerzo en Indicadores Financieros y Gestión",
                8, "Julián Cardona", "jcardona@sena-cs.edu.co",
                "SENA - Centro de Comercio y Servicios",
                "Académico / Técnico",
                "Nivelación en análisis de estados financieros, KPIs operativos y simulacro de entrevista técnica empresarial.",
                "2026-11-18", "Alta", "Dr. Hernán Darío Mejía",
                "",
                45, "En Progreso"
            ),
            (
                "Plan de Mejoramiento: Arquitectura de Software y Pruebas Unitarias",
                12, "Andrés Giraldo", "agiraldo@udea-tec.edu.co",
                "Institución Universitaria Tecnológica de Antioquia",
                "Académico / Técnico",
                "Implementación de pruebas automatizadas y refactorización de proyecto de Ingeniería de Sistemas con acompañamiento docente.",
                "2026-11-20", "Alta", "Dra. Claudia Marcela Vélez",
                "",
                30, "En Progreso"
            )
        ]
        cursor.executemany('''
            INSERT INTO support_plans (
                title, student_id, assigned_to, student_email, institution,
                type, description, deadline, priority, assigned_by, student_notes, progress, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', initial_plans)

    # Semilla inicial de Mentores
    cursor.execute('SELECT COUNT(*) FROM mentors')
    if cursor.fetchone()[0] == 0:
        initial_mentors = [
            ("Andrés Felipe Navarro", "anavarro@globant.com", "Tecnólogo en ADSO", "Globant", "Tech Lead Full Stack", "Arquitectura Web, React & FastAPI", 4, 4.9, 14, "AN", 1),
            ("Laura Sofía Cárdenas", "lcardenas@mercadolibre.com", "Tecnólogo en ADSO", "Mercado Libre", "Senior Backend Engineer", "Python, Microservicios y PostgreSQL", 3, 5.0, 21, "LC", 1),
            ("Juan Manuel Echeverry", "jecheverry@bancolombia.com.co", "Tecnólogo en ADSO", "Bancolombia", "DevOps & Cloud Specialist", "Git, Docker y Pruebas Unitarias", 3, 4.8, 9, "JE", 1),
            ("Valentina Ríos", "vrios@rappi.com", "Diseño Gráfico Digital", "Rappi", "Product Designer UI/UX", "Diseño de Interfaces y Portafolio", 3, 4.9, 16, "VR", 1)
        ]
        cursor.executemany('''
            INSERT INTO mentors (name, email, program, company, role_title, specialty, experience_years, rating, sessions_completed, avatar_initials, available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', initial_mentors)

    # Semilla inicial de Sesiones de Mentoría para Diego Tapia
    cursor.execute('SELECT COUNT(*) FROM mentorship_sessions')
    if cursor.fetchone()[0] == 0:
        initial_sessions = [
            ("Diego Tapia", "estudiante@talentlab.edu", 1, "Andrés Felipe Navarro", "Refuerzo en Arquitectura de Software y Preparación para Etapa Productiva", "2026-10-27", "16:00", "https://meet.google.com/talentlab-mentoria-1", "Confirmada")
        ]
        cursor.executemany('''
            INSERT INTO mentorship_sessions (student_name, student_email, mentor_id, mentor_name, topic, scheduled_date, scheduled_time, meet_link, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', initial_sessions)

    # Semilla inicial de Egresados
    cursor.execute('SELECT COUNT(*) FROM graduates')
    if cursor.fetchone()[0] == 0:
        initial_graduates = [
            ("Andrés Felipe Navarro", "anavarro@globant.com", "Tecnólogo en ADSO", 2024, "Globant", "Tech Lead Full Stack", "https://linkedin.com/in/andres-navarro-adso", 1, "Activo en Industria"),
            ("Laura Sofía Cárdenas", "lcardenas@mercadolibre.com", "Tecnólogo en ADSO", 2023, "Mercado Libre", "Senior Backend Engineer", "https://linkedin.com/in/laura-cardenas-dev", 1, "Activo en Industria"),
            ("Juan Manuel Echeverry", "jecheverry@bancolombia.com.co", "Tecnólogo en ADSO", 2024, "Bancolombia", "DevOps & Cloud Specialist", "https://linkedin.com/in/juan-echeverry", 1, "Activo en Industria"),
            ("Valentina Ríos", "vrios@rappi.com", "Diseño Gráfico Digital", 2023, "Rappi", "Product Designer UI/UX", "https://linkedin.com/in/valentina-rios-design", 1, "Activo en Industria"),
            ("Carlos Mario Ospina", "cospina@ibm.com", "Tecnólogo en ADSO", 2022, "IBM Colombia", "Data Analyst & Automation", "https://linkedin.com/in/carlos-ospina", 0, "Activo en Industria"),
            ("Mariana Salazar", "msalazar@sura.com.co", "Desarrollo de Software", 2023, "Seguros SURA", "QA Automation Engineer", "https://linkedin.com/in/mariana-salazar-qa", 1, "Activo en Industria")
        ]
        cursor.executemany('''
            INSERT INTO graduates (name, email, program, grad_year, company, current_role, linkedin_url, is_mentor, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', initial_graduates)

    # Perfiles de los 3 Roles del Ecosistema (Super Admin, Directivos por Institución y Estudiante)
    cursor.execute('''
        INSERT OR IGNORE INTO system_profiles (email, full_name, role, institution, title, phone, department, status, password)
        VALUES 
        ('admin@talentlab.edu', 'Carlos Alberto Ramírez', 'super_admin', 'Dirección General', 'Administrador General', '+57 300 910 2030', 'Administración de Plataforma', 'Activo', 'admin123'),
        ('director@talentlab.edu', 'Patricia Gómez Salazar', 'admin_tenant', 'SENA - Centro de Tecnologías del Software', 'Coordinadora de Formación y Permanencia Académica', '+57 (601) 546-1500', 'Coordinación de Formación Profesional', 'Activo', 'director123'),
        ('rector@sena-cs.edu.co', 'Dr. Hernán Darío Mejía', 'admin_tenant', 'SENA - Centro de Comercio y Servicios', 'Subdirector / Rector Institucional', '+57 (604) 576-0000', 'Dirección General de Centro', 'Activo', 'director123'),
        ('coordinador@udea-tec.edu.co', 'Dra. Claudia Marcela Vélez', 'admin_tenant', 'Institución Universitaria Tecnológica de Antioquia', 'Coordinadora de Ingeniería y Permanencia', '+57 (604) 444-3700', 'Facultad de Ingeniería', 'Activo', 'director123'),
        ('estudiante@talentlab.edu', 'Diego Tapia', 'student', 'SENA - Centro de Tecnologías del Software', 'Aprendiz Tecnólogo en ADSO (Ficha 2996897)', '+57 312 411 7048', 'Etapa Lectiva / Proyecto Productivo', 'Activo', 'student123')
    ''')

    # Limpiar etiquetas antiguas del perfil de Administrador General si ya existían en BD
    cursor.execute('''
        UPDATE system_profiles
        SET institution = 'Dirección General',
            title = 'Administrador General',
            department = 'Administración de Plataforma'
        WHERE email = 'admin@talentlab.edu' AND institution LIKE '%Gobierno Global%'
    ''')

    conn.commit()
    conn.close()
    print("Base de datos local SQLite verificada y lista con todas las entidades activas.")

init_db()

# --- ALGORITMO PREDICTIVO MULTIFACTORIAL DE RIESGO DE DESERCIÓN (4 PILARES) ---
def compute_risk_detailed(
    attendance: float,
    academic_score: float,
    stratum: int,
    has_financial_aid: int,
    emotional_status: str = "Estable",
    interview_score: Optional[float] = None
):
    """
    Calcula el nivel de riesgo (alto, medio, bajo), la probabilidad (0.05 a 0.98),
    el Factor Clave predominante y el desglose porcentual de las 4 dimensiones:
    1. Asistencia / Fallas (SOFIA Plus / Reporte de inasistencias)
    2. Rendimiento Académico (Juicios evaluativos y notas)
    3. Vulnerabilidad Socioeconómica (Ficha de caracterización: Estrato y Auxilio)
    4. Estado Emocional / Vocacional y Simulador IA (Bienestar + Filtro 1 RRHH)
    """
    candidates = []

    # 1. Pilar de Asistencia e Inasistencias (Peso máx 0.35)
    if attendance < 70.0:
        att_weight = 0.35
        candidates.append((0.35, "Inasistencias Críticas (<70%)"))
    elif attendance < 82.0:
        att_weight = 0.18
        candidates.append((0.18, "Fallas Recurrentes de Asistencia"))
    else:
        att_weight = 0.02

    # 2. Pilar de Rendimiento Académico (Peso máx 0.32)
    if academic_score < 60.0:
        acad_weight = 0.32
        candidates.append((0.32, "Académico (Rezago Crítico <60 pts)"))
    elif academic_score < 76.0:
        acad_weight = 0.17
        candidates.append((0.17, "Académico (Refuerzo en Competencias)"))
    else:
        acad_weight = 0.02

    # 3. Pilar Socioeconómico y Sostenimiento (Peso máx 0.26)
    if stratum in [1, 2] and not has_financial_aid:
        soc_weight = 0.26
        candidates.append((0.26, "Económico (Transporte / Sin Auxilio)"))
    elif stratum == 3 and not has_financial_aid:
        soc_weight = 0.10
        candidates.append((0.10, "Económico (Requiere Apoyo Bienestar)"))
    else:
        soc_weight = 0.02

    # 4. Pilar Emocional, Vocacional y Simulador IA (Peso máx 0.32)
    emo_clean = (emotional_status or "Estable").strip()
    emo_weight = 0.02
    emo_label = None

    if "Crisis" in emo_clean or (interview_score is not None and interview_score < 50):
        emo_weight = 0.32
        emo_label = "Emocional (Alerta Psicosocial / Actitudinal)"
    elif "Desmotivación" in emo_clean or (interview_score is not None and interview_score < 68):
        emo_weight = 0.24
        emo_label = "Personal (Desmotivación Vocacional)"
    elif "Estrés" in emo_clean or "Tiempo" in emo_clean or "Trabajo" in emo_clean:
        emo_weight = 0.22
        emo_label = "Tiempo (Cruce Estudio y Trabajo)"

    if emo_label:
        candidates.append((emo_weight, emo_label))

    raw_prob = att_weight + acad_weight + soc_weight + emo_weight
    risk_prob = min(max(raw_prob, 0.08), 0.98)

    # Ordenar factores de mayor a menor impacto para elegir el Factor Clave real
    candidates.sort(key=lambda x: x[0], reverse=True)

    if risk_prob >= 0.68:
        level = "alto"
        factor_desc = candidates[0][1] if candidates else "Vulnerabilidad Múltiple"
    elif risk_prob >= 0.38:
        level = "medio"
        factor_desc = candidates[0][1] if candidates else "Alerta Preventiva"
    else:
        level = "bajo"
        factor_desc = "Desempeño Estable"

    breakdown = {
        "attendance_risk_pct": min(100, round((att_weight / 0.35) * 100)),
        "academic_risk_pct": min(100, round((acad_weight / 0.32) * 100)),
        "socioeconomic_risk_pct": min(100, round((soc_weight / 0.26) * 100)),
        "emotional_risk_pct": min(100, round((emo_weight / 0.32) * 100)),
    }

    return level, round(risk_prob, 2), factor_desc, breakdown


def compute_risk(
    attendance: float,
    academic_score: float,
    stratum: int,
    has_financial_aid: int,
    emotional_status: str = "Estable",
    interview_score: Optional[float] = None
):
    level, prob, factor_desc, _ = compute_risk_detailed(
        attendance, academic_score, stratum, has_financial_aid, emotional_status, interview_score
    )
    return level, prob, factor_desc


app = FastAPI(
    title="TalentLab API Backend",
    description="API REST en Python (FastAPI) para Gestión de Matrícula, Semáforo Predictivo, Red de Egresados y Simulador de IA",
    version="1.4.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELOS PYDANTIC ---
class LoginRequest(BaseModel):
    email: str
    password: str
    role: str

class UserSession(BaseModel):
    email: str
    role: str
    fullName: str
    institution: str
    title: Optional[str] = "Coordinadora de Formación y Permanencia Académica"
    phone: Optional[str] = "+57 (601) 546-1500"
    department: Optional[str] = "Coordinación de Formación Profesional"

class ProfileUpdateRequest(BaseModel):
    email: str
    fullName: str
    institution: str
    title: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = None

class StudentCreateRequest(BaseModel):
    name: str
    email: str
    program: str
    institution: Optional[str] = "SENA - Centro de Tecnologías del Software"
    attendance: Optional[float] = 85.0
    absences_count: Optional[int] = None
    academic_score: Optional[float] = 75.0
    stratum: Optional[int] = 2
    has_financial_aid: Optional[int] = 0
    emotional_status: Optional[str] = "Estable"
    status: Optional[str] = "Activo"

class StudentUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    program: Optional[str] = None
    institution: Optional[str] = None
    attendance: Optional[float] = None
    absences_count: Optional[int] = None
    academic_score: Optional[float] = None
    stratum: Optional[int] = None
    has_financial_aid: Optional[int] = None
    emotional_status: Optional[str] = None
    status: Optional[str] = None

class StudentBatchImportRequest(BaseModel):
    institution: str
    rows: List[Dict[str, Any]]

class SupportPlanCreate(BaseModel):
    title: str
    student_id: Optional[int] = None
    student_email: Optional[str] = ""
    assigned_to: str
    institution: Optional[str] = "SENA - Centro de Tecnologías del Software"
    type: str
    description: Optional[str] = ""
    deadline: Optional[str] = "2026-11-30"
    priority: Optional[str] = "Alta"
    assigned_by: Optional[str] = "Coordinación Académica"
    student_notes: Optional[str] = ""
    progress: Optional[int] = 0
    status: Optional[str] = "En Progreso"

class SupportPlanUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    progress: Optional[int] = None
    status: Optional[str] = None
    student_notes: Optional[str] = None

class AdminUserCreateRequest(BaseModel):
    role: str  # 'super_admin' | 'admin_tenant' | 'student'
    name: str
    email: str
    institution: str
    title_or_program: str
    phone: Optional[str] = "+57 300 000 0000"
    department: Optional[str] = "Formación Profesional"
    attendance: Optional[float] = 88.0
    academic_score: Optional[float] = 78.0
    stratum: Optional[int] = 2
    has_financial_aid: Optional[int] = 0
    status: Optional[str] = "Activo"
    password: Optional[str] = "123456"

class AdminUserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    institution: Optional[str] = None
    title_or_program: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    attendance: Optional[float] = None
    academic_score: Optional[float] = None
    stratum: Optional[int] = None
    has_financial_aid: Optional[int] = None
    status: Optional[str] = None

class MentorshipMatchRequest(BaseModel):
    student_program: str
    goal: str
    priorities: Optional[List[str]] = []

class MentorshipBookingRequest(BaseModel):
    student_name: str
    student_email: str
    mentor_id: int
    topic: str
    scheduled_date: str
    scheduled_time: str

class GraduateCreateRequest(BaseModel):
    name: str
    email: str
    program: str
    grad_year: int
    company: str
    current_role: str
    linkedin_url: Optional[str] = None
    is_mentor: Optional[int] = 1

class InterviewRequest(BaseModel):
    message: Optional[str] = None
    userResponse: Optional[str] = None
    student_id: Optional[str] = None
    phase: Optional[int] = 0
    area: Optional[str] = "transversal"
    role_target: Optional[str] = None
    interview_mode: Optional[str] = "hr"
    technical_program: Optional[str] = "software"
    history: Optional[List[Dict[str, Any]]] = []
    gemini_api_key: Optional[str] = None

class InterviewConclusionRequest(BaseModel):
    student_id: Optional[str] = "estudiante@talentlab.co"
    technical_program: Optional[str] = "software"
    role_target: Optional[str] = None
    hr_messages: Optional[List[Dict[str, Any]]] = []
    tech_messages: Optional[List[Dict[str, Any]]] = []
    hr_score: Optional[int] = 80
    tech_score: Optional[int] = 80
    bio_metrics: Optional[Dict[str, Any]] = {}
    is_hostile: Optional[bool] = False
    gemini_api_key: Optional[str] = None


# --- ENDPOINTS REST ---

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "TalentLab AI Backend",
        "version": "1.4.0",
        "storage": "SQLite 3.45 Local (Modo Híbrido PostgreSQL / Supabase)",
        "message": "Servidor de Backend de TalentLab en FastAPI está en línea y operando."
    }

# 1. ESTADO DEL SISTEMA Y BASE DE DATOS
@app.get("/api/system/status")
def get_system_status():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM students")
    students_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM support_plans")
    plans_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM mentors")
    mentors_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM graduates")
    graduates_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM interview_history")
    interviews_count = cursor.fetchone()[0]

    conn.close()

    return {
        "database": {
            "engine": "SQLite 3.45 Relacional Embebido",
            "file": DB_PATH,
            "status": "Conectada y Operativa",
            "cloud_compatibility": "PostgreSQL v15 (Supabase / Neon Ready)",
            "isolation_model": "Multi-tenant por tenant_id",
            "tables": {
                "students": students_count,
                "support_plans": plans_count,
                "mentors": mentors_count,
                "graduates": graduates_count,
                "interview_history": interviews_count
            }
        },
        "server": {
            "framework": "FastAPI (Python 3.12)",
            "port": 8000,
            "uptime_sla": "99.9%",
            "active_tenant": "SENA Centro de Tecnologías del Software"
        }
    }

# 2. AUTENTICACIÓN Y ROLES (3 PERFILES: SUPER_ADMIN, DIRECTIVO INSTITUCIONAL Y ESTUDIANTE)
@app.post("/api/auth/login", response_model=UserSession)
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    password = payload.password.strip()
    role = payload.role

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_profiles WHERE LOWER(email) = ?", (email,))
    saved_profile = cursor.fetchone()

    # También buscar en tabla de estudiantes por si el Administrador o Directivo creó un estudiante nuevo
    cursor.execute("SELECT * FROM students WHERE LOWER(email) = ?", (email,))
    student_row = cursor.fetchone()
    conn.close()

    if saved_profile and saved_profile["role"] == "super_admin" and role != "student":
        return UserSession(
            email=saved_profile["email"],
            role="super_admin",
            fullName=saved_profile["full_name"],
            institution=saved_profile["institution"] if "Gobierno Global" not in (saved_profile["institution"] or "") else "Dirección General",
            title=saved_profile["title"] or "Administrador General",
            phone=saved_profile["phone"] or "+57 300 910 2030",
            department=saved_profile["department"] or "Administración de Plataforma"
        )

    if saved_profile and saved_profile["role"] in ("admin_tenant", "directivo") and role != "student":
        return UserSession(
            email=saved_profile["email"],
            role="admin_tenant",
            fullName=saved_profile["full_name"],
            institution=saved_profile["institution"],
            title=saved_profile["title"] or "Coordinador Académico Institucional",
            phone=saved_profile["phone"] or "+57 (601) 546-1500",
            department=saved_profile["department"] or "Coordinación de Formación Profesional"
        )

    if role == "super_admin":
        return UserSession(
            email=email if "@" in email else "admin@talentlab.edu",
            role="super_admin",
            fullName="Carlos Alberto Ramírez",
            institution="Dirección General",
            title="Administrador General",
            phone="+57 300 910 2030",
            department="Administración de Plataforma"
        )

    elif role == "student":
        if student_row:
            return UserSession(
                email=student_row["email"],
                role="student",
                fullName=student_row["name"],
                institution=student_row["institution"] or "SENA - Centro de Tecnologías del Software",
                title=f"Aprendiz / Estudiante - {student_row['program']}",
                phone=saved_profile["phone"] if saved_profile else "+57 312 411 7048",
                department="Etapa Lectiva / Proyecto Productivo"
            )
        if saved_profile:
            return UserSession(
                email=saved_profile["email"],
                role="student",
                fullName=saved_profile["full_name"],
                institution=saved_profile["institution"],
                title=saved_profile["title"] or "Aprendiz Tecnólogo en ADSO",
                phone=saved_profile["phone"] or "+57 312 411 7048",
                department=saved_profile["department"] or "Etapa Lectiva SENA"
            )
        return UserSession(
            email=email if "@" in email else "estudiante@talentlab.edu",
            role="student",
            fullName="Diego Tapia",
            institution="SENA - Centro de Tecnologías del Software",
            title="Aprendiz Tecnólogo en ADSO (Ficha 2996897)",
            phone="+57 312 411 7048",
            department="Etapa Lectiva / Proyecto Productivo"
        )
            
    elif role in ("admin_tenant", "directivo"):
        if saved_profile and saved_profile["role"] in ("admin_tenant", "directivo"):
            return UserSession(
                email=saved_profile["email"],
                role="admin_tenant",
                fullName=saved_profile["full_name"],
                institution=saved_profile["institution"],
                title=saved_profile["title"] or "Coordinadora de Formación y Permanencia Académica",
                phone=saved_profile["phone"] or "+57 (601) 546-1500",
                department=saved_profile["department"] or "Coordinación de Formación Profesional"
            )
        return UserSession(
            email=email if "@" in email else "director@talentlab.edu",
            role="admin_tenant",
            fullName="Patricia Gómez Salazar",
            institution="SENA - Centro de Tecnologías del Software",
            title="Coordinadora de Formación y Permanencia Académica",
            phone="+57 (601) 546-1500",
            department="Coordinación de Formación Profesional"
        )
            
    raise HTTPException(status_code=400, detail="Rol de acceso no reconocido. Seleccione Administrador, Directivo o Estudiante.")

# 3. PERFIL DE USUARIO (CONSULTAR Y ACTUALIZAR)
@app.get("/api/auth/profile")
def get_user_profile(email: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_profiles WHERE LOWER(email) = ?", (email.lower(),))
    profile = cursor.fetchone()
    if not profile:
        cursor.execute("SELECT * FROM students WHERE LOWER(email) = ?", (email.lower(),))
        st = cursor.fetchone()
        conn.close()
        if st:
            return {
                "email": st["email"],
                "fullName": st["name"],
                "role": "student",
                "institution": st["institution"],
                "title": f"Aprendiz - {st['program']}",
                "phone": "+57 312 411 7048",
                "department": "Formación Profesional"
            }
        raise HTTPException(status_code=404, detail="Perfil no encontrado.")
    conn.close()

    return {
        "email": profile["email"],
        "fullName": profile["full_name"],
        "role": profile["role"],
        "institution": profile["institution"],
        "title": profile["title"],
        "phone": profile["phone"],
        "department": profile["department"]
    }

@app.put("/api/auth/profile")
def update_user_profile(payload: ProfileUpdateRequest):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM system_profiles WHERE LOWER(email) = ?", (payload.email.lower(),))
    existing = cursor.fetchone()
    role_val = existing["role"] if existing else ("super_admin" if "admin@" in payload.email else ("admin_tenant" if "director" in payload.email or "rector" in payload.email or "coordinador" in payload.email else "student"))

    cursor.execute('''
        INSERT INTO system_profiles (email, full_name, role, institution, title, phone, department)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
            full_name = excluded.full_name,
            institution = excluded.institution,
            title = excluded.title,
            phone = excluded.phone,
            department = excluded.department,
            updated_at = CURRENT_TIMESTAMP
    ''', (
        payload.email,
        payload.fullName,
        role_val,
        payload.institution,
        payload.title or "Coordinador Institucional",
        payload.phone or "",
        payload.department or ""
    ))

    # Si también existe como estudiante, mantener sincronizado su nombre e institución
    cursor.execute("UPDATE students SET name = ?, institution = ? WHERE LOWER(email) = ?", (payload.fullName, payload.institution, payload.email.lower()))

    conn.commit()
    conn.close()

    return {
        "message": "Perfil actualizado exitosamente en la base de datos.",
        "profile": {
            "email": payload.email,
            "fullName": payload.fullName,
            "institution": payload.institution,
            "title": payload.title,
            "phone": payload.phone,
            "department": payload.department
        }
    }

# 3b. GOBIERNO GLOBAL DE USUARIOS Y RECOMENDACIONES IA (EXCLUSIVO SUPER ADMINISTRADOR)
@app.get("/api/admin/users")
def get_all_ecosystem_users(role_filter: Optional[str] = None, institution: Optional[str] = None, search: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM system_profiles WHERE role IN ('super_admin', 'admin_tenant') ORDER BY role DESC, full_name ASC")
    staff_rows = cursor.fetchall()

    cursor.execute("SELECT * FROM students ORDER BY id DESC")
    student_rows = cursor.fetchall()

    cursor.execute("SELECT student_email, AVG(score) as avg_iv, COUNT(*) as iv_count FROM interview_history GROUP BY student_email")
    iv_map = {r["student_email"].lower(): {"avg": round(r["avg_iv"]), "count": r["iv_count"]} for r in cursor.fetchall()}

    cursor.execute("SELECT student_email, assigned_to, COUNT(*) as plan_count FROM support_plans GROUP BY student_email, assigned_to")
    plan_rows = cursor.fetchall()
    conn.close()

    staff_list = []
    for s in staff_rows:
        if institution and institution != "todas" and s["institution"] != institution:
            continue
        if search:
            q = search.lower()
            if q not in s["full_name"].lower() and q not in s["email"].lower() and q not in s["institution"].lower() and q not in (s["title"] or "").lower():
                continue
        raw_inst = s["institution"] or "Dirección General"
        clean_inst = "Dirección General" if "Gobierno Global" in raw_inst else raw_inst
        raw_title = s["title"] or ("Administrador General" if s["role"] == "super_admin" else "Directivo Institucional")
        clean_title = "Administrador General" if "Super Admin" in raw_title else raw_title
        staff_list.append({
            "uid": f"staff:{s['email']}",
            "email": s["email"],
            "name": s["full_name"],
            "role": s["role"],
            "roleLabel": "Administrador General" if s["role"] == "super_admin" else "Directivo Institucional",
            "institution": clean_inst,
            "titleOrProgram": clean_title,
            "phone": s["phone"] or "+57 300 000 0000",
            "department": s["department"] or "Dirección Académica",
            "status": s["status"] if "status" in s.keys() and s["status"] else "Activo"
        })

    students_list = []
    for st in student_rows:
        if institution and institution != "todas" and st["institution"] != institution:
            continue
        if search:
            q = search.lower()
            if q not in st["name"].lower() and q not in st["email"].lower() and q not in st["institution"].lower() and q not in st["program"].lower():
                continue
        iv_info = iv_map.get(st["email"].lower(), {"avg": None, "count": 0})
        p_count = sum(r["plan_count"] for r in plan_rows if (r["student_email"] and r["student_email"].lower() == st["email"].lower()) or r["assigned_to"].lower() == st["name"].lower())
        students_list.append({
            "uid": f"student:{st['id']}",
            "id": st["id"],
            "email": st["email"],
            "name": st["name"],
            "role": "student",
            "roleLabel": "Estudiante / Aprendiz",
            "institution": st["institution"],
            "titleOrProgram": st["program"],
            "program": st["program"],
            "attendance": st["attendance"],
            "academic_score": st["academic_score"],
            "stratum": st["stratum"],
            "has_financial_aid": bool(st["has_financial_aid"]),
            "risk": st["risk_level"],
            "risk_probability": f"{int(st['risk_probability'] * 100)}%",
            "factor": st["primary_factor"],
            "interview_score": iv_info["avg"],
            "interview_count": iv_info["count"],
            "plans_count": p_count,
            "status": st["status"]
        })

    # Consolidar instituciones del ecosistema
    all_insts = sorted(
        ({s["institution"] for s in staff_rows if s["role"] != "super_admin"} | {st["institution"] for st in student_rows})
    )
    institutions_summary = []
    for inst in all_insts:
        inst_staff = [s for s in staff_rows if s["institution"] == inst and s["role"] == "admin_tenant"]
        inst_students = [st for st in student_rows if st["institution"] == inst]
        high_risk = [st for st in inst_students if st["risk_level"] == "alto"]
        institutions_summary.append({
            "name": inst,
            "directivesCount": len(inst_staff),
            "directivesNames": [s["full_name"] for s in inst_staff],
            "studentsCount": len(inst_students),
            "highRiskCount": len(high_risk),
            "avgAcademic": round(sum(st["academic_score"] for st in inst_students) / len(inst_students), 1) if inst_students else 0
        })

    # Generar recomendaciones estratégicas en tiempo real para el Super Administrador
    recommendations = []
    unassigned_high_risk = []
    for st in student_rows:
        if st["risk_level"] == "alto":
            p_count = sum(r["plan_count"] for r in plan_rows if (r["student_email"] and r["student_email"].lower() == st["email"].lower()) or r["assigned_to"].lower() == st["name"].lower())
            if p_count == 0:
                unassigned_high_risk.append(f"{st['name']} ({st['institution']})")

    if unassigned_high_risk:
        recommendations.append({
            "id": "rec_high_risk",
            "severity": "alta",
            "icon": "fa-triangle-exclamation",
            "title": f"{len(unassigned_high_risk)} Estudiante(s) en Riesgo Alto sin Plan de Mejoramiento",
            "description": f"Se detectaron estudiantes en semáforo rojo sin plan activo: {', '.join(unassigned_high_risk[:3])}. Se recomienda asignarles un Plan de Mejoramiento inmediato.",
            "actionLabel": "Ir a Planes de Mejoramiento",
            "actionPath": "/planes"
        })

    inst_without_director = [i["name"] for i in institutions_summary if i["directivesCount"] == 0]
    if inst_without_director:
        recommendations.append({
            "id": "rec_no_director",
            "severity": "media",
            "icon": "fa-user-tie",
            "title": f"Institución sin Directivo / Coordinador Asignado",
            "description": f"La sede '{inst_without_director[0]}' tiene estudiantes activos pero no cuenta con un Coordinador o Rector asignado para su monitoreo.",
            "actionLabel": "Crear Directivo Ahora",
            "actionType": "open_create_director"
        })

    low_iv_students = [st["name"] for st in student_rows if iv_map.get(st["email"].lower(), {}).get("avg") and iv_map[st["email"].lower()]["avg"] < 70]
    if low_iv_students:
        recommendations.append({
            "id": "rec_low_interview",
            "severity": "media",
            "icon": "fa-microphone-lines",
            "title": f"Refuerzo Requerido en Simulador de Entrevistas ({len(low_iv_students)} alumnos)",
            "description": f"Estudiantes con puntaje menor a 70/100 en entrevista IA: {', '.join(low_iv_students[:3])}. Sugerido activar Plan de Mejoramiento en Habilidades Blandas y Método STAR.",
            "actionLabel": "Ver Consolidado Académico",
            "actionPath": "/consolidado"
        })

    recommendations.append({
        "id": "rec_multi_tenant_ok",
        "severity": "optima",
        "icon": "fa-shield-check",
        "title": "Aislamiento Multi-Institución Activo y Sincronizado",
        "description": f"El ecosistema opera con {len(institutions_summary)} instituciones activas, {len(staff_rows)} perfiles administrativos y {len(student_rows)} estudiantes sincronizados en tiempo real.",
        "actionLabel": "Ver Métricas Globales",
        "actionPath": "/consolidado"
    })

    return {
        "staff": staff_list,
        "students": students_list,
        "institutions": institutions_summary,
        "allInstitutionNames": all_insts,
        "kpis": {
            "totalUsers": len(staff_rows) + len(student_rows),
            "totalStaff": len(staff_rows),
            "totalStudents": len(student_rows),
            "totalInstitutions": len(all_insts),
            "highRiskTotal": sum(1 for st in student_rows if st["risk_level"] == "alto")
        },
        "recommendations": recommendations
    }

@app.post("/api/admin/users", status_code=201)
def admin_create_user(payload: AdminUserCreateRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    clean_email = payload.email.strip().lower()

    if payload.role in ("super_admin", "admin_tenant", "directivo"):
        role_db = "super_admin" if payload.role == "super_admin" else "admin_tenant"
        cursor.execute("SELECT email FROM system_profiles WHERE LOWER(email) = ?", (clean_email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Ya existe un usuario registrado con ese correo institucional.")

        cursor.execute('''
            INSERT INTO system_profiles (email, full_name, role, institution, title, phone, department, status, password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            clean_email,
            payload.name.strip(),
            role_db,
            payload.institution.strip(),
            payload.title_or_program.strip() or "Coordinador Académico Institucional",
            payload.phone or "+57 (601) 546-1500",
            payload.department or "Coordinación Académica",
            payload.status or "Activo",
            payload.password or "director123"
        ))
        conn.commit()
        conn.close()
        return {"message": f"Perfil administrativo ({payload.name}) creado exitosamente para {payload.institution}."}
    else:
        # Crear estudiante tanto en tabla students como en system_profiles
        cursor.execute("SELECT id FROM students WHERE LOWER(email) = ?", (clean_email,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Ya existe un estudiante registrado con ese correo.")

        risk_level, risk_prob, primary_factor = compute_risk(
            attendance=payload.attendance or 85.0,
            academic_score=payload.academic_score or 75.0,
            stratum=payload.stratum or 2,
            has_financial_aid=payload.has_financial_aid or 0
        )

        cursor.execute('''
            INSERT INTO students (name, email, program, attendance, academic_score, stratum, has_financial_aid, risk_level, risk_probability, primary_factor, status, institution)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            payload.name.strip(),
            clean_email,
            payload.title_or_program.strip() or "Tecnólogo en ADSO",
            payload.attendance or 85.0,
            payload.academic_score or 75.0,
            payload.stratum or 2,
            payload.has_financial_aid or 0,
            risk_level,
            risk_prob,
            primary_factor,
            payload.status or "Activo",
            payload.institution.strip()
        ))

        cursor.execute('''
            INSERT OR REPLACE INTO system_profiles (email, full_name, role, institution, title, phone, department, status, password)
            VALUES (?, ?, 'student', ?, ?, ?, 'Formación Profesional', ?, ?)
        ''', (
            clean_email,
            payload.name.strip(),
            payload.institution.strip(),
            f"Aprendiz - {payload.title_or_program.strip()}",
            payload.phone or "+57 312 000 0000",
            payload.status or "Activo",
            payload.password or "student123"
        ))

        conn.commit()
        conn.close()
        return {"message": f"Estudiante {payload.name} creado y vinculado a {payload.institution}."}

@app.put("/api/admin/users/staff/{email}")
def admin_update_staff(email: str, payload: AdminUserUpdateRequest):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM system_profiles WHERE LOWER(email) = ?", (email.lower(),))
    prof = cursor.fetchone()
    if not prof:
        conn.close()
        raise HTTPException(status_code=404, detail="Perfil administrativo no encontrado.")

    new_name = payload.name if payload.name is not None else prof["full_name"]
    new_role = payload.role if payload.role is not None else prof["role"]
    new_inst = payload.institution if payload.institution is not None else prof["institution"]
    new_title = payload.title_or_program if payload.title_or_program is not None else prof["title"]
    new_phone = payload.phone if payload.phone is not None else prof["phone"]
    new_dept = payload.department if payload.department is not None else prof["department"]
    new_status = payload.status if payload.status is not None else (prof["status"] if "status" in prof.keys() else "Activo")

    cursor.execute('''
        UPDATE system_profiles
        SET full_name = ?, role = ?, institution = ?, title = ?, phone = ?, department = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE LOWER(email) = ?
    ''', (new_name, new_role, new_inst, new_title, new_phone, new_dept, new_status, email.lower()))

    conn.commit()
    conn.close()
    return {"message": "Usuario administrativo actualizado correctamente."}

@app.delete("/api/admin/users/staff/{email}")
def admin_delete_staff(email: str):
    if email.lower() == "admin@talentlab.edu":
        raise HTTPException(status_code=400, detail="No se puede eliminar la cuenta maestra del Super Administrador principal.")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM system_profiles WHERE LOWER(email) = ?", (email.lower(),))
    conn.commit()
    conn.close()
    return {"message": "Directivo eliminado del sistema exitosamente."}

# 4. GESTIÓN CRUD DE ESTUDIANTES (FILTRADO POR INSTITUCIÓN PARA DIRECTIVOS Y GLOBAL PARA ADMIN)
@app.get("/api/students")
def get_students(search: Optional[str] = None, risk: Optional[str] = None, institution: Optional[str] = None, program: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM students WHERE 1=1"
    params = []

    if institution and institution != "todas":
        query += " AND institution = ?"
        params.append(institution)

    if program and program != "todos":
        query += " AND program = ?"
        params.append(program)

    if search:
        query += " AND (name LIKE ? OR program LIKE ? OR email LIKE ? OR institution LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s, s])

    if risk and risk != "todos":
        query += " AND risk_level = ?"
        params.append(risk)

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    cursor.execute("SELECT student_email, AVG(score) as avg_iv FROM interview_history GROUP BY student_email")
    iv_map = {r["student_email"].lower(): round(r["avg_iv"]) for r in cursor.fetchall()}

    cursor.execute("SELECT student_email, assigned_to, COUNT(*) as cnt FROM support_plans GROUP BY student_email, assigned_to")
    plan_rows = cursor.fetchall()
    conn.close()

    students = []
    for r in rows:
        p_count = sum(pr["cnt"] for pr in plan_rows if (pr["student_email"] and pr["student_email"].lower() == r["email"].lower()) or pr["assigned_to"].lower() == r["name"].lower())
        iv_sc = iv_map.get(r["email"].lower())
        emo_st = r["emotional_status"] if "emotional_status" in r.keys() and r["emotional_status"] else "Estable"
        abs_cnt = r["absences_count"] if "absences_count" in r.keys() and r["absences_count"] is not None else max(0, round((100.0 - r["attendance"]) / 4.0))
        _, _, _, breakdown = compute_risk_detailed(
            attendance=r["attendance"],
            academic_score=r["academic_score"],
            stratum=r["stratum"],
            has_financial_aid=r["has_financial_aid"],
            emotional_status=emo_st,
            interview_score=iv_sc
        )
        students.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "program": r["program"],
            "institution": r["institution"],
            "attendance": r["attendance"],
            "absences_count": abs_cnt,
            "academic_score": r["academic_score"],
            "stratum": r["stratum"],
            "has_financial_aid": bool(r["has_financial_aid"]),
            "emotional_status": emo_st,
            "risk": r["risk_level"],
            "risk_probability": f"{int(r['risk_probability'] * 100)}%",
            "factor": r["primary_factor"],
            "risk_breakdown": breakdown,
            "status": r["status"],
            "score": f"{int(r['risk_probability'] * 100)}%",
            "interview_score": iv_sc,
            "plans_count": p_count
        })

    return {"students": students, "total": len(students)}

@app.post("/api/students", status_code=201)
def create_student(payload: StudentCreateRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    clean_email = payload.email.strip().lower()

    cursor.execute("SELECT id FROM students WHERE LOWER(email) = ?", (clean_email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")

    att_val = payload.attendance if payload.attendance is not None else 85.0
    abs_val = payload.absences_count if payload.absences_count is not None else max(0, round((100.0 - att_val) / 4.0))
    emo_val = payload.emotional_status or "Estable"

    risk_level, risk_prob, primary_factor = compute_risk(
        attendance=att_val,
        academic_score=payload.academic_score or 75.0,
        stratum=payload.stratum or 2,
        has_financial_aid=payload.has_financial_aid or 0,
        emotional_status=emo_val
    )

    inst = payload.institution or "SENA - Centro de Tecnologías del Software"

    cursor.execute('''
        INSERT INTO students (name, email, program, attendance, absences_count, academic_score, stratum, has_financial_aid, emotional_status, risk_level, risk_probability, primary_factor, status, institution)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        payload.name.strip(),
        clean_email,
        payload.program,
        att_val,
        abs_val,
        payload.academic_score,
        payload.stratum,
        payload.has_financial_aid,
        emo_val,
        risk_level,
        risk_prob,
        primary_factor,
        payload.status or "Activo",
        inst
    ))

    new_id = cursor.lastrowid

    # Sincronizar también en system_profiles para que el estudiante pueda iniciar sesión de inmediato
    cursor.execute('''
        INSERT OR REPLACE INTO system_profiles (email, full_name, role, institution, title, phone, department, status, password)
        VALUES (?, ?, 'student', ?, ?, '+57 312 000 0000', 'Formación Profesional', ?, 'student123')
    ''', (clean_email, payload.name.strip(), inst, f"Aprendiz - {payload.program}", payload.status or "Activo"))

    conn.commit()
    conn.close()

    return {
        "message": "Estudiante registrado exitosamente.",
        "student": {
            "id": new_id,
            "name": payload.name,
            "email": clean_email,
            "program": payload.program,
            "institution": inst,
            "risk": risk_level,
            "risk_probability": f"{int(risk_prob * 100)}%",
            "factor": primary_factor,
            "status": payload.status or "Activo"
        }
    }

@app.put("/api/students/{student_id}")
def update_student(student_id: int, payload: StudentUpdateRequest):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    if not student:
        conn.close()
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")

    old_email = student["email"]
    new_name = payload.name if payload.name is not None else student["name"]
    new_email = payload.email.strip().lower() if payload.email is not None else student["email"]
    new_program = payload.program if payload.program is not None else student["program"]
    new_attendance = payload.attendance if payload.attendance is not None else student["attendance"]
    new_absences = payload.absences_count if payload.absences_count is not None else max(0, round((100.0 - new_attendance) / 4.0))
    new_score = payload.academic_score if payload.academic_score is not None else student["academic_score"]
    new_stratum = payload.stratum if payload.stratum is not None else student["stratum"]
    new_aid = payload.has_financial_aid if payload.has_financial_aid is not None else student["has_financial_aid"]
    new_emo = payload.emotional_status if payload.emotional_status is not None else (student["emotional_status"] if "emotional_status" in student.keys() else "Estable")
    new_status = payload.status if payload.status is not None else student["status"]
    new_institution = payload.institution if payload.institution is not None else student["institution"]

    cursor.execute("SELECT AVG(score) as avg_iv FROM interview_history WHERE LOWER(student_email) = ?", (new_email.lower(),))
    iv_row = cursor.fetchone()
    iv_avg = round(iv_row["avg_iv"]) if iv_row and iv_row["avg_iv"] is not None else None

    risk_level, risk_prob, primary_factor = compute_risk(
        attendance=new_attendance,
        academic_score=new_score,
        stratum=new_stratum,
        has_financial_aid=new_aid,
        emotional_status=new_emo,
        interview_score=iv_avg
    )

    cursor.execute('''
        UPDATE students 
        SET name = ?, email = ?, program = ?, attendance = ?, absences_count = ?, academic_score = ?, stratum = ?, has_financial_aid = ?, emotional_status = ?, risk_level = ?, risk_probability = ?, primary_factor = ?, status = ?, institution = ?
        WHERE id = ?
    ''', (
        new_name, new_email, new_program, new_attendance, new_absences, new_score, new_stratum, new_aid, new_emo, risk_level, risk_prob, primary_factor, new_status, new_institution, student_id
    ))

    cursor.execute('''
        UPDATE system_profiles
        SET email = ?, full_name = ?, institution = ?, title = ?, status = ?
        WHERE LOWER(email) = ?
    ''', (new_email, new_name, new_institution, f"Aprendiz - {new_program}", new_status, old_email.lower()))

    conn.commit()
    conn.close()

    return {
        "message": "Estudiante actualizado y Semáforo de Riesgo recalculado.",
        "student": {
            "id": student_id,
            "name": new_name,
            "email": new_email,
            "program": new_program,
            "institution": new_institution,
            "risk": risk_level,
            "risk_probability": f"{int(risk_prob * 100)}%",
            "factor": primary_factor,
            "status": new_status
        }
    }

@app.post("/api/students/import-batch")
def import_students_batch(payload: StudentBatchImportRequest):
    """
    Permite al Directivo cargar o actualizar masivamente los datos de sus estudiantes
    (Asistencia/Fallas desde SOFIA Plus, Notas Académicas, Caracterización Socioeconómica y Estado Emocional)
    mediante archivo CSV, recalculando el Semáforo y Factor Clave automáticamente.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    created_count = 0
    updated_count = 0

    for row in payload.rows:
        name = str(row.get("name") or row.get("nombre") or "").strip()
        email = str(row.get("email") or row.get("correo") or "").strip().lower()
        if not name or not email:
            continue

        program = str(row.get("program") or row.get("programa") or "Tecnólogo en ADSO").strip()
        attendance = float(row.get("attendance") or row.get("asistencia") or 85.0)
        absences = int(row.get("absences_count") or row.get("fallas") or max(0, round((100.0 - attendance) / 4.0)))
        academic_score = float(row.get("academic_score") or row.get("promedio") or 75.0)
        stratum = int(row.get("stratum") or row.get("estrato") or 2)
        aid_raw = str(row.get("has_financial_aid") or row.get("auxilio") or "0").strip().lower()
        has_aid = 1 if aid_raw in ("1", "si", "sí", "true", "yes") else 0
        emo_status = str(row.get("emotional_status") or row.get("estado_emocional") or "Estable").strip()

        risk_level, risk_prob, primary_factor = compute_risk(
            attendance=attendance,
            academic_score=academic_score,
            stratum=stratum,
            has_financial_aid=has_aid,
            emotional_status=emo_status
        )

        cursor.execute("SELECT id FROM students WHERE LOWER(email) = ?", (email,))
        existing = cursor.fetchone()
        if existing:
            cursor.execute('''
                UPDATE students
                SET name = ?, program = ?, attendance = ?, absences_count = ?, academic_score = ?,
                    stratum = ?, has_financial_aid = ?, emotional_status = ?,
                    risk_level = ?, risk_probability = ?, primary_factor = ?, institution = ?
                WHERE id = ?
            ''', (
                name, program, attendance, absences, academic_score,
                stratum, has_aid, emo_status,
                risk_level, risk_prob, primary_factor, payload.institution, existing["id"]
            ))
            updated_count += 1
        else:
            cursor.execute('''
                INSERT INTO students (name, email, program, attendance, absences_count, academic_score, stratum, has_financial_aid, emotional_status, risk_level, risk_probability, primary_factor, status, institution)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo', ?)
            ''', (
                name, email, program, attendance, absences, academic_score,
                stratum, has_aid, emo_status,
                risk_level, risk_prob, primary_factor, payload.institution
            ))
            cursor.execute('''
                INSERT OR REPLACE INTO system_profiles (email, full_name, role, institution, title, phone, department, status, password)
                VALUES (?, ?, 'student', ?, ?, '+57 312 000 0000', 'Formación Profesional', 'Activo', 'student123')
            ''', (email, name, payload.institution, f"Aprendiz - {program}"))
            created_count += 1

    conn.commit()
    conn.close()
    return {
        "message": f"Sincronización completada: {created_count} estudiantes nuevos y {updated_count} actualizados con Semáforo IA recalculado.",
        "created": created_count,
        "updated": updated_count
    }

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    st = cursor.fetchone()
    if not st:
        conn.close()
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")

    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
    cursor.execute("DELETE FROM support_plans WHERE student_id = ? OR LOWER(student_email) = ?", (student_id, st["email"].lower()))
    cursor.execute("DELETE FROM system_profiles WHERE LOWER(email) = ? AND role = 'student'", (st["email"].lower(),))
    conn.commit()
    conn.close()

    return {"message": "Estudiante eliminado exitosamente del sistema."}

# 5. SEMÁFORO PREDICTIVO Y KPIS DEL DASHBOARD (FILTRADO POR INSTITUCIÓN PARA DIRECTIVOS)
@app.get("/api/dashboard/risk-semaphore")
def get_risk_semaphore(institution: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    if institution and institution != "todas":
        cursor.execute("SELECT * FROM students WHERE institution = ? ORDER BY id DESC", (institution,))
    else:
        cursor.execute("SELECT * FROM students ORDER BY id DESC")
    rows = cursor.fetchall()

    cursor.execute("SELECT student_email, AVG(score) as avg_iv, COUNT(*) as cnt FROM interview_history GROUP BY student_email")
    iv_map = {r["student_email"].lower(): {"avg": round(r["avg_iv"]), "cnt": r["cnt"]} for r in cursor.fetchall()}

    if institution and institution != "todas":
        cursor.execute("SELECT COUNT(*) FROM support_plans WHERE institution = ?", (institution,))
    else:
        cursor.execute("SELECT COUNT(*) FROM support_plans")
    plans_count = cursor.fetchone()[0]
    conn.close()

    total = len(rows)
    high = sum(1 for r in rows if r["risk_level"] == "alto")
    medium = sum(1 for r in rows if r["risk_level"] == "medio")
    low = sum(1 for r in rows if r["risk_level"] == "bajo")
    total_sims = sum(iv_map.get(r["email"].lower(), {}).get("cnt", 0) for r in rows)

    retention_num = 94
    if total > 0:
        retention_num = int(((low + medium * 0.7) / total) * 100)

    students_list = []
    for r in rows:
        iv_data = iv_map.get(r["email"].lower(), {})
        students_list.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "program": r["program"],
            "institution": r["institution"],
            "attendance": r["attendance"],
            "academic_score": r["academic_score"],
            "risk": r["risk_level"],
            "factor": r["primary_factor"],
            "score": f"{int(r['risk_probability'] * 100)}%",
            "interview_score": iv_data.get("avg")
        })

    return {
        "totalEvaluated": total,
        "highRiskCount": high,
        "mediumRiskCount": medium,
        "lowRiskCount": low,
        "retentionRate": f"{retention_num}%",
        "simulationsCount": max(total_sims, len(rows) * 2),
        "activePlansCount": plans_count,
        "students": students_list
    }

# 5b. CONSOLIDADO GLOBAL POR INSTITUCIÓN Y PROGRAMA (VISTA ADMINISTRADOR)
def _aggregate(rows, interviews):
    n = len(rows)
    if n == 0:
        return None
    emails = [r["email"] for r in rows]
    iv = [interviews[e] for e in emails if e in interviews]
    return {
        "total": n,
        "high": sum(1 for r in rows if r["risk_level"] == "alto"),
        "medium": sum(1 for r in rows if r["risk_level"] == "medio"),
        "low": sum(1 for r in rows if r["risk_level"] == "bajo"),
        "avgAttendance": round(sum(r["attendance"] for r in rows) / n, 1),
        "avgScore": round(sum(r["academic_score"] for r in rows) / n, 1),
        "avgRiskProbability": round(sum(r["risk_probability"] for r in rows) / n * 100),
        "interviewedStudents": len(iv),
        "avgInterview": round(sum(x["avg"] for x in iv) / len(iv)) if iv else None,
        "avgGrammar": round(sum(x["grammar"] for x in iv) / len(iv)) if iv else None,
        "avgBodyLanguage": round(sum(x["body"] for x in iv) / len(iv)) if iv else None,
        "avgAlignment": round(sum(x["alignment"] for x in iv) / len(iv)) if iv else None,
    }

@app.get("/api/dashboard/consolidated")
def get_consolidated(institution: Optional[str] = None, program: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students")
    all_rows = cursor.fetchall()

    cursor.execute('''
        SELECT student_email,
               AVG(score) AS avg_score,
               AVG(COALESCE(grammar, score)) AS grammar,
               AVG(COALESCE(body_language, score)) AS body,
               AVG(COALESCE(alignment, score)) AS alignment
        FROM interview_history GROUP BY student_email
    ''')
    interviews = {
        r["student_email"]: {"avg": r["avg_score"], "grammar": r["grammar"], "body": r["body"], "alignment": r["alignment"]}
        for r in cursor.fetchall()
    }
    conn.close()

    rows = [
        r for r in all_rows
        if (not institution or institution == "todas" or r["institution"] == institution)
        and (not program or program == "todos" or r["program"] == program)
    ]

    institutions = sorted({r["institution"] for r in all_rows})
    programs = sorted({r["program"] for r in all_rows})

    by_institution = []
    for inst in sorted({r["institution"] for r in rows}):
        inst_rows = [r for r in rows if r["institution"] == inst]
        entry = _aggregate(inst_rows, interviews)
        entry["institution"] = inst
        entry["programs"] = []
        for prog in sorted({r["program"] for r in inst_rows}):
            p = _aggregate([r for r in inst_rows if r["program"] == prog], interviews)
            p["program"] = prog
            entry["programs"].append(p)
        by_institution.append(entry)

    by_program = []
    for prog in sorted({r["program"] for r in rows}):
        p = _aggregate([r for r in rows if r["program"] == prog], interviews)
        p["program"] = prog
        by_program.append(p)

    students = []
    for r in rows:
        iv = interviews.get(r["email"])
        students.append({
            "id": r["id"], "name": r["name"], "institution": r["institution"], "program": r["program"],
            "attendance": r["attendance"], "academic_score": r["academic_score"], "risk": r["risk_level"],
            "interviewScore": round(iv["avg"]) if iv else None,
        })

    return {
        "filters": {"institutions": institutions, "programs": programs},
        "summary": _aggregate(rows, interviews),
        "byInstitution": by_institution,
        "byProgram": by_program,
        "students": students,
    }

# 6. GESTIÓN DE PLANES DE MEJORAMIENTO ACADÉMICO Y DE COMPETENCIAS (INTERACTIVO ENTRE DIRECTIVO Y ESTUDIANTE)
@app.get("/api/plans/support")
def get_support_plans(institution: Optional[str] = None, student_email: Optional[str] = None, assigned_to: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM support_plans WHERE 1=1"
    params = []

    if institution and institution != "todas":
        query += " AND institution = ?"
        params.append(institution)

    if student_email and assigned_to:
        query += " AND (LOWER(student_email) = ? OR LOWER(assigned_to) = ?)"
        params.extend([student_email.lower(), assigned_to.lower()])
    elif student_email:
        query += " AND LOWER(student_email) = ?"
        params.append(student_email.lower())
    elif assigned_to:
        query += " AND LOWER(assigned_to) = ?"
        params.append(assigned_to.lower())

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    plans = []
    for r in rows:
        keys = r.keys()
        plans.append({
            "id": r["id"],
            "title": r["title"],
            "student_id": r["student_id"],
            "studentEmail": r["student_email"] if "student_email" in keys else "",
            "assignedTo": r["assigned_to"],
            "institution": r["institution"] if "institution" in keys else "SENA - Centro de Tecnologías del Software",
            "type": r["type"],
            "description": r["description"] if "description" in keys else "",
            "deadline": r["deadline"] if "deadline" in keys else "2026-11-30",
            "priority": r["priority"] if "priority" in keys else "Alta",
            "assignedBy": r["assigned_by"] if "assigned_by" in keys else "Coordinación Académica",
            "studentNotes": r["student_notes"] if "student_notes" in keys else "",
            "progress": r["progress"],
            "status": r["status"],
            "createdAt": r["created_at"] if "created_at" in keys else ""
        })
    return {"plans": plans, "total": len(plans)}

@app.post("/api/plans/support", status_code=201)
def create_support_plan(payload: SupportPlanCreate):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    st_id = payload.student_id
    st_email = (payload.student_email or "").strip().lower()
    st_name = payload.assigned_to.strip()
    inst = payload.institution or "SENA - Centro de Tecnologías del Software"

    # Enlazar automáticamente con los datos reales del estudiante en la tabla students
    if st_id:
        cursor.execute("SELECT * FROM students WHERE id = ?", (st_id,))
    elif st_email:
        cursor.execute("SELECT * FROM students WHERE LOWER(email) = ?", (st_email,))
    else:
        cursor.execute("SELECT * FROM students WHERE LOWER(name) = ?", (st_name.lower(),))
    st_row = cursor.fetchone()

    if st_row:
        st_id = st_row["id"]
        st_email = st_row["email"]
        st_name = st_row["name"]
        inst = st_row["institution"]

    cursor.execute('''
        INSERT INTO support_plans (
            title, student_id, student_email, assigned_to, institution,
            type, description, deadline, priority, assigned_by, student_notes, progress, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        payload.title.strip(),
        st_id,
        st_email,
        st_name,
        inst,
        payload.type,
        payload.description or "Cumplimiento de actividades de nivelación y refuerzo de competencias.",
        payload.deadline or "2026-11-30",
        payload.priority or "Alta",
        payload.assigned_by or "Coordinación Académica",
        payload.student_notes or "",
        payload.progress or 0,
        payload.status or "En Progreso"
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Plan de mejoramiento creado y asignado exitosamente.", "id": new_id}

@app.put("/api/plans/support/{plan_id}")
def update_support_plan(plan_id: int, payload: SupportPlanUpdate):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM support_plans WHERE id = ?", (plan_id,))
    plan = cursor.fetchone()
    if not plan:
        conn.close()
        raise HTTPException(status_code=404, detail="Plan de mejoramiento no encontrado.")

    keys = plan.keys()
    new_title = payload.title if payload.title is not None else plan["title"]
    new_type = payload.type if payload.type is not None else plan["type"]
    new_desc = payload.description if payload.description is not None else (plan["description"] if "description" in keys else "")
    new_deadline = payload.deadline if payload.deadline is not None else (plan["deadline"] if "deadline" in keys else "2026-11-30")
    new_priority = payload.priority if payload.priority is not None else (plan["priority"] if "priority" in keys else "Alta")
    new_progress = payload.progress if payload.progress is not None else plan["progress"]
    new_status = payload.status if payload.status is not None else plan["status"]
    new_notes = payload.student_notes if payload.student_notes is not None else (plan["student_notes"] if "student_notes" in keys else "")

    if new_progress >= 100:
        new_progress = 100
        new_status = "Completado"
    elif new_progress > 0 and new_status == "Pendiente":
        new_status = "En Progreso"

    cursor.execute('''
        UPDATE support_plans
        SET title = ?, type = ?, description = ?, deadline = ?, priority = ?, progress = ?, status = ?, student_notes = ?
        WHERE id = ?
    ''', (new_title, new_type, new_desc, new_deadline, new_priority, new_progress, new_status, new_notes, plan_id))

    conn.commit()
    conn.close()
    return {"message": "Plan de mejoramiento actualizado con éxito."}

@app.delete("/api/plans/support/{plan_id}")
def delete_support_plan(plan_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM support_plans WHERE id = ?", (plan_id,))
    conn.commit()
    conn.close()
    return {"message": "Plan de mejoramiento eliminado correctamente."}

@app.post("/api/plans/suggest-ai")
def suggest_improvement_plan_ai(student_id: int = Body(..., embed=True)):
    """
    Genera automáticamente una propuesta de Plan de Mejoramiento personalizada con IA
    según el riesgo de deserción, promedio académico y puntaje del simulador del estudiante.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    st = cursor.fetchone()
    if not st:
        conn.close()
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")

    cursor.execute("SELECT AVG(score) as avg_iv FROM interview_history WHERE LOWER(student_email) = ?", (st["email"].lower(),))
    iv_row = cursor.fetchone()
    avg_iv = round(iv_row["avg_iv"]) if iv_row and iv_row["avg_iv"] else None
    conn.close()

    factor = (st["primary_factor"] or "").lower()
    if st["academic_score"] < 68 or "académico" in factor or "rendimiento" in factor:
        return {
            "title": f"Plan de Mejoramiento: Nivelación Técnica en {st['program']}",
            "type": "Académico / Técnico",
            "priority": "Alta" if st["risk_level"] == "alto" else "Media",
            "description": (
                f"1. Desarrollar taller práctico de refuerzo en competencias troncales de {st['program']} (promedio actual: {st['academic_score']}%).\n"
                f"2. Asistir a 2 sesiones de monitoría par con egresado mentor.\n"
                f"3. Presentar sustentación técnica en el Simulador IA alcanzando mínimo 80/100 puntos."
            )
        }
    elif st["attendance"] < 75 or "inasistencia" in factor or "tiempo" in factor or "económico" in factor:
        return {
            "title": f"Plan de Mejoramiento: Compromiso de Permanencia y Flexibilización",
            "type": "Permanencia y Bienestar",
            "priority": "Alta",
            "description": (
                f"1. Plan de recuperación de evidencias pendientes por asistencia crítica ({st['attendance']}%).\n"
                f"2. Ruta de acompañamiento socioeconómico y articulación con Bienestar al Aprendiz.\n"
                f"3. Seguimiento semanal de entregas con la Coordinación Académica."
            )
        }
    elif avg_iv and avg_iv < 78:
        return {
            "title": "Plan de Mejoramiento: Expresión Oral, Habilidades Blandas y Método STAR",
            "type": "Habilidades Blandas y Entrevista",
            "priority": "Media",
            "description": (
                f"1. Realizar 3 entrenamientos completos en el Simulador de Entrevistas IA (puntaje actual: {avg_iv}/100).\n"
                f"2. Estructurar respuestas de resolución de conflictos aplicando el método STAR con la Dra. Carolina Ortiz.\n"
                f"3. Mejorar contacto visual y reducir muletillas verbales durante la exposición técnica."
            )
        }
    else:
        return {
            "title": f"Plan de Mejoramiento: Preparación de Excelencia para Etapa Productiva ({st['program']})",
            "type": "Habilidades Blandas y Entrevista",
            "priority": "Media",
            "description": (
                f"1. Completar simulacro integral de selección (Filtro RRHH + Filtro Técnico) con calificación superior a 85/100.\n"
                f"2. Agendar mentoría especializada con líder técnico de la industria en el módulo de Mentorías IA.\n"
                f"3. Actualizar portafolio de proyectos aplicados para postulación a empresa patrocinadora."
            )
        }

# 7. EMPAREJAMIENTO INTELIGENTE DE MENTORÍAS CON IA
@app.get("/api/mentors")
def get_mentors():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mentors WHERE available = 1 ORDER BY rating DESC")
    rows = cursor.fetchall()
    conn.close()

    mentors_list = []
    for r in rows:
        mentors_list.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "program": r["program"],
            "company": r["company"],
            "role": r["role_title"],
            "specialty": r["specialty"],
            "years": r["experience_years"],
            "rating": r["rating"],
            "sessions": r["sessions_completed"],
            "avatar": r["avatar_initials"]
        })
    return {"mentors": mentors_list}

@app.post("/api/mentorships/match")
def match_mentors_ai(payload: MentorshipMatchRequest):
    """
    Algoritmo de emparejamiento con IA:
    Calcula coincidencia de perfil entre metas del aprendiz y experiencia de egresados SENA.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mentors WHERE available = 1")
    mentors = cursor.fetchall()
    conn.close()

    matched = []
    goal_lower = payload.goal.lower()

    for m in mentors:
        base_affinity = 75
        reasons = []

        if payload.student_program.lower() in m["program"].lower():
            base_affinity += 12
            reasons.append(f"Graduado del mismo programa ({m['program']})")

        spec_lower = m["specialty"].lower()
        if any(term in goal_lower for term in ["react", "web", "frontend", "arquitectura"]) and "react" in spec_lower:
            base_affinity += 10
            reasons.append("Especialista en Frontend y Arquitectura React")
        if any(term in goal_lower for term in ["backend", "api", "python", "datos"]) and "python" in spec_lower:
            base_affinity += 10
            reasons.append("Dominio experto en APIs con FastAPI y Bases de Datos")
        if any(term in goal_lower for term in ["empleo", "entrevista", "productiva", "empresa"]):
            base_affinity += 8
            reasons.append(f"Experiencia consolidada en la industria ({m['company']})")

        if m["rating"] >= 4.9:
            base_affinity += 5
            reasons.append("Calificación de mentoría sobresaliente (5.0 / 5)")

        final_affinity = min(max(base_affinity, 70), 98)

        matched.append({
            "id": m["id"],
            "name": m["name"],
            "email": m["email"],
            "program": m["program"],
            "company": m["company"],
            "role": m["role_title"],
            "specialty": m["specialty"],
            "rating": m["rating"],
            "sessions": m["sessions_completed"],
            "avatar": m["avatar_initials"],
            "affinity": f"{final_affinity}%",
            "affinity_num": final_affinity,
            "reasons": reasons[:3]
        })

    matched.sort(key=lambda x: x["affinity_num"], reverse=True)
    return {"matches": matched}

@app.get("/api/mentorships/my-sessions")
def get_my_mentorship_sessions(student_email: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM mentorship_sessions WHERE student_email = ? ORDER BY id DESC", (student_email,))
    rows = cursor.fetchall()
    conn.close()

    sessions = []
    for r in rows:
        sessions.append({
            "id": r["id"],
            "mentorName": r["mentor_name"],
            "topic": r["topic"],
            "date": r["scheduled_date"],
            "time": r["scheduled_time"],
            "meetLink": r["meet_link"],
            "status": r["status"]
        })
    return {"sessions": sessions}

@app.post("/api/mentorships/book", status_code=201)
def book_mentorship_session(payload: MentorshipBookingRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM mentors WHERE id = ?", (payload.mentor_id,))
    mentor = cursor.fetchone()
    mentor_name = mentor[0] if mentor else "Mentor Egresado"

    meet_link = f"https://meet.google.com/tl-mentoria-{payload.mentor_id}-{os.urandom(2).hex()}"

    cursor.execute('''
        INSERT INTO mentorship_sessions (student_name, student_email, mentor_id, mentor_name, topic, scheduled_date, scheduled_time, meet_link, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmada')
    ''', (
        payload.student_name,
        payload.student_email,
        payload.mentor_id,
        mentor_name,
        payload.topic,
        payload.scheduled_date,
        payload.scheduled_time,
        meet_link
    ))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "message": "Sesión de mentoría agendada con éxito.",
        "session": {
            "id": new_id,
            "mentorName": mentor_name,
            "topic": payload.topic,
            "date": payload.scheduled_date,
            "time": payload.scheduled_time,
            "meetLink": meet_link,
            "status": "Confirmada"
        }
    }

# 8. RED DE EGRESADOS (DIRECTORIO COMPLETO)
@app.get("/api/graduates")
def get_graduates(search: Optional[str] = None, program: Optional[str] = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM graduates WHERE 1=1"
    params = []

    if search:
        query += " AND (name LIKE ? OR company LIKE ? OR current_role LIKE ?)"
        s = f"%{search}%"
        params.extend([s, s, s])

    if program and program != "todos":
        query += " AND program = ?"
        params.append(program)

    query += " ORDER BY grad_year DESC, id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    grads = []
    for r in rows:
        grads.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "program": r["program"],
            "gradYear": r["grad_year"],
            "company": r["company"],
            "role": r["current_role"],
            "linkedin": r["linkedin_url"],
            "isMentor": bool(r["is_mentor"]),
            "status": r["status"]
        })
    return {"graduates": grads, "total": len(grads)}

@app.post("/api/graduates", status_code=201)
def create_graduate(payload: GraduateCreateRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO graduates (name, email, program, grad_year, company, current_role, linkedin_url, is_mentor, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Activo en Industria')
    ''', (
        payload.name,
        payload.email,
        payload.program,
        payload.grad_year,
        payload.company,
        payload.current_role,
        payload.linkedin_url or "",
        payload.is_mentor or 1
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Egresado registrado exitosamente en la Red TalentLab.", "id": new_id}

# 9. SIMULADOR DE ENTREVISTAS CON IA (GEMINI REST API + MOTOR CONTEXTUAL LOCAL)
def check_response_quality(user_text: str, mode: str, prog: str) -> Dict[str, Any]:
    """
    Evalúa la coherencia, consistencia semántica y nivel de compromiso de la respuesta.
    Detecta:
    0. Hostilidad, agresividad, violencia, insultos o faltas graves de conducta.
    1. Gibberish / Tecleo basura ('asdfghjk', 'aaaaaa', 'qwerty', caracteres repetitivos).
    2. Respuestas evasivas o monosilábicas ('no se', 'ok', 'nada', 'bien', 'paso').
    3. Ausencia total de fundamentación profesional o respuestas ultra cortas.
    """
    clean = user_text.strip()
    lower = clean.lower()
    words = [w for w in re.split(r'\s+', lower) if w]
    word_count = len(words)

    # 0. Detección de Hostilidad, Agresividad, Violencia o Faltas Graves de Conducta
    # Se utilizan expresiones regulares con límites de palabra (\b) para evitar falsos positivos
    # en términos como 'disputas', 'computadora', 'reputación', 'disputar', etc.
    hostile_regexes = [
        r'\binsulto\s+(a|al|a\s+los|a\s+todos|a\s+todo\s+el\s+mundo)\b',
        r'\binsultar\s+(a|al|a\s+los|a\s+todos|a\s+todo\s+el\s+mundo)\b',
        r'\bme\s+pongo\s+de\s+mal\s+genio\b',
        r'\b(agarro|me\s+voy)\s+a\s+los\s+golpes\b',
        r'\b(mando|mandar)\s+a\s+la\s+mierda\b',
        r'\bhago\s+lo\s+que\s+me\s+da\s+la\s+gana\b',
        r'\bno\s+me\s+importa\s+nada\b',
        r'\bme\s+vale\s+(madre|verga|culo|huevo|tres\s+tiras)\b',
        r'\b(hijueputa|malparid[oa]s?|gonorrea|gonorreas|carechimba)\b',
        r'\b(imbecil|estupido|estupida|estupidos|estupidas)\b',
        r'\b(tiro\s+las\s+cosas|golpeo\s+la\s+mesa)\b',
        r'\bpeleo\s+con\s+(todos|la\s+gente|mis\s+compañeros)\b',
        r'\bno\s+tolero\s+a\s+nadie\b',
        r'\b(odio\s+a\s+todos|odio\s+a\s+mis\s+compañeros)\b',
        r'\bput[ao]s?\b'  # Palabra aislada solamente ('puta', 'puto'), nunca dentro de 'disputas'
    ]

    # Lista blanca de términos de mediación constructiva y resolución pacífica
    mediation_terms = [
        "resolver", "resolví", "resolvi", "negociando", "negociar", "solución",
        "solucion", "solucionado", "acuerdo", "mediar", "mediación", "dialogar",
        "consenso", "disputa", "disputas"
    ]
    is_mediating_conflicts = any(m in lower for m in ["resolver", "resolví", "negoci", "mediar", "acuerdo"])

    matched_hostile = False
    for rx in hostile_regexes:
        m = re.search(rx, lower)
        if m:
            matched_word = m.group(0)
            # Si el candidato está describiendo la resolución constructiva de disputas, no penalizar
            if matched_word in ["puta", "putas"] and is_mediating_conflicts:
                continue
            matched_hostile = True
            break

    if matched_hostile:
        return {
            "is_incoherent": True,
            "is_hostile": True,
            "is_clarification": False,
            "reason": "hostile",
            "warning_tip": "🚨 FALTA ÉTICA GRAVE: Se identificó una conducta agresiva, hostil o violenta (insultos, descontrol emocional)."
        }

    # 0.1 Detección de preguntas de aclaración o solicitud de orientación del candidato
    clarification_patterns = [
        r'^\s*por\s*qu[eé]\??\s*$',
        r'^\s*c[oó]mo\s*as[ií]\??\s*$',
        r'^\s*me\s*explicas\??\s*$',
        r'^\s*a\s*qu[eé]\s*te\s*refieres\??\s*$',
        r'^\s*qu[eé]\s*significa\s*eso\??\s*$'
    ]
    if any(re.search(p, lower) for p in clarification_patterns):
        return {
            "is_incoherent": False,
            "is_hostile": False,
            "is_clarification": True,
            "reason": "clarification",
            "warning_tip": "💡 Solicitud de aclaración u orientación por parte del candidato."
        }

    # 1. Repetición de caracteres excesiva (spam/tecleo vago)
    if re.search(r'(.)\1{4,}', lower):
        return {
            "is_incoherent": True,
            "is_hostile": False,
            "reason": "gibberish",
            "warning_tip": "⚠ ALERTA DE COHERENCIA: Se detectó tecleo repetitivo o caracteres sin sentido."
        }

    # 2. Keyboard smashing (patrones de teclado comunes)
    smashes = ["asdf", "qwer", "zxcv", "jklñ", "hjkl", "poiu", "12345", "6789", "lkjh"]
    if any(s in lower for s in smashes) and word_count <= 6:
        return {
            "is_incoherent": True,
            "reason": "gibberish",
            "warning_tip": "⚠ ALERTA DE COHERENCIA: La respuesta contiene combinaciones de teclas sin coherencia semántica."
        }

    # 3. Ratio de vocales vs consonantes (detecta tecleo aleatorio como 'dfghjkl' o 'aeiouaeiou')
    letters = re.findall(r'[a-záéíóúñ]', lower)
    vowels = re.findall(r'[aeiouáéíóú]', lower)
    if len(letters) >= 7:
        vowel_ratio = len(vowels) / len(letters)
        if vowel_ratio < 0.16 or vowel_ratio > 0.82:
            return {
                "is_incoherent": True,
                "reason": "gibberish",
                "warning_tip": "⚠ ALERTA DE COHERENCIA: La respuesta no sigue patrones ortográficos naturales en español."
            }

    # 4. Respuestas evasivas o de desinterés
    evasive_roots = [
        "no se", "no sé", "nose", "ni idea", "no tengo idea", "no me acuerdo", "no me acuerdo de", 
        "no recuerdo", "no opino", "da igual", "yo que se", "no sabria decir", "no tengo experiencia",
        "no sabria", "paso a la siguiente", "siguiente pregunta", "ninguna de las anteriores"
    ]
    if any(root in lower for root in evasive_roots) and word_count <= 8:
        return {
            "is_incoherent": True,
            "reason": "evasive",
            "warning_tip": "⚠ ALERTA DE COHERENCIA: Respuesta evasiva identificada. Demuestra desinterés o falta de preparación."
        }

    # Monosílabos y frases vacías
    empty_singles = {"nada", "ok", "bien", "no", "si", "sí", "hola", "ninguno", "ninguna", "paso", "siguiente", "que", "ola", "buenas", "bla", "blabla", "por ahi"}
    cleaned_phrase = re.sub(r'[^a-záéíóúñ\s]', '', lower).strip()
    if cleaned_phrase in empty_singles or (word_count <= 2 and any(w in empty_singles for w in words)):
        return {
            "is_incoherent": True,
            "reason": "evasive",
            "warning_tip": "⚠ ALERTA DE COHERENCIA: Respuesta monosilábica o vacía identificada."
        }

    # 5. Respuestas excesivamente cortas sin ningún contenido técnico ni contextual
    if word_count < 4:
        return {
            "is_incoherent": True,
            "reason": "too_short",
            "warning_tip": "⚠ ALERTA DE EXTENSIÓN: La respuesta es demasiado escueta para evaluar competencias profesionales."
        }

    return {"is_incoherent": False, "reason": "none", "warning_tip": ""}


def generate_ai_interview_feedback(
    user_text: str,
    history: List[Dict[str, Any]],
    interview_mode: str,
    technical_program: str,
    gemini_key: Optional[str] = None,
    is_incoherent: bool = False,
    is_hostile: bool = False,
    is_clarification: bool = False
) -> Dict[str, Any]:
    """
    Generador de respuestas de entrevista con IA.
    1. Si hay Google Gemini API Key disponible (gratuita en Google AI Studio):
       Llama al modelo gemini-3.5-flash vía HTTP REST con historial completo.
    2. Si no hay API key o falla la conexión externa:
       Ejecuta el Motor Conversacional Heurístico Dinámico que rota preguntas
       y evalúa pertinencia según el turno sin repetir frases genéricas.
    """
    key = (gemini_key or os.environ.get("GEMINI_API_KEY") or "").strip()
    mode_is_hr = (interview_mode or "hr").lower() == "hr"
    prog = (technical_program or "software").lower()

    # Si el candidato formula una pregunta de aclaración u orientación al evaluador
    if is_clarification:
        if mode_is_hr:
            reply = (
                "Con mucho gusto te oriento. En esta simulación de Habilidades Blandas evaluamos tu madurez comunicativa, empatía y trabajo en equipo. "
                "Para poder valorar tus competencias de forma justa, procura compartir vivencias o retos específicos. Cuéntame con tranquilidad: ¿qué experiencia formativa o de trabajo con otros recuerdas con mayor satisfacción?"
            )
        else:
            reply = (
                "Con gusto te oriento. Como evaluador técnico, mi objetivo es conocer tus competencias prácticas de ingeniería y toma de decisiones. "
                "Cuéntame con mayor detalle sobre un proyecto o sistema que hayas programado y cómo resolviste los desafíos técnicos."
            )
        return {"reply": reply, "engine": "TalentLab Orientation Guide", "is_completed": False}

    # Si hay hostilidad o agresión grave, descalificación inmediata
    if is_hostile:
        if mode_is_hr:
            reply = (
                "Conducta totalmente inaceptable: La pérdida de control, el mal genio y los insultos hacia compañeros o líderes constituyen causales directas de descarte inmediato y despido con justa causa en cualquier empresa. "
                "En TalentLab formamos profesionales con madurez emocional y capacidad de diálogo constructivo. "
                "Tu respuesta evidencia una incapacidad crítica para convivir en un entorno laboral, por lo cual esta entrevista queda formalmente reprobada por falta grave a las competencias éticas y actitudinales."
            )
        else:
            reply = (
                "Conducta inaceptable: En un equipo de ingeniería o tecnología, la colaboración y el respeto mutuo son tan vitales como la calidad del código. "
                "Declarar que recurres al insulto o al mal genio ante las diferencias destruye el clima de trabajo y te descarta de inmediato para cualquier posición técnica. "
                "La tolerancia a la frustración y el profesionalismo son condiciones no negociables."
            )
        return {"reply": reply, "engine": "TalentLab Ethics & Conduct Guard", "is_completed": True}

    # Si la respuesta es incoherente, evasiva o basura, reenfocar de inmediato sin gastar cuota de API
    if is_incoherent:
        if mode_is_hr:
            reply = (
                "Atención: tu respuesta es demasiado breve, evasiva o carece de sentido profesional. "
                "En TalentLab evaluamos tu madurez profesional y capacidad comunicativa; en un proceso de selección real, una respuesta evasiva causa descalificación inmediata. "
                "Por favor, tómate la simulación en serio y comparte: ¿puedes describir una situación real donde hayas tenido que asumir una responsabilidad y cómo la sacaste adelante?"
            )
        else:
            reply = (
                "Tu intervención carece de rigor técnico y no responde a la situación planteada. "
                "Como evaluador técnico necesito comprobar tus competencias prácticas, metodologías y dominio de herramientas. "
                "Vuelve a intentarlo con mayor detalle: ¿cuál es un proyecto técnico en el que hayas participado y qué decisiones específicas de ingeniería tomaste?"
            )
        return {"reply": reply, "engine": "Motor Anti-Incoherencias (TalentLab Guard)", "is_completed": False}

    # Intento con Google Gemini API (Free Tier oficial)
    if key and len(key) > 10:
        try:
            if mode_is_hr:
                sys_prompt = (
                    "Eres la Dra. Carolina Ortiz, Líder de Gestión de Talento Humano y mentora vocacional en TalentLab. "
                    "Tu estilo es profundamente humano, cálido, empático, motivador y cercano, como una consejera organizacional que comprende la realidad del estudiante y busca potenciar su autenticidad. "
                    "Estás guiando una conversación constructiva sobre Habilidades Blandas, inteligencia emocional, trabajo en equipo y resolución pacífica de diferencias. "
                    "CRITERIO HUMANO DE EVALUACIÓN: "
                    "- Valora profundamente la madurez en el diálogo: Si el candidato comparte vivencias de mediación, resolución pacífica de disputas o acuerdos de equipo mediante la negociación, reconócelo con calidez y entusiasmo (es una competencia de alto valor ético y profesional). "
                    "- Cercanía y empatía: Valida las emociones del candidato y felicita sus logros o aprendizajes con naturalidad y respeto. "
                    "- Solo ante faltas de respeto explícitas o insultos destructivos, llama la atención con serenidad y sentido formativo. "
                    "ESTRUCTURA OBLIGATORIA DE TU RESPUESTA: "
                    "1. Reconocimiento cálido y empático: Conecta de forma cercana con lo que el candidato acaba de relatar, validando su esfuerzo o actitud humana (1 a 2 oraciones cálidas). "
                    "2. Pregunta reflexiva y cercana: Plantea UNA pregunta reflexiva sobre situaciones humanas reales (ej. gestión de emociones bajo presión, empatía con compañeros desmotivados, o aprendizaje tras equivocarse). "
                    "REGLA DE CONCISIÓN: Sé concisa, cálida y natural (máximo 65 a 85 palabras en total). Concluye siempre con la pregunta. Habla en primera persona como Carolina."
                )
            else:
                prog_label = {
                    "software": "Desarrollo de Software / ADSO / Sistemas",
                    "gestion": "Gestión Empresarial, Contable y Administrativa",
                    "diseno": "Diseño Gráfico, Multimedia y UI/UX",
                    "redes": "Infraestructura, Redes y Telecomunicaciones"
                }.get(prog, "Especialidad Técnica")
                sys_prompt = (
                    f"Eres el Ing. Carlos Mendoza, Evaluador Técnico Senior en TalentLab para el área de {prog_label}. "
                    "Estás realizando una entrevista técnica interactiva y rigurosa para evaluar criterio de ingeniería, metodologías, arquitectura y resolución de incidentes prácticos. "
                    "ESTRUCTURA OBLIGATORIA DE TU RESPUESTA: "
                    "1. Retroalimentación técnica: Comenta directamente sobre las tecnologías, patrones, bases de datos o procesos que el candidato explicó, reconociendo el acierto o complejidad (1 a 2 oraciones). "
                    "2. Pregunta de profundización técnica: Plantea UNA pregunta técnica precisa, desafiante y práctica para evaluar cómo resolvería un fallo imprevisto, un cuello de botella o un cambio de requerimientos. "
                    "REGLA DE CONCISIÓN: Sé conciso y directo (máximo 80 a 100 palabras en total). Concluye siempre con la pregunta. Habla en primera persona como Carlos Mendoza."
                )

            contents = []
            if history:
                for msg in history[-6:]:
                    r = "user" if msg.get("role") == "user" else "model"
                    c = str(msg.get("content") or "").strip()
                    if c:
                        contents.append({"role": r, "parts": [{"text": c}]})
            contents.append({"role": "user", "parts": [{"text": user_text}]})

            payload = {
                "system_instruction": {"parts": [{"text": sys_prompt}]},
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 2048,
                    "topP": 0.95,
                    "thinkingConfig": {
                        "thinkingBudget": 0
                    }
                }
            }
            # Modelos oficiales vigentes y disponibles para esta clave de Google Gemini
            models = [
                m for m in [
                    os.environ.get("GEMINI_MODEL"),
                    "gemini-3.5-flash",
                    "gemini-3.5-flash-lite",
                    "gemini-3.1-flash-lite",
                    "gemini-flash-latest"
                ] if m
            ]
            with httpx.Client(timeout=5.0) as client:
                for model_name in models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
                    headers = {
                        "Content-Type": "application/json",
                        "x-goog-api-key": key
                    }
                    try:
                        res = client.post(url, json=payload, headers=headers)
                        if res.status_code == 200:
                            data = res.json()
                            candidates = data.get("candidates", [])
                            if candidates and "content" in candidates[0]:
                                parts = candidates[0]["content"].get("parts", [])
                                if parts and "text" in parts[0]:
                                    return {
                                        "reply": parts[0]["text"].strip(),
                                        "engine": f"Google {model_name}",
                                        "is_completed": False
                                    }
                        elif res.status_code in (401, 403):
                            print(f"[Gemini Auth Error {res.status_code}]: {res.text[:200]}")
                            break
                        else:
                            print(f"[Gemini Notice]: Modelo {model_name} respondió código {res.status_code}. Probando siguiente modelo...")
                    except Exception as err_post:
                        print(f"Error intentando con modelo {model_name}: {err_post}")
        except Exception as e:
            print(f"Aviso conexión Gemini API: {e}. Activando motor contextual local de alta fidelidad.")

    # Motor Conversacional Heurístico Dinámico (Local resiliente con rotación dinámica según turno de conversación)
    user_turn = len([m for m in history if m.get("role") == "user"]) + 1

    if mode_is_hr:
        lower_u = user_text.lower()
        if any(w in lower_u for w in ["disputa", "disputas", "negoci", "resolver", "resolví", "acuerdo", "mediar", "mediacion", "consenso"]):
            reply = (
                "¡Qué valiosa experiencia compartes! Saber negociar y mediar en desacuerdos para encontrar soluciones constructivas es una de las virtudes humanas y profesionales más buscadas en cualquier equipo de trabajo. "
                "Para conocerte más en tu bienestar y autoconocimiento: en aquellos momentos de alta exigencia o estrés, ¿cómo cuidas tu serenidad y qué haces para mantenerte motivado y enfocado?"
            )
        elif user_turn == 1:
            reply = (
                "¡Excelente inicio! Me alegra mucho conocerte. En cualquier entorno de trabajo surgen diferentes puntos de vista entre compañeros. "
                "Para conocer más tu enfoque humano: ¿podrías relatar una ocasión en la que tuviste un desacuerdo de criterio con un compañero y cómo lograron llegar a un consenso constructivo sin deteriorar la relación personal?"
            )
        elif user_turn == 2:
            reply = (
                "Valoro inmensamente tu honestidad y capacidad de autorreflexión. Todos los seres humanos cometemos equivocaciones o enfrentamos días difíciles en nuestros proyectos: "
                "¿cuál ha sido un tropiezo o error que te haya dejado un aprendizaje valioso para tu vida personal y profesional?"
            )
        elif user_turn == 3:
            reply = (
                "La empatía es el pilar de un equipo cohesionado y solidario. Si notas que un compañero está pasando por un momento personal complicado o desmotivado y eso afecta el trabajo conjunto: "
                "¿cómo te acercarías a él de manera humana y respetuosa para brindarle apoyo?"
            )
        else:
            reply = (
                "Has demostrado una gran madurez humana y profesional a lo largo de este diálogo. "
                "Pensando en tu etapa productiva en la empresa patrocinadora: ¿qué valores personales consideras que serán tu mayor aporte para el equipo y qué esperas de tu futuro líder o mentor para seguir creciendo?"
            )
    else:
        # Modo Técnico con rotación según turno
        if prog == "software":
            if user_turn == 1:
                reply = (
                    "Buen planteamiento técnico. Para evaluar tu rigor de ingeniería: "
                    "¿qué criterios aplicaste para estructurar la arquitectura del código, cómo dividiste los módulos o capas y qué base de datos elegiste?"
                )
            elif user_turn == 2:
                reply = (
                    "Correcto. En entornos de producción la robustez es crítica: "
                    "¿cómo manejaste el control de excepciones, la validación de datos en el backend y qué estrategia aplicaste para evitar cuellos de botella bajo carga?"
                )
            elif user_turn == 3:
                reply = (
                    "Excelente. Hablemos de calidad de software: "
                    "¿qué tipos de pruebas (unitarias, integración o manuales) realizaste antes de considerar listo el desarrollo y cómo gestionaste el control de versiones con Git?"
                )
            else:
                reply = (
                    "Interesante visión técnica integral. "
                    "Si tuvieras que escalar este sistema para soportar 10 veces más usuarios concurrentes, ¿qué cambios arquitectónicos o de infraestructura implementarías primero?"
                )
        elif prog == "gestion":
            if user_turn == 1:
                reply = (
                    "Interesante enfoque administrativo. "
                    "Cuéntanos: ¿cómo priorizaste los recursos disponibles frente a las restricciones operativas y cómo justificaste técnicamente tu propuesta ante los líderes o clientes?"
                )
            elif user_turn == 2:
                reply = (
                    "Criterio administrativo sólido. "
                    "En la gestión operativa real: ¿qué metodología de seguimiento o KPI implementaste para monitorear desviaciones y qué plan de contingencia aplicaste para asegurar el cumplimiento de la meta?"
                )
            else:
                reply = (
                    "Muy buen análisis de procesos. "
                    "Pensando en la optimización de costos y satisfacción del cliente: ¿qué oportunidad de mejora continua identificaste en ese escenario?"
                )
        elif prog == "redes":
            if user_turn == 1:
                reply = (
                    "Correcto análisis de infraestructura y conectividad. "
                    "¿Podrías explicar la topología de red que diseñaste, qué protocolos de enrutamiento utilizaste y cómo segmentaste el tráfico?"
                )
            elif user_turn == 2:
                reply = (
                    "Punto neurálgico de infraestructura. "
                    "En entornos operativos de alta disponibilidad: ¿qué políticas de seguridad perimetral implementaste para evitar vulnerabilidades y qué herramientas empleaste para verificar la latencia y la integridad del tráfico?"
                )
            else:
                reply = (
                    "Buen criterio de soporte y administración. "
                    "¿Qué procedimiento de respaldo (backup) y plan de recuperación ante desastres (DRP) contemplaste para garantizar la continuidad del negocio?"
                )
        else: # diseno
            if user_turn == 1:
                reply = (
                    "Buen planteamiento conceptual y creativo. "
                    "Respecto a la ejecución: ¿cómo tradujiste los requerimientos iniciales del brief en una propuesta visual coherente y cómo validaste las necesidades del usuario final?"
                )
            elif user_turn == 2:
                reply = (
                    "Muy valioso tu enfoque centrado en la usabilidad. "
                    "Desde la óptica de la experiencia de usuario y la comunicación visual: ¿cómo testeaste esa propuesta con los usuarios destinatarios y qué iteraciones realizaste para equilibrar la estética con la funcionalidad requerida?"
                )
            else:
                reply = (
                    "Excelente evolución de diseño. "
                    "¿Cómo defendiste tus decisiones de diseño ante el evaluador o cliente cuando surgieron comentarios críticos o cambios imprevistos en los requerimientos?"
                )

    return {"reply": reply, "engine": "local_contextual_dynamic", "is_completed": False}


@app.post("/api/interview/simulate")
def simulate_interview(payload: InterviewRequest):
    user_text = (payload.message or payload.userResponse or "").strip()

    if not user_text:
        raise HTTPException(status_code=400, detail="La respuesta del estudiante no puede estar vacía.")

    words = user_text.split()
    word_count = len(words)
    lower_text = user_text.lower()

    mode = (payload.interview_mode or "hr").lower()
    prog = (payload.technical_program or payload.area or "software").lower()
    target_role = payload.role_target or (
        "Evaluación de Recursos Humanos y Talento" if mode == "hr" else f"Evaluación Técnica en {prog.capitalize()}"
    )

    quality = check_response_quality(user_text, mode, prog)
    is_incoherent = quality["is_incoherent"]
    is_hostile = quality.get("is_hostile", False)
    is_clarification = quality.get("is_clarification", False)

    tips = []
    if is_hostile:
        # Descalificación inmediata por hostilidad, agresividad o insultos
        alignment = random.randint(10, 16)
        grammar = random.randint(32, 45)
        body_language = random.randint(20, 32)
        final_score = random.randint(18, 24)

        tips.append("🚨 DESCALIFICACIÓN DISCIPLINARIA: Se detectó conducta agresiva o insultos ('mal genio', 'insulto a todos').")
        tips.append("❌ En un proceso de selección real, una respuesta agresiva hacia compañeros o evaluadores causa expulsión inmediata del proceso.")
        tips.append("💡 Refuerzo urgente: Desarrolla inteligencia emocional, asertividad y gestión pacífica del conflicto.")
        primary_feedback = tips[0]
    elif is_clarification:
        # El candidato formula una pregunta de aclaración u orientación al evaluador
        alignment = 75
        grammar = 80
        body_language = 78
        final_score = 75
        tips.append("💡 Orientación del evaluador: Responde compartiendo tus vivencias formativas o de trabajo en equipo.")
        primary_feedback = tips[0]
    elif is_incoherent:
        # Penalización severa por incoherencia, evasivas o tecleo basura
        alignment = random.randint(34, 44)
        if quality["reason"] == "gibberish":
            grammar = random.randint(30, 44)
        else:
            grammar = random.randint(55, 66)
        body_language = random.randint(58, 68)
        
        final_score = int(alignment * 0.45 + grammar * 0.35 + body_language * 0.20)
        final_score = min(max(final_score, 32), 48) # Descalificación/reprobado

        tips.append(quality["warning_tip"])
        tips.append("❌ PENALIZACIÓN EN RÚBRICA: En un proceso de selección real, una respuesta evasiva o incoherente causa descalificación inmediata.")
        tips.append("💡 Recomendación STAR: Estructura tu respuesta mencionando una Situación real, tu Tarea, la Acción que ejecutaste y el Resultado medible obtenido.")
        primary_feedback = tips[0]
    else:
        base_score = 72

        tech_keywords = ["python", "react", "código", "software", "lógica", "datos", "sistema", "desarrollo", "api", "base de datos", "git", "sql", "redes", "algoritmo", "automatización"]
        soft_keywords = ["equipo", "comunicación", "empatía", "escuchar", "solucionar", "respeto", "aprender", "proactivo", "metas", "disciplina", "responsabilidad", "adaptabilidad", "liderazgo", "disputa", "disputas", "negociando", "negociar", "resolver", "acuerdo", "mediar", "consenso", "diálogo"]
        mgmt_keywords = ["cliente", "servicio", "presupuesto", "indicadores", "logística", "administración", "planeación", "costos", "ventas", "informe", "gestión", "estrategia", "recursos", "prioridades", "organización"]
        design_keywords = ["usuario", "diseño", "concepto", "marca", "audiencia", "interfaz", "creatividad", "propuesta", "visual", "comunicación", "brief", "estética", "prototipo"]

        found_tech = any(k in lower_text for k in tech_keywords)
        found_soft = any(k in lower_text for k in soft_keywords)
        found_mgmt = any(k in lower_text for k in mgmt_keywords)
        found_design = any(k in lower_text for k in design_keywords)

        if word_count >= 10:
            base_score += 8
            tips.append("✔ Buena extensión y argumentación en la respuesta.")
        else:
            tips.append("⚠ Podrías profundizar más con ejemplos concretos y situaciones reales.")

        if mode == "hr":
            if found_soft:
                base_score += 9
                tips.append("✔ Demostraste alta inteligencia emocional, adaptabilidad y trabajo colaborativo.")
            else:
                tips.append("✔ Tono profesional y adecuada estructuración discursiva.")
        else:
            if prog == "gestion" and (found_mgmt or found_soft):
                base_score += 8
                tips.append("✔ Demostraste criterio administrativo, orientación al cliente y enfoque en resultados.")
            elif prog in ["software", "redes"] and found_tech:
                base_score += 8
                tips.append("✔ Correcto uso de terminología técnica y metodológica aplicada a tu especialidad.")
            elif prog == "diseno" and (found_design or found_soft):
                base_score += 8
                tips.append("✔ Excelente claridad en enfoque de diseño centrado en el usuario y expresión creativa.")
            else:
                tips.append("✔ Dominio conceptual acorde al programa formativo.")

        final_score = min(max(base_score, 68), 96)

        # Desglose por ejes
        sentences = [s for s in re.split(r'[.!?]+', user_text) if s.strip()]
        has_caps = user_text[:1].isupper()
        has_punct = user_text.rstrip()[-1:] in ".!?"
        grammar = 76 + (6 if has_caps else 0) + (6 if has_punct else 0) + (4 if len(sentences) >= 2 else 0) + (3 if word_count >= 10 else 0)
        star_keywords = ["situación", "tarea", "acción", "resultado", "logré", "aprendí", "decidí", "implementé", "proyecto", "reto", "problema", "objetivo"]
        star_hits = sum(1 for k in star_keywords if k in lower_text)
        alignment = min(95, 68 + star_hits * 5 + (6 if (found_tech or found_mgmt or found_design) else 0) + (5 if found_soft else 0))
        avg_len = word_count / max(len(sentences), 1)
        body_language = min(92, 66 + min(word_count, 40) // 3 + (6 if 8 <= avg_len <= 22 else 0) + (4 if found_soft else 0))
        grammar, alignment, body_language = [min(max(int(v), 55), 98) for v in (grammar, alignment, body_language)]
        final_score = round((grammar + alignment + body_language) / 3 * 0.5 + final_score * 0.5)
        primary_feedback = tips[0] if tips else "✔ Respuesta analizada con éxito."

    # Generación de respuesta con IA (Gemini REST API o Motor Contextual)
    ai_gen = generate_ai_interview_feedback(
        user_text=user_text,
        history=payload.history or [],
        interview_mode=mode,
        technical_program=prog,
        gemini_key=payload.gemini_api_key,
        is_incoherent=is_incoherent,
        is_hostile=is_hostile,
        is_clarification=is_clarification
    )
    ai_reply = ai_gen["reply"]
    ai_engine = ai_gen.get("engine", "local_contextual")
    is_completed = ai_gen.get("is_completed", False)

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO interview_history (student_email, score, role_target, feedback, grammar, body_language, alignment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (payload.student_id or "estudiante@talentlab.edu", final_score, target_role, primary_feedback, grammar, body_language, alignment))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error guardando entrevista: {e}")

    return {
        "ai_response": ai_reply,
        "metrics": {
            "score": final_score,
            "feedback": primary_feedback,
            "grammar": grammar,
            "bodyLanguage": body_language,
            "alignment": alignment
        },
        "breakdown": {"grammar": grammar, "bodyLanguage": body_language, "alignment": alignment},
        "score": final_score,
        "tips": tips,
        "engine": ai_engine,
        "completed": is_completed,
        "is_hostile": is_hostile,
        "is_incoherent": is_incoherent,
        "is_clarification": is_clarification
    }

@app.post("/api/interview/conclude")
def conclude_interview(payload: InterviewConclusionRequest):
    # 1. Calcular notas consolidadas de los 2 filtros
    hr_sc = max(10, min(100, int(payload.hr_score or 80)))
    tech_sc = max(10, min(100, int(payload.tech_score or 80)))
    
    bio = payload.bio_metrics or {}
    posture = int(bio.get("posture", 85))
    eye_contact = int(bio.get("eyeContact", 88))
    smile = int(bio.get("smile", 80))
    cadence = int(bio.get("cadenceWpm", 120))
    fillers = int(bio.get("fillersCount", 0))
    cam_active = bool(bio.get("camOn", True))
    
    body_lang_score = round(posture * 0.45 + eye_contact * 0.45 + (10 if cam_active else 0)) if cam_active else 50
    body_lang_score = max(20, min(98, body_lang_score))
    
    grammar_score = 88 if fillers <= 1 else (80 if fillers <= 3 else 70)
    
    if payload.is_hostile or hr_sc <= 30:
        overall_score = 22
        verdict = "DESCALIFICADO POR FALTA ÉTICA / DISCIPLINARIA"
        verdict_badge = "danger"
    else:
        overall_score = round(hr_sc * 0.35 + tech_sc * 0.35 + body_lang_score * 0.15 + grammar_score * 0.15)
        overall_score = max(35, min(98, overall_score))
        if overall_score >= 85:
            verdict = "CONTRATABLE / RECOMENDADO CON HONORES"
            verdict_badge = "success"
        elif overall_score >= 70:
            verdict = "APTO / RECOMENDADO CON PLAN DE MEJORA"
            verdict_badge = "warning"
        else:
            verdict = "EN FORMACIÓN / REQUIERE REFUERZO TÉCNICO Y ACTITUDINAL"
            verdict_badge = "info"

    # 2. Programa Formativo
    prog_name = {
        "software": "Desarrollo de Software (ADSO / Backend / Fullstack)",
        "redes": "Infraestructura, Redes y Telecomunicaciones",
        "gestion": "Gestión Empresarial, Contabilidad y Finanzas",
        "diseno": "Diseño Gráfico, UI/UX y Multimedia"
    }.get((payload.technical_program or "software").lower(), "Especialidad Técnica")

    key = (payload.gemini_api_key or os.environ.get("GEMINI_API_KEY") or "").strip()
    executive_summary = ""
    hr_feedback = ""
    tech_feedback = ""
    key_strengths = []
    priority_improvements = []

    # 3. Síntesis Ejecutiva con Gemini 3.5 Flash si está disponible
    if key and len(key) > 10 and not payload.is_hostile:
        try:
            sys_instruct = (
                "Eres el Comité Evaluador de Selección de TalentLab (Dra. Carolina Ortiz, Selección RH e Ing. Carlos Mendoza, Evaluador Técnico Senior). "
                "Tu tarea es generar las CONCLUSIONES Y DICTAMEN FINAL del proceso en 2 filtros. "
                "Devuelve ÚNICAMENTE un JSON válido con estas claves: "
                "executive_summary (resumen global de 2 a 3 oraciones), "
                "hr_feedback (comentario de Dra. Carolina Ortiz sobre STAR y habilidades blandas, 2 oraciones), "
                "tech_feedback (comentario de Ing. Carlos Mendoza sobre arquitectura y técnica, 2 oraciones), "
                "key_strengths (lista con exactamente 3 fortalezas demostradas), "
                "priority_improvements (lista con exactamente 2 oportunidades clave de mejora)."
            )

            hr_text_summary = " ".join([m.get("content", "") for m in (payload.hr_messages or []) if m.get("role") == "user"])[:600]
            tech_text_summary = " ".join([m.get("content", "") for m in (payload.tech_messages or []) if m.get("role") == "user"])[:600]

            user_prompt = (
                f"Candidato del programa: {prog_name}. "
                f"Puntaje Consolidado: {overall_score}/100 (Filtro RH: {hr_sc}, Filtro Técnico: {tech_sc}, Biometría: {body_lang_score}). "
                f"Respuestas en Filtro 1 (RH): {hr_text_summary or 'Compartió experiencias y resolución de retos en equipo'}. "
                f"Respuestas en Filtro 2 (Técnico): {tech_text_summary or 'Explicó herramientas, bases de datos y arquitectura de proyecto'}. "
                f"Biometría: Postura {posture}%, Mirada {eye_contact}%, Cadencia {cadence} ppm, Muletillas {fillers}."
            )

            conclude_payload = {
                "system_instruction": {"parts": [{"text": sys_instruct}]},
                "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
                "generationConfig": {
                    "temperature": 0.5,
                    "maxOutputTokens": 1024,
                    "responseMimeType": "application/json",
                    "thinkingConfig": {"thinkingBudget": 0}
                }
            }

            with httpx.Client(timeout=8.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={key}"
                res = client.post(url, json=conclude_payload, headers={"Content-Type": "application/json"})
                if res.status_code == 200:
                    cand = res.json().get("candidates", [])
                    if cand and "content" in cand[0]:
                        raw_json = cand[0]["content"]["parts"][0]["text"].strip()
                        parsed = json.loads(raw_json)
                        executive_summary = parsed.get("executive_summary", "")
                        hr_feedback = parsed.get("hr_feedback", "")
                        tech_feedback = parsed.get("tech_feedback", "")
                        key_strengths = parsed.get("key_strengths", [])
                        priority_improvements = parsed.get("priority_improvements", [])
        except Exception as e_gemini:
            print(f"[Aviso Conclusiones Gemini]: {e_gemini}. Activando respaldo local.")

    # 4. Generador Heurístico Local de Alta Fidelidad si falla la conexión
    if not executive_summary:
        if payload.is_hostile:
            executive_summary = "El comité ha reprobado de manera unánime e inmediata al candidato debido a conductas verbalmente agresivas y falta grave de autorregulación emocional."
            hr_feedback = "Dra. Carolina Ortiz: La expresión de insultos o actitudes hostiles anula de raíz cualquier posibilidad de inserción laboral en nuestras empresas aliadas."
            tech_feedback = "Ing. Carlos Mendoza: Ningún dominio técnico compensa la incapacidad para convivir pacíficamente en un equipo de trabajo."
            key_strengths = ["Sinceridad directa en el diálogo inicial"]
            priority_improvements = [
                "Desarrollar urgentemente inteligencia emocional y autocontrol",
                "Aprender resolución asertiva y pacífica de conflictos laborales"
            ]
        else:
            executive_summary = f"El candidato culminó satisfactoriamente los dos filtros del proceso de selección para {prog_name}, demostrando un balance integral del {overall_score}% entre habilidades humanas y criterio técnico."
            hr_feedback = f"Dra. Carolina Ortiz: En el Filtro 1 (Calificación: {hr_sc}/100) demostró buena claridad expresiva, estructuración coherente bajo el método STAR y madurez para enfrentar retos en equipo."
            tech_feedback = f"Ing. Carlos Mendoza: En el Filtro 2 (Calificación: {tech_sc}/100) evidenció dominio práctico de las tecnologías de {prog_name}, buen criterio metodológico y capacidad de resolución ante incidencias operativas."
            key_strengths = [
                "Estructuración lógica de respuestas bajo metodología STAR",
                f"Fundamentos sólidos en herramientas y estándares de {prog_name}",
                f"Lenguaje corporal y presencia profesional adecuada ({body_lang_score}% en biometría)"
            ]
            priority_improvements = [
                "Cuantificar con mayor precisión el impacto numérico (%) de tus proyectos previos",
                "Profundizar en patrones avanzados de escalabilidad y tolerancia a fallos"
            ]

    # 5. Persistencia en SQLite y recalibración automática del Semáforo de Deserción del estudiante
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        st_email = (payload.student_id or "estudiante@talentlab.edu").strip().lower()
        cursor.execute('''
            INSERT INTO interview_history (student_email, score, role_target, feedback, grammar, body_language, alignment)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            st_email,
            overall_score,
            payload.role_target or f"Proceso Integral (2 Filtros) - {prog_name}",
            executive_summary,
            grammar_score,
            body_lang_score,
            round((hr_sc + tech_sc) / 2)
        ))

        cursor.execute("SELECT * FROM students WHERE LOWER(email) = ?", (st_email,))
        st_row = cursor.fetchone()
        if st_row:
            if payload.is_hostile or hr_sc < 50:
                new_emo = "Crisis Personal / Emocional"
            elif overall_score < 68:
                new_emo = "Desmotivación Vocacional"
            elif overall_score >= 78:
                new_emo = "Estable"
            else:
                new_emo = st_row["emotional_status"] if "emotional_status" in st_row.keys() and st_row["emotional_status"] else "Estable"

            r_lvl, r_prob, r_factor = compute_risk(
                attendance=st_row["attendance"],
                academic_score=st_row["academic_score"],
                stratum=st_row["stratum"],
                has_financial_aid=st_row["has_financial_aid"],
                emotional_status=new_emo,
                interview_score=overall_score
            )
            cursor.execute('''
                UPDATE students
                SET emotional_status = ?, risk_level = ?, risk_probability = ?, primary_factor = ?
                WHERE id = ?
            ''', (new_emo, r_lvl, r_prob, r_factor, st_row["id"]))

        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error guardando conclusiones en SQLite: {e}")

    return {
        "status": "success",
        "overall_score": overall_score,
        "verdict": verdict,
        "verdict_badge": verdict_badge,
        "breakdown": {
            "hr_score": hr_sc,
            "tech_score": tech_sc,
            "body_language": body_lang_score,
            "grammar": grammar_score,
            "alignment": round((hr_sc + tech_sc) / 2)
        },
        "bio_metrics": {
            "posture": posture,
            "eyeContact": eye_contact,
            "smile": smile,
            "cadenceWpm": cadence,
            "fillersCount": fillers,
            "camOn": cam_active
        },
        "conclusions": {
            "executive_summary": executive_summary,
            "hr_feedback": hr_feedback,
            "tech_feedback": tech_feedback,
            "key_strengths": key_strengths,
            "priority_improvements": priority_improvements
        },
        "technical_program": payload.technical_program,
        "created_at": datetime.now().isoformat()
    }

# 10. PLANES INSTITUCIONALES B2B (ESTUDIO FINANCIERO)
@app.get("/api/plans/subscriptions")
def get_institutional_plans():
    return {
        "currency": "COP",
        "plans": [
            {
                "id": "basic",
                "name": "Plan Semillero (Colegio Básico)",
                "pricePerLicense": 4500000,
                "period": "Anual",
                "features": [
                    "Hasta 250 estudiantes evaluados",
                    "Semáforo Predictivo de Deserción",
                    "Simulador de Roles con IA (Texto)",
                    "Dashboard de Directivos y Orientadores"
                ],
                "recommended": False
            },
            {
                "id": "pro",
                "name": "Plan Institucional Avanzado",
                "pricePerLicense": 4500000,
                "period": "Anual",
                "features": [
                    "Hasta 600 estudiantes evaluados",
                    "Simulador con Reconocimiento de Voz",
                    "Reportes vocacionales personalizados en PDF",
                    "Acompañamiento psicopedagógico bimensual",
                    "Soporte técnico preferencial"
                ],
                "recommended": True
            },
            {
                "id": "public_social",
                "name": "Plan Social SENA / Impacto Público",
                "pricePerLicense": 0,
                "period": "Gratuito para Colegios Vulnerables",
                "features": [
                    "Acceso 100% subsidiado por TalentLab",
                    "Pruebas de orientación vocacional con IA",
                    "Guía de articulación con programas SENA",
                    "Talleres virtuales de inserción laboral"
                ],
                "recommended": False
            }
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
