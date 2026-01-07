@echo off
echo 正在修复数据库模块编译问题...
echo.

echo 1. 删除 node_modules 目录...
rmdir /s /q node_modules 2>nul
if exist node_modules (
    echo 无法删除 node_modules，可能有程序正在使用。
    echo 请关闭所有相关程序后重试。
    pause
    exit /b 1
)

echo 2. 删除 package-lock.json...
del /f /q package-lock.json 2>nul

echo 3. 重新安装依赖...
call npm install
if errorlevel 1 (
    echo npm install 失败
    pause
    exit /b 1
)

echo 4. 重新编译原生模块...
call npm run rebuild
if errorlevel 1 (
    echo 重新编译失败，尝试使用 electron-rebuild...
    call npx electron-rebuild
    if errorlevel 1 (
        echo electron-rebuild 也失败了
        pause
        exit /b 1
    )
)

echo.
echo 修复完成！现在可以运行 npm run dev 启动应用了。
echo.
pause