const express = require("express");
const db = require("../db");
const auth = require("../middleware/auth");
const requireSuperAdmin = require("../middleware/requireSuperAdmin");
const botManager = require("../botManager");

const router = express.Router();
router.use(auth, requireSuperAdmin);

// ── List all users with their access settings and live usage ──────────────────
router.get("/users", (req, res) => {
  const users = db
    .prepare(
      `SELECT
         u.id, u.email, u.username, u.created_at,
         u.is_super_admin, u.is_enabled, u.max_servers, u.max_keywords,
         (SELECT COUNT(*) FROM monitored_servers WHERE user_id = u.id) AS server_count,
         (SELECT COUNT(*) FROM keywords WHERE user_id = u.id)          AS keyword_count,
         COALESCE(uc.bot_active, 0) AS bot_active
       FROM users u
       LEFT JOIN user_configs uc ON uc.user_id = u.id
       ORDER BY u.is_super_admin DESC, u.created_at DESC`
    )
    .all();

  res.json({
    users: users.map((u) => ({
      ...u,
      is_super_admin: !!u.is_super_admin,
      is_enabled: !!u.is_enabled,
      bot_active: !!u.bot_active,
    })),
    currentUserId: req.user.id,
  });
});

// ── Update a user's access (enable/disable, limits, super-admin) ───────────────
router.patch("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid user id" });

  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  if (!target) return res.status(404).json({ error: "User not found" });

  const { is_enabled, is_super_admin, max_servers, max_keywords } = req.body;

  // ── Self-protection: a super admin can't lock themselves out ────────────────
  const isSelf = id === req.user.id;
  if (isSelf && is_super_admin != null && !is_super_admin)
    return res.status(400).json({ error: "You cannot remove your own super admin access." });
  if (isSelf && is_enabled != null && !is_enabled)
    return res.status(400).json({ error: "You cannot disable your own account." });

  // ── Build the update from only the fields that were provided ────────────────
  const fields = [];
  const values = [];

  if (is_enabled != null) {
    fields.push("is_enabled = ?");
    values.push(is_enabled ? 1 : 0);
  }
  if (is_super_admin != null) {
    fields.push("is_super_admin = ?");
    values.push(is_super_admin ? 1 : 0);
  }
  if (max_servers != null) {
    const n = Math.max(0, Math.floor(Number(max_servers)));
    if (Number.isNaN(n)) return res.status(400).json({ error: "max_servers must be a number" });
    fields.push("max_servers = ?");
    values.push(n);
  }
  if (max_keywords != null) {
    const n = Math.max(0, Math.floor(Number(max_keywords)));
    if (Number.isNaN(n)) return res.status(400).json({ error: "max_keywords must be a number" });
    fields.push("max_keywords = ?");
    values.push(n);
  }

  if (!fields.length) return res.status(400).json({ error: "No changes provided" });

  values.push(id);
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  // If the user was just disabled, stop any bot they have running so monitoring
  // halts immediately rather than waiting for their next request to be blocked.
  if (is_enabled != null && !is_enabled) {
    try { botManager.stop(id); } catch (err) {
      console.error(`[ADMIN] Failed to stop bot for disabled user ${id}: ${err.message}`);
    }
  }

  const updated = db
    .prepare("SELECT id, email, username, is_super_admin, is_enabled, max_servers, max_keywords FROM users WHERE id = ?")
    .get(id);

  res.json({
    success: true,
    user: {
      ...updated,
      is_super_admin: !!updated.is_super_admin,
      is_enabled: !!updated.is_enabled,
    },
  });
});

module.exports = router;
