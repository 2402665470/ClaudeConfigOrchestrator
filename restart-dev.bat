@echo off
echo ====================
echo 重启 Claude Config Distributor
echo ====================

REM 设置项目目录
set PROJECT_DIR=D:\MyProject\claude

REM 进入项目目录
cd /d "%PROJECT_DIR%"

REM 查找并关闭所有 node.exe 进程（可能是 Vite 或 Electron）
echo 正在关闭相关进程...
for /f "tokens=2" %%i in ('tasklist ^| findstr /i "node.exe"') do (
    taskkill //F //PID %%i 2>nul
)

REM 查找并关闭占用端口 5173 的进程
echo 正在关闭占用端口 5173 的进程...
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5173"') do (
    taskkill //F //PID %%i 2>nul
)

REM 等待一下确保进程完全关闭
echo 等待进程关闭...
timeout /t 2 /nobreak >nul

REM 清理可能存在的 node_modules/.cache
echo 清理缓存...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
)

REM 重新启动应用
echo 启动开发服务器...
start /min "Vite Server" cmd /c "npm run dev"

echo.
echo ====================
echo 应用已重启！
echo ====================
echo.
echo 提示：
echo - 开发服务器将在后台运行
echo - Electron 应用窗口将自动打开
echo - 如果需要查看日志，请查看控制台输出
echo.
pause