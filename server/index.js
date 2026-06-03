require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const botManager = require("./botManager");

const app = express();
app.use(cors());
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/config", require("./routes/config"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/admin", require("./routes/admin"));

// ── Serve React frontend ──────────────────────────────────────────────────────
const CLIENT_DIST = path.join(__dirname, "../client/dist");
app.use(express.static(CLIENT_DIST));
app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_DIST, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

  // ── Auto-restart bots for all users who had bot_active = 1 ─────────────────
  try {
    const activeUsers = db
      .prepare("SELECT user_id FROM user_configs WHERE bot_active = 1")
      .all();

    if (activeUsers.length === 0) {
      console.log("[AUTO-START] No previously active bots to restore.");
      return;
    }

    console.log(`[AUTO-START] Restoring ${activeUsers.length} bot(s) from previous session...`);

    for (const { user_id } of activeUsers) {
      try {
        await botManager.start(user_id);
        console.log(`[AUTO-START] ✅ Bot restored for user ${user_id}`);
      } catch (err) {
        console.error(`[AUTO-START] ❌ Failed to restore bot for user ${user_id}: ${err.message}`);
        // Mark as stopped so dashboard shows correct state
        db.prepare("UPDATE user_configs SET bot_active = 0 WHERE user_id = ?").run(user_id);
      }
    }
  } catch (err) {
    console.error("[AUTO-START] Error during auto-start:", err.message);
  }
});
