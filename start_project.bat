@echo off
title Benefit Business Solutions Runner
echo ========================================================
echo   Starting Benefit Business Solutions (Full Stack)
echo ========================================================
echo.

echo [1/2] Launching Backend Server on Port 5000...
start "BBS Backend Server (Port 5000)" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/2] Launching Frontend Server on Port 5173...
start "BBS Frontend Server (Port 5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ========================================================
echo   Servers are running!
echo   Open your browser at: http://localhost:5173
echo ========================================================
pause

