// ─── MEMBER JOIN HANDLER ─────────────────────────────────────────────────────
const { isAllowed, COOLDOWNS_CONFIG } = require("../src/rateLimiter");

function buildJoinNotification(member) {
  const timestamp = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  const accountAgeDays = Math.floor((Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const accountCreated = member.user.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" });
  const newAccountWarning = accountAgeDays < 7 ? "\n⚠️  **New account** (less than 7 days old)" : "";

  return (
    `👋 **New Member Joined!**\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👤 **User:** ${member.user.tag}\n` +
    `🆔 **ID:** \`${member.user.id}\`\n` +
    `🏠 **Server:** ${member.guild?.name}\n` +
    `👥 **Member count:** ${member.guild?.memberCount}\n` +
    `📅 **Account created:** ${accountCreated} (${accountAgeDays} days ago)\n` +
    `🕐 **Joined at:** ${timestamp}` +
    newAccountWarning
  );
}

function registerMemberJoinHandler(client, monitorServerIds, notifyChannelId) {
  client.on("guildMemberAdd", async (member) => {
    try {
      // ── Only watch monitored servers ──────────────────────────────────────
      if (!monitorServerIds.includes(member.guild?.id)) return;

      const cooldownKey = `join-${member.user.id}`;
      if (!isAllowed(cooldownKey, COOLDOWNS_CONFIG.MEMBER_JOIN_MS)) {
        console.log(`[RATE LIMITED] Join for ${member.user.tag} skipped.`);
        return;
      }
      if (!isAllowed("global", COOLDOWNS_CONFIG.GLOBAL_MS)) {
        console.log(`[RATE LIMITED] Global cooldown active.`);
        return;
      }

      console.log(`[JOIN] ${member.user.tag} joined ${member.guild.name}`);

      const notifyChannel = await client.channels.fetch(notifyChannelId);
      if (!notifyChannel) return;

      await notifyChannel.send(buildJoinNotification(member));
      console.log(`[SENT] Join notification dispatched.`);
    } catch (err) {
      console.error("[ERROR] Member join handler:", err.message);
    }
  });
}

module.exports = { registerMemberJoinHandler };
