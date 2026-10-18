# CEIT Metaverse Project Documentation

## 1. Overview

CEIT Metaverse is a full-stack web project that combines:

- a frontend UI built from static HTML, CSS, and JavaScript files in `WebPage/`
- a backend API server that handles authentication, user profiles, and game management
- a PostgreSQL database managed through Prisma
- static game hosting for uploaded Unity/WebGL and executable game packages in `uploads/games/`
- Cloudflare Pages deployment configuration via `wrangler.toml`

The project is built around a game portal and profile system where users can register, log in, upload games, browse available games, and play them in-browser.

---

## 2. Project Structure

```text
CEITMETAVERSE/
├── README.md
├── package.json
├── wrangler.toml
├── build.sh
├── docker-compose.yml
├── docker-compose.override.yml
├── Dockerfile
├── run-dev.bat
├── START-DEV.bat
├── start.sh
├── Script/
│   ├── Backend/
│   │   ├── src/
│   │   │   ├── Config/Prisma.ts
│   │   │   ├── middleware/upload.ts
│   │   │   ├── module/
│   │   │   │   ├── Auth/api/auth.Routes.ts
│   │   │   │   ├── Auth/api/AuthController.ts
│   │   │   │   ├── game/api/GameController.ts
│   │   │   │   ├── game/api/GameRoute.ts
│   │   │   │   ├── user/api/User.Routes.ts
│   │   │   │   └── user/api/UserController.ts
│   │   │   ├── server.ts
│   │   │   ├── types/
│   │   │   └── utils/fileUtils.ts
│   │   └── Utils/fileUtils.ts
│   └── DataBase/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── package.json
│       ├── seed.js
│       ├── sever.js
│       ├── swagger.json
│       └── prisma.config.ts
├── uploads/
│   ├── games/
│   └── images/
├── WebPage/
│   ├── api-config.js
│   ├── env.js
│   ├── HomePage.html
│   ├── LogIn.html
│   ├── SignInPage.html
│   ├── Profile.html
│   ├── SettingProfilePage.html
│   ├── AddPage.html
│   ├── Catagory.html
│   ├── GamePage.html
│   ├── About.html
│   ├── ConnectionDiagnostic.html
│   └── Image/
└── .env
```

---

## 3. Runtime Architecture

There are two backend implementations in the repository:

### 3.1 Primary runtime: `Script/DataBase/sever.js`

This is the active server used by the `Script/DataBase/package.json` scripts:

```bash
cd Script/DataBase
npm install
npm run dev
```

It uses:

- Express for HTTP routing
- Prisma + PostgreSQL for persistence
- JWT for auth tokens
- bcryptjs for password hashing
- multer for file upload handling
- unzipper for extracting uploaded game zip files
- Swagger UI for API documentation at `/docs`

### 3.2 TypeScript backend: `Script/Backend/src/server.ts`

This is a newer modular TypeScript version of the same application. It uses Express and Prisma with cleaner module structure. It includes:

- `AuthController` for register/login
- `UserController` for profile read/update
- `GameController` for game upload/list/play/download
- `Config/Prisma.ts` for database initialization
- `middleware/upload.ts` for upload validation

The TypeScript backend is organized more cleanly than the legacy server file, but the repository’s active runtime still appears to be the Node/JavaScript server in `Script/DataBase`.

---

## 4. Database Model

The Prisma schema is located at `Script/DataBase/prisma/schema.prisma`.

### User model

```prisma
model User {
  id             String   @id @db.Text @map("id")
  username       String   @unique @db.VarChar(50) @map("username")
  email          String   @unique @db.VarChar(100) @map("email")
  password       String   @db.VarChar(255) @map("password")
  fullName       String?  @db.VarChar(100) @map("full_name")
  profilePicture String?  @db.VarChar(255) @map("profile_picture")
  bio            String?  @db.Text @map("bio")
  createdAt      DateTime @default(now()) @db.Timestamp(3) @map("created_at")

  games Game[] @relation("UserGames")

  @@map("users")
}
```

### Game model

```prisma
model Game {
  id         String   @id @db.Text @map("id")
  title      String   @db.VarChar(200) @map("title")
  shortDesc  String?  @db.Text @map("short_desc")
  fullDesc   String?  @db.Text @map("full_desc")
  gameType   String?  @db.VarChar(50) @map("game_type")
  tags       Json?    @map("tags")
  coverImage String?  @db.VarChar(255) @map("cover_image")
  gameFile   String?  @db.VarChar(255) @map("game_file")
  creatorId  String?  @db.Text @map("creator_id")
  createdAt  DateTime @default(now()) @db.Timestamp(3) @map("created_at")

  creator User? @relation("UserGames", fields: [creatorId], references: [id], onDelete: SetNull, onUpdate: Cascade)

  @@map("games")
  @@index([creatorId], name: "games_creator_id_idx")
}
```

### Meaning

- `User` stores identity, login, profile, and account metadata.
- `Game` stores game metadata, cover image path, uploaded game file path, and creator relationship.
- `tags` is stored as JSON and can hold an array of strings.

---

## 5. Authentication and User APIs

### 5.1 Register

Endpoint:

- `POST /register`

Behavior:

- validates username, email, and password
- checks for duplicate username/email
- hashes password using bcrypt
- creates a new user in Prisma
- returns a JWT token plus basic user data

### 5.2 Login

Endpoint:

- `POST /login`

Behavior:

- accepts either `email` or `username`
- verifies password with bcrypt
- creates a JWT token for 7 days
- returns user info and token

### 5.3 Google login

Endpoint:

- `POST /auth/google`

Behavior:

- verifies Google ID token
- looks up or creates a user automatically
- returns the same JWT-style session payload

### 5.4 Profile

Endpoints:

- `GET /profile/:userId`
- `PUT /profile/:userId`
- `PUT /profile/:userId/picture`
- `PUT /profile/:userId/password`
- `DELETE /profile/:userId`

These routes allow retrieving a user, changing profile fields, updating profile pictures, changing password, or deleting an account.

---

## 6. Game APIs

The server supports a full game media workflow.

### File upload and processing

Routes:

- `POST /addGame`

The upload logic accepts:

- `coverImage` (required)
- `gameFile` (required)
- optional metadata such as title, shortDesc, fullDesc, gameType, tags, creatorId

The upload flow:

1. validates file presence and title
2. checks file extension
3. if the uploaded game is a zip/rar/7z archive, it unpacks the content into `uploads/games/<sanitized-title>`
4. if the uploaded file is `.exe`, it stores the binary file for download
5. stores the cover image path and generated game path in Prisma
6. returns a game record

### Game listing and retrieval

Routes:

- `GET /games`
- `GET /games/:gameId`

These endpoints return all game records or a single game by ID.

### Game play route

Route:

- `GET /play/:gameId`

Behavior:

- loads the game record
- resolves the extracted game folder
- sends the `index.html` entry so the browser can launch the game

### Download route

Route:

- `GET /download/:gameId`

Behavior:

- finds the stored file
- sends it to the client as an attachment

---

## 7. Frontend Overview

The frontend lives under `WebPage/` and is mostly static HTML + JS. These pages act as the UI layer:

- `HomePage.html` — landing page
- `LogIn.html` — login interface
- `SignInPage.html` — registration page
- `Profile.html` — user profile display
- `SettingProfilePage.html` — profile settings
- `AddPage.html` — upload a game
- `Catagory.html` — product/category listing page
- `GamePage.html` — per-game detail view
- `About.html` — about page
- `ConnectionDiagnostic.html` — health check/debug page

### Centralized API config

File:

- `WebPage/api-config.js`

This file defines:

- base URL resolution (`window.__API_BASE__`, meta tag, current origin, localhost fallback)
- endpoint names for auth, users, and games
- a helper wrapper function for `fetch` requests
- auth session helpers (`saveAuthSession`, `clearAuthSession`, etc.)

This makes the frontend easy to maintain because all API URL logic is centralized.

---

## 8. Static Files and Game Hosting

The project serves uploaded static content from:

- `uploads/`
- `uploads/games/`

This is important because game files are not stored in a database blob; instead, the database stores a path, and the server serves those files as static content.

### Example structure

```text
uploads/
├── games/
│   ├── ceit/
│   │   ├── index.html
│   │   ├── Build/
│   │   └── TemplateData/
│   ├── nuksuksa/
│   └── sfada/
└── images/
```

This allows Unity/WebGL games to be served with browser-friendly paths and static file support.

---

## 9. Environment Variables

The project relies on environment variables.

### Typical variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
JWT_SECRET="your-secret-key"
PORT=5000
GOOGLE_CLIENT_ID="your-google-client-id"
ALLOWED_ORIGIN="https://example.com,https://www.example.com"
```

### Notes

- `Script/DataBase/prisma/schema.prisma` reads `DATABASE_URL` from the environment.
- The `sever.js` server also uses `JWT_SECRET` and `GOOGLE_CLIENT_ID`.
- Cloudflare Pages config is in `wrangler.toml`.

---

## 10. Startup and Development Instructions

### Install root dependencies

```bash
npm install
```

### Start the database server

```bash
cd Script/DataBase
npm install
npm run dev
```

### Run the project in production-like mode

```bash
cd Script/DataBase
npm start
```

### Seed the database

```bash
cd Script/DataBase
npm run seed
```

### Prisma commands

```bash
cd Script/DataBase
npx prisma generate
npx prisma studio
npx prisma migrate dev --name init --preview-feature
```

---

## 11. Deploying the backend on Debian with Cloudflare Tunnel

Run these commands in a Debian terminal (for example, Debian under WSL). Start the Docker Compose services from the project directory:

```bash
cd /mnt/d/CEITMETAVERSE
docker compose up -d --build
docker compose ps
```

Install `cloudflared`:

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
  -o /tmp/cloudflared.deb && sudo dpkg -i /tmp/cloudflared.deb
```

Start a Cloudflare quick tunnel to the backend on port `5000`. Keep this command running in its own terminal:

```bash
cloudflared tunnel --url http://localhost:5000 --loglevel info 2>&1 | tee /tmp/cloudflared.log
```

In another terminal, check that the tunnel URL responds:

```bash
curl -sS -o /dev/null -w 'HTTP %{http_code}\n' \
  'https://rendering-odds-consistent-bring.trycloudflare.com'
```

The `trycloudflare.com` quick-tunnel URL may change when the tunnel is restarted. If it changes, update the backend API URL in `WebPage/env.js` to match the new URL and redeploy the frontend.

---

## 12. Cloudflare Pages Configuration

The project includes a Cloudflare Pages config file:

- `wrangler.toml`

Content summary:

```toml
name = "ceitmetaverse"
pages_build_output_dir = "WebPage"
compatibility_date = "2026-07-19"
```

This suggests the frontend static pages are intended to be deployed as a Cloudflare Pages website, while the backend API likely runs separately from the static frontend or via another hosting setup.

---

## 13. Important Implementation Notes

### 13.1 There are two backend versions

The repository contains:

- a TypeScript backend at `Script/Backend/src/server.ts`
- a JavaScript server at `Script/DataBase/sever.js`

The JavaScript version appears to be the one actually run by the project scripts and is more feature-complete at runtime.

### 13.2 Static uploads are served directly

Uploaded files are stored under `uploads/` and served through Express static routes instead of being stored in a binary database field.

### 13.3 File upload support is limited by extension

Allowed upload types are defined in the upload middleware and include:

- `.zip`
- `.rar`
- `.7z`
- `.exe`

### 13.4 Game extraction is normalized

Uploaded zip files are extracted to a sanitized folder name, and the game server tries to locate `index.html` inside the extracted structure.

---

## 14. Summary of Key Code Modules

### Core API server

- `Script/DataBase/sever.js` — main Express server and all routes
- `Script/Backend/src/server.ts` — modular TypeScript alternative

### Prisma database access

- `Script/Backend/src/Config/Prisma.ts` — Prisma client configuration
- `Script/DataBase/prisma/schema.prisma` — database schema

### Auth logic

- `Script/Backend/src/module/Auth/api/AuthController.ts`
- `Script/DataBase/sever.js` route handlers for `/register`, `/login`, and `/auth/google`

### User logic

- `Script/Backend/src/module/user/api/UserController.ts`
- `WebPage/Profile.html` and `SettingProfilePage.html`

### Game logic

- `Script/Backend/src/module/game/api/GameController.ts`
- `Script/DataBase/sever.js` game upload/list/play/download routes
- `Script/Backend/src/utils/fileUtils.ts`

### Frontend client

- `WebPage/api-config.js`
- `WebPage/*.html` pages

---

## 15. Recommended Next Improvements

1. Keep one canonical backend implementation instead of maintaining both `sever.js` and the TypeScript server.
2. Standardize naming conventions between Prisma fields and controller property names to reduce mismatch bugs.
3. Add tests for authentication, game upload, and play/download routes.
4. Add a `.env.example` file for easier setup.
5. Document the exact deployment architecture for backend + frontend separation.

---

## 16. Final Notes

This repository is a web game portal with user accounts, uploaded games, and static game hosting. The system works as a full-stack app where the browser UI calls a backend API, the backend writes to PostgreSQL via Prisma, and game files are stored on disk and served as static content.

If you want to continue, the best next steps are:

- set up `.env` values,
- run the database server,
- initialize Prisma migrations,
- and test the `/register`, `/login`, and `/games` endpoints.
