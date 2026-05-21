// ─── DISCORD SELFBOT — KEYWORD NOTIFIER ──────────────────────────────────────
require("dotenv").config();
const { Client } = require("discord.js-selfbot-v13");
const { registerMessageHandler } = require("./src/messageHandler");
const { registerMemberJoinHandler } = require("./src/memberJoinHandler");

const TOKEN = process.env.TOKEN;
const MONITOR_SERVER_IDS = process.env.MONITOR_SERVER_IDS?.split(",").map(id => id.trim());
const NOTIFY_CHANNEL_ID = process.env.NOTIFY_CHANNEL_ID;

// ── Validate config ───────────────────────────────────────────────────────────
if (!TOKEN || TOKEN === "your_user_token_here") {
  console.error("❌ Missing TOKEN in your .env file.");
  process.exit(1);
}
if (!MONITOR_SERVER_IDS || MONITOR_SERVER_IDS.length === 0) {
  console.error("❌ Please set MONITOR_SERVER_IDS in your .env file.");
  process.exit(1);
}
if (!NOTIFY_CHANNEL_ID) {
  console.error("❌ Please set NOTIFY_CHANNEL_ID in your .env file.");
  process.exit(1);
}

// ── Create client ─────────────────────────────────────────────────────────────
const client = new Client();

client.on("ready", async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Selfbot online as: ${client.user.tag}`);
  console.log(`👀 Monitoring ${MONITOR_SERVER_IDS.length} server(s):`);

  // Print each server name
  for (const id of MONITOR_SERVER_IDS) {
    const guild = client.guilds.cache.get(id);
    const name = guild ? guild.name : "⚠️  Not found (check ID)";
    console.log(`   • [${id}] ${name}`);
  }

  console.log(`🔔 Notifications → channel ID: ${NOTIFY_CHANNEL_ID}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Validate notify channel
  try {
    const channel = await client.channels.fetch(NOTIFY_CHANNEL_ID);
    console.log(`📡 Notify channel confirmed: #${channel.name}`);
  } catch {
    console.warn("⚠️  Could not verify notify channel. Check NOTIFY_CHANNEL_ID.");
  }

  // Register handlers — pass the full array of server IDs
  registerMessageHandler(client, MONITOR_SERVER_IDS, NOTIFY_CHANNEL_ID);
  registerMemberJoinHandler(client, MONITOR_SERVER_IDS, NOTIFY_CHANNEL_ID);
});

client.on("error", (err) => console.error("[CLIENT ERROR]", err.message));
process.on("unhandledRejection", (err) => console.error("[UNHANDLED]", err.message));

client.login(TOKEN);
