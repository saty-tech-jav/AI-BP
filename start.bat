@echo off
echo ============================================
echo   VitalTrack BP Tracker - Startup Script
echo ============================================
echo.

echo [1/2] Starting Backend (Spring Boot)...
cd /d "%~dp0backend"
start "BP Tracker Backend" cmd /k "mvn spring-boot:run"

echo Waiting for backend to start (15 seconds)...
timeout /t 15 /nobreak >nul

echo [2/2] Starting Frontend (React)...
cd /d "%~dp0frontend"
call npm install
start "BP Tracker Frontend" cmd /k "npm start"

echo.
echo ============================================
echo   App is starting up!
echo   Backend : http://localhost:8080
echo   Frontend: http://localhost:3000
echo   Demo Login: demo / demo123
echo ============================================
pause
