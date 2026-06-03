#!/usr/bin/env bash
# ── WatchCord zero-data-loss deploy (Linux/Git-Bash + PM2) ───────────────────
# Pull latest code, refresh deps, rebuild the frontend, reload the process.
# The SQLite database in data/ is gitignored and never touched; schema
# migrations run automatically on boot.
#
#   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

echo "==> [1/4] Pulling latest changes from GitHub..."
git pull --ff-only

echo "==> [2/4] Installing/updating server dependencies..."
npm install

echo "==> [3/4] Rebuilding the frontend (client/dist)..."
npm run build

echo "==> [4/4] Reloading PM2 (migrations apply automatically on boot)..."
pm2 reload ecosystem.config.js --update-env
pm2 save

echo ""
echo "[OK] Deploy complete — existing data preserved, code updated."
pm2 status
