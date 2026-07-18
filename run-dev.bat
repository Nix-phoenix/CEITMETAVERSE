@echo off
REM Run backend dev via Docker (WSL) and open frontend in the browser (Windows)

set WSL_DISTRO=Debian
set PROJECT_DIR=/mnt/d/CEITMETAVERSE

echo Checking WSL / Docker...
wsl -d %WSL_DISTRO% -e bash -lc "docker info >/dev/null 2>&1"
if %errorlevel% neq 0 (
    echo ERROR: Docker is not reachable inside WSL distro "%WSL_DISTRO%".
    echo Make sure Docker Desktop is running and WSL Integration is enabled for %WSL_DISTRO%.
    pause
    exit /b 1
)

echo Starting containers (build + up -d)...
wsl -d %WSL_DISTRO% -e bash -lc "cd %PROJECT_DIR% && docker compose up --build -d"
if %errorlevel% neq 0 (
    echo ERROR: docker compose up failed. See output above.
    pause
    exit /b 1
)

REM Open a second window tailing the backend logs
start "Docker Logs (app)" wsl -d %WSL_DISTRO% -e bash -lc "cd %PROJECT_DIR% && docker compose logs -f app"

echo Waiting for backend to become ready...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5000/"

exit /b 0
