// PM2 process definitions for the live VPS.
//
// Start everything once:   pm2 start ecosystem.config.js && pm2 save
// Redeploy after a pull:   pm2 reload ecosystem.config.js --update-env
//
// The server reads PORT and JWT_SECRET from .env (via dotenv) on boot, and the
// SQLite schema migrations in server/db.js run automatically at startup, so a
// reload picks up new code + new columns without touching existing data.
module.exports = {
  apps: [
    {
      name: "watchcord",
      script: "server/index.js",
      cwd: __dirname,
      autorestart: true,
      max_restarts: 15,
      watch: false,
      env: { NODE_ENV: "production" },
    },
    {
      // Cloudflared tunnel wrapper (keeps the public URL alive under PM2).
      name: "watchcord-tunnel",
      script: "tunnel.js",
      cwd: __dirname,
      autorestart: true,
      watch: false,
    },
  ],
};
