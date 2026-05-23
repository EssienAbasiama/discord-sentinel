const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const botManager = require("../botManager");

const router = express.Router();
router.use(auth);

// ── Get full config ───────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const config = db.prepare("SELECT * FROM user_configs WHERE user_id = ?").get(req.user.id);
  const servers = db.prepare("SELECT * FROM monitored_servers WHERE user_id = ? ORDER BY added_at DESC").all(req.user.id);
  const keywords = db.prepare("SELECT * FROM keywords WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
  const status = botManager.getStatus(req.user.id);
  res.json({ config, servers, keywords, botStatus: status });
});

// ── Save token + channel ──────────────────────────────────────────────────────
router.post("/token", (req, res) => {
  const { discord_token, notify_channel_id } = req.body;
  if (!discord_token) return res.status(400).json({ error: "Token required" });
  db.prepare("UPDATE user_configs SET discord_token = ?, notify_channel_id = ? WHERE user_id = ?")
    .run(discord_token, notify_channel_id || null, req.user.id);
  res.json({ success: true });
});

// ── Add server ────────────────────────────────────────────────────────────────
router.post("/servers", async (req, res) => {
  const { server_id, server_name } = req.body;
  if (!server_id) return res.status(400).json({ error: "Server ID required" });
  try {
    db.prepare("INSERT OR IGNORE INTO monitored_servers (user_id, server_id, server_name) VALUES (?, ?, ?)")
      .run(req.user.id, server_id.trim(), server_name || "Unknown Server");

    // Auto-reload bot if it's already running — no manual restart needed
    if (botManager.getStatus(req.user.id) === "running") {
      console.log(`[CONFIG] Server added for user ${req.user.id} — reloading bot...`);
      botManager.reload(req.user.id).catch((err) => {
        console.error(`[CONFIG] Bot reload failed: ${err.message}`);
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("[CONFIG] Add server error:", err.message);
    res.status(500).json({ error: "Could not add server" });
  }
});

// ── Delete server ─────────────────────────────────────────────────────────────
router.delete("/servers/:id", async (req, res) => {
  db.prepare("DELETE FROM monitored_servers WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);

  // Auto-reload bot if running
  if (botManager.getStatus(req.user.id) === "running") {
    console.log(`[CONFIG] Server removed for user ${req.user.id} — reloading bot...`);
    botManager.reload(req.user.id).catch((err) => {
      console.error(`[CONFIG] Bot reload failed: ${err.message}`);
    });
  }

  res.json({ success: true });
});

// ── Add keyword ───────────────────────────────────────────────────────────────
router.post("/keywords", (req, res) => {
  const { keyword } = req.body;
  if (!keyword) return res.status(400).json({ error: "Keyword required" });
  try {
    db.prepare("INSERT OR IGNORE INTO keywords (user_id, keyword) VALUES (?, ?)").run(req.user.id, keyword.toLowerCase().trim());
    // No reload needed — keywords are fetched live from DB on every message
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Could not add keyword" });
  }
});

// ── Delete keyword ────────────────────────────────────────────────────────────
router.delete("/keywords/:id", (req, res) => {
  db.prepare("DELETE FROM keywords WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  // No reload needed — keywords are fetched live from DB on every message
  res.json({ success: true });
});

// ── Start bot ─────────────────────────────────────────────────────────────────
router.post("/bot/start", async (req, res) => {
  try {
    await botManager.start(req.user.id);
    res.json({ success: true, status: "running" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stop bot ──────────────────────────────────────────────────────────────────
router.post("/bot/stop", (req, res) => {
  botManager.stop(req.user.id);
  res.json({ success: true, status: "stopped" });
});

module.exports = router;
