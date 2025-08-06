@echo off
echo 🚀 启动墨尔本停车地图开发环境...
echo.

echo 📡 启动后端服务器 (端口 3001)...
start "Backend" cmd /c "cd backend && npm start"

echo ⏳ 等待后端启动...
timeout /t 5 /nobreak >nul

echo 🌐 启动前端服务器 (端口 5173)...
start "Frontend" cmd /c "npm run dev"

echo.
echo ✅ 开发环境启动完成!
echo 📍 前端: http://localhost:5173
echo 📍 后端: http://localhost:3001
echo.
echo 按任意键关闭此窗口...
pause >nul
