# ⬡ Discord Sentinel — Multi-User Dashboard

A full-stack web app for monitoring Discord servers with keyword alerts and member join tracking — with per-user isolated dashboards, database persistence, and a sleek dark UI.

## Architecture

```
discord-sentinel/
├── server/              ← Express API + Bot Manager
│   ├── index.js         ← Main server entry
│   ├── auth.js          ← JWT authentication
│   ├── botManager.js    ← Discord selfbot instances
│   └── routes/
│       ├── authRoutes.js
│       ├── botRoutes.js
│       └── logRoutes.js
├── db/
│   └── database.js      ← SQLite schema & connection
└── client/              ← React frontend
    └── src/
        ├── pages/
        │   ├── AuthPage.js     ← Login/Register + onboarding
        │   ├── Dashboard.js    ← Bot overview + setup wizard
        │   ├── BotDetail.js    ← Manage servers & keywords
        │   └── LogsPage.js     ← Full activity log
        ├── components/
        │   └── Layout.js       ← Sidebar navigation
        └── contexts/
            └── AuthContext.js  ← Auth state + API helper
```

## Quick Start (Development)

### 1. Install dependencies

```bash
# Backend
npm install

# Frontend
cd client && npm install && cd ..
```

### 2. Start the backend

```bash
npm start
# API runs on http://localhost:4000
```

### 3. Start the frontend

```bash
cd client && npm start
# UI runs on http://localhost:3000
```

Open http://localhost:3000 → Register → Add Bot → Configure → Start!

---

## Deploying to Production

### Option A: Single-server (Recommended)

Build the React app and serve it from Express:

```bash
cd client && npm run build && cd ..
NODE_ENV=production PORT=4000 node server/index.js
```

### Option B: Railway / Render / Fly.io

Add a `Procfile`:
```
web: cd client && npm run build && cd .. && NODE_ENV=production node server/index.js
```

Set environment variables:
```
PORT=4000
NODE_ENV=production
CLIENT_ORIGIN=https://your-domain.com
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### Option C: VPS with PM2

```bash
npm install -g pm2
cd client && npm run build && cd ..
pm2 start server/index.js --name sentinel
pm2 save
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Server port |
| `NODE_ENV` | `development` | Set to `production` for deploy |
| `CLIENT_ORIGIN` | `http://localhost:3000` | CORS allowed origin |
| `JWT_SECRET` | (built-in dev default) | **Change this in production!** |

> No `.env` needed for development. All user data (tokens, server IDs, keywords) is stored in `db/sentinel.db` (SQLite).

---

## Database

SQLite file at `db/sentinel.db`. Tables:

- `users` — accounts
- `user_bots` — Discord token + notify channel per user
- `monitored_servers` — server IDs per bot
- `keywords` — keywords per bot
- `logs` — activity history

---

## Security Notes

- Discord tokens are stored in the SQLite database. In production, consider encrypting them at rest.
- Change `JWT_SECRET` to a long random string in production.
- This is a selfbot tool — use responsibly and only for practice/learning.
- Discord's ToS prohibits selfbots; this project is for educational purposes only.
