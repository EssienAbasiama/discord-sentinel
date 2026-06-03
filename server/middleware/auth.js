const jwt = require("jsonwebtoken");
const db = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || "changeme_in_production";

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);

    // Always load the live user record so admin status, enabled state, and
    // limits reflect the latest changes made by a super admin — not whatever
    // was true when the token was issued.
    const user = db
      .prepare("SELECT id, email, username, is_super_admin, is_enabled, max_servers, max_keywords FROM users WHERE id = ?")
      .get(payload.id);

    if (!user) return res.status(401).json({ error: "Invalid token" });
    if (!user.is_enabled)
      return res.status(403).json({ error: "Your account has been disabled. Please contact an administrator." });

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      is_super_admin: !!user.is_super_admin,
    };
    req.dbUser = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
