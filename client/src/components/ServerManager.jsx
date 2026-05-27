import { useState } from "react";

export default function ServerManager({ servers, onAdd, onDelete, toast }) {
  const [form, setForm] = useState({ server_id: "", server_name: "" });
  const [adding, setAdding] = useState(false);

  async function add() {
    if (!form.server_id.trim()) return;
    setAdding(true);
    try { await onAdd(form); setForm({ server_id: "", server_name: "" }); }
    catch (e) { toast(e.message, "error"); }
    finally { setAdding(false); }
  }

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Monitored Servers</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>Add the servers you want to watch for keyword mentions and joins</p>

      <div className="grid-2col">
        {/* Add server form */}
        <div className="card">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 20 }}>Add a Server</div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Server ID *</label>
            <input
              placeholder="e.g. 1234567890123456789"
              value={form.server_id}
              onChange={e => setForm(f => ({ ...f, server_id: e.target.value }))}
              style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
              onKeyDown={e => e.key === "Enter" && add()}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Server Name (optional)</label>
            <input
              placeholder="e.g. Tech Hub"
              value={form.server_name}
              onChange={e => setForm(f => ({ ...f, server_name: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && add()}
            />
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={add} disabled={adding || !form.server_id.trim()}>
            {adding ? <span className="spinner" /> : "+ Add Server"}
          </button>
        </div>

        {/* How to get server ID */}
        <div className="card" style={{ background: "var(--cyan-dim)", borderColor: "rgba(34,211,238,0.15)" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 15, marginBottom: 16, color: "var(--cyan)" }}>
            📌 How to get a Server ID
          </div>
          <ol style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Open Discord (desktop or browser)",
              "Go to Settings → Advanced",
              'Enable "Developer Mode"',
              "Right-click the server icon in the sidebar",
              'Click "Copy Server ID"',
              "Paste it above",
            ].map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: "var(--text-dim)", lineHeight: 1.5 }}>{s}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Server list */}
      <div style={{ marginTop: 32 }}>
        <div className="section-label">Active Servers ({servers.length})</div>
        {servers.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏠</div>
            <div style={{ fontSize: 14 }}>No servers added yet. Add one above to start monitoring.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {servers.map((s) => (
              <div key={s.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-dim)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏠</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.server_name || "Unnamed Server"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{s.server_id}</div>
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => onDelete(s.id)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
