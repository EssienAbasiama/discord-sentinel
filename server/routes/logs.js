const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

// ── Get logs (paginated) ──────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const { page = 1, limit = 50, type } = req.query;
  const offset = (page - 1) * limit;
  const whereType = type ? "AND type = ?" : "";
  const params = type
    ? [req.user.id, type, Number(limit), offset]
    : [req.user.id, Number(limit), offset];

  const logs = db
    .prepare(`SELECT * FROM logs WHERE user_id = ? ${whereType} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(...params);

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM logs WHERE user_id = ? ${whereType}`)
    .get(...(type ? [req.user.id, type] : [req.user.id])).count;

  res.json({ logs, total, page: Number(page) });
});

// ── Clear all logs ────────────────────────────────────────────────────────────
router.delete("/", (req, res) => {
  db.prepare("DELETE FROM logs WHERE user_id = ?").run(req.user.id);
  res.json({ success: true });
});

module.exports = router;
