import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

const TYPE_CONFIG = {
  keyword: { label: "Keyword", color: "var(--primary)", bg: "var(--primary-dim)", icon: "🔍" },
  join: { label: "Join", color: "var(--cyan)", bg: "var(--cyan-dim)", icon: "👋" },
  system: { label: "System", color: "var(--text-dim)", bg: "var(--card)", icon: "⚙" },
  error: { label: "Error", color: "var(--red)", bg: "var(--red-dim)", icon: "✕" },
};

export default function LogsPanel() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filter !== "all") params.type = filter;
      const data = await api.getLogs(params);
      setLogs(data.logs);
      setTotal(data.total);
    } catch {}
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  async function clearAll() {
    if (!confirm("Clear all logs?")) return;
    setClearing(true);
    try { await api.clearLogs(); await load(); } catch {}
    finally { setClearing(false); }
  }

  const totalPages = Math.ceil(total / 30);

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Logs</h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14 }}>{total} total event{total !== 1 ? "s" : ""} recorded</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {/* Filter tabs */}
          {["all", "keyword", "join", "system", "error"].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className="btn btn-sm"
              style={{
                background: filter === f ? "var(--primary-dim)" : "var(--card)",
                color: filter === f ? "var(--primary)" : "var(--text-dim)",
                border: `1px solid ${filter === f ? "rgba(129,140,248,0.3)" : "var(--border)"}`,
              }}>
              {f === "all" ? "All" : TYPE_CONFIG[f]?.icon + " " + TYPE_CONFIG[f]?.label}
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-danger btn-sm" onClick={clearAll} disabled={clearing || logs.length === 0}>
            {clearing ? <span className="spinner" /> : "🗑 Clear"}
          </button>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No logs yet</div>
          <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Events will appear here once your bot is running.</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map(log => {
              const cfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.system;
              return (
                <div key={log.id} className="card" style={{ padding: "14px 18px", borderLeft: `3px solid ${cfg.color}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                        <span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {log.server_name && <span style={{ fontSize: 13, color: "var(--text-dim)" }}>🏠 {log.server_name}</span>}
                        {log.channel_name && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>#{log.channel_name}</span>}
                        {log.author_tag && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>👤 {log.author_tag}</span>}
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: "auto" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      {log.matched_keywords && (
                        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                          {log.matched_keywords.split(", ").map(k => (
                            <span key={k} style={{ padding: "2px 8px", borderRadius: 100, background: "var(--primary-dim)", color: "var(--primary)", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                      {log.content && (
                        <div style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5, wordBreak: "break-word", background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 10px", borderLeft: "2px solid var(--border)" }}>
                          {log.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
              <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={{ fontSize: 14, color: "var(--text-dim)" }}>Page {page} of {totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
