@echo off
cd /d D:\MyProject\claude

echo ========================================
echo Claude Config Distributor Development Server
echo ========================================

REM 检查依赖
echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo node_modules not found, installing dependencies...
    npm install
    if errorlevel 1 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies found.
)

REM 检查 package.json
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please ensure you are in the project directory.
    pause
        exit /b 1
)

REM 清理之前的构建
echo.
echo Cleaning previous build...
if exist "dist\main" (
    rmdir /s /q "dist\main"
)

REM 关闭现有进程
echo.
echo Stopping existing processes...
taskkill //F //IM node.exe >nul 2>&1
taskkill //F //IM electron.exe >nul 2>&1

REM 启动开发服务器
echo.
echo Starting development server...
echo.
echo ========================================
echo Server will start at http://localhost:5173
echo Press Ctrl+C to stop
echo ========================================
echo.

npm run dev