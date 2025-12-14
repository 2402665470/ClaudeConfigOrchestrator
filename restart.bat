@echo off
echo 重启中...

REM 直接杀掉进程，不等待
taskkill //F //IM node.exe >nul 2>&1
taskkill //F //IM electron.exe >nul 2>&1

REM 重新启动
cd /d D:\MyProject\claude
start /B npm run dev > logs\dev.log 2>&1 &

echo 重启完成！