import { useState, useEffect, useCallback } from "react";
import { api } from "../api";

// ── A small reusable toggle switch matching the dark UI ──────────────────────
function Toggle({ checked, onChange, disabled, color = "var(--primary)" }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        width: 42, height: 24, borderRadius: 100, border: "none", flexShrink: 0,
        background: checked ? color : "var(--border-bright)",
        position: "relative", cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1, transition: "background 0.2s", padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }} />
    </button>
  );
}

// ── One editable user card ───────────────────────────────────────────────────
function UserCard({ user, isSelf, onSave }) {
  const [draft, setDraft] = useState(user);
  const [saving, setSaving] = useState(false);

  // Keep the draft in sync when the parent reloads the user list.
  useEffect(() => { setDraft(user); }, [user]);

  const dirty =
    draft.is_enabled !== user.is_enabled ||
    draft.is_super_admin !== user.is_super_admin ||
    Number(draft.max_servers) !== user.max_servers ||
    Number(draft.max_keywords) !== user.max_keywords;

  async function save() {
    setSaving(true);
    try {
      await onSave(user.id, {
        is_enabled: draft.is_enabled,
        is_super_admin: draft.is_super_admin,
        max_servers: Math.max(0, parseInt(draft.max_servers, 10) || 0),
        max_keywords: Math.max(0, parseInt(draft.max_keywords, 10) || 0),
      });
    } finally {
      setSaving(false);
    }
  }

  const initial = (user.username || user.email || "?").charAt(0).toUpperCase();

  return (
    <div className="card" style={{ padding: 20, opacity: draft.is_enabled ? 1 : 0.75 }}>
      {/* Header: identity + badges */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: draft.is_super_admin ? "var(--primary-dim)" : "var(--card-hover)",
          color: draft.is_super_admin ? "var(--primary)" : "var(--text-dim)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 18,
        }}>{initial}</div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>{user.username}</span>
            {isSelf && <span className="badge badge-cyan">You</span>}
            {user.is_super_admin && <span className="badge badge-indigo">Super Admin</span>}
            {user.bot_active && <span className="badge badge-green">Bot Live</span>}
            {!user.is_enabled && <span className="badge badge-red">Disabled</span>}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.email}
          </div>
        </div>
      </div>

      {/* Limits */}
      <div className="grid-2col" style={{ gap: 14, marginBottom: 18 }}>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>
            Max servers <span style={{ color: "var(--text-muted)" }}>· using {user.server_count}</span>
          </label>
          <input type="number" min="0" value={draft.max_servers}
            onChange={(e) => setDraft((d) => ({ ...d, max_servers: e.target.value }))}
            style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>
            Max keywords <span style={{ color: "var(--text-muted)" }}>· using {user.keyword_count}</span>
          </label>
          <input type="number" min="0" value={draft.max_keywords}
            onChange={(e) => setDraft((d) => ({ ...d, max_keywords: e.target.value }))}
            style={{ fontFamily: "var(--font-mono)", fontSize: 13 }} />
        </div>
      </div>

      {/* Access toggles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Account enabled</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {isSelf ? "You can't disable yourself" : "Disabled users can't sign in or run a bot"}
            </div>
          </div>
          <Toggle checked={draft.is_enabled} disabled={isSelf} color="var(--green)"
            onChange={(v) => setDraft((d) => ({ ...d, is_enabled: v }))} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Super admin</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {isSelf ? "You can't revoke your own access" : "Full access to manage all users & limits"}
            </div>
          </div>
          <Toggle checked={draft.is_super_admin} disabled={isSelf}
            onChange={(v) => setDraft((d) => ({ ...d, is_super_admin: v }))} />
        </div>
      </div>

      <button className="btn btn-primary btn-sm" onClick={save} disabled={!dirty || saving}
        style={{ width: "100%", justifyContent: "center" }}>
        {saving ? <span className="spinner" /> : dirty ? "Save Changes" : "Saved"}
      </button>
    </div>
  );
}

export default function AdminPanel({ toast }) {
  const [users, setUsers] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await api.adminGetUsers();
      setUsers(d.users);
      setCurrentUserId(d.currentUserId);
    } catch (e) {
      toast(e.message || "Failed to load users", "error");
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(id, body) {
    try {
      await api.adminUpdateUser(id, body);
      toast("User updated");
      await load();
    } catch (e) {
      toast(e.message || "Update failed", "error");
    }
  }

  const filtered = (users || []).filter((u) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const stats = users
    ? [
        { label: "Total Users", value: users.length, color: "var(--primary)" },
        { label: "Enabled", value: users.filter((u) => u.is_enabled).length, color: "var(--green)" },
        { label: "Super Admins", value: users.filter((u) => u.is_super_admin).length, color: "var(--cyan)" },
        { label: "Bots Live", value: users.filter((u) => u.bot_active).length, color: "var(--amber)" },
      ]
    : [];

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 28, marginBottom: 4 }}>User Management</h1>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>
        Grant access, set per-user server &amp; keyword limits, and promote or disable members
      </p>

      {!users ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
            {stats.map((s, i) => (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div style={{ fontSize: 26, fontFamily: "var(--font-head)", fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 20, maxWidth: 360 }}>
            <input placeholder="Search by name or email…" value={query}
              onChange={(e) => setQuery(e.target.value)} />
          </div>

          <div className="section-label">Users ({filtered.length})</div>

          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 24px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 14 }}>No users match your search.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
              {filtered.map((u) => (
                <UserCard key={u.id} user={u} isSelf={u.id === currentUserId} onSave={handleSave} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
