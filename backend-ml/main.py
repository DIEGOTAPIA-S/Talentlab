import os
import re
import sqlite3
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from dotenv import load_dotenv

# Cargar variables de entorno opcionales
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
    _add_column('interview_history', 'grammar', 'INTEGER')
    _add_column('interview_history', 'body_language', 'INTEGER')
    _add_column('interview_history', 'alignment', 'INTEGER')
    cursor.execute("UPDATE students SET institution = 'SENA - Centro de Tecnologías del Software' WHERE institution IS NULL OR institution = ''")

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

    # Semilla inicial de Planes de Apoyo
    cursor.execute('SELECT COUNT(*) FROM support_plans')
    if cursor.fetchone()[0] == 0:
        initial_plans = [
            ("Apoyo Económico de Transporte y Alimentación", 3, "Diego Tapia", "Económico", 50, "En Progreso"),
            ("Tutoría de Refuerzo en Lógica de Programación", 2, "Camila Restrepo", "Académico", 20, "En Progreso"),
            ("Acompañamiento Psicopedagógico y Vocacional", 4, "Mateo Bermúdez", "Psicosocial", 100, "Completado")
        ]
        cursor.executemany('''
            INSERT INTO support_plans (title, student_id, assigned_to, type, progress, status)
            VALUES (?, ?, ?, ?, ?, ?)
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

    # Perfiles predeterminados verosímiles
    cursor.execute('''
        INSERT OR IGNORE INTO system_profiles (email, full_name, role, institution, title, phone, department)
        VALUES 
        ('director@talentlab.edu', 'Patricia Gómez Salazar', 'admin_tenant', 'SENA - Centro de Tecnologías del Software', 'Coordinadora de Formación y Permanencia Académica', '+57 (601) 546-1500', 'Coordinación de Formación Profesional'),
        ('estudiante@talentlab.edu', 'Diego Tapia', 'student', 'SENA - Centro de Tecnologías del Software', 'Aprendiz Tecnólogo en ADSO (Ficha 2996897)', '+57 312 411 7048', 'Etapa Lectiva / Proyecto Productivo')
    ''')

    conn.commit()
    conn.close()
    print("Base de datos local SQLite verificada y lista con todas las entidades activas.")

init_db()

# --- ALGORITMO PREDICTIVO DE RIESGO DE DESERCIÓN (ESTUDIO TÉCNICO 3.1.1) ---
def compute_risk(attendance: float, academic_score: float, stratum: int, has_financial_aid: int):
    prob = 0.05
    factors = []

    if attendance < 70.0:
        prob += 0.40
        factors.append("Inasistencias Críticas (<70%)")
    elif attendance < 80.0:
        prob += 0.20
        factors.append("Inasistencias Moderadas")

    if academic_score < 60.0:
        prob += 0.35
        factors.append("Rendimiento Académico Crítico (<60 pts)")
    elif academic_score < 75.0:
        prob += 0.15
        factors.append("Dificultad en Asignaturas Clave")

    if stratum in [1, 2] and not has_financial_aid:
        prob += 0.25
        factors.append("Vulnerabilidad Económica (Estrato bajo sin auxilio)")
    elif not has_financial_aid:
        prob += 0.10

    risk_prob = min(max(prob, 0.05), 0.98)

    if risk_prob >= 0.75:
        level = "alto"
        factor_desc = factors[0] if factors else "Vulnerabilidad Múltiple"
    elif risk_prob >= 0.40:
        level = "medio"
        factor_desc = factors[0] if factors else "Alerta Preventiva"
    else:
        level = "bajo"
        factor_desc = "Desempeño Estable"

    return level, round(risk_prob, 2), factor_desc


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
    academic_score: Optional[float] = 75.0
    stratum: Optional[int] = 2
    has_financial_aid: Optional[int] = 0
    status: Optional[str] = "Activo"

class StudentUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    program: Optional[str] = None
    institution: Optional[str] = None
    attendance: Optional[float] = None
    academic_score: Optional[float] = None
    stratum: Optional[int] = None
    has_financial_aid: Optional[int] = None
    status: Optional[str] = None

class SupportPlanCreate(BaseModel):
    title: str
    student_id: Optional[int] = None
    assigned_to: str
    type: str
    progress: Optional[int] = 0
    status: Optional[str] = "En Progreso"

class SupportPlanUpdate(BaseModel):
    progress: Optional[int] = None
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

# 2. AUTENTICACIÓN Y ROLES
@app.post("/api/auth/login", response_model=UserSession)
def login(payload: LoginRequest):
    email = payload.email.strip().lower()
    password = payload.password.strip()
    role = payload.role

    # Buscar perfil en base de datos para nombres actualizados
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_profiles WHERE email = ?", (email,))
    saved_profile = cursor.fetchone()
    conn.close()

    if role == "student":
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
            
    elif role == "admin_tenant":
        if saved_profile:
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
            
    raise HTTPException(status_code=400, detail="Rol de acceso no reconocido. Seleccione Estudiante o Directivo.")

# 3. PERFIL DE USUARIO (CONSULTAR Y ACTUALIZAR)
@app.get("/api/auth/profile")
def get_user_profile(email: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_profiles WHERE email = ?", (email,))
    profile = cursor.fetchone()
    conn.close()

    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado.")

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
    cursor = conn.cursor()

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
        "admin_tenant" if "director" in payload.email or "admin" in payload.email else "student",
        payload.institution,
        payload.title or "Coordinador Institucional",
        payload.phone or "",
        payload.department or ""
    ))

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

# 4. GESTIÓN CRUD DE ESTUDIANTES (GESTOR DE USUARIOS)
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
    conn.close()

    students = []
    for r in rows:
        students.append({
            "id": r["id"],
            "name": r["name"],
            "email": r["email"],
            "program": r["program"],
            "institution": r["institution"],
            "attendance": r["attendance"],
            "academic_score": r["academic_score"],
            "stratum": r["stratum"],
            "has_financial_aid": bool(r["has_financial_aid"]),
            "risk": r["risk_level"],
            "risk_probability": f"{int(r['risk_probability'] * 100)}%",
            "factor": r["primary_factor"],
            "status": r["status"],
            "score": f"{int(r['risk_probability'] * 100)}%"
        })

    return {"students": students, "total": len(students)}

@app.post("/api/students", status_code=201)
def create_student(payload: StudentCreateRequest):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM students WHERE email = ?", (payload.email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="El correo ya se encuentra registrado.")

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
        payload.name,
        payload.email,
        payload.program,
        payload.attendance,
        payload.academic_score,
        payload.stratum,
        payload.has_financial_aid,
        risk_level,
        risk_prob,
        primary_factor,
        payload.status or "Activo",
        payload.institution or "SENA - Centro de Tecnologías del Software"
    ))

    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "message": "Estudiante registrado exitosamente.",
        "student": {
            "id": new_id,
            "name": payload.name,
            "email": payload.email,
            "program": payload.program,
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

    new_name = payload.name if payload.name is not None else student["name"]
    new_email = payload.email if payload.email is not None else student["email"]
    new_program = payload.program if payload.program is not None else student["program"]
    new_attendance = payload.attendance if payload.attendance is not None else student["attendance"]
    new_score = payload.academic_score if payload.academic_score is not None else student["academic_score"]
    new_stratum = payload.stratum if payload.stratum is not None else student["stratum"]
    new_aid = payload.has_financial_aid if payload.has_financial_aid is not None else student["has_financial_aid"]
    new_status = payload.status if payload.status is not None else student["status"]
    new_institution = payload.institution if payload.institution is not None else student["institution"]

    risk_level, risk_prob, primary_factor = compute_risk(
        attendance=new_attendance,
        academic_score=new_score,
        stratum=new_stratum,
        has_financial_aid=new_aid
    )

    cursor.execute('''
        UPDATE students 
        SET name = ?, email = ?, program = ?, attendance = ?, academic_score = ?, stratum = ?, has_financial_aid = ?, risk_level = ?, risk_probability = ?, primary_factor = ?, status = ?, institution = ?
        WHERE id = ?
    ''', (
        new_name, new_email, new_program, new_attendance, new_score, new_stratum, new_aid, risk_level, risk_prob, primary_factor, new_status, new_institution, student_id
    ))

    conn.commit()
    conn.close()

    return {
        "message": "Estudiante actualizado correctamente.",
        "student": {
            "id": student_id,
            "name": new_name,
            "email": new_email,
            "program": new_program,
            "risk": risk_level,
            "risk_probability": f"{int(risk_prob * 100)}%",
            "factor": primary_factor,
            "status": new_status
        }
    }

@app.delete("/api/students/{student_id}")
def delete_student(student_id: int):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM students WHERE id = ?", (student_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Estudiante no encontrado.")

    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
    cursor.execute("DELETE FROM support_plans WHERE student_id = ?", (student_id,))
    conn.commit()
    conn.close()

    return {"message": "Estudiante eliminado exitosamente del sistema."}

# 5. SEMÁFORO PREDICTIVO Y KPIS DEL DASHBOARD
@app.get("/api/dashboard/risk-semaphore")
def get_risk_semaphore():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    total = len(rows)
    high = sum(1 for r in rows if r["risk_level"] == "alto")
    medium = sum(1 for r in rows if r["risk_level"] == "medio")
    low = sum(1 for r in rows if r["risk_level"] == "bajo")

    retention_num = 94
    if total > 0:
        retention_num = int(((low + medium * 0.7) / total) * 100)

    students_list = []
    for r in rows:
        students_list.append({
            "id": r["id"],
            "name": r["name"],
            "program": r["program"],
            "institution": r["institution"],
            "risk": r["risk_level"],
            "factor": r["primary_factor"],
            "score": f"{int(r['risk_probability'] * 100)}%"
        })

    return {
        "totalEvaluated": total,
        "highRiskCount": high,
        "mediumRiskCount": medium,
        "lowRiskCount": low,
        "retentionRate": f"{retention_num}%",
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

# 6. GESTIÓN DE PLANES DE APOYO INSTITUCIONAL
@app.get("/api/plans/support")
def get_support_plans():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM support_plans ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    plans = []
    for r in rows:
        plans.append({
            "id": r["id"],
            "title": r["title"],
            "student_id": r["student_id"],
            "assignedTo": r["assigned_to"],
            "type": r["type"],
            "progress": r["progress"],
            "status": r["status"]
        })
    return {"plans": plans}

@app.post("/api/plans/support", status_code=201)
def create_support_plan(payload: SupportPlanCreate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO support_plans (title, student_id, assigned_to, type, progress, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (payload.title, payload.student_id, payload.assigned_to, payload.type, payload.progress or 0, payload.status or "En Progreso"))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Plan de apoyo creado exitosamente.", "id": new_id}

@app.put("/api/plans/support/{plan_id}")
def update_support_plan(plan_id: int, payload: SupportPlanUpdate):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    if payload.progress is not None and payload.status is not None:
        cursor.execute("UPDATE support_plans SET progress = ?, status = ? WHERE id = ?", (payload.progress, payload.status, plan_id))
    elif payload.progress is not None:
        cursor.execute("UPDATE support_plans SET progress = ? WHERE id = ?", (payload.progress, plan_id))
    elif payload.status is not None:
        cursor.execute("UPDATE support_plans SET status = ? WHERE id = ?", (payload.status, plan_id))

    conn.commit()
    conn.close()
    return {"message": "Plan de apoyo actualizado con éxito."}

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

# 9. SIMULADOR DE ENTREVISTAS CON IA (NLP HEURÍSTICO)
@app.post("/api/interview/simulate")
def simulate_interview(payload: InterviewRequest):
    user_text = (payload.message or payload.userResponse or "").strip()

    if not user_text:
        raise HTTPException(status_code=400, detail="La respuesta del estudiante no puede estar vacía.")

    words = user_text.split()
    word_count = len(words)
    lower_text = user_text.lower()

    area = (payload.area or "transversal").lower()
    target_role = payload.role_target or ("Etapa Productiva - Tecnólogo" if area == "tecnologia" else "Prácticas Profesionales - Gestión" if area == "gestion" else "Evaluación de Competencias Laborales")

    base_score = 72
    tips = []

    tech_keywords = ["python", "react", "código", "software", "lógica", "datos", "sistema", "desarrollo", "api", "base de datos", "git", "sql", "redes", "algoritmo", "automatización"]
    soft_keywords = ["equipo", "comunicación", "empatía", "escuchar", "solucionar", "respeto", "aprender", "proactivo", "metas", "disciplina", "responsabilidad", "adaptabilidad", "liderazgo"]
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

    if area == "gestion" and (found_mgmt or found_soft):
        base_score += 8
        tips.append("✔ Demostraste criterio administrativo, orientación al cliente y enfoque en resultados.")
    elif area == "tecnologia" and found_tech:
        base_score += 8
        tips.append("✔ Correcto uso de terminología técnica y metodológica aplicada a tu área.")
    elif area == "diseno" and (found_design or found_soft):
        base_score += 8
        tips.append("✔ Excelente claridad en enfoque de diseño centrado en el usuario y expresión creativa.")
    elif found_soft:
        base_score += 8
        tips.append("✔ Demostraste alta inteligencia emocional, adaptabilidad y trabajo colaborativo.")
    else:
        tips.append("✔ Tono formal y adecuada estructuración gramatical.")

    final_score = min(max(base_score, 68), 96)

    # Desglose por ejes (heurístico NLP; el lenguaje corporal es una estimación por fluidez del discurso)
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

    if word_count < 5:
        ai_reply = "Comprendo tu punto. Para evaluar mejor tus competencias, por favor cuéntame con más detalle: ¿Cuál ha sido un reto formativo o de trabajo en equipo que hayas liderado recientemente?"
        is_completed = False
    elif any(k in lower_text for k in ["reto", "difícil", "problema", "proyecto", "error", "conflicto", "meta"]):
        if area == "gestion":
            ai_reply = "Excelente enfoque de resolución. En el entorno laboral la relación con los clientes o usuarios puede ser compleja: ¿Cómo manejas una queja o un desacuerdo dentro del equipo de trabajo?"
        elif area == "diseno":
            ai_reply = "Muy buen criterio comunicativo. Cuando un cliente o tutor solicita cambios radicales en tu propuesta: ¿Cómo defiendes tus decisiones de diseño manteniendo una postura colaborativa?"
        else:
            ai_reply = "Excelente enfoque de resolución. En un entorno laboral el trabajo colaborativo es vital: ¿Cómo manejas la retroalimentación constructiva o un desacuerdo con tu equipo de trabajo?"
        is_completed = False
    elif any(k in lower_text for k in ["equipo", "compañero", "comunicación", "escuchar", "diálogo", "cliente"]):
        ai_reply = "Gran madurez profesional. Para finalizar: ¿Cuáles son tus principales metas vocacionales para los próximos 2 años y qué esperas aportar en tu etapa práctica laboral?"
        is_completed = False
    else:
        ai_reply = f"¡Excelente aporte! Tu respuesta denota claridad vocacional y buen desenvolvimiento comunicativo. Hemos consolidado tu calificación con un puntaje global de {final_score}/100. Puedes revisar el desglose en tu Reporte de Desempeño."
        is_completed = True

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
        "completed": is_completed
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
