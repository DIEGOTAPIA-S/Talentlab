@echo off
title TalentLab - Sistema de Acompañamiento y Orientación Estudiantil
color 0B

echo ==============================================================================
echo                      INICIANDO PROTOTIPO MVP DE TALENTLAB
echo                  (Frontend React + Backend FastAPI + Supabase)
echo ==============================================================================
echo.

cd /d "%~dp0"

echo [1/3] Iniciando Servidor Backend (FastAPI / Uvicorn en Puerto 8000)...
start "TalentLab Backend (Puerto 8000)" cmd /k "cd backend-ml && python main.py"

echo [2/3] Iniciando Servidor Frontend (React / Vite en Puerto 5173)...
start "TalentLab Frontend (Puerto 5173)" cmd /k "cd frontend && npm run dev"

echo [3/3] Esperando inicializacion de servicios...
timeout /t 3 /nobreak >nul

echo Abriendo navegador en http://localhost:5173/login ...
start http://localhost:5173/login

echo.
echo ==============================================================================
echo       PLATAFORMA EN LINEA Y LISTA PARA LA DEMOSTRACION ANTE EL INSTRUCTOR
echo ==============================================================================
echo  CREDENCIALES DE ACCESO RAPIDO:
echo  - Perfil Estudiante: estudiante@talentlab.edu / student123
echo  - Perfil Directivo:   director@talentlab.edu   / director123
echo ==============================================================================
echo.
pause
