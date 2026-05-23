import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

const TYPE_COLORS = {
  keyword: { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", text: "var(--accent-2)", label: "KEYWORD" },
  join: { bg: "var(--yellow-bg)", border: "rgba(251,191,36,0.2)", text: "var(--yellow)", label: "JOIN" },
};

function LogRow({ log }) {
  const tc = TYPE_COLORS[log.type] || TYPE_COLORS.keyword;
  const ts = new Date(log.created_at * 1000);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr auto",
      gap: 16,
      padding: "14px 20px",
      borderBottom: "1px solid var(--border)",
      alignItems: "start",
      transition: "background 0.15s",
      fontSize: 13,
    }}
      onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
      onMouseOut={e => e.currentTarget.style.background = "transparent"}
    >
      <span style={{
        padding: "3px 8px", borderRadius: 4,
        background: tc.bg, border: `1px solid ${tc.border}`,
        color: tc.text, fontSize: 10, fontWeight: 700,
        fontFamily: "var(--font-mono)",
        display: "inline-block", textAlign: "center",
        whiteSpace: "nowrap",
      }}>
        {tc.label}
      </span>

      <div>
        <div style={{ marginBottom: 4, color: "var(--text)", lineHeight: 1.5 }}>
          {log.type === "keyword" ? (
            <>
              <span style={{ color: "var(--text-2)" }}>[{log.server_name}]</span>
              {" "}#{log.channel_name}
              {" "}— <span style={{ color: "var(--accent-2)" }}>{log.author_tag}</span>
            </>
          ) : (
            <>
              <span style={{ color: "var(--green)" }}>{log.author_tag}</span>
              {" "}joined <span style={{ color: "var(--text-2)" }}>{log.server_name}</span>
            </>
          )}
        </div>

        {log.content && (
          <div style={{
            fontSize: 12, color: "var(--text-3)",
            fontFamily: "var(--font-mono)", lineHeight: 1.5,
            background: "var(--bg-3)", padding: "6px 10px",
            borderRadius: 6, marginTop: 6,
            borderLeft: "2px solid var(--border-hover)",
          }}>
            {log.content.slice(0, 120)}{log.content.length > 120 ? "..." : ""}
          </div>
        )}

        {log.matched_keywords?.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>matched:</span>
            {log.matched_keywords.map(kw => (
              <span key={kw} style={{
                fontSize: 11, padding: "1px 6px",
                background: "rgba(99,102,241,0.1)",
                color: "var(--accent-2)",
                borderRadius: 4, fontFamily: "var(--font-mono)",
              }}>{kw}</span>
            ))}
          </div>
        )}

        {log.message_link && (
          <a
            href={log.message_link}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)", marginTop: 4, display: "inline-block" }}
          >
            Jump to message →
          </a>
        )}
      </div>

      <div style={{
        textAlign: "right", fontSize: 11,
        color: "var(--text-3)", fontFamily: "var(--font-mono)",
        whiteSpace: "nowrap",
      }}>
        {ts.toLocaleDateString()}<br />
        {ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

export default function LogsPage() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, keywords: 0, joins: 0, today: 0 });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  const loadLogs = async () => {
    setLoading(true);
    const typeParam = filter !== "all" ? `&type=${filter}` : "";
    const [logsRes, statsRes] = await Promise.all([
      authFetch(`/api/logs?limit=${LIMIT}&offset=${page * LIMIT}${typeParam}`),
      authFetch("/api/logs/stats"),
    ]);
    setLogs(await logsRes.json());
    setStats(await statsRes.json());
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, [filter, page]);

  const clearLogs = async () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    setClearing(true);
    await authFetch("/api/logs", { method: "DELETE" });
    setClearing(false);
    setConfirmClear(false);
    loadLogs();
  };

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, animation: "fadeUp 0.4s ease both" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, marginBottom: 4 }}>Activity Logs</h1>
          <p style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
            {stats.total} total events · {stats.today} today
          </p>
        </div>
        <button
          onClick={clearLogs}
          disabled={clearing || stats.total === 0}
          style={{
            padding: "10px 16px",
            background: confirmClear ? "var(--red-bg)" : "var(--bg-2)",
            border: `1px solid ${confirmClear ? "rgba(248,113,113,0.3)" : "var(--border)"}`,
            color: confirmClear ? "var(--red)" : "var(--text-3)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12, fontWeight: 600,
            fontFamily: "var(--font-mono)",
            transition: "all 0.15s",
            cursor: stats.total === 0 ? "not-allowed" : "pointer",
          }}
        >
          {clearing ? "clearing..." : confirmClear ? "confirm clear?" : "Clear All Logs"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 24,
        animation: "fadeUp 0.4s ease 0.1s both",
      }}>
        {[
          { key: "all", label: "All", count: stats.total },
          { key: "keyword", label: "Keywords", count: stats.keywords },
          { key: "join", label: "Joins", count: stats.joins },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(0); }}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              fontSize: 13, fontWeight: 600,
              fontFamily: "var(--font-display)",
              background: filter === f.key ? "var(--accent)" : "var(--bg-2)",
              color: filter === f.key ? "white" : "var(--text-2)",
              border: `1px solid ${filter === f.key ? "transparent" : "var(--border)"}`,
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {f.label}
            <span style={{
              padding: "1px 7px", borderRadius: 10,
              background: filter === f.key ? "rgba(255,255,255,0.2)" : "var(--bg-3)",
              fontSize: 11, fontFamily: "var(--font-mono)",
            }}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Log table */}
      <div style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        animation: "fadeUp 0.4s ease 0.15s both",
      }}>
        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "80px 1fr auto",
          gap: 16, padding: "10px 20px",
          background: "var(--bg-2)",
          borderBottom: "1px solid var(--border)",
          fontSize: 10, fontWeight: 700,
          color: "var(--text-3)", fontFamily: "var(--font-mono)",
          textTransform: "uppercase", letterSpacing: 1,
        }}>
          <span>Type</span>
          <span>Event</span>
          <span>Time</span>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            loading...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>◈</div>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No logs yet</p>
            <p style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              Start a bot to begin capturing events
            </p>
          </div>
        ) : (
          logs.map(log => <LogRow key={log.id} log={log} />)
        )}
      </div>

      {/* Pagination */}
      {logs.length > 0 && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: 16, padding: "0 4px",
          animation: "fadeUp 0.4s ease 0.2s both",
        }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: "8px 16px",
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12, color: page === 0 ? "var(--text-3)" : "var(--text)",
              fontFamily: "var(--font-mono)",
              cursor: page === 0 ? "not-allowed" : "pointer",
            }}
          >← Prev</button>

          <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            Page {page + 1} · showing {logs.length} events
          </span>

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={logs.length < LIMIT}
            style={{
              padding: "8px 16px",
              background: "var(--bg-2)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12, color: logs.length < LIMIT ? "var(--text-3)" : "var(--text)",
              fontFamily: "var(--font-mono)",
              cursor: logs.length < LIMIT ? "not-allowed" : "pointer",
            }}
          >Next →</button>
        </div>
      )}
    </div>
  );
}
