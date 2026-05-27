import { useState } from "react";

export default function Overview({ data, onStart, onStop, onTabChange, toast }) {
  const [starting, setStarting] = useState(false);
  const isRunning = data?.botStatus === "running";
  const isConnecting = data?.botStatus === "connecting";
  const setupComplete = data?.config?.discord_token && data?.config?.notify_channel_id && data?.servers?.length > 0;

  async function handleStart() {
    setStarting(true);
    try { await onStart(); } catch {}
    finally { setStarting(false); }
  }

  const stats = [
    { label: "Servers Monitored", value: data?.servers?.length || 0, icon: "🏠", color: "var(--primary)" },
    { label: "Keywords Tracked", value: data?.keywords?.length || 0, icon: "🔍", color: "var(--cyan)" },
    { label: "Notify Channel", value: data?.config?.notify_channel_id ? "Configured" : "Not set", icon: "🔔", color: data?.config?.notify_channel_id ? "var(--green)" : "var(--amber)" },
    { label: "Bot Status", value: isRunning ? "Online" : isConnecting ? "Connecting" : "Offline", icon: "⚡", color: isRunning ? "var(--green)" : isConnecting ? "var(--amber)" : "var(--red)" },
  ];

  const steps = [
    { label: "Add your Discord token", done: !!data?.config?.discord_token, tab: "setup" },
    { label: "Set notification channel ID", done: !!data?.config?.notify_channel_id, tab: "setup" },
    { label: "Add a server to monitor", done: data?.servers?.length > 0, tab: "servers" },
    { label: "Add keywords to watch", done: data?.keywords?.length > 0, tab: "keywords" },
    { label: "Start the bot", done: isRunning, tab: null },
  ];

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Overview</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>Monitor status and quick controls</p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontFamily: "var(--font-head)", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2col">
        {/* Setup checklist */}
        <div className="card">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Setup Checklist</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                  background: s.done ? "var(--green-dim)" : "var(--card)",
                  border: `1px solid ${s.done ? "rgba(52,211,153,0.3)" : "var(--border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12
                }}>
                  {s.done ? <span style={{ color: "var(--green)" }}>✓</span> : <span style={{ color: "var(--text-muted)", fontSize: 10 }}>{i + 1}</span>}
                </div>
                <span style={{ fontSize: 14, color: s.done ? "var(--text-dim)" : "var(--text)", textDecoration: s.done ? "line-through" : "none" }}>
                  {s.label}
                </span>
                {!s.done && s.tab && (
                  <button onClick={() => onTabChange(s.tab)} style={{ marginLeft: "auto", fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                    Set up →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bot controls */}
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Bot Controls</div>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24, lineHeight: 1.6 }}>
            {isRunning
              ? `Your bot is active and monitoring ${data.servers.length} server(s).`
              : setupComplete
              ? "Your setup is complete. Start the bot to begin monitoring."
              : "Complete setup above before starting the bot."}
          </p>

          <div style={{ marginTop: "auto" }}>
            {isRunning ? (
              <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} onClick={onStop}>
                ⏹ Stop Bot
              </button>
            ) : (
              <button className="btn btn-success" style={{ width: "100%", justifyContent: "center" }}
                disabled={!setupComplete || starting} onClick={handleStart}>
                {starting ? <><span className="spinner" /> Connecting...</> : "▶ Start Bot"}
              </button>
            )}
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
              {isRunning ? "Stop to pause all monitoring" : "Bot will connect to Discord on start"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
