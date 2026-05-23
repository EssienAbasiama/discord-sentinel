import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Input = ({ label, type = "text", value, onChange, placeholder, hint }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", letterSpacing: 0.5, textTransform: "uppercase" }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 14px",
        color: "var(--text)",
        fontSize: 14,
        outline: "none",
        fontFamily: "var(--font-display)",
        transition: "border-color 0.15s",
      }}
      onFocus={e => e.target.style.borderColor = "var(--accent)"}
      onBlur={e => e.target.style.borderColor = "var(--border)"}
    />
    {hint && <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>{hint}</p>}
  </div>
);

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login"
      ? { email, password }
      : { email, username, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      login(data.token, data.user);
      navigate("/");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--bg)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative left panel */}
      <div style={{
        flex: 1,
        background: "linear-gradient(135deg, var(--bg-1) 0%, var(--bg-3) 100%)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }} />
        {/* Glow orb */}
        <div style={{
          position: "absolute",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
        }} />

        <div style={{ position: "relative", textAlign: "center", animation: "fadeUp 0.8s ease forwards" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, margin: "0 auto 24px",
            boxShadow: "0 0 60px var(--accent-glow)",
          }}>⬡</div>

          <h1 style={{
            fontSize: 48, fontWeight: 800, letterSpacing: -2,
            background: "linear-gradient(135deg, #fff 30%, var(--accent-2))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.1, marginBottom: 16,
          }}>Sentinel</h1>

          <p style={{
            fontSize: 16, color: "var(--text-2)", maxWidth: 300,
            lineHeight: 1.7, fontFamily: "var(--font-mono)", fontSize: 13,
          }}>
            Monitor Discord servers in real-time. Get notified on keywords, new members, and activity — all from one dashboard.
          </p>

          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12, textAlign: "left" }}>
            {[
              { icon: "◈", text: "Multi-server monitoring" },
              { icon: "⬡", text: "Real-time keyword alerts" },
              { icon: "◉", text: "Per-user isolated dashboards" },
              { icon: "◆", text: "Full activity log history" },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                color: "var(--text-2)", fontSize: 13,
                animation: `slideIn 0.5s ease ${i * 0.1}s both`,
              }}>
                <span style={{ color: "var(--accent-2)", fontSize: 16 }}>{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth panel */}
      <div style={{
        width: 440,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "60px 48px",
        animation: "fadeUp 0.6s ease 0.2s both",
      }}>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, marginBottom: 6 }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
            {mode === "login"
              ? "Sign in to your Sentinel dashboard"
              : "Start monitoring Discord in minutes"}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: "flex",
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-sm)",
          padding: 4,
          marginBottom: 28,
          gap: 4,
        }}>
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "8px 0",
                borderRadius: 6, fontSize: 13, fontWeight: 600,
                background: mode === m ? "var(--accent)" : "transparent",
                color: mode === m ? "white" : "var(--text-2)",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-display)",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {mode === "register" && (
            <Input
              label="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="your_handle"
            />
          )}
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            hint={mode === "register" ? "Minimum 8 characters" : null}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 16,
            padding: "10px 14px",
            background: "var(--red-bg)",
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: "var(--radius-sm)",
            fontSize: 13,
            color: "var(--red)",
            fontFamily: "var(--font-mono)",
          }}>
            ✕ {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          style={{
            marginTop: 24,
            padding: "14px",
            background: loading ? "var(--bg-3)" : "linear-gradient(135deg, var(--accent), #8b5cf6)",
            color: "white",
            borderRadius: "var(--radius-sm)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.5,
            fontFamily: "var(--font-display)",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "opacity 0.2s",
            boxShadow: loading ? "none" : "0 0 30px var(--accent-glow)",
          }}
        >
          {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
        </button>

        <p style={{
          marginTop: 24, textAlign: "center",
          fontSize: 12, color: "var(--text-3)",
          fontFamily: "var(--font-mono)", lineHeight: 1.8,
        }}>
          For practice use only. Your Discord token is<br />
          stored securely in the database.
        </p>
      </div>
    </div>
  );
}
