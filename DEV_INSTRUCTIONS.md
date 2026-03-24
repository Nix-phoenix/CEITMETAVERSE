# Development: Run Frontend and Backend (Windows)

This project contains a static frontend under `WebPage/` and a Node backend inside `Script/DataBase/`.

Quick steps

- **Frontend:** Open the frontend by double-clicking `WebPage\HomePage.html` or run a simple static server.
  - Example (recommended if you want a local server):
    - `npx http-server WebPage -o`

- **Backend:** Install dependencies and run the backend dev server:
  - From project root:
    - `npm --prefix Script/DataBase install`
    - `npm --prefix Script/DataBase run dev`

Run both (automated)

- Use the included batch script `run-dev.bat` to start the backend (in a new terminal window) and open the frontend in your default browser.

Troubleshooting

- If `npm` or `npx` are not found, install Node.js (which includes npm) from https://nodejs.org/.
- If the backend uses TypeScript (files like `server.ts`) you may need an additional build step; check `Script/DataBase` for scripts and adapt as needed.

Port conflicts

- If the backend fails to start with an error like `EADDRINUSE` (address in use), another process is using the configured port. You can:
  - Set a different port when starting the backend: `set PORT=3002 && npm --prefix Script/DataBase run dev` (PowerShell/CMD).
  - Or edit the `PORT` environment variable in your system, or stop the other process using that port.
  - The backend now attempts several nearby ports automatically if the requested port is busy.

  Prisma / PostgreSQL

  - This project contains a Prisma schema at `Script/DataBase/prisma/schema.prisma` and expects a PostgreSQL database.
  - Set your database connection string in `Script/DataBase/.env` as `DATABASE_URL` before running migrations.
  - To prepare the database (from project root):
    - `cd Script/DataBase`
    - `npm install` (if you haven't already)
    - `npx prisma generate`
    - `npx prisma migrate dev --name init` or run the npm script `npm run prisma:migrate`
    - Optionally seed sample data: `npm run seed`

  API docs (Swagger)

  - After dependencies are installed, open the Swagger UI at: `http://localhost:3001/docs` to explore and test API endpoints.

  Notes

  - I removed Mongoose usage from the DataBase server and switched the runtime data access to Prisma (Postgres). Ensure `DATABASE_URL` points to a running Postgres instance.

Notes

- The backend `dev` script defined in `Script/DataBase/package.json` uses `nodemon` and runs `sever.js`.
- Adjust the `run-dev.bat` if you prefer to run both servers in the same terminal or using a terminal multiplexer.
