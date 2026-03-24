@echo off
REM Run backend dev and open frontend in default browser (Windows)

REM Change to the script directory and run npm install + dev in a new cmd window
start "Backend Dev" cmd /k "cd /d "%~dp0Script\DataBase" && echo Installing backend deps... && npm install && echo Starting backend dev... && npm run dev"

REM Open frontend HomePage in default browser
start "" "%~dp0WebPage\HomePage.html"

exit /b 0
