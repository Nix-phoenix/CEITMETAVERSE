@echo off
REM ==========================================
REM CEIT METAVERSE AND GAME - Development Setup Script
REM Starts backend server and opens frontend
REM ==========================================

setlocal enabledelayedexpansion

echo ==========================================
echo  CEIT METAVERSE AND GAME - Development Setup
echo ==========================================
echo.

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

echo ==========================================
echo Starting Backend Server...
echo ==========================================
echo.

REM Start backend in new window
cd /d "%SCRIPT_DIR%Script\DataBase"
echo Installing backend dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Starting development server...
start "CEIT METAVERSE AND GAME Backend" cmd /k "npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak

echo.
echo ==========================================
echo Opening Frontend...
echo ==========================================
echo.

REM Open frontend
start "" "%SCRIPT_DIR%WebPage\HomePage.html"

echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: file:///WebPage/HomePage.html
echo Diagnostic: Open ConnectionDiagnostic.html to test connection
echo.
echo Make sure:
echo - Database is running and accessible
echo - All npm dependencies installed
echo - Port 5000 is not in use
echo.
pause

endlocal
