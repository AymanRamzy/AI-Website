@echo off
REM MODEX Platform Startup Script for Windows
REM This script starts both the backend (FastAPI) and frontend (React) services

echo Starting MODEX Platform...
echo.

REM Start backend server in a new window
echo Starting Backend Server (Port 8000)...
start "MODEX Backend" cmd /k "cd backend && python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 5 /nobreak > nul

REM Start frontend server in a new window
echo Starting Frontend Server (Port 3000)...
start "MODEX Frontend" cmd /k "cd frontend && npm start"

echo.
echo ===================================================
echo MODEX Platform is starting!
echo ===================================================
echo.
echo Services:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo Close the terminal windows to stop the services
echo.
pause
