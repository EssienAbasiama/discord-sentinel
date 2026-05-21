// ─── MEMBER JOIN HANDLER ─────────────────────────────────────────────────────
// Fires whenever someone joins the monitored server

const { isAllowed, COOLDOWNS_CONFIG } = require("../src/rateLimiter");

function buildJoinNotification(member) {
  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const serverName = member.guild?.name || "Unknown Server";
  const memberCount = member.guild?.memberCount || "N/A";
  const accountAgeDays = Math.floor(
    (Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  const accountCreated = member.user.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" });
  const newAccountWarning = accountAgeDays < 7 ? "\n⚠️  **New account** (less than 7 days old)" : "";

  return (
    `👋 **New Member Joined!**\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 **User:** ${member.user.tag}\n` +
    `🆔 **ID:** \`${member.user.id}\`\n` +
    `🏠 **Server:** ${serverName}\n` +
    `👥 **Member count:** ${memberCount}\n` +
    `📅 **Account created:** ${accountCreated} (${accountAgeDays} days ago)\n` +
    `🕐 **Joined at:** ${timestamp}` +
    newAccountWarning
  );
}

function registerMemberJoinHandler(client, monitorServerId, notifyChannelId) {
  client.on("guildMemberAdd", async (member) => {
    try {
      if (member.guild?.id !== monitorServerId) return;

      // ── Rate limit: same user re-joining (5 min cooldown) ─────────────────
      const cooldownKey = `join-${member.user.id}`;
      if (!isAllowed(cooldownKey, COOLDOWNS_CONFIG.MEMBER_JOIN_MS)) {
        console.log(`[RATE LIMITED] Join event for ${member.user.tag} skipped — 5min cooldown active`);
        return;
      }

      // ── Rate limit: global burst protection ───────────────────────────────
      if (!isAllowed("global", COOLDOWNS_CONFIG.GLOBAL_MS)) {
        console.log(`[RATE LIMITED] Global cooldown active, skipping join notification.`);
        return;
      }

      console.log(`[JOIN] ${member.user.tag} joined ${member.guild.name}`);

      const notifyChannel = await client.channels.fetch(notifyChannelId);
      if (!notifyChannel) {
        console.error("[ERROR] Could not find your notification channel.");
        return;
      }

      await notifyChannel.send(buildJoinNotification(member));
      console.log(`[SENT] Join notification dispatched.`);
    } catch (err) {
      console.error("[ERROR] Failed to handle member join:", err.message);
    }
  });
}

module.exports = { registerMemberJoinHandler };
