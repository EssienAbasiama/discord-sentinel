const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "../data/monitor.db");
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    discord_token TEXT,
    notify_channel_id TEXT,
    bot_active INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS monitored_servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    server_id TEXT NOT NULL,
    server_name TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, server_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, keyword),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    server_id TEXT,
    server_name TEXT,
    channel_name TEXT,
    author_tag TEXT,
    content TEXT,
    matched_keywords TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// ── Lightweight column migrations for existing databases ────────────────────
// CREATE TABLE IF NOT EXISTS won't add columns to a table that already exists,
// so add the welcome_message column to user_configs only if it's missing.
const existingCols = new Set(
  db.prepare("PRAGMA table_info(user_configs)").all().map((c) => c.name)
);
const extraColumns = [
  ["welcome_message", "TEXT"],
];
for (const [name, def] of extraColumns) {
  if (!existingCols.has(name)) {
    db.exec(`ALTER TABLE user_configs ADD COLUMN ${name} ${def}`);
  }
}

// ── User access-control columns (super admin, enable/disable, per-user limits) ─
// SQLite fills existing rows with the DEFAULT when a column is added, so existing
// users automatically get sensible limits and an enabled, non-admin status.
const userCols = new Set(
  db.prepare("PRAGMA table_info(users)").all().map((c) => c.name)
);
const userExtraColumns = [
  ["is_super_admin", "INTEGER DEFAULT 0"],
  ["is_enabled", "INTEGER DEFAULT 1"],
  ["max_servers", "INTEGER DEFAULT 3"],
  ["max_keywords", "INTEGER DEFAULT 10"],
];
for (const [name, def] of userExtraColumns) {
  if (!userCols.has(name)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
    console.log(`[DB] Migration: added column users.${name} (existing rows backfilled with default)`);
  }
}

// ── Bootstrap the platform super admins ─────────────────────────────────────
// These accounts are always granted super-admin access and force-enabled when
// they exist. New registrations using these emails are promoted in the auth
// route (see routes/auth.js), since they may not exist yet at boot time.
const SUPER_ADMIN_EMAILS = ["hqxwvbvj5@gmx.com", "essienabasiama11@gmail.com"];
const promote = db.prepare(
  "UPDATE users SET is_super_admin = 1, is_enabled = 1 WHERE email = ?"
);
for (const email of SUPER_ADMIN_EMAILS) {
  const result = promote.run(email.toLowerCase());
  if (result.changes > 0) {
    console.log(`[DB] Ensured super-admin access for ${email}`);
  }
}

module.exports = db;
module.exports.SUPER_ADMIN_EMAILS = SUPER_ADMIN_EMAILS;
