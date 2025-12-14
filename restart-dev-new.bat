@echo off
REM 使用 PowerShell 在后台重启，这样不会阻塞

powershell -Command "cd D:\MyProject\claude; ./restart-background.sh 2>&1"

echo 重启命令已发送，等待 3 秒后查看日志...
timeout /t 3 /nobreak >nul

REM 查看日志
type D:\MyProject\claude\logs\restart.log 2>nul

echo.
echo 查看开发服务器日志...
type D:\MyProject\claude\logs\dev.log 2>nul

pause