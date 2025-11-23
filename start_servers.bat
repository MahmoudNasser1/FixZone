@echo off
echo Starting FixZone ERP Servers...
echo.

echo Starting Backend Server on port 4000...
start "Backend Server" cmd /c "cd backend && node server.js"

echo Waiting 3 seconds...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server on port 3000...
start "Frontend Server" cmd /c "cd frontend/react-app && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:4000/api
echo Frontend: http://localhost:3000
echo.
echo Please wait a moment for both servers to fully start.
pause
