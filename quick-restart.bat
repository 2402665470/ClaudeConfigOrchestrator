@echo off
title Quick Restart - Claude Config Distributor

echo 正在重启应用...

REM 杀掉所有相关进程
taskkill //F //IM node.exe 2>nul
taskkill //F //IM electron.exe 2>nul

REM 等待1秒
timeout /t 1 /nobreak >nul

REM 重新启动
cd /d D:\MyProject\claude
start cmd /k "npm run dev"

echo 应用已重启！
timeout /t 2 /nobreak >nul
exit