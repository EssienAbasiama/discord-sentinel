// ─── DISCORD SELFBOT — KEYWORD NOTIFIER ──────────────────────────────────────
// Monitors a server for specific keywords and pings you in a private channel

require("dotenv").config();
const { Client } = require("discord.js-selfbot-v13");
const { registerMessageHandler } = require("./src/messageHandler");
const { registerMemberJoinHandler } = require("./src/memberJoinHandler");

// ── Load environment variables ────────────────────────────────────────────────
const TOKEN = process.env.TOKEN;
const MONITOR_SERVER_ID = process.env.MONITOR_SERVER_ID;
const NOTIFY_CHANNEL_ID = process.env.NOTIFY_CHANNEL_ID;

// ── Validate config ───────────────────────────────────────────────────────────
if (!TOKEN || TOKEN === "your_user_token_here") {
  console.error("❌ Missing TOKEN in your .env file. Please add your Discord user token.");
  process.exit(1);
}

if (!MONITOR_SERVER_ID || MONITOR_SERVER_ID === "123456789012345678") {
  console.error("❌ Please set MONITOR_SERVER_ID in your .env file.");
  process.exit(1);
}

if (!NOTIFY_CHANNEL_ID || NOTIFY_CHANNEL_ID === "123456789012345678") {
  console.error("❌ Please set NOTIFY_CHANNEL_ID in your .env file.");
  process.exit(1);
}

// ── Create client ─────────────────────────────────────────────────────────────
const client = new Client();

// ── On ready ──────────────────────────────────────────────────────────────────
client.on("ready", async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Selfbot is online as: ${client.user.tag}`);
  console.log(`👀 Monitoring server ID: ${MONITOR_SERVER_ID}`);
  console.log(`🔔 Notifications → channel ID: ${NOTIFY_CHANNEL_ID}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Validate the notification channel exists
  try {
    const channel = await client.channels.fetch(NOTIFY_CHANNEL_ID);
    console.log(`📡 Notify channel confirmed: #${channel.name}`);
  } catch {
    console.warn("⚠️  Could not verify notify channel. Check NOTIFY_CHANNEL_ID.");
  }

  // Register message keyword handler
  registerMessageHandler(client, MONITOR_SERVER_ID, NOTIFY_CHANNEL_ID);

  // Register member join handler
  registerMemberJoinHandler(client, MONITOR_SERVER_ID, NOTIFY_CHANNEL_ID);
});

// ── Error handling ────────────────────────────────────────────────────────────
client.on("error", (err) => {
  console.error("[CLIENT ERROR]", err.message);
});

process.on("unhandledRejection", (err) => {
  console.error("[UNHANDLED REJECTION]", err.message);
});

// ── Login ─────────────────────────────────────────────────────────────────────
client.login(TOKEN);
