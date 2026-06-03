const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";
const SUPER_ADMIN_EMAILS = db.SUPER_ADMIN_EMAILS || [];

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password)
    return res.status(400).json({ error: "All fields required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const user = db
      .prepare("INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)")
      .run(email.toLowerCase(), username, hash);

    db.prepare("INSERT INTO user_configs (user_id) VALUES (?)").run(user.lastInsertRowid);

    // Promote bootstrap super-admin emails on registration (they may not have
    // existed when the DB booted, so this is where they get their access).
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
    if (isSuperAdmin) {
      db.prepare("UPDATE users SET is_super_admin = 1 WHERE id = ?").run(user.lastInsertRowid);
    }

    // Seed default keywords
    const defaults = ["website development", "web development", "engineer", "web design", "frontend developer"];
    const insertKw = db.prepare("INSERT OR IGNORE INTO keywords (user_id, keyword) VALUES (?, ?)");
    defaults.forEach((kw) => insertKw.run(user.lastInsertRowid, kw));

    const token = jwt.sign({ id: user.lastInsertRowid, email: email.toLowerCase(), username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.lastInsertRowid, email, username, is_super_admin: isSuperAdmin } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) return res.status(409).json({ error: "Email already registered" });
    res.status(500).json({ error: "Server error" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  if (!user.is_enabled)
    return res.status(403).json({ error: "Your account has been disabled. Please contact an administrator." });

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, email: user.email, username: user.username, is_super_admin: !!user.is_super_admin } });
});

module.exports = router;
