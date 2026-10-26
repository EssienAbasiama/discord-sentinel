// ─── TELEGRAM BOT MANAGER ────────────────────────────────────────────────────
// Manages one Telegram bot instance per registered user.
// Uses the official Telegram Bot API via node-telegram-bot-api.
// No ToS issues — this is a proper bot account, not a user account.

const TelegramBot = require("node-telegram-bot-api");
const db = require("./db");

const instances = new Map(); // userId → { bot, status }

function getStatus(userId) {
  return instances.get(userId)?.status || "stopped";
}

async function start(userId) {
  if (instances.get(userId)?.status === "running") return;

  const config = db.prepare("SELECT * FROM telegram_configs WHERE user_id = ?").get(userId);
  if (!config?.bot_token) throw new Error("No Telegram bot token configured");
  if (!config?.notify_chat_id) throw new Error("No Telegram notification chat ID configured");

  const groups = db.prepare("SELECT chat_id FROM telegram_groups WHERE user_id = ?").all(userId);
  if (!groups.length) throw new Error("No Telegram groups to monitor. Add at least one group.");

  const chatIds = groups.map((g) => String(g.chat_id).trim());

  console.log(`[TG] Starting for user ${userId} | Groups: ${chatIds.join(", ")}`);

  const bot = new TelegramBot(config.bot_token, { polling: true });

  instances.set(userId, { bot, status: "connecting" });

  await new Promise((resolve, reject) => {
    let settled = false;

    // Polling starts as soon as the bot is constructed, so a failed connect must
    // stop it — otherwise a bad token keeps polling and floods the logs.
    function fail(err) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      bot.stopPolling().catch(() => {});
      instances.set(userId, { bot: null, status: "stopped" });
      reject(err);
    }

    const timeout = setTimeout(() => {
      fail(new Error("Telegram bot failed to connect — check your bot token"));
    }, 15000);

    bot.getMe().then((me) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      instances.set(userId, { bot, status: "running" });
      db.prepare("UPDATE telegram_configs SET tg_bot_active = 1 WHERE user_id = ?").run(userId);

      console.log(`[TG] ✅ Online as: @${me.username}`);
      console.log(`[TG] 👀 Monitoring chats: ${chatIds.join(", ")}`);
      console.log(`[TG] 🔔 Notify chat: ${config.notify_chat_id}`);

      addLog(userId, "system", { content: `Telegram bot started as @${me.username}. Monitoring ${chatIds.length} group(s).` });

      attachHandlers(bot, userId, chatIds, config.notify_chat_id);
      resolve();
    }).catch((err) => {
      fail(new Error(`Telegram login failed: ${err.message}`));
    });

    bot.on("polling_error", (err) => {
      // Only log for a live bot; connect failures are reported once via fail().
      const inst = instances.get(userId);
      if (inst?.bot !== bot || inst.status !== "running") return;
      console.error(`[TG] Polling error for user ${userId}:`, err.message);
      addLog(userId, "error", { content: `Polling error: ${err.message}` });
    });
  });
}

function stop(userId) {
  const inst = instances.get(userId);
  if (inst?.bot) {
    try { inst.bot.stopPolling(); } catch {}
  }
  instances.set(userId, { bot: null, status: "stopped" });
  db.prepare("UPDATE telegram_configs SET tg_bot_active = 0 WHERE user_id = ?").run(userId);
  addLog(userId, "system", { content: "Telegram bot stopped by user." });
  console.log(`[TG] Stopped for user ${userId}`);
}

async function reload(userId) {
  stop(userId);
  await new Promise(r => setTimeout(r, 1000)); // brief pause before restart
  await start(userId);
}

function addLog(userId, type, data) {
  try {
    db.prepare(`
      INSERT INTO logs (user_id, type, server_id, server_name, channel_name, author_tag, content, matched_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, `tg_${type}`,
      data.server_id || null,
      data.server_name || null,
      data.channel_name || null,
      data.author_tag || null,
      data.content || null,
      data.matched_keywords || null
    );
    db.prepare(`
      DELETE FROM logs WHERE user_id = ? AND id NOT IN (
        SELECT id FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 500
      )
    `).run(userId, userId);
  } catch (err) {
    console.error("[TG] Failed to write log:", err.message);
  }
}

function attachHandlers(bot, userId, chatIds, notifyChatId) {
  const cooldowns = new Map();

  function isAllowed(key, ms) {
    const now = Date.now();
    if (cooldowns.has(key) && now - cooldowns.get(key) < ms) return false;
    cooldowns.set(key, now);
    return true;
  }

  // ── Keyword message handler ───────────────────────────────────────────────
  bot.on("message", async (msg) => {
    try {
      const chatId = String(msg.chat.id);
      if (!chatIds.includes(chatId)) return;
      if (!msg.text) return;

      const keywords = db
        .prepare("SELECT keyword FROM keywords WHERE user_id = ?")
        .all(userId)
        .map((k) => k.keyword);

      if (!keywords.length) return;

      const lower = msg.text.toLowerCase();
      const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));

      const senderName = msg.from?.username
        ? `@${msg.from.username}`
        : `${msg.from?.first_name || "Unknown"}`;

      console.log(`[TG] 💬 Message in ${msg.chat.title || chatId} from ${senderName}: "${msg.text.slice(0, 80)}"`);

      if (!matched.length) return;

      const ck = `kw-${chatId}-${matched[0]}`;
      if (!isAllowed(ck, 30000) || !isAllowed("global", 2000)) return;

      console.log(`[TG] 🎯 MATCH! Keywords: [${matched.join(", ")}] from ${senderName}`);

      addLog(userId, "keyword", {
        server_id: chatId,
        server_name: msg.chat.title || chatId,
        author_tag: senderName,
        content: msg.text.slice(0, 500),
        matched_keywords: matched.join(", "),
      });

      const msgLink = msg.chat.username
        ? `https://t.me/${msg.chat.username}/${msg.message_id}`
        : null;

      const text =
        `🔔 *Keyword Alert* | \`${matched.join(", ")}\`\n` +
        `*Group:* ${msg.chat.title || chatId}\n` +
        `*From:* ${senderName}\n` +
        `*Message:* ${msg.text.slice(0, 300)}` +
        (msgLink ? `\n[Jump to message](${msgLink})` : "");

      await bot.sendMessage(notifyChatId, text, { parse_mode: "Markdown" })
        .catch((err) => {
          console.error(`[TG] Failed to send notification: ${err.message}`);
          addLog(userId, "error", { content: `Failed to send Telegram notification: ${err.message}` });
        });

      console.log(`[TG] ✅ Notification sent!`);
    } catch (err) {
      console.error("[TG] message handler error:", err.message);
      addLog(userId, "error", { content: `Message handler error: ${err.message}` });
    }
  });

  // ── New member join handler ───────────────────────────────────────────────
  bot.on("new_chat_members", async (msg) => {
    try {
      const chatId = String(msg.chat.id);
      if (!chatIds.includes(chatId)) return;

      for (const member of msg.new_chat_members) {
        if (member.is_bot) continue;

        const ck = `join-${chatId}-${member.id}`;
        if (!isAllowed(ck, 300000) || !isAllowed("global", 2000)) continue;

        const name = member.username ? `@${member.username}` : `${member.first_name}`;
        console.log(`[TG] 👋 ${name} joined ${msg.chat.title || chatId}`);

        addLog(userId, "join", {
          server_id: chatId,
          server_name: msg.chat.title || chatId,
          author_tag: name,
          content: `Joined the group.`,
        });

        const text =
          `👋 *New Member Joined!*\n` +
          `*Group:* ${msg.chat.title || chatId}\n` +
          `*User:* ${name}\n` +
          `*ID:* \`${member.id}\``;

        await bot.sendMessage(notifyChatId, text, { parse_mode: "Markdown" })
          .catch((err) => {
            console.error(`[TG] Failed to send join notification: ${err.message}`);
          });

        console.log(`[TG] ✅ Join notification sent!`);
      }
    } catch (err) {
      console.error("[TG] new_chat_members error:", err.message);
    }
  });
}

module.exports = { start, stop, reload, getStatus };
