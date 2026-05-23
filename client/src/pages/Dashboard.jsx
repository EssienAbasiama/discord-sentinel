import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import Overview from "../components/Overview";
import TokenSetup from "../components/TokenSetup";
import ServerManager from "../components/ServerManager";
import KeywordManager from "../components/KeywordManager";
import LogsPanel from "../components/LogsPanel";

const NAV = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "setup", label: "Bot Setup", icon: "⚙" },
  { id: "servers", label: "Servers", icon: "🏠" },
  { id: "keywords", label: "Keywords", icon: "🔍" },
  { id: "logs", label: "Logs", icon: "📋" },
];

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem("wc_user") || "{}");

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const load = useCallback(async () => {
    try {
      const d = await api.getConfig();
      setData(d);
    } catch { toast("Failed to load config", "error"); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 10s when bot is running
  useEffect(() => {
    if (data?.botStatus !== "running") return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [data?.botStatus, load]);

  function logout() {
    localStorage.clear();
    nav("/");
  }

  const setupComplete = data?.config?.discord_token && data?.config?.notify_channel_id && data?.servers?.length > 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, background: "var(--bg2)",
        borderRight: "1px solid var(--border)", padding: "24px 0",
        display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh"
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 20 }}>
            <span style={{ color: "var(--primary)" }}>Watch</span>Cord
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>@{user.username}</div>
        </div>

        {/* Bot status pill */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "var(--card)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <span className={`dot ${data?.botStatus === "running" ? "dot-green" : data?.botStatus === "connecting" ? "dot-amber" : "dot-red"}`} />
            <span style={{ fontSize: 13, color: "var(--text-dim)", fontWeight: 500 }}>
              {data?.botStatus === "running" ? "Bot Running" : data?.botStatus === "connecting" ? "Connecting..." : "Bot Stopped"}
            </span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === n.id ? "var(--primary-dim)" : "transparent",
                color: tab === n.id ? "var(--primary)" : "var(--text-dim)",
                fontSize: 14, fontFamily: "var(--font-body)", fontWeight: tab === n.id ? 600 : 400,
                transition: "all 0.15s", textAlign: "left", marginBottom: 2,
              }}
              onMouseEnter={e => { if (tab !== n.id) e.currentTarget.style.background = "var(--card)"; }}
              onMouseLeave={e => { if (tab !== n.id) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
              {n.id === "setup" && !setupComplete && (
                <span style={{ marginLeft: "auto", width: 7, height: 7, background: "var(--amber)", borderRadius: "50%", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-ghost btn-sm" onClick={logout} style={{ width: "100%", justifyContent: "center" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "36px 40px" }}>
        {!data ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <span className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : (
          <>
            {/* Setup prompt if incomplete */}
            {!setupComplete && tab !== "setup" && (
              <div className="fade-up" style={{ background: "var(--amber-dim)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 12, padding: "14px 20px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>⚠️</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--amber)" }}>Setup not complete</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Add your token, notification channel, and at least one server to activate.</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab("setup")} style={{ color: "var(--amber)", borderColor: "rgba(251,191,36,0.3)" }}>
                  Complete Setup →
                </button>
              </div>
            )}

            {tab === "overview" && <Overview data={data} onStart={() => api.startBot().then(load).catch(e => toast(e.message, "error"))} onStop={() => api.stopBot().then(load)} onTabChange={setTab} toast={toast} />}
            {tab === "setup" && <TokenSetup config={data.config} onSave={async (body) => { await api.saveToken(body); toast("Token saved!"); load(); }} toast={toast} />}
            {tab === "servers" && <ServerManager servers={data.servers} onAdd={async (s) => { await api.addServer(s); toast("Server added!"); load(); }} onDelete={async (id) => { await api.deleteServer(id); toast("Server removed"); load(); }} toast={toast} />}
            {tab === "keywords" && <KeywordManager keywords={data.keywords} onAdd={async (k) => { await api.addKeyword(k); toast("Keyword added!"); load(); }} onDelete={async (id) => { await api.deleteKeyword(id); toast("Keyword removed"); load(); }} />}
            {tab === "logs" && <LogsPanel />}
          </>
        )}
      </main>

      {/* Toasts */}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span>{t.type === "success" ? "✓" : "✕"}</span>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
