@echo off
echo Starting Claude Config Orchestrator in development mode...

echo Step 1: Starting Vite dev server...
start /B npx vite --port 5173

echo Waiting for Vite server to start...
timeout /t 5 /nobreak > nul

echo Step 2: Starting Electron...
set NODE_ENV=development
npx electron .

echo Done!