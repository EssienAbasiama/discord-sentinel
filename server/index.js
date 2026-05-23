// ─── DISCORD SENTINEL — SERVER ───────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const path = require("path");
const { getDb } = require("../db/database");

const authRoutes = require("./routes/authRoutes");
const botRoutes = require("./routes/botRoutes");
const logRoutes = require("./routes/logRoutes");

const PORT = process.env.PORT || 4000;
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());

// ── Init DB ───────────────────────────────────────────────────────────────────
getDb();
console.log("✅ Database initialized");

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/bots", botRoutes);
app.use("/api/logs", logRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// ── Serve React build in production ──────────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../client/build");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`🚀 Discord Sentinel API running on port ${PORT}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

process.on("unhandledRejection", (err) => console.error("[UNHANDLED]", err?.message));
