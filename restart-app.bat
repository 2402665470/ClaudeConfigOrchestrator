@echo off
echo ========================================
echo Claude Config Distributor 重启脚本
echo ========================================
echo.

:: 切换到项目目录
cd /d D:\MyProject\claude
if %errorlevel% neq 0 (
    echo 错误: 无法切换到项目目录
    pause
    exit /b 1
)

echo [1/4] 检查并清理端口 5173...
:: 查找占用端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    set PID=%%a
)

:: 如果找到了进程，就终止它
if defined PID (
    echo 找到进程 %PID% 正在使用端口 5173
    echo 正在终止进程...
    taskkill /F /PID %PID% >nul 2>&1
    if %errorlevel% equ 0 (
        echo 进程已成功终止
    ) else (
        echo 无法终止进程，尝试其他方法...
        wmic process where "ProcessId=%PID%" delete >nul 2>&1
    )
) else (
    echo 端口 5173 未被占用
)

echo.
echo [2/4] 清理旧的 node 进程（可选）...
:: 清理可能的僵尸 node 进程
:: tasklist | findstr node >nul
:: if %errorlevel% equ 0 (
::     echo 清理旧的 node 进程...
::     taskkill /F /IM node.exe >nul 2>&1
:: )

echo.
echo [3/4] 等待端口释放...
:: 等待端口完全释放
timeout /t 2 /nobreak >nul

echo.
echo [4/4] 启动应用...
echo.
npm run dev

echo.
echo 应用已退出
pause