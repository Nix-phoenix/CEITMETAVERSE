Deploying to Render

This repository already includes a `render.yaml` configured for the backend service located at `Script/DataBase`.

Checklist
- Ensure `Script/DataBase/package.json` contains a `start` script (it does: `node sever.js`).
- Ensure `Script/DataBase/prisma/schema.prisma` exists and `DATABASE_URL` points to your Postgres database.
- Keep secrets out of repo; set them in Render dashboard or use `render.yaml` secret sync.

Quick steps (recommended)
1. Push your repository to GitHub.
2. On Render (https://render.com) create a new "Web Service" and connect your GitHub repo.
3. Choose the branch you want to deploy.
4. If Render detects `render.yaml`, it will use the settings there (build/start). If not, manually set:
   - Build Command: `cd Script/DataBase && npm install && npx prisma generate --schema=./prisma/schema.prisma && npx prisma migrate deploy --schema=./prisma/schema.prisma`
   - Start Command: `cd Script/DataBase && node sever.js`
5. Add required environment variables in Render -> Environment -> New Secret / Environment Variable:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = (your Postgres connection string)
   - `JWT_SECRET` = (your secret)
   - `ALLOWED_ORIGIN` = (optional, origin allowed for CORS)
6. Confirm `PORT` is not required (Render provides it via `PORT` env). The app reads `process.env.PORT`.
7. Deploy and monitor logs on Render.

Local testing

```bash
# from repo root
cd Script/DataBase
npm install
# run locally
node sever.js
# or for development
npm run dev
```

Troubleshooting
- If Prisma cannot connect during build, ensure the Postgres DB is reachable from Render and migrations are permitted.
- If static game files are missing, ensure `uploads/games` is present in repo or uploaded by runtime.

If you want, I can:
- Add a small `render-deploy.sh` script to automate build checks.
- Add a `Dockerfile` and `docker-compose.yml` for containerized Deployments (optional).