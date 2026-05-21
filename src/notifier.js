// ─── NOTIFICATION BUILDER ────────────────────────────────────────────────────
// Formats a clean notification message when a keyword is triggered

/**
 * Builds the notification message sent to your private channel
 * @param {Message} message - The Discord message that triggered the keyword
 * @param {string[]} matchedWords - Keywords that were found in the message
 * @returns {string} - Formatted notification string
 */
function buildNotification(message, matchedWords) {
  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const serverName = message.guild?.name || "Unknown Server";
  const channelName = message.channel?.name || "Unknown Channel";
  const authorTag = message.author?.tag || "Unknown User";
  const authorId = message.author?.id || "N/A";
  const messageLink = `https://discord.com/channels/${message.guild?.id}/${message.channel?.id}/${message.id}`;
  const keywordList = matchedWords.map((w) => `\`${w}\``).join(", ");

  return (
    `🔔 **Keyword Alert!**\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 **Keywords matched:** ${keywordList}\n` +
    `🏠 **Server:** ${serverName}\n` +
    `💬 **Channel:** #${channelName}\n` +
    `👤 **Sent by:** ${authorTag} (ID: \`${authorId}\`)\n` +
    `🕐 **Time:** ${timestamp}\n\n` +
    `📝 **Message:**\n> ${message.content.slice(0, 500)}\n\n` +
    `🔗 [Jump to message](${messageLink})`
  );
}

module.exports = { buildNotification };
