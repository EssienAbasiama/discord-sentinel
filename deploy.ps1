# ── WatchCord zero-data-loss deploy (Windows VPS / PM2) ──────────────────────
# Pull the latest code, refresh dependencies, rebuild the frontend, and reload
# the running process. Your SQLite database in data/ is gitignored and never
# touched — schema migrations run automatically on boot.
#
# Usage (from the project root on the VPS):
#   powershell -ExecutionPolicy Bypass -File .\deploy.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "==> [1/4] Pulling latest changes from GitHub..." -ForegroundColor Cyan
git pull --ff-only

Write-Host "==> [2/4] Installing/updating server dependencies..." -ForegroundColor Cyan
npm install

Write-Host "==> [3/4] Rebuilding the frontend (client/dist)..." -ForegroundColor Cyan
npm run build

Write-Host "==> [4/4] Reloading PM2 (migrations apply automatically on boot)..." -ForegroundColor Cyan
pm2 reload ecosystem.config.js --update-env
pm2 save

Write-Host "`n[OK] Deploy complete — existing data preserved, code updated." -ForegroundColor Green
pm2 status
