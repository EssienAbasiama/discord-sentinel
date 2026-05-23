const express = require("express");
const { getDb } = require("../../db/database");
const { authMiddleware } = require("../auth");

const router = express.Router();
router.use(authMiddleware);

// GET /api/logs?bot_id=&type=&limit=&offset=
router.get("/", (req, res) => {
  const { bot_id, type, limit = 50, offset = 0 } = req.query;

  let query = "SELECT * FROM logs WHERE user_id = ?";
  const params = [req.user.id];

  if (bot_id) { query += " AND bot_id = ?"; params.push(bot_id); }
  if (type) { query += " AND type = ?"; params.push(type); }

  query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  const db = getDb();
  const logs = db.prepare(query).all(...params);

  // Parse matched_keywords JSON
  const parsed = logs.map(log => ({
    ...log,
    matched_keywords: log.matched_keywords ? JSON.parse(log.matched_keywords) : [],
  }));

  res.json(parsed);
});

// GET /api/logs/stats
router.get("/stats", (req, res) => {
  const db = getDb();
  const total = db.prepare("SELECT COUNT(*) as count FROM logs WHERE user_id = ?").get(req.user.id);
  const keywords = db.prepare("SELECT COUNT(*) as count FROM logs WHERE user_id = ? AND type = 'keyword'").get(req.user.id);
  const joins = db.prepare("SELECT COUNT(*) as count FROM logs WHERE user_id = ? AND type = 'join'").get(req.user.id);
  const today = db.prepare("SELECT COUNT(*) as count FROM logs WHERE user_id = ? AND created_at > strftime('%s', 'now', '-1 day')").get(req.user.id);

  res.json({
    total: total.count,
    keywords: keywords.count,
    joins: joins.count,
    today: today.count,
  });
});

// DELETE /api/logs — clear all logs for user
router.delete("/", (req, res) => {
  const db = getDb();
  db.prepare("DELETE FROM logs WHERE user_id = ?").run(req.user.id);
  res.json({ message: "Logs cleared" });
});

module.exports = router;
