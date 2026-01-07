# PowerShell script to fix better-sqlite3 compilation issues
Write-Host "正在修复 better-sqlite3 编译问题..." -ForegroundColor Green

# 检查是否以管理员身份运行
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "需要管理员权限，正在请求提升权限..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

try {
    Write-Host "`n1. 停止所有 Node.js 进程..." -ForegroundColor Cyan
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

    Write-Host "`n2. 删除 node_modules 目录..." -ForegroundColor Cyan
    if (Test-Path node_modules) {
        Remove-Item -Recurse -Force node_modules
    }

    Write-Host "`n3. 删除 package-lock.json..." -ForegroundColor Cyan
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

    Write-Host "`n4. 清理 npm 缓存..." -ForegroundColor Cyan
    npm cache clean --force

    Write-Host "`n5. 重新安装依赖..." -ForegroundColor Cyan
    npm install

    Write-Host "`n6. 重新编译原生模块..." -ForegroundColor Cyan
    npm run rebuild

    Write-Host "`n✅ 修复完成！现在可以运行 'npm run dev' 启动应用了。" -ForegroundColor Green
} catch {
    Write-Host "`n❌ 修复过程中出现错误:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")