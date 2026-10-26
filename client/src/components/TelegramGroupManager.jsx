import { useState } from "react";

export default function TelegramGroupManager({ groups, onAdd, onDelete, toast }) {
  const [form, setForm] = useState({ chat_id: "", chat_title: "" });
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!form.chat_id.trim()) return;
    setAdding(true);
    try { await onAdd(form); setForm({ chat_id: "", chat_title: "" }); }
    catch (e) { toast(e.message, "error"); }
    finally { setAdding(false); }
  }

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 28 }}>✈️</span>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28 }}>Telegram Groups</h1>
      </div>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>
        Add the Telegram groups you want to monitor
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div className="card">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Add a Group</div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Chat ID *</label>
            <input placeholder="e.g. -1001234567890"
              value={form.chat_id} onChange={e => setForm(f => ({ ...f, chat_id: e.target.value }))}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              onKeyDown={e => e.key === "Enter" && add()} />
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>
              Group IDs are negative numbers like -1001234567890
            </p>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Group Name (optional)</label>
            <input placeholder="e.g. My Tech Group"
              value={form.chat_title} onChange={e => setForm(f => ({ ...f, chat_title: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && add()} />
          </div>
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
            onClick={add} disabled={adding || !form.chat_id.trim()}>
            {adding ? <span className="spinner" /> : "+ Add Group"}
          </button>
        </div>

        {/* How to get chat ID */}
        <div className="card" style={{ background: "var(--cyan-dim)", borderColor: "rgba(34,211,238,0.15)" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 15, marginBottom: 14, color: "var(--cyan)" }}>
            📌 How to get a Group Chat ID
          </div>
          <ol style={{ paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Add your bot to the Telegram group",
              "Also add @userinfobot to the group",
              "Type /start@userinfobot in the group",
              "It will reply with the group's chat ID",
              "It looks like: -1001234567890",
              "Paste that ID above",
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>{s}</li>
            ))}
          </ol>
          <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 12, color: "var(--text-muted)" }}>
            💡 Alternatively, send a message in the group and visit:<br />
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--cyan)" }}>
              https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates
            </span>
          </div>
        </div>
      </div>

      {/* Group list */}
      <div style={{ marginTop: 32 }}>
        <div className="section-label">Monitored Groups ({groups.length})</div>
        {groups.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✈️</div>
            <div style={{ fontSize: 14 }}>No groups added yet. Add one above to start monitoring.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groups.map(g => (
              <div key={g.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--cyan-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>✈️</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{g.chat_title || "Unnamed Group"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{g.chat_id}</div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(g.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
