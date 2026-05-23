import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Tag({ label, onRemove, color = "accent" }) {
  const colors = {
    accent: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.2)", text: "var(--accent-2)" },
    green: { bg: "var(--green-bg)", border: "rgba(52,211,153,0.2)", text: "var(--green)" },
  };
  const c = colors[color] || colors.accent;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 10px",
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, fontSize: 13, fontFamily: "var(--font-mono)",
      color: c.text, animation: "slideIn 0.2s ease both",
    }}>
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          style={{ color: c.text, opacity: 0.6, fontSize: 14, lineHeight: 1, padding: "0 2px" }}
          title="Remove"
        >×</button>
      )}
    </div>
  );
}

function AddField({ placeholder, onAdd, buttonLabel = "Add", hint }) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder={placeholder}
          style={{
            flex: 1, background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px", color: "var(--text)",
            fontSize: 13, outline: "none",
            fontFamily: "var(--font-mono)",
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button
          onClick={submit}
          style={{
            padding: "10px 16px",
            background: "var(--accent)",
            color: "white", borderRadius: "var(--radius-sm)",
            fontSize: 13, fontWeight: 600,
            fontFamily: "var(--font-display)",
            transition: "opacity 0.15s",
          }}
          onMouseOver={e => e.currentTarget.style.opacity = "0.8"}
          onMouseOut={e => e.currentTarget.style.opacity = "1"}
        >
          {buttonLabel}
        </button>
      </div>
      {hint && <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{hint}</p>}
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{
      background: "var(--bg-1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      overflow: "hidden",
      animation: "fadeUp 0.4s ease both",
    }}>
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 10,
        background: "var(--bg-2)",
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h3>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  );
}

export default function BotDetail() {
  const { id } = useParams();
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [bot, setBot] = useState(null);
  const [servers, setServers] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [feedback, setFeedback] = useState("");

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 2500);
  };

  const loadAll = async () => {
    try {
      const [botsRes, serversRes, keywordsRes, logsRes] = await Promise.all([
        authFetch("/api/bots"),
        authFetch(`/api/bots/${id}/servers`),
        authFetch(`/api/bots/${id}/keywords`),
        authFetch(`/api/logs?bot_id=${id}&limit=10`),
      ]);
      const bots = await botsRes.json();
      const found = Array.isArray(bots) ? bots.find(b => b.id === id) : null;
      setBot(found);
      setServers(await serversRes.json());
      setKeywords(await keywordsRes.json());
      setLogs(await logsRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleToggle = async () => {
    setActing(true);
    const endpoint = bot?.live_status === "online" ? "stop" : "start";
    const res = await authFetch(`/api/bots/${id}/${endpoint}`, { method: "POST" });
    const data = await res.json();
    showFeedback(data.message || (endpoint === "start" ? "Bot started" : "Bot stopped"));
    await loadAll();
    setActing(false);
  };

  const addServer = async (input) => {
    setError("");
    // Accept "server_id" or "server_id:name"
    const parts = input.split(":").map(p => p.trim());
    const server_id = parts[0];
    const server_name = parts[1] || null;
    if (!/^\d{17,20}$/.test(server_id)) {
      setError("Invalid server ID. IDs are 17-20 digit numbers.");
      return;
    }
    const res = await authFetch(`/api/bots/${id}/servers`, {
      method: "POST",
      body: JSON.stringify({ server_id, server_name }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    showFeedback("Server added");
    loadAll();
  };

  const removeServer = async (serverId) => {
    await authFetch(`/api/bots/${id}/servers/${serverId}`, { method: "DELETE" });
    showFeedback("Server removed");
    loadAll();
  };

  const addKeyword = async (kw) => {
    const res = await authFetch(`/api/bots/${id}/keywords`, {
      method: "POST",
      body: JSON.stringify({ keyword: kw }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    showFeedback("Keyword added");
    loadAll();
  };

  const removeKeyword = async (kwId) => {
    await authFetch(`/api/bots/${id}/keywords/${kwId}`, { method: "DELETE" });
    showFeedback("Keyword removed");
    loadAll();
  };

  if (loading) return (
    <div style={{ padding: 48, color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
      loading...
    </div>
  );

  if (!bot) return (
    <div style={{ padding: 48 }}>
      <p style={{ color: "var(--red)" }}>Bot not found.</p>
      <button onClick={() => navigate("/")} style={{ color: "var(--accent-2)", marginTop: 8 }}>← Back</button>
    </div>
  );

  const isOnline = bot.live_status === "online";

  return (
    <div style={{ padding: "40px 48px", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 36, animation: "fadeUp 0.4s ease both" }}>
        <button
          onClick={() => navigate("/")}
          style={{ color: "var(--text-3)", fontSize: 13, fontFamily: "var(--font-mono)", marginBottom: 12 }}
        >← Dashboard</button>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>
              {bot.bot_name || "Unnamed Bot"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", borderRadius: 20,
                background: isOnline ? "var(--green-bg)" : "var(--bg-3)",
                border: `1px solid ${isOnline ? "rgba(52,211,153,0.2)" : "var(--border)"}`,
                fontSize: 11, fontWeight: 600,
                color: isOnline ? "var(--green)" : "var(--text-3)",
                fontFamily: "var(--font-mono)",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: isOnline ? "var(--green)" : "var(--text-3)",
                  animation: isOnline ? "pulse 2s infinite" : "none",
                }} />
                {isOnline ? "ONLINE" : "OFFLINE"}
              </div>
              <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                {servers.length} server{servers.length !== 1 ? "s" : ""} · {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={acting}
            style={{
              padding: "12px 28px",
              background: acting ? "var(--bg-3)" : isOnline
                ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                : "linear-gradient(135deg, var(--green), #059669)",
              color: acting ? "var(--text-3)" : "white",
              borderRadius: "var(--radius-sm)",
              fontSize: 14, fontWeight: 700,
              fontFamily: "var(--font-display)",
              boxShadow: !acting ? (isOnline ? "0 0 20px rgba(220,38,38,0.2)" : "0 0 20px rgba(52,211,153,0.2)") : "none",
              transition: "all 0.2s",
              cursor: acting ? "not-allowed" : "pointer",
            }}
          >
            {acting ? "..." : isOnline ? "⏹ Stop Bot" : "▶ Start Bot"}
          </button>
        </div>
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div style={{
          padding: "10px 16px",
          background: "var(--green-bg)",
          border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: "var(--radius-sm)",
          fontSize: 13, color: "var(--green)",
          fontFamily: "var(--font-mono)",
          marginBottom: 20, animation: "fadeUp 0.2s ease both",
        }}>
          ✓ {feedback}
        </div>
      )}

      {error && (
        <div style={{
          padding: "10px 16px",
          background: "var(--red-bg)", border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "var(--radius-sm)", fontSize: 13,
          color: "var(--red)", fontFamily: "var(--font-mono)",
          marginBottom: 20, animation: "fadeUp 0.2s ease both",
        }}>
          ✕ {error}
          <button onClick={() => setError("")} style={{ marginLeft: 8, color: "var(--red)", opacity: 0.7 }}>dismiss</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Monitored Servers */}
        <SectionCard title="Monitored Servers" icon="🏠">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AddField
              placeholder="Server ID  (or  ServerID:Server Name)"
              onAdd={addServer}
              buttonLabel="Add"
              hint='Right-click server icon → Copy Server ID. Optionally add a name: 1234567890:My Server'
            />
            {servers.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {servers.map(s => (
                  <Tag
                    key={s.id}
                    label={s.server_name ? `${s.server_name} (${s.server_id})` : s.server_id}
                    onRemove={() => removeServer(s.id)}
                    color="green"
                  />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                No servers added yet. Add server IDs to monitor above.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Keywords */}
        <SectionCard title="Keywords to Monitor" icon="🔍">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AddField
              placeholder='e.g. "web developer" or "react"'
              onAdd={addKeyword}
              buttonLabel="Add"
              hint="Case-insensitive. Press Enter or click Add."
            />
            {keywords.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {keywords.map(k => (
                  <Tag
                    key={k.id}
                    label={k.keyword}
                    onRemove={() => removeKeyword(k.id)}
                    color="accent"
                  />
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                No keywords yet. Add words to trigger notifications.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Recent Logs */}
        <SectionCard title="Recent Activity" icon="◈">
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              No activity yet. Start the bot to begin monitoring.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  padding: "12px 14px",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12, fontFamily: "var(--font-mono)",
                  animation: "slideIn 0.2s ease both",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 4,
                      background: log.type === "keyword" ? "rgba(99,102,241,0.1)" : "var(--yellow-bg)",
                      color: log.type === "keyword" ? "var(--accent-2)" : "var(--yellow)",
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {log.type === "keyword" ? "KEYWORD" : "JOIN"}
                    </span>
                    <span style={{ color: "var(--text-3)", fontSize: 11 }}>
                      {new Date(log.created_at * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ color: "var(--text)" }}>
                    {log.type === "keyword"
                      ? `[${log.server_name}] #${log.channel_name} — ${log.author_tag}: ${log.content?.slice(0, 80)}...`
                      : `${log.author_tag} joined ${log.server_name}`}
                  </div>
                  {log.matched_keywords?.length > 0 && (
                    <div style={{ marginTop: 4, color: "var(--accent-2)" }}>
                      matched: {log.matched_keywords.join(", ")}
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => navigate("/logs")}
                style={{ color: "var(--accent-2)", fontSize: 12, fontFamily: "var(--font-mono)", textAlign: "left", marginTop: 4 }}
              >
                View all logs →
              </button>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
