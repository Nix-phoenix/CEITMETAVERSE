@echo off
REM Small Render deploy helper for Windows (Command Prompt)
REM Usage: render-deploy.bat

SET ROOT_DIR=%~dp0
cd /d %ROOT_DIR%Script\DataBase

necho Installing dependencies...
npm install --no-audit --no-fund

necho Generating Prisma client...
npx prisma generate --schema=./prisma/schema.prisma

necho Running Prisma migrations (deploy)...
npx prisma migrate deploy --schema=./prisma/schema.prisma || echo Migration failed. Ensure DATABASE_URL is reachable.

necho Build steps finished. Commit and push to trigger Render deploy.
