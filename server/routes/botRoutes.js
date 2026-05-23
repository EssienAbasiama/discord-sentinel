const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getDb } = require("../../db/database");
const { authMiddleware } = require("../auth");
const { startBot, stopBot, getBotStatus } = require("../botManager");

const router = express.Router();
router.use(authMiddleware);

// ── BOTS ─────────────────────────────────────────────────────────────────────

// GET /api/bots — list user's bots
router.get("/", (req, res) => {
  const db = getDb();
  const bots = db.prepare("SELECT id, bot_name, notify_channel_id, status, last_connected, created_at FROM user_bots WHERE user_id = ?")
    .all(req.user.id);

  // Enrich with live status from memory
  const enriched = bots.map(b => ({
    ...b,
    live_status: getBotStatus(b.id),
  }));
  res.json(enriched);
});

// POST /api/bots — create new bot config
router.post("/", (req, res) => {
  const { discord_token, notify_channel_id } = req.body;
  if (!discord_token || !notify_channel_id) {
    return res.status(400).json({ error: "discord_token and notify_channel_id are required" });
  }

  const db = getDb();
  const id = uuidv4();
  db.prepare("INSERT INTO user_bots (id, user_id, discord_token, notify_channel_id) VALUES (?, ?, ?, ?)")
    .run(id, req.user.id, discord_token, notify_channel_id);

  res.json({ id, message: "Bot created. Start it to go online." });
});

// DELETE /api/bots/:id
router.delete("/:id", async (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  await stopBot(req.params.id);
  db.prepare("DELETE FROM user_bots WHERE id = ?").run(req.params.id);
  res.json({ message: "Bot deleted" });
});

// POST /api/bots/:id/start
router.post("/:id/start", async (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const result = await startBot(req.params.id);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// POST /api/bots/:id/stop
router.post("/:id/stop", async (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const result = await stopBot(req.params.id);
  res.json(result);
});

// ── SERVERS ───────────────────────────────────────────────────────────────────

// GET /api/bots/:id/servers
router.get("/:id/servers", (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const servers = db.prepare("SELECT * FROM monitored_servers WHERE bot_id = ?").all(req.params.id);
  res.json(servers);
});

// POST /api/bots/:id/servers
router.post("/:id/servers", (req, res) => {
  const { server_id, server_name } = req.body;
  if (!server_id) return res.status(400).json({ error: "server_id is required" });

  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  // Check duplicate
  const existing = db.prepare("SELECT id FROM monitored_servers WHERE bot_id = ? AND server_id = ?").get(req.params.id, server_id);
  if (existing) return res.status(409).json({ error: "Server already monitored" });

  const id = uuidv4();
  db.prepare("INSERT INTO monitored_servers (id, bot_id, user_id, server_id, server_name) VALUES (?, ?, ?, ?, ?)")
    .run(id, req.params.id, req.user.id, server_id, server_name || null);

  res.json({ id, server_id, server_name, message: "Server added" });
});

// DELETE /api/bots/:id/servers/:serverId
router.delete("/:id/servers/:serverId", (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  db.prepare("DELETE FROM monitored_servers WHERE id = ? AND bot_id = ?").run(req.params.serverId, req.params.id);
  res.json({ message: "Server removed" });
});

// ── KEYWORDS ──────────────────────────────────────────────────────────────────

// GET /api/bots/:id/keywords
router.get("/:id/keywords", (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const keywords = db.prepare("SELECT * FROM keywords WHERE bot_id = ?").all(req.params.id);
  res.json(keywords);
});

// POST /api/bots/:id/keywords
router.post("/:id/keywords", (req, res) => {
  const { keyword } = req.body;
  if (!keyword || !keyword.trim()) return res.status(400).json({ error: "keyword is required" });

  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  const existing = db.prepare("SELECT id FROM keywords WHERE bot_id = ? AND keyword = ?").get(req.params.id, keyword.trim());
  if (existing) return res.status(409).json({ error: "Keyword already exists" });

  const id = uuidv4();
  db.prepare("INSERT INTO keywords (id, bot_id, user_id, keyword) VALUES (?, ?, ?, ?)")
    .run(id, req.params.id, req.user.id, keyword.trim());

  res.json({ id, keyword: keyword.trim(), message: "Keyword added" });
});

// DELETE /api/bots/:id/keywords/:kwId
router.delete("/:id/keywords/:kwId", (req, res) => {
  const db = getDb();
  const bot = db.prepare("SELECT id FROM user_bots WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
  if (!bot) return res.status(404).json({ error: "Bot not found" });

  db.prepare("DELETE FROM keywords WHERE id = ? AND bot_id = ?").run(req.params.kwId, req.params.id);
  res.json({ message: "Keyword removed" });
});

module.exports = router;
