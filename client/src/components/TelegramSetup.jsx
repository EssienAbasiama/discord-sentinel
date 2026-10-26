import { useState } from "react";

const steps = [
  { num: 1, title: "Open Telegram and find @BotFather", desc: "Search for @BotFather in Telegram and open the chat." },
  { num: 2, title: "Create a new bot", desc: 'Send /newbot, follow the prompts, and give your bot a name and username. BotFather will give you a bot token.' },
  { num: 3, title: "Copy your bot token", desc: 'It looks like: 7123456789:AAFxxxxxx_xxxxxxxxxxxxxxxxxx. Paste it below.' },
  { num: 4, title: "Get your notification chat ID", desc: 'Add @userinfobot to any Telegram chat (or DM it). It will reply with your chat ID. Use that for the notification chat.' },
  { num: 5, title: "Add your bot to groups you want to monitor", desc: 'Open each group → Add Member → search for your bot username → add it. Then get the group chat ID from @userinfobot.' },
];

export default function TelegramSetup({ config, onSave, toast }) {
  const [token, setToken] = useState(config?.bot_token || "");
  const [chatId, setChatId] = useState(config?.notify_chat_id || "");
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  async function save() {
    if (!token.trim()) return toast("Bot token is required", "error");
    if (!chatId.trim()) return toast("Notification chat ID is required", "error");
    setSaving(true);
    try { await onSave({ bot_token: token.trim(), notify_chat_id: chatId.trim() }); }
    catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 28 }}>✈️</span>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28 }}>Telegram Bot Setup</h1>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>
        Configure your Telegram bot token and notification chat
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 24 }}>Your Credentials</div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Telegram Bot Token</label>
            <div style={{ position: "relative" }}>
              <input
                type={showToken ? "text" : "password"}
                placeholder="7123456789:AAFxxxxxxxxxxxxxxxx"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{ paddingRight: 44, fontFamily: "var(--font-mono)", fontSize: 13 }}
              />
              <button onClick={() => setShowToken(v => !v)} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16
              }}>
                {showToken ? "🙈" : "👁"}
              </button>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Get this from @BotFather on Telegram</p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Notification Chat ID</label>
            <input
              type="text"
              placeholder="e.g. -1001234567890 or 123456789"
              value={chatId}
              onChange={e => setChatId(e.target.value)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              The chat where alerts will be sent. Get ID from @userinfobot.
            </p>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : "Save Configuration"}
          </button>

          {config?.bot_token && (
            <div className="badge badge-green" style={{ marginTop: 16, display: "inline-flex" }}>✓ Token saved</div>
          )}
        </div>

        {/* Guide */}
        <div>
          <div className="section-label">How to set up your Telegram bot</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {steps.map((s) => (
              <div key={s.num} className="card" style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.3)",
                    color: "var(--cyan)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-head)"
                  }}>{s.num}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>{s.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
