@echo off
setlocal enabledelayedexpansion

echo ====================
echo 重启 Claude Config Distributor
echo ====================

REM 设置项目目录
set PROJECT_DIR=D:\MyProject\claude
set LOG_DIR=%PROJECT_DIR%\logs

REM 创建日志目录
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM 设置日志文件
set LOG_FILE=%LOG_DIR%\restart.log
set DEV_LOG=%LOG_DIR%\dev.log

REM 进入项目目录
cd /d "%PROJECT_DIR%"

echo 当前目录: %CD% >> "%LOG_FILE%"
echo 重启时间: %date% %time% >> "%LOG_FILE%"

REM 查找并关闭相关进程
echo 正在关闭相关进程... >> "%LOG_FILE%"

REM 关闭占用端口 5173 的进程
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":5173"') do (
    if not "%%i"=="" (
        echo  关闭 PID: %%i >> "%LOG_FILE%"
        taskkill //F //PID %%i >> "%LOG_FILE%" 2>&1
    )
)

REM 关闭 node 和 electron 进程
taskkill //F //IM node.exe >> "%LOG_FILE%" 2>&1
taskkill //F //IM electron.exe >> "%LOG_FILE%" 2>&1

REM 等待进程关闭
echo 等待进程关闭... >> "%LOG_FILE%"
ping 127.0.0.1 -n 2 > nul

REM 清理缓存
if exist "node_modules\.cache" (
    echo 清理缓存... >> "%LOG_FILE%"
    rmdir /s /q "node_modules\.cache" >> "%LOG_FILE%" 2>&1
)

REM 启动开发服务器（后台运行）
echo 在后台启动开发服务器... >> "%LOG_FILE%"
start /B cmd /c "npm run dev > \"%DEV_LOG%\" 2>&1"

echo.
echo ====================
echo 应用已重启！
echo ====================
echo.
echo 日志位置:
echo - 重启日志: %LOG_FILE%
echo - 开发日志: %DEV_LOG%
echo.
echo 查看开发日志:
echo type "%DEV_LOG%"
echo.
pause