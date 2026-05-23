import { Link } from "react-router-dom";

const features = [
  { icon: "🔍", title: "Keyword Monitoring", desc: "Get instant alerts when specific words appear in any monitored server." },
  { icon: "👋", title: "Join Alerts", desc: "Know every time someone joins your watched servers, with account age flags." },
  { icon: "🖥️", title: "Live Dashboard", desc: "View all your logs and manage settings from one clean interface." },
  { icon: "🔐", title: "Per-User Isolation", desc: "Your token, your servers, your logs. Fully private per account." },
  { icon: "⚡", title: "Rate Limited", desc: "Smart cooldowns prevent your account from triggering abuse filters." },
  { icon: "🗄️", title: "Persistent Storage", desc: "All settings saved to database. Add or remove servers anytime." },
];

export default function Landing() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 22, color: "var(--text)" }}>
          <span style={{ color: "var(--primary)" }}>Watch</span>Cord
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/login"><button className="btn btn-ghost">Sign In</button></Link>
          <Link to="/register"><button className="btn btn-primary">Get Started</button></Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", padding: "100px 24px 80px" }}>
        <div className="badge badge-indigo fade-up" style={{ marginBottom: 24, display: "inline-flex" }}>
          ✦ Discord Server Monitor
        </div>
        <h1 className="fade-up" style={{ fontFamily: "var(--font-head)", fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 24, animationDelay: "0.1s" }}>
          Monitor Discord.<br />
          <span style={{ background: "linear-gradient(135deg, var(--primary), var(--cyan))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Stay Ahead.
          </span>
        </h1>
        <p className="fade-up" style={{ fontSize: 18, color: "var(--text-dim)", maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7, animationDelay: "0.2s" }}>
          Get real-time notifications when keywords are mentioned or new members join
          your watched servers — delivered straight to your private Discord channel.
        </p>
        <div className="fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", animationDelay: "0.3s" }}>
          <Link to="/register"><button className="btn btn-primary" style={{ padding: "12px 28px", fontSize: 15 }}>Start Monitoring Free →</button></Link>
          <Link to="/login"><button className="btn btn-ghost" style={{ padding: "12px 28px", fontSize: 15 }}>Sign In</button></Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 100px" }}>
        <p className="section-label" style={{ textAlign: "center", marginBottom: 40 }}>Everything You Need</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {features.map((f, i) => (
            <div key={i} className="card fade-up" style={{ animationDelay: `${0.1 * i}s`, transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-bright)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontFamily: "var(--font-head)", fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{f.title}</div>
              <div style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Ready to start monitoring?</h2>
        <p style={{ color: "var(--text-dim)", marginBottom: 32 }}>Create your account and set up in under 2 minutes.</p>
        <Link to="/register"><button className="btn btn-primary" style={{ padding: "13px 32px", fontSize: 15 }}>Create Free Account</button></Link>
      </div>
    </div>
  );
}
