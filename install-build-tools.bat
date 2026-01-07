@echo off
echo ========================================
echo 安装 Visual Studio 构建工具
echo ========================================
echo.
echo 正在下载 Visual Studio Build Tools...
echo.

REM 使用 chocolatey 安装 Visual Studio Build Tools
echo 方法1: 使用 Chocolatey (推荐)
echo.
echo 1. 安装 Chocolatey:
echo    - 以管理员身份打开 PowerShell
echo    - 运行: Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
echo.
echo 2. 安装 Visual Studio Build Tools:
echo    choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
echo.

echo 方法2: 手动下载安装
echo.
echo 访问链接下载 Visual Studio Build Tools:
echo https://visualstudio.microsoft.com/zh-hans/downloads/#build-tools-for-visual-studio-2022
echo.
echo 安装时选择:
echo - 工作负载: C++ 生成工具
echo - 单个组件: MSVC v143 - VS 2022 C++ x64/x86 生成工具
echo.
echo 安装完成后，重新运行:
echo npm rebuild better-sqlite3
echo.
pause