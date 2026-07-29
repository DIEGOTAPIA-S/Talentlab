import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any

app = FastAPI(
    title="TalentLab API Backend",
    description="API REST en Python (FastAPI) para el Semáforo de Deserción y Simulador de Entrevistas con IA",
    version="1.0.0"
)

# Enable CORS for React Frontend (vite runs on port 5173 by default)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins. Can be restricted to specific localhost ports.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserSession(BaseModel):
    email: str
    role: str
    fullName: str
    institution: str

class InterviewRequest(BaseModel):
    phase: int
    userResponse: str

# --- MOCK DATA ---
MOCK_STUDENTS = [
    { "name": "Juan Pérez García", "program": "Tecnólogo en ADSO", "risk": "alto", "factor": "Económico (Transporte/Matrícula)", "score": "42%" },
    { "name": "Camila Restrepo", "program": "Tecnólogo en ADSO", "risk": "alto", "factor": "Tiempo (Estudio y Trabajo)", "score": "39%" },
    { "name": "Diego Tapia", "program": "Tecnólogo en ADSO", "risk": "medio", "factor": "Académico (Rendimiento)", "score": "62%" },
    { "name": "Mateo Bermúdez", "program": "Diseño Gráfico Digital", "risk": "medio", "factor": "Personal (Desmotivación)", "score": "68%" },
    { "name": "Daniela Rojas", "program": "Tecnólogo en ADSO", "risk": "bajo", "factor": "Estable", "score": "89%" },
    { "name": "Estefanía Herrera", "program": "Desarrollo de Software", "risk": "bajo", "factor": "Estable", "score": "93%" }
]

INTERVIEW_QUESTIONS = [
    "Perfecto, entiendo tu perfil. Ahora cuéntame: ¿Cuál ha sido el mayor reto técnico que has superado y cómo lo resolviste?",
    "Entendido. En un entorno laboral, el trabajo en equipo es crucial. ¿Cómo manejas un desacuerdo profesional con un compañero de proyecto?",
    "Bien. Por último, ¿por qué consideras que deberíamos seleccionarte a ti para esta posición sobre otros postulantes?"
]

AI_FEEDBACKS = [
    {
        "score": 78,
        "tips": [
            "✔ Buena presentación inicial de perfil.",
            "⚠ Podrías detallar más tus tecnologías preferidas.",
            "✔ Actitud y tono profesional."
        ]
    },
    {
        "score": 83,
        "tips": [
            "✔ Demostraste gran resolución técnica (metodología STAR).",
            "✔ Mencionaste tecnologías específicas del área.",
            "⚠ Recuerda estructurar la conclusión de tus logros."
        ]
    },
    {
        "score": 89,
        "tips": [
            "✔ Excelente gestión de empatía y liderazgo en equipo.",
            "✔ Muestras alta capacidad de adaptación.",
            "✔ Puntaje de coherencia lingüística sobresaliente."
        ]
    }
]

# --- ENDPOINTS ---
@app.get("/")
def read_root():
    return {"message": "Servidor de Backend de TalentLab en FastAPI está en línea."}

@app.post("/api/auth/login", response_model=UserSession)
def login(payload: LoginRequest):
    email = payload.email.lower()
    password = payload.password
    role = payload.role

    if role == "student":
        if email == "estudiante@talentlab.edu" and password == "student123":
            return UserSession(
                email=email,
                role="student",
                fullName="Diego Tapia",
                institution="SENA Centro de Tecnologías"
            )
        else:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas para perfil de Estudiante.")
            
    elif role == "admin_tenant":
        if email == "director@talentlab.edu" and password == "director123":
            return UserSession(
                email=email,
                role="admin_tenant",
                fullName="Dra. Patricia Gómez",
                institution="SENA Centro de Tecnologías"
            )
        else:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas para perfil de Directivo.")
            
    raise HTTPException(status_code=400, detail="Rol de acceso no reconocido.")

@app.get("/api/dashboard/risk-semaphore")
def get_risk_semaphore():
    # Returns the list of evaluated B2C students risk indicators for B2B dashboards
    return {
        "totalEvaluated": 96,
        "highRiskCount": 26,
        "mediumRiskCount": 18,
        "lowRiskCount": 52,
        "students": MOCK_STUDENTS
    }

@app.post("/api/interview/simulate")
def simulate_interview(payload: InterviewRequest):
    phase = payload.phase
    user_response = payload.userResponse.strip()

    if not user_response:
        raise HTTPException(status_code=400, detail="La respuesta del usuario no puede estar vacía.")

    # Simple heuristic scoring based on response quality
    word_count = len(user_response.split())
    base_score = 70
    if word_count > 15:
        base_score += 10
    if word_count > 30:
        base_score += 10
        
    # Cap score at 98
    final_score = min(base_score, 98)

    if phase < len(INTERVIEW_QUESTIONS):
        next_question = INTERVIEW_QUESTIONS[phase]
        feedback = AI_FEEDBACKS[min(phase, len(AI_FEEDBACKS)-1)]
        # Use calculated heuristic score instead of hardcoded if it fits
        feedback["score"] = final_score
        
        return {
            "completed": False,
            "nextQuestion": next_question,
            "evaluation": feedback
        }
    else:
        # End of interview simulation
        return {
            "completed": True,
            "nextQuestion": None,
            "evaluation": {
                "score": final_score,
                "tips": [
                    "✔ ¡Simulación Completada con éxito!",
                    f"Tu promedio de comunicación final es de {final_score}/100.",
                    "El reporte ha sido consolidado en Supabase PostgreSQL para monitoreo institucional."
                ]
            }
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
