# WatchCord — Discord Monitor Web Platform

A full-stack web platform for monitoring Discord servers. Users register, configure their credentials, and get real-time alerts in their private Discord channel.

---

## Stack
- **Backend:** Node.js + Express
- **Database:** SQLite (via better-sqlite3)
- **Auth:** JWT
- **Frontend:** React + Vite

---

## Setup & Run

### 1. Install server dependencies
```bash
npm install
```

### 2. Build the React frontend
```bash
npm run build
```

### 3. Configure environment
Edit `.env`:
```env
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
```

### 4. Start the server
```bash
npm start
```

Visit: **http://localhost:3001**

---

## Development (hot reload)

Run backend and frontend separately:

```bash
# Terminal 1 — backend
npm start

# Terminal 2 — frontend dev server
cd client && npm install && npm run dev
```

Frontend dev server: http://localhost:5173 (proxies API to :3001)

---

## Deployment on Windows VPS with PM2

### First-time setup (run once)
```bash
npm install
npm run build
pm2 start ecosystem.config.js   # starts "watchcord" + "watchcord-tunnel"
pm2 save
pm2-windows-startup install
```

> Migrating from an older `pm2 start server/index.js --name watchcord`?
> Run `pm2 delete watchcord` (and your old tunnel app) once, then
> `pm2 start ecosystem.config.js && pm2 save`.

### Redeploying new code (no data loss, no manual restart)
Pull the latest changes and reload in one step:

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```
```bash
# or Git-Bash / Linux
./deploy.sh

# or, from anywhere npm runs:
npm run deploy
```

This pulls from GitHub, refreshes dependencies, **rebuilds the frontend**, and
reloads PM2. Your data is safe and untouched:

- `data/monitor.db` is gitignored, so `git pull` never overwrites it.
- Schema migrations in `server/db.js` are **idempotent** — new columns are added
  to existing tables only if missing, and existing rows are backfilled with
  sensible defaults. Super-admin emails are promoted automatically on boot.
- `client/dist` is gitignored and therefore rebuilt on the server each deploy.

You'll see migration confirmations in the PM2 logs (`pm2 logs watchcord`),
e.g. `[DB] Migration: added column users.max_servers …`.

---

## Project Structure

```
discord-monitor-web/
├── server/
│   ├── index.js          # Express entry point
│   ├── db.js             # SQLite schema + connection
│   ├── botManager.js     # Per-user Discord client manager
│   ├── routes/
│   │   ├── auth.js       # Register / Login
│   │   ├── config.js     # Token, servers, keywords, bot start/stop
│   │   └── logs.js       # Fetch / clear logs
│   └── middleware/
│       └── auth.js       # JWT verification
├── client/               # React + Vite frontend
│   └── src/
│       ├── pages/        # Landing, Login, Register, Dashboard
│       └── components/   # Overview, TokenSetup, ServerManager, KeywordManager, LogsPanel
├── data/                 # Auto-created — holds monitor.db
└── .env                  # JWT_SECRET and PORT
```
