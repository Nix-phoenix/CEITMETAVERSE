# Prisma + PostgreSQL — Quick Start

This guide explains how to set up Prisma with a PostgreSQL database for the `Script/DataBase` service.

## Prerequisites

- Node.js (>=16) and npm
- Docker (recommended) or a running PostgreSQL instance
- `npx` (bundled with npm)

## Example: start Postgres with Docker

Create `docker-compose.yml` (recommended location: project root or `Script/DataBase`):

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    restart: unless-stopped
    environment:
      POSTGRES_USER: gamehub
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gamehub
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Start it:

```bash
docker compose up -d
```

## Set `DATABASE_URL`

Create or edit `Script/DataBase/.env` and add:

```env
DATABASE_URL="postgresql://gamehub:password@localhost:5432/gamehub?schema=public"
```

Adjust `gamehub`, `password`, `localhost`, and port as needed.

## Install dependencies & generate Prisma client

From `Script/DataBase`:

```bash
npm install
npx prisma generate
```

If `@prisma/client` was recently added, `npm install` will ensure it is present.

## Create and apply migrations

Development (creates a migration and applies it locally):

```bash
npx prisma migrate dev --name init
```

Production (apply existing migrations):

```bash
npx prisma migrate deploy
```

To reset the local database (WARNING: destroys data):

```bash
npx prisma migrate reset
```

## Seed data

If the project provides a `seed.js` script, run:

```bash
npm run seed
```

## Useful commands

- Open Prisma Studio (GUI): `npx prisma studio`
- Generate client: `npx prisma generate`
- Check schema & database diffs: `npx prisma migrate diff --from-empty` (advanced)

## Schema notes

- The repository's `prisma/schema.prisma` uses `provider = "postgresql"` and expects `DATABASE_URL`.
- ID fields may be defined as `String @id @db.Text` — this file uses UUIDs generated in code. If you prefer database-generated UUIDs, update the field to `String @id @default(uuid()) @db.Uuid` and run a migration.

## Prisma client usage (Node.js)

Example (already used in `sever.js`):

```js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

await prisma.user.findMany();
await prisma.game.create({ data: { /* ... */ } });
await prisma.$disconnect();
```

## Troubleshooting

- "P1001: Can't reach database" — check `DATABASE_URL`, Postgres running, and port mapping.
- If `npx prisma migrate dev` fails, run `npx prisma db pull` to introspect or inspect `prisma/schema.prisma` for compatibility.
- If you change ID column types (e.g., to `Uuid`), update application code that creates IDs.

## Security & Production

- Use strong passwords and secure network settings for production databases.
- Store production `DATABASE_URL` in environment variables or a secrets manager — do not commit `.env`.
- For production deployments, use `npx prisma migrate deploy` and ensure you have backups.

## Next steps

- After the DB is ready, run the backend:

```bash
npm run dev
```

- Open Swagger UI (if enabled) at `http://localhost:3001/docs` to test endpoints.

If you'd like, I can add a `docker-compose` entry to the repo or update `prisma/schema.prisma` to use database-generated UUIDs — which do you prefer?
