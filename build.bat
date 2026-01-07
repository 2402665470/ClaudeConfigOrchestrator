@echo off
echo ========================================
echo Claude Config Orchestrator Build Script
echo ========================================
echo.

echo [1/4] Cleaning dist directory...
if exist dist\main\main rmdir /s /q dist\main\main
if exist dist\common rmdir /s /q dist\common

echo [2/4] Building main process...
call npx tsc -p tsconfig.main.json
if errorlevel 1 (
    echo ERROR: Main process build failed!
    pause
    exit /b 1
)
echo Main process build completed.

echo [3/4] Building preload script...
call npx tsc -p tsconfig.preload.json
if errorlevel 1 (
    echo ERROR: Preload build failed!
    pause
    exit /b 1
)
echo Preload build completed.

echo [4/4] Building renderer...
call npx vite build
if errorlevel 1 (
    echo ERROR: Renderer build failed!
    pause
    exit /b 1
)
echo Renderer build completed.

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo To start the application, run:
echo   npx electron .
echo.
pause