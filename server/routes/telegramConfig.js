const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const tgManager = require("../telegramBotManager");

const router = express.Router();
router.use(auth);

// Ensure telegram_configs row exists for this user
function ensureTgConfig(userId) {
  const existing = db.prepare("SELECT id FROM telegram_configs WHERE user_id = ?").get(userId);
  if (!existing) {
    db.prepare("INSERT INTO telegram_configs (user_id) VALUES (?)").run(userId);
  }
}

// ── Get Telegram config ───────────────────────────────────────────────────────
router.get("/", (req, res) => {
  ensureTgConfig(req.user.id);
  const config = db.prepare("SELECT * FROM telegram_configs WHERE user_id = ?").get(req.user.id);
  const groups = db.prepare("SELECT * FROM telegram_groups WHERE user_id = ? ORDER BY added_at DESC").all(req.user.id);
  const status = tgManager.getStatus(req.user.id);
  res.json({ config, groups, tgBotStatus: status });
});

// ── Save bot token + notify chat ──────────────────────────────────────────────
router.post("/token", (req, res) => {
  const { bot_token, notify_chat_id } = req.body;
  if (!bot_token) return res.status(400).json({ error: "Bot token required" });
  ensureTgConfig(req.user.id);
  db.prepare("UPDATE telegram_configs SET bot_token = ?, notify_chat_id = ? WHERE user_id = ?")
    .run(bot_token.trim(), notify_chat_id?.trim() || null, req.user.id);
  res.json({ success: true });
});

// ── Add group ─────────────────────────────────────────────────────────────────
router.post("/groups", async (req, res) => {
  const { chat_id, chat_title } = req.body;
  if (!chat_id) return res.status(400).json({ error: "Chat ID required" });
  try {
    db.prepare("INSERT OR IGNORE INTO telegram_groups (user_id, chat_id, chat_title) VALUES (?, ?, ?)")
      .run(req.user.id, String(chat_id).trim(), chat_title || "Unknown Group");
    if (tgManager.getStatus(req.user.id) === "running") {
      tgManager.reload(req.user.id).catch(err => console.error("[TG] Reload failed:", err.message));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Could not add group" });
  }
});

// ── Delete group ──────────────────────────────────────────────────────────────
router.delete("/groups/:id", (req, res) => {
  db.prepare("DELETE FROM telegram_groups WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
  if (tgManager.getStatus(req.user.id) === "running") {
    tgManager.reload(req.user.id).catch(err => console.error("[TG] Reload failed:", err.message));
  }
  res.json({ success: true });
});

// ── Start bot ─────────────────────────────────────────────────────────────────
router.post("/bot/start", async (req, res) => {
  try {
    await tgManager.start(req.user.id);
    res.json({ success: true, status: "running" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stop bot ──────────────────────────────────────────────────────────────────
router.post("/bot/stop", (req, res) => {
  tgManager.stop(req.user.id);
  res.json({ success: true, status: "stopped" });
});

module.exports = router;
