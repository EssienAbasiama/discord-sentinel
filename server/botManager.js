// ─── BOT MANAGER ──────────────────────────────────────────────────────────────
// Manages multiple Discord selfbot instances, one per user bot configuration

const { Client } = require("discord.js-selfbot-v13");
const { getDb } = require("../db/database");
const { v4: uuidv4 } = require("uuid");

// Map of botId -> { client, userId }
const activeBots = new Map();

// Rate limiter per bot
const cooldowns = new Map();

function isAllowed(key, cooldownMs) {
  const now = Date.now();
  const lastSent = cooldowns.get(key);
  if (lastSent && now - lastSent < cooldownMs) return false;
  cooldowns.set(key, now);
  return true;
}

function saveLog({ userId, botId, type, serverName, channelName, authorTag, content, matchedKeywords, messageLink }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO logs (id, user_id, bot_id, type, server_name, channel_name, author_tag, content, matched_keywords, message_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, botId, type,
      serverName || null, channelName || null,
      authorTag || null, content || null,
      matchedKeywords ? JSON.stringify(matchedKeywords) : null,
      messageLink || null
    );
  } catch (err) {
    console.error("[DB] Failed to save log:", err.message);
  }
}

function getBotConfig(botId) {
  const db = getDb();
  const bot = db.prepare("SELECT * FROM user_bots WHERE id = ?").get(botId);
  if (!bot) return null;

  const servers = db.prepare("SELECT server_id, server_name FROM monitored_servers WHERE bot_id = ?").all(botId);
  const keywords = db.prepare("SELECT keyword FROM keywords WHERE bot_id = ?").all(botId).map(k => k.keyword);

  return { bot, servers, keywords };
}

async function startBot(botId) {
  if (activeBots.has(botId)) {
    console.log(`[BOT] ${botId} already running`);
    return { success: true, message: "Bot already running" };
  }

  const config = getBotConfig(botId);
  if (!config) return { success: false, message: "Bot config not found" };

  const { bot, servers, keywords } = config;

  const client = new Client();
  const serverIds = servers.map(s => s.server_id);

  client.on("ready", async () => {
    console.log(`[BOT] ✅ Online as ${client.user.tag} (botId: ${botId})`);

    // Update status in DB
    getDb().prepare("UPDATE user_bots SET status = 'online', bot_name = ?, last_connected = strftime('%s', 'now') WHERE id = ?")
      .run(client.user.tag, botId);

    // Validate notify channel
    try {
      await client.channels.fetch(bot.notify_channel_id);
    } catch {
      console.warn(`[BOT] Could not verify notify channel for bot ${botId}`);
    }
  });

  client.on("messageCreate", async (message) => {
    try {
      if (!serverIds.includes(message.guild?.id)) return;
      if (message.author?.id === client.user?.id) return;
      if (!message.content || message.author?.bot) return;

      const currentKeywords = getDb()
        .prepare("SELECT keyword FROM keywords WHERE bot_id = ?")
        .all(botId).map(k => k.keyword);

      const lower = message.content.toLowerCase();
      const matched = currentKeywords.filter(kw => lower.includes(kw.toLowerCase()));
      if (matched.length === 0) return;

      const cooldownKey = `kw-${botId}-${message.channel.id}-${matched[0]}`;
      if (!isAllowed(cooldownKey, 30_000)) return;
      if (!isAllowed(`global-${botId}`, 2_000)) return;

      const serverName = message.guild?.name || message.guild?.id;
      const channelName = message.channel?.name || message.channel?.id;
      const authorTag = message.author?.tag || "Unknown";
      const messageLink = `https://discord.com/channels/${message.guild?.id}/${message.channel?.id}/${message.id}`;

      console.log(`[BOT] [${serverName}] Match: [${matched.join(", ")}] from ${authorTag}`);

      // Save log to DB
      saveLog({
        userId: bot.user_id, botId,
        type: "keyword",
        serverName, channelName, authorTag,
        content: message.content.slice(0, 1000),
        matchedKeywords: matched,
        messageLink,
      });

      // Send Discord notification
      try {
        const notifyChannel = await client.channels.fetch(bot.notify_channel_id);
        const keywordList = matched.map(w => `\`${w}\``).join(", ");
        const timestamp = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

        await notifyChannel.send(
          `🔔 **Keyword Alert!**\n━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 **Keywords matched:** ${keywordList}\n` +
          `🏠 **Server:** ${serverName}\n` +
          `💬 **Channel:** #${channelName}\n` +
          `👤 **Sent by:** ${authorTag}\n` +
          `🕐 **Time:** ${timestamp}\n\n` +
          `📝 **Message:**\n> ${message.content.slice(0, 500)}\n\n` +
          `🔗 [Jump to message](${messageLink})`
        );
      } catch (sendErr) {
        console.error("[BOT] Failed to send notification:", sendErr.message);
      }
    } catch (err) {
      console.error("[BOT] Message handler error:", err.message);
    }
  });

  client.on("guildMemberAdd", async (member) => {
    try {
      const currentServers = getDb()
        .prepare("SELECT server_id FROM monitored_servers WHERE bot_id = ?")
        .all(botId).map(s => s.server_id);

      if (!currentServers.includes(member.guild?.id)) return;

      const cooldownKey = `join-${botId}-${member.user.id}`;
      if (!isAllowed(cooldownKey, 5 * 60_000)) return;
      if (!isAllowed(`global-${botId}`, 2_000)) return;

      const accountAgeDays = Math.floor((Date.now() - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const newWarning = accountAgeDays < 7 ? "\n⚠️  **New account** (less than 7 days old)" : "";

      saveLog({
        userId: bot.user_id, botId,
        type: "join",
        serverName: member.guild?.name,
        authorTag: member.user.tag,
        content: `Account age: ${accountAgeDays} days`,
      });

      try {
        const notifyChannel = await client.channels.fetch(bot.notify_channel_id);
        await notifyChannel.send(
          `👋 **New Member Joined!**\n━━━━━━━━━━━━━━━━━━━━\n` +
          `👤 **User:** ${member.user.tag}\n` +
          `🆔 **ID:** \`${member.user.id}\`\n` +
          `🏠 **Server:** ${member.guild?.name}\n` +
          `👥 **Member count:** ${member.guild?.memberCount}\n` +
          `📅 **Account created:** ${accountAgeDays} days ago` +
          newWarning
        );
      } catch {}
    } catch (err) {
      console.error("[BOT] Join handler error:", err.message);
    }
  });

  client.on("error", (err) => {
    console.error(`[BOT] Client error for ${botId}:`, err.message);
  });

  try {
    await client.login(bot.discord_token);
    activeBots.set(botId, { client, userId: bot.user_id });
    return { success: true, message: "Bot started successfully" };
  } catch (err) {
    console.error(`[BOT] Login failed for ${botId}:`, err.message);
    getDb().prepare("UPDATE user_bots SET status = 'error' WHERE id = ?").run(botId);
    return { success: false, message: `Login failed: ${err.message}` };
  }
}

async function stopBot(botId) {
  const entry = activeBots.get(botId);
  if (!entry) return { success: false, message: "Bot not running" };

  try {
    await entry.client.destroy();
    activeBots.delete(botId);
    getDb().prepare("UPDATE user_bots SET status = 'offline' WHERE id = ?").run(botId);
    console.log(`[BOT] Stopped bot ${botId}`);
    return { success: true, message: "Bot stopped" };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

function getBotStatus(botId) {
  return activeBots.has(botId) ? "online" : "offline";
}

// Auto-start all bots that were online on server restart
async function autoStartBots() {
  const db = getDb();
  const bots = db.prepare("SELECT id FROM user_bots WHERE status = 'online'").all();
  console.log(`[BOT MANAGER] Auto-starting ${bots.length} bot(s)...`);
  for (const bot of bots) {
    await startBot(bot.id);
  }
}

module.exports = { startBot, stopBot, getBotStatus, activeBots };
