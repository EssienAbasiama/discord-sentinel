import { useState } from "react";

const SUGGESTIONS = ["developer", "freelance", "hire", "react", "nodejs", "frontend", "backend", "fullstack", "remote work", "javascript"];

export default function KeywordManager({ keywords, onAdd, onDelete }) {
  const [input, setInput] = useState("");

  async function add(kw) {
    const word = (kw || input).trim();
    if (!word) return;
    await onAdd({ keyword: word });
    setInput("");
  }

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Keywords</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>You'll get an alert whenever these words appear in a monitored server</p>

      <div className="grid-2col">
        <div className="card">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Add Keyword</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <input placeholder='e.g. "web developer"' value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && add()} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={() => add()} disabled={!input.trim()} style={{ flexShrink: 0 }}>Add</button>
          </div>

          <div className="section-label">Suggestions</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTIONS.filter(s => !keywords.find(k => k.keyword === s)).map(s => (
              <button key={s} onClick={() => add(s)} style={{
                padding: "5px 12px", borderRadius: 100, fontSize: 13,
                background: "var(--card)", border: "1px solid var(--border)",
                color: "var(--text-dim)", cursor: "pointer", transition: "all 0.15s",
                fontFamily: "var(--font-body)"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}>
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="section-label">Active Keywords ({keywords.length})</div>
          {keywords.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: 14 }}>
              No keywords yet. Add one to start receiving alerts.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {keywords.map(k => (
                <div key={k.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ color: "var(--primary)", fontSize: 14 }}>🔍</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{k.keyword}</span>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(k.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
