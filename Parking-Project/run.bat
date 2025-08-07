@echo off
chcp 65001
echo Starting Melbourne Parking Map...
echo.

echo Starting Backend...
start "Backend" cmd /c "cd backend && npm start"

echo Waiting 5 seconds...
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "Frontend" cmd /c "npm run dev"

echo.
echo Development Environment Started!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001
echo.
pause
