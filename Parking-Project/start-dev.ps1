# PowerShell启动脚本
# 设置UTF-8编码以避免中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001 > $null

Write-Host "🚀 启动墨尔本停车地图开发环境..." -ForegroundColor Green
Write-Host ""

# 检查并关闭占用端口的进程
Write-Host "🔍 检查端口占用情况..." -ForegroundColor Yellow

# 检查3001端口
$backend_process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backend_process) {
    Write-Host "⚠️  端口3001被占用，正在释放..." -ForegroundColor Yellow
    $pid = (Get-NetTCPConnection -LocalPort 3001).OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# 检查5173端口  
$frontend_process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend_process) {
    Write-Host "⚠️  端口5173被占用，正在释放..." -ForegroundColor Yellow
    $pid = (Get-NetTCPConnection -LocalPort 5173).OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "📡 启动后端服务器 (端口 3001)..." -ForegroundColor Cyan
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

Write-Host "⏳ 等待后端启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "🌐 启动前端服务器 (端口 5173)..." -ForegroundColor Cyan  
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ 开发环境启动完成!" -ForegroundColor Green
Write-Host "📍 前端: http://localhost:5173" -ForegroundColor White
Write-Host "📍 后端: http://localhost:3001" -ForegroundColor White
Write-Host "📍 后端健康检查: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
