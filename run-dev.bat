@echo off
REM Run backend dev and open frontend via the backend server (Windows)

REM Start backend in a new cmd window (installs deps then starts nodemon)
start "Backend Dev" cmd /k "cd /d "%~dp0Script\DataBase" && echo Installing backend deps... && npm install && echo Starting backend dev... && npm run dev"

REM Wait a few seconds for the server to start, then open via http (not file://)
echo Waiting for backend to start...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5000/WebPage/HomePage.html"

exit /b 0
