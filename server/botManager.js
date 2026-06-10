// ─── BOT MANAGER ─────────────────────────────────────────────────────────────
const { Client } = require("discord.js-selfbot-v13");
const db = require("./db");

const DEFAULT_WELCOME =
  "👋 Welcome to the server! Glad to have you here — feel free to look around and say hi.";

const instances = new Map();

function getStatus(userId) {
  return instances.get(userId)?.status || "stopped";
}

async function start(userId) {
  if (instances.get(userId)?.status === "running") return;

  const config = db.prepare("SELECT * FROM user_configs WHERE user_id = ?").get(userId);
  if (!config?.discord_token) throw new Error("No Discord token configured");
  if (!config?.notify_channel_id) throw new Error("No notification channel configured");

  const servers = db.prepare("SELECT server_id FROM monitored_servers WHERE user_id = ?").all(userId);
  if (!servers.length) throw new Error("No servers to monitor. Add at least one server.");

  const serverIds = servers.map((s) => s.server_id.trim());

  console.log(`[BOT] Starting for user ${userId} | Servers: ${serverIds.join(", ")}`);

  const client = new Client({
    checkUpdate: false,
    readyStatus: false,
    intents: [
      "GUILDS",
      "GUILD_MESSAGES",
      "GUILD_MEMBERS",
      "MESSAGE_CONTENT",
    ],
    partials: ["MESSAGE", "CHANNEL", "GUILD_MEMBER"],
  });

  instances.set(userId, { client, status: "connecting" });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Login timed out")), 20000);

    client.on("ready", async () => {
      clearTimeout(timeout);
      instances.set(userId, { client, status: "running" });
      db.prepare("UPDATE user_configs SET bot_active = 1 WHERE user_id = ?").run(userId);

      console.log(`[BOT] ✅ Online as: ${client.user.tag}`);
      console.log(`[BOT] 👀 Monitoring servers: ${serverIds.join(", ")}`);
      console.log(`[BOT] 🔔 Notify channel: ${config.notify_channel_id}`);

      // Verify notify channel
      try {
        const ch = await client.channels.fetch(config.notify_channel_id);
        console.log(`[BOT] 📡 Notify channel confirmed: #${ch.name}`);
        addLog(userId, "system", { content: `Bot started as ${client.user.tag}. Monitoring ${serverIds.length} server(s). Notify channel: #${ch.name}` });
      } catch (err) {
        console.error(`[BOT] ❌ Could not fetch notify channel: ${err.message}`);
        addLog(userId, "error", { content: `Could not fetch notify channel ID: ${config.notify_channel_id}. Error: ${err.message}` });
      }

      // Log which guilds the account is actually in
      const joinedGuilds = client.guilds.cache.map(g => g.id);
      console.log(`[BOT] Guilds this account is in: ${joinedGuilds.join(", ")}`);

      for (const sid of serverIds) {
        if (!joinedGuilds.includes(sid)) {
          console.warn(`[BOT] ⚠️  Server ${sid} not found in account's guilds!`);
          addLog(userId, "error", { content: `⚠️ Server ID ${sid} was not found in this account's guilds. Make sure the account has joined this server.` });
        }
      }

      attachHandlers(client, userId, serverIds, config.notify_channel_id);
      resolve();
    });

    client.on("error", (err) => {
      clearTimeout(timeout);
      console.error(`[BOT] Client error:`, err.message);
      addLog(userId, "error", { content: `Client error: ${err.message}` });
      instances.set(userId, { client: null, status: "stopped" });
      db.prepare("UPDATE user_configs SET bot_active = 0 WHERE user_id = ?").run(userId);
    });

    client.login(config.discord_token).catch((err) => {
      clearTimeout(timeout);
      console.error(`[BOT] Login failed:`, err.message);
      instances.set(userId, { client: null, status: "stopped" });
      reject(new Error(`Login failed: ${err.message}`));
    });
  });
}

function stop(userId) {
  const inst = instances.get(userId);
  if (inst?.client) {
    try { inst.client.destroy(); } catch { }
  }
  instances.set(userId, { client: null, status: "stopped" });
  db.prepare("UPDATE user_configs SET bot_active = 0 WHERE user_id = ?").run(userId);
  addLog(userId, "system", { content: "Bot stopped by user." });
  console.log(`[BOT] Stopped for user ${userId}`);
}

async function reload(userId) {
  stop(userId);
  await start(userId);
}

function addLog(userId, type, data) {
  try {
    db.prepare(`
      INSERT INTO logs (user_id, type, server_id, server_name, channel_name, author_tag, content, matched_keywords)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId, type,
      data.server_id || null,
      data.server_name || null,
      data.channel_name || null,
      data.author_tag || null,
      data.content || null,
      data.matched_keywords || null
    );
    // Keep max 500 logs per user
    db.prepare(`
      DELETE FROM logs WHERE user_id = ? AND id NOT IN (
        SELECT id FROM logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 500
      )
    `).run(userId, userId);
  } catch (err) {
    console.error("[BOT] Failed to write log:", err.message);
  }
}

function attachHandlers(client, userId, serverIds, notifyChannelId) {
  const cooldowns = new Map();

  function isAllowed(key, ms) {
    const now = Date.now();
    if (cooldowns.has(key) && now - cooldowns.get(key) < ms) return false;
    cooldowns.set(key, now);
    return true;
  }

  // ── Keyword message handler ───────────────────────────────────────────────
  client.on("messageCreate", async (message) => {
    try {
      if (!message.guild) return;
      if (!serverIds.includes(message.guild.id)) return;
      if (message.author?.id === client.user?.id) return;
      if (!message.content) return;
      if (message.author?.bot) return;

      const keywords = db
        .prepare("SELECT keyword FROM keywords WHERE user_id = ?")
        .all(userId)
        .map((k) => k.keyword);

      if (keywords.length === 0) {
        console.log(`[BOT] ⚠️  No keywords set for user ${userId} — add keywords in the dashboard`);
        return;
      }

      const lower = message.content.toLowerCase();
      const matched = keywords.filter((kw) => lower.includes(kw.toLowerCase()));

      console.log(`[BOT] 💬 Message in ${message.guild.name}#${message.channel.name} from ${message.author.tag}: "${message.content.slice(0, 80)}"`);

      if (!matched.length) return;

      // Rate limit
      const ck = `kw-${message.channel.id}-${matched[0]}`;
      if (!isAllowed(ck, 30000)) {
        console.log(`[BOT] Rate limited: keyword "${matched[0]}" in #${message.channel.name}`);
        return;
      }
      if (!isAllowed("global", 2000)) {
        console.log(`[BOT] Global rate limit active`);
        return;
      }

      console.log(`[BOT] 🎯 MATCH! Keywords: [${matched.join(", ")}] from ${message.author.tag} in ${message.guild.name}`);

      addLog(userId, "keyword", {
        server_id: message.guild.id,
        server_name: message.guild.name,
        channel_name: message.channel.name,
        author_tag: message.author.tag,
        content: message.content.slice(0, 500),
        matched_keywords: matched.join(", "),
      });

      const ch = await client.channels.fetch(notifyChannelId).catch((err) => {
        console.error(`[BOT] Could not fetch notify channel: ${err.message}`);
        addLog(userId, "error", { content: `Failed to fetch notify channel: ${err.message}` });
        return null;
      });

      if (ch) {
        const link = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
        await ch.send(
          `🔔 **Keyword Alert** | \`${matched.join(", ")}\`\n` +
          `**Server:** ${message.guild.name} | **Channel:** #${message.channel.name}\n` +
          `**From:** ${message.author.tag}\n> ${message.content.slice(0, 300)}\n🔗 ${link}`
        ).catch((err) => {
          console.error(`[BOT] Failed to send notification: ${err.message}`);
          addLog(userId, "error", { content: `Failed to send Discord notification: ${err.message}` });
        });
        console.log(`[BOT] ✅ Notification sent!`);
      }

    } catch (err) {
      console.error("[BOT] messageCreate error:", err.message);
      addLog(userId, "error", { content: `Message handler error: ${err.message}` });
    }
  });

  // ── Member join handler ───────────────────────────────────────────────────
  client.on("guildMemberAdd", async (member) => {
    try {
      if (!serverIds.includes(member.guild?.id)) return;

      const ck = `join-${member.user.id}`;
      if (!isAllowed(ck, 300000) || !isAllowed("global", 2000)) {
        console.log(`[BOT] Rate limited join for ${member.user.tag}`);
        return;
      }

      const ageDays = Math.floor((Date.now() - member.user.createdAt) / 86400000);
      console.log(`[BOT] 👋 ${member.user.tag} joined ${member.guild.name} (account age: ${ageDays} days)`);

      addLog(userId, "join", {
        server_id: member.guild.id,
        server_name: member.guild.name,
        author_tag: member.user.tag,
        content: `Joined. Account age: ${ageDays} day(s).${ageDays < 7 ? " ⚠️ New account." : ""}`,
      });

      const ch = await client.channels.fetch(notifyChannelId).catch((err) => {
        console.error(`[BOT] Could not fetch notify channel: ${err.message}`);
        return null;
      });

      if (ch) {
        await ch.send(
          `👋 **New Member** joined **${member.guild.name}**\n` +
          `**User:** ${member.user.tag} | **Members:** ${member.guild.memberCount}\n` +
          `**Account age:** ${ageDays} day(s)${ageDays < 7 ? " ⚠️ New account!" : ""}`
        ).catch((err) => {
          console.error(`[BOT] Failed to send join notification: ${err.message}`);
          addLog(userId, "error", { content: `Failed to send join notification: ${err.message}` });
        });
        console.log(`[BOT] ✅ Join notification sent!`);
      }

      // ── Welcome DM (sent to every new member) ─────────────────────────────
      await sendWelcome(userId, member);

    } catch (err) {
      console.error("[BOT] guildMemberAdd error:", err.message);
      addLog(userId, "error", { content: `Join handler error: ${err.message}` });
    }
  });

  // Send a welcome DM to a newly-joined member.
  async function sendWelcome(userId, member) {
    try {
      const cfg = db
        .prepare("SELECT welcome_message FROM user_configs WHERE user_id = ?")
        .get(userId);
      const message = cfg?.welcome_message?.trim() || DEFAULT_WELCOME;

      await member.send(message);
      console.log(`[BOT] ✉️ Welcome DM sent to ${member.user.tag}`);
      addLog(userId, "welcome", {
        author_tag: member.user.tag,
        content: `✉️ Welcome DM sent: ${message.slice(0, 300)}`,
      });
    } catch (err) {
      // Discord triggered a CAPTCHA challenge — skip the DM silently.
      if (err.message === "CAPTCHA_SOLVER_NOT_IMPLEMENTED") {
        console.warn(`[BOT] Welcome DM skipped for ${member.user?.tag}: Discord CAPTCHA required.`);
        addLog(userId, "warn", { content: `Welcome DM skipped for ${member.user?.tag}: Discord required a CAPTCHA (rate-limit / new account).` });
        return;
      }
      console.error("[BOT] Welcome error:", err.message);
      addLog(userId, "error", { content: `Welcome DM failed for ${member.user?.tag}: ${err.message}` });
    }
  }

}

module.exports = { start, stop, reload, getStatus };
