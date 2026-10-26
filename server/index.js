require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const botManager = require("./botManager");
const tgManager = require("./telegramBotManager");

const app = express();
app.use(cors());
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/config", require("./routes/config"));
app.use("/api/logs", require("./routes/logs"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/telegram", require("./routes/telegramConfig"));

// ── Serve React frontend ──────────────────────────────────────────────────────
const CLIENT_DIST = path.join(__dirname, "../client/dist");
app.use(express.static(CLIENT_DIST));
app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_DIST, "index.html"));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);

  // ── Auto-restart Discord bots ───────────────────────────────────────────────
  try {
    const activeDiscord = db
      .prepare("SELECT user_id FROM user_configs WHERE bot_active = 1")
      .all();
    if (activeDiscord.length > 0) {
      console.log(`[AUTO-START] Restoring ${activeDiscord.length} Discord bot(s)...`);
      for (const { user_id } of activeDiscord) {
        try {
          await botManager.start(user_id);
          console.log(`[AUTO-START] ✅ Discord bot restored for user ${user_id}`);
        } catch (err) {
          console.error(`[AUTO-START] ❌ Discord bot failed for user ${user_id}: ${err.message}`);
          db.prepare("UPDATE user_configs SET bot_active = 0 WHERE user_id = ?").run(user_id);
        }
      }
    } else {
      console.log("[AUTO-START] No Discord bots to restore.");
    }
  } catch (err) {
    console.error("[AUTO-START] Discord error:", err.message);
  }

  // ── Auto-restart Telegram bots ──────────────────────────────────────────────
  try {
    const activeTg = db
      .prepare("SELECT user_id FROM telegram_configs WHERE tg_bot_active = 1")
      .all();
    if (activeTg.length > 0) {
      console.log(`[AUTO-START] Restoring ${activeTg.length} Telegram bot(s)...`);
      for (const { user_id } of activeTg) {
        try {
          await tgManager.start(user_id);
          console.log(`[AUTO-START] ✅ Telegram bot restored for user ${user_id}`);
        } catch (err) {
          console.error(`[AUTO-START] ❌ Telegram bot failed for user ${user_id}: ${err.message}`);
          db.prepare("UPDATE telegram_configs SET tg_bot_active = 0 WHERE user_id = ?").run(user_id);
        }
      }
    } else {
      console.log("[AUTO-START] No Telegram bots to restore.");
    }
  } catch (err) {
    console.error("[AUTO-START] Telegram error:", err.message);
  }
});
