// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
const { KEYWORDS } = require("../src/keywords");
const { buildNotification } = require("../src/notifier");
const { isAllowed, COOLDOWNS_CONFIG } = require("../src/rateLimiter");

function findKeywords(content) {
  const lower = content.toLowerCase();
  return KEYWORDS.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

function registerMessageHandler(client, monitorServerIds, notifyChannelId) {
  client.on("messageCreate", async (message) => {
    try {
      // ── Only watch messages from one of the monitored servers ─────────────
      if (!monitorServerIds.includes(message.guild?.id)) return;
      if (message.author?.id === client.user?.id) return;
      if (!message.content || message.author?.bot) return;

      const matched = findKeywords(message.content);
      if (matched.length === 0) return;

      // ── Rate limit ────────────────────────────────────────────────────────
      const cooldownKey = `keyword-${message.channel.id}-${matched[0]}`;
      if (!isAllowed(cooldownKey, COOLDOWNS_CONFIG.KEYWORD_PER_CHANNEL_MS)) {
        console.log(`[RATE LIMITED] Skipping "${matched[0]}" in #${message.channel.name}`);
        return;
      }
      if (!isAllowed("global", COOLDOWNS_CONFIG.GLOBAL_MS)) {
        console.log(`[RATE LIMITED] Global cooldown active.`);
        return;
      }

      const serverName = message.guild?.name || message.guild?.id;
      console.log(`[MATCH] [${serverName}] Keywords: [${matched.join(", ")}] | From: ${message.author.tag}`);

      const notifyChannel = await client.channels.fetch(notifyChannelId);
      if (!notifyChannel) return;

      await notifyChannel.send(buildNotification(message, matched));
      console.log(`[SENT] Notification dispatched.`);
    } catch (err) {
      console.error("[ERROR] Message handler:", err.message);
    }
  });
}

module.exports = { registerMessageHandler };
