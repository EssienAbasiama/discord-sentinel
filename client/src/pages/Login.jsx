import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { token, user } = await api.login(form);
      localStorage.setItem("wc_token", token);
      localStorage.setItem("wc_user", JSON.stringify(user));
      nav("/dashboard");
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "radial-gradient(ellipse at 50% 0%, rgba(129,140,248,0.08) 0%, var(--bg) 60%)" }}>
      <Link to="/" style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, color: "var(--text)", textDecoration: "none", marginBottom: 40 }}>
        <span style={{ color: "var(--primary)" }}>Watch</span>Cord
      </Link>

      <div className="card fade-up" style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 24, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 28 }}>Sign in to your WatchCord dashboard</p>

        {error && (
          <div style={{ background: "var(--red-dim)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "var(--red)", marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 6, display: "block" }}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center", marginTop: 4, padding: "12px" }}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
