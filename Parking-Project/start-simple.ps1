# Simple startup script without Chinese characters
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Starting Melbourne Parking Map Development Environment..." -ForegroundColor Green
Write-Host ""

# Kill processes on ports if they exist
Write-Host "Checking port usage..." -ForegroundColor Yellow

# Check port 3001
$backend_process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backend_process) {
    Write-Host "Port 3001 is in use, releasing..." -ForegroundColor Yellow
    $pid = (Get-NetTCPConnection -LocalPort 3001).OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

# Check port 5173
$frontend_process = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($frontend_process) {
    Write-Host "Port 5173 is in use, releasing..." -ForegroundColor Yellow
    $pid = (Get-NetTCPConnection -LocalPort 5173).OwningProcess
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Starting Backend Server (Port 3001)..." -ForegroundColor Cyan
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "chcp 65001; cd backend; npm start" -WindowStyle Normal

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

Write-Host "Starting Frontend Server (Port 5173)..." -ForegroundColor Cyan  
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "chcp 65001; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "Development Environment Started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend: http://localhost:3001" -ForegroundColor White
Write-Host "Backend Health: http://localhost:3001/health" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
