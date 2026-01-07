@echo off
echo ========================================
echo Claude Config Orchestrator 修复脚本
echo ========================================
echo.

echo 1. 等待 3 秒，请关闭所有相关窗口...
timeout /t 3 /nobreak >nul

echo.
echo 2. 强制删除 node_modules...
rd /s /q node_modules >nul 2>&1
if exist node_modules (
    echo [错误] 无法删除 node_modules，请手动关闭所有程序后重试
    pause
    exit /b 1
)
echo [成功] node_modules 已删除

echo.
echo 3. 删除 package-lock.json...
del /f /q package-lock.json >nul 2>&1

echo.
echo 4. 安装依赖（这可能需要几分钟）...
call npm install --no-optional
if errorlevel 1 (
    echo [错误] npm install 失败
    pause
    exit /b 1
)

echo.
echo 5. 重新编译原生模块...
call npx @electron/rebuild --version=32.2.0
if errorlevel 1 (
    echo [警告] 重新编译可能失败，继续尝试...
)

echo.
echo 6. 编译项目...
call npm run build:main
if errorlevel 1 (
    echo [警告] 主进程编译失败
)

call npm run build:preload
if errorlevel 1 (
    echo [警告] 预加载脚本编译失败
)

echo.
echo ========================================
echo 修复完成！
echo.
echo 现在运行以下命令启动应用：
echo   npm run dev
echo.
echo 如果仍有问题，请以管理员权限运行此脚本
echo ========================================
echo.
pause