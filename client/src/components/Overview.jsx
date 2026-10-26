import { useState } from "react";

export default function Overview({ data, tgData, onStart, onStop, onTgStart, onTgStop, onTabChange, toast }) {
  const [starting, setStarting] = useState(false);
  const [tgStarting, setTgStarting] = useState(false);
  const isRunning = data?.botStatus === "running";
  const isConnecting = data?.botStatus === "connecting";
  const setupComplete = data?.config?.discord_token && data?.config?.notify_channel_id && data?.servers?.length > 0;
  const tgIsRunning = tgData?.tgBotStatus === "running";
  const tgSetupComplete = tgData?.config?.bot_token && tgData?.config?.notify_chat_id && tgData?.groups?.length > 0;

  async function handleStart() {
    setStarting(true);
    try { await onStart(); } catch {}
    finally { setStarting(false); }
  }

  async function handleTgStart() {
    setTgStarting(true);
    try { await onTgStart(); } catch {}
    finally { setTgStarting(false); }
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
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Discord Bot Controls</div>
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

      {/* Telegram bot controls */}
      <div className="card" style={{ marginTop: 24, display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Telegram Bot Controls</div>
        <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 24, lineHeight: 1.6 }}>
          {tgIsRunning
            ? `Your Telegram bot is active and monitoring ${tgData.groups.length} group(s).`
            : tgSetupComplete
            ? "Your Telegram setup is complete. Start the bot to begin monitoring."
            : <>Add a bot token, notification chat, and at least one group before starting.{" "}
                <button onClick={() => onTabChange(tgData?.config?.bot_token && tgData?.config?.notify_chat_id ? "tg-groups" : "tg-setup")} style={{ fontSize: 13, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Set up →
                </button>
              </>}
        </p>

        {tgIsRunning ? (
          <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }} onClick={onTgStop}>
            ⏹ Stop Telegram Bot
          </button>
        ) : (
          <button className="btn btn-success" style={{ width: "100%", justifyContent: "center" }}
            disabled={!tgSetupComplete || tgStarting} onClick={handleTgStart}>
            {tgStarting ? <><span className="spinner" /> Connecting...</> : "▶ Start Telegram Bot"}
          </button>
        )}
        <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", marginTop: 10 }}>
          {tgIsRunning ? "Stop to pause Telegram monitoring" : "Bot will connect to Telegram on start"}
        </p>
      </div>
    </div>
  );
}
