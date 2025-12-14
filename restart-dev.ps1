# Claude Config Distributor 重启脚本 (PowerShell)

Write-Host "====================" -ForegroundColor Cyan
Write-Host "重启 Claude Config Distributor" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# 设置项目目录
$PROJECT_DIR = "D:\MyProject\claude"

# 进入项目目录
Set-Location $PROJECT_DIR

Write-Host "`n当前目录: $(Get-Location)" -ForegroundColor Yellow

# 函数：强制关闭进程
function Kill-ProcessByName($processName) {
    $processes = Get-Process | Where-Object { $_.ProcessName -like "*$processName*" }
    if ($processes) {
        Write-Host "`n正在关闭 $processName 相关进程..." -ForegroundColor Yellow
        foreach ($proc in $processes) {
            try {
                $proc.Kill()
                Write-Host "  ✓ 已关闭 PID: $($proc.Id) - $($proc.ProcessName)" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ 无法关闭 PID: $($proc.Id) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

# 函数：关闭占用端口的进程
function Kill-ProcessByPort($port) {
    Write-Host "`n正在关闭占用端口 $port 的进程..." -ForegroundColor Yellow
    $connections = netstat -ano | findstr ":$port"
    if ($connections) {
        foreach ($conn in $connections) {
            $parts = $conn -split '\s+'
            $pid = $parts[-1]
            if ($pid -and $pid -ne "0") {
                try {
                    Stop-Process -Id $pid -Force
                    Write-Host "  ✓ 已关闭 PID: $pid" -ForegroundColor Green
                } catch {
                    Write-Host "  ✗ 无法关闭 PID: $pid" -ForegroundColor Red
                }
            }
        }
    }
}

# 执行关闭操作
Kill-ProcessByName "node"
Kill-ProcessByName "electron"
Kill-ProcessByPort 5173

# 等待进程完全关闭
Write-Host "`n等待进程完全关闭..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 清理缓存
$cachePath = Join-Path $PROJECT_DIR "node_modules\.cache"
if (Test-Path $cachePath) {
    Write-Host "`n清理缓存..." -ForegroundColor Yellow
    Remove-Item -Path $cachePath -Recurse -Force
    Write-Host "  ✓ 已删除缓存目录" -ForegroundColor Green
}

# 启动新的开发服务器
Write-Host "`n启动开发服务器..." -ForegroundColor Green
Start-Process -WindowStyle Minimized -FilePath "cmd" -ArgumentList "/c", "npm run dev"

Write-Host "`n====================" -ForegroundColor Cyan
Write-Host "应用已成功重启！" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "`n提示:" -ForegroundColor Yellow
Write-Host "- 开发服务器已在后台启动" -ForegroundColor White
Write-Host "- Electron 应用窗口将自动打开" -ForegroundColor White
Write-Host "- 可以在开发者工具中查看日志" -ForegroundColor White
Write-Host "`n按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")