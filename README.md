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

```bash
# Build first
npm run build

# Start with PM2
pm2 start server/index.js --name watchcord
pm2 save
pm2-windows-startup install
```

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
