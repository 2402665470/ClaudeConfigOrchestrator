@echo off
echo ========================================
echo Claude Config Orchestrator Dev Mode
echo ========================================
echo.

echo Starting Vite development server...
start "Vite Dev Server" cmd /c "npx vite --port 5173"

echo Waiting for Vite server to start (5 seconds)...
timeout /t 5 /nobreak > nul

echo Starting Electron...
set NODE_ENV=development
npx electron .

echo.
echo Application closed.
pause