import { useState } from "react";

const steps = [
  {
    num: 1,
    title: "Open Discord in your browser",
    desc: "Go to discord.com and log in with the account you want to monitor from. Don't use your main account.",
  },
  {
    num: 2,
    title: "Open Developer Tools",
    desc: 'Press F12 (or Ctrl+Shift+I) to open DevTools. Go to the "Network" tab.',
  },
  {
    num: 3,
    title: "Capture the token",
    desc: 'Click any channel or send a message. Find a request in the list, click it, then look under "Headers" for "Authorization". That value is your token.',
  },
  {
    num: 4,
    title: "Get your notification channel ID",
    desc: 'In Discord: Settings → Advanced → Enable Developer Mode. Then right-click your private channel and click "Copy Channel ID".',
  },
];

export default function TokenSetup({ config, onSave, toast }) {
  const [token, setToken] = useState(config?.discord_token || "");
  const [channel, setChannel] = useState(config?.notify_channel_id || "");
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  async function save() {
    if (!token.trim()) return toast("Token is required", "error");
    if (!channel.trim()) return toast("Channel ID is required", "error");
    setSaving(true);
    try { await onSave({ discord_token: token.trim(), notify_channel_id: channel.trim() }); }
    catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Bot Setup</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>Configure your Discord token and notification channel</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Form */}
        <div className="card">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 24 }}>Your Credentials</div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Discord User Token</label>
            <div style={{ position: "relative" }}>
              <input
                type={showToken ? "text" : "password"}
                placeholder="Paste your token here"
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
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              ⚠️ Keep this private. Never share it with anyone.
            </p>
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Notification Channel ID</label>
            <input
              type="text"
              placeholder="e.g. 1234567890123456789"
              value={channel}
              onChange={e => setChannel(e.target.value)}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
            />
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              The channel in your private server where alerts will be sent.
            </p>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : "Save Configuration"}
          </button>

          {config?.discord_token && (
            <div className="badge badge-green" style={{ marginTop: 16, display: "inline-flex" }}>
              ✓ Token saved
            </div>
          )}
        </div>

        {/* Guide */}
        <div>
          <div className="section-label">How to find your token</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s) => (
              <div key={s.num} className="card" style={{ padding: "16px 18px" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", background: "var(--primary-dim)",
                    border: "1px solid rgba(129,140,248,0.3)", color: "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, flexShrink: 0, fontFamily: "var(--font-head)"
                  }}>
                    {s.num}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>{s.desc}</div>
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
