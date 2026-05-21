// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
// Listens for messages in the monitored server and checks for keywords

const { KEYWORDS } = require("../src/keywords");
const { buildNotification } = require("../src/notifier");
const { isAllowed, COOLDOWNS_CONFIG } = require("../src/rateLimiter");

/**
 * Scans a message for any matching keywords (case-insensitive)
 * @param {string} content - The message content
 * @returns {string[]} - Array of matched keywords
 */
function findKeywords(content) {
  const lower = content.toLowerCase();
  return KEYWORDS.filter((keyword) => lower.includes(keyword.toLowerCase()));
}

/**
 * Registers the messageCreate event on the client
 * @param {Client} client
 * @param {string} monitorServerId - Guild ID to watch
 * @param {string} notifyChannelId - Your private channel to send alerts to
 */
function registerMessageHandler(client, monitorServerId, notifyChannelId) {
  client.on("messageCreate", async (message) => {
    try {
      // ── Only watch the target server ──────────────────────────────────────
      if (message.guild?.id !== monitorServerId) return;

      // ── Ignore your own messages ──────────────────────────────────────────
      if (message.author?.id === client.user?.id) return;

      // ── Skip empty messages / bots ────────────────────────────────────────
      if (!message.content || message.author?.bot) return;

      // ── Scan for keywords ─────────────────────────────────────────────────
      const matched = findKeywords(message.content);
      if (matched.length === 0) return;

      // ── Rate limit: same keyword in same channel (30s cooldown) ──────────
      const cooldownKey = `keyword-${message.channel.id}-${matched[0]}`;
      if (!isAllowed(cooldownKey, COOLDOWNS_CONFIG.KEYWORD_PER_CHANNEL_MS)) {
        console.log(`[RATE LIMITED] Skipping "${matched[0]}" in #${message.channel.name} — 30s cooldown active`);
        return;
      }

      // ── Rate limit: global burst protection (1 per 2s) ───────────────────
      if (!isAllowed("global", COOLDOWNS_CONFIG.GLOBAL_MS)) {
        console.log(`[RATE LIMITED] Global cooldown active, skipping.`);
        return;
      }

      console.log(
        `[MATCH] Keywords: [${matched.join(", ")}] | From: ${message.author.tag} | #${message.channel.name}`
      );

      // ── Fetch your private notification channel ───────────────────────────
      const notifyChannel = await client.channels.fetch(notifyChannelId);
      if (!notifyChannel) {
        console.error("[ERROR] Could not find your notification channel.");
        return;
      }

      // ── Send the notification ─────────────────────────────────────────────
      const notification = buildNotification(message, matched);
      await notifyChannel.send(notification);

      console.log(`[SENT] Notification dispatched to channel: ${notifyChannelId}`);
    } catch (err) {
      console.error("[ERROR] Failed to handle message:", err.message);
    }
  });
}

module.exports = { registerMessageHandler };
