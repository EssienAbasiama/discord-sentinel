const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_PATH = path.join(__dirname, "sentinel.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS user_bots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      discord_token TEXT NOT NULL,
      notify_channel_id TEXT NOT NULL,
      bot_name TEXT,
      status TEXT DEFAULT 'offline',
      last_connected INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monitored_servers (
      id TEXT PRIMARY KEY,
      bot_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      server_name TEXT,
      added_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (bot_id) REFERENCES user_bots(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      bot_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      keyword TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (bot_id) REFERENCES user_bots(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bot_id TEXT NOT NULL,
      type TEXT NOT NULL,
      server_name TEXT,
      channel_name TEXT,
      author_tag TEXT,
      content TEXT,
      matched_keywords TEXT,
      message_link TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_monitored_servers_bot_id ON monitored_servers(bot_id);
    CREATE INDEX IF NOT EXISTS idx_keywords_bot_id ON keywords(bot_id);
  `);
}

module.exports = { getDb };
