import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "var(--bg-1)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px 24px",
      flex: 1,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: accent || "var(--text)", fontFamily: "var(--font-mono)", letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </div>
    </div>
  );
}

function BotCard({ bot, onStart, onStop, onDelete, onClick }) {
  const isOnline = bot.live_status === "online";
  const [confirming, setConfirming] = useState(false);
  const [acting, setActing] = useState(false);

  const handleToggle = async (e) => {
    e.stopPropagation();
    setActing(true);
    if (isOnline) await onStop(); else await onStart();
    setActing(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); setTimeout(() => setConfirming(false), 3000); return; }
    await onDelete();
  };

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-1)",
        border: `1px solid ${isOnline ? "rgba(52,211,153,0.2)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        padding: 24,
        cursor: "pointer",
        transition: "all 0.2s ease",
        position: "relative",
        overflow: "hidden",
        animation: "fadeUp 0.4s ease both",
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = isOnline ? "rgba(52,211,153,0.5)" : "var(--border-hover)"}
      onMouseOut={e => e.currentTarget.style.borderColor = isOnline ? "rgba(52,211,153,0.2)" : "var(--border)"}
    >
      {/* Online glow */}
      {isOnline && (
        <div style={{
          position: "absolute", top: 0, right: 0, width: 120, height: 120,
          background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      )}

      {/* Status badge */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          borderRadius: 20,
          background: isOnline ? "var(--green-bg)" : "var(--bg-3)",
          border: `1px solid ${isOnline ? "rgba(52,211,153,0.2)" : "var(--border)"}`,
          fontSize: 11,
          fontWeight: 600,
          color: isOnline ? "var(--green)" : "var(--text-3)",
          fontFamily: "var(--font-mono)",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: isOnline ? "var(--green)" : "var(--text-3)",
            animation: isOnline ? "pulse 2s infinite" : "none",
          }} />
          {isOnline ? "ONLINE" : "OFFLINE"}
        </div>

        <button
          onClick={handleDelete}
          style={{
            fontSize: 12, padding: "4px 8px",
            color: confirming ? "var(--red)" : "var(--text-3)",
            fontFamily: "var(--font-mono)",
            borderRadius: 4,
            border: confirming ? "1px solid var(--red)" : "1px solid transparent",
            background: confirming ? "var(--red-bg)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          {confirming ? "confirm?" : "✕"}
        </button>
      </div>

      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, letterSpacing: -0.3 }}>
        {bot.bot_name || "Unnamed Bot"}
      </div>
      <div style={{
        fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)",
        marginBottom: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
      }}>
        notify → {bot.notify_channel_id}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "var(--text-2)" }}>
          Configure servers & keywords →
        </span>
        <button
          onClick={handleToggle}
          disabled={acting}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
            fontWeight: 700,
            background: acting ? "var(--bg-3)" : isOnline ? "var(--red-bg)" : "var(--green-bg)",
            color: acting ? "var(--text-3)" : isOnline ? "var(--red)" : "var(--green)",
            border: `1px solid ${acting ? "var(--border)" : isOnline ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)"}`,
            fontFamily: "var(--font-display)",
            transition: "all 0.15s",
          }}
        >
          {acting ? "..." : isOnline ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
}

// Guided setup modal
function SetupModal({ onClose, onCreated, authFetch }) {
  const [step, setStep] = useState(0);
  const [token, setToken] = useState("");
  const [channelId, setChannelId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = [
    {
      title: "Step 1: Get Your Discord Token",
      icon: "🔑",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.8, fontFamily: "var(--font-mono)" }}>
            Your Discord token allows Sentinel to monitor servers on your behalf.
          </p>
          <div style={{
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", padding: 16, fontSize: 12,
            fontFamily: "var(--font-mono)", color: "var(--text-2)", lineHeight: 2,
          }}>
            <div style={{ color: "var(--accent-2)", fontWeight: 700, marginBottom: 8 }}>HOW TO GET YOUR TOKEN:</div>
            <div>1. Open Discord in your browser (not app)</div>
            <div>2. Press <span style={{ color: "var(--yellow)", background: "var(--yellow-bg)", padding: "1px 6px", borderRadius: 4 }}>F12</span> to open DevTools</div>
            <div>3. Go to <span style={{ color: "var(--accent-2)" }}>Network</span> tab → filter by <span style={{ color: "var(--accent-2)" }}>XHR</span></div>
            <div>4. Send any message in Discord</div>
            <div>5. Click the request → Headers → find <span style={{ color: "var(--green)" }}>Authorization</span></div>
            <div style={{ color: "var(--red)", marginTop: 8 }}>⚠ Never share your token with anyone</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Paste Token
            </label>
            <input
              type="password"
              value={token}
              onChange={e => setToken(e.target.value)}
              placeholder="your-discord-token"
              style={{
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "12px 14px",
                color: "var(--text)", fontSize: 14, outline: "none",
                fontFamily: "var(--font-mono)",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        </div>
      ),
      canNext: () => token.length > 20,
    },
    {
      title: "Step 2: Set Notification Channel",
      icon: "📡",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.8, fontFamily: "var(--font-mono)" }}>
            Choose a private Discord channel where Sentinel will send keyword match alerts.
          </p>
          <div style={{
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", padding: 16, fontSize: 12,
            fontFamily: "var(--font-mono)", color: "var(--text-2)", lineHeight: 2,
          }}>
            <div style={{ color: "var(--accent-2)", fontWeight: 700, marginBottom: 8 }}>HOW TO GET CHANNEL ID:</div>
            <div>1. Open Discord Settings → Advanced</div>
            <div>2. Enable <span style={{ color: "var(--yellow)", background: "var(--yellow-bg)", padding: "1px 6px", borderRadius: 4 }}>Developer Mode</span></div>
            <div>3. Right-click your private channel</div>
            <div>4. Click <span style={{ color: "var(--green)" }}>Copy Channel ID</span></div>
            <div style={{ marginTop: 8, color: "var(--accent-2)" }}>
              💡 Create a private server just for notifications
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Channel ID
            </label>
            <input
              value={channelId}
              onChange={e => setChannelId(e.target.value)}
              placeholder="1234567890123456789"
              style={{
                background: "var(--bg-2)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", padding: "12px 14px",
                color: "var(--text)", fontSize: 14, outline: "none",
                fontFamily: "var(--font-mono)",
              }}
              onFocus={e => e.target.style.borderColor = "var(--accent)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>
        </div>
      ),
      canNext: () => /^\d{17,20}$/.test(channelId),
    },
    {
      title: "Step 3: Review & Launch",
      icon: "🚀",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.8, fontFamily: "var(--font-mono)" }}>
            Your bot is ready. After saving, go to the bot detail page to add servers and keywords to monitor.
          </p>
          <div style={{
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)", padding: 16,
          }}>
            {[
              { label: "Token", value: token ? `${token.slice(0, 8)}••••••••••••` : "—" },
              { label: "Notify Channel", value: channelId || "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", borderBottom: "1px solid var(--border)",
                fontSize: 13,
              }}>
                <span style={{ color: "var(--text-2)" }}>{label}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-2)" }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{
            padding: "12px 14px",
            background: "var(--green-bg)",
            border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: "var(--radius-sm)",
            fontSize: 12, color: "var(--green)",
            fontFamily: "var(--font-mono)", lineHeight: 1.7,
          }}>
            ✓ After saving, add servers to monitor from the bot detail page<br />
            ✓ Then start the bot to go live
          </div>
          {error && (
            <div style={{
              padding: "10px 14px",
              background: "var(--red-bg)", border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: "var(--radius-sm)", fontSize: 12,
              color: "var(--red)", fontFamily: "var(--font-mono)",
            }}>✕ {error}</div>
          )}
        </div>
      ),
      canNext: () => true,
    },
  ];

  const isLast = step === steps.length - 1;

  const handleNext = async () => {
    if (!isLast) { setStep(s => s + 1); return; }

    setLoading(true);
    setError("");
    try {
      const res = await authFetch("/api/bots", {
        method: "POST",
        body: JSON.stringify({ discord_token: token, notify_channel_id: channelId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      onCreated();
    } catch {
      setError("Failed to create bot. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 24,
      backdropFilter: "blur(4px)",
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "var(--bg-1)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        width: "100%", maxWidth: 520,
        animation: "fadeUp 0.3s ease both",
        overflow: "hidden",
      }}>
        {/* Progress bar */}
        <div style={{
          height: 3, background: "var(--bg-3)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0,
            height: "100%",
            width: `${((step + 1) / steps.length) * 100}%`,
            background: "linear-gradient(90deg, var(--accent), #8b5cf6)",
            transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ padding: 32 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{steps[step].icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
                {steps[step].title}
              </h3>
            </div>
            <div style={{
              fontSize: 11, fontFamily: "var(--font-mono)",
              color: "var(--text-3)",
              padding: "4px 10px",
              background: "var(--bg-3)",
              borderRadius: 20,
              border: "1px solid var(--border)",
            }}>
              {step + 1} / {steps.length}
            </div>
          </div>

          {steps[step].content}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  padding: "12px 20px",
                  background: "var(--bg-3)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-2)",
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-display)",
                }}
              >← Back</button>
            )}
            <button
              onClick={handleNext}
              disabled={loading || !steps[step].canNext()}
              style={{
                flex: 1,
                padding: "12px 20px",
                background: loading || !steps[step].canNext()
                  ? "var(--bg-3)"
                  : "linear-gradient(135deg, var(--accent), #8b5cf6)",
                color: loading || !steps[step].canNext() ? "var(--text-3)" : "white",
                borderRadius: "var(--radius-sm)",
                fontSize: 13, fontWeight: 700,
                fontFamily: "var(--font-display)",
                cursor: loading || !steps[step].canNext() ? "not-allowed" : "pointer",
                boxShadow: steps[step].canNext() && !loading ? "0 0 20px var(--accent-glow)" : "none",
                transition: "all 0.2s",
              }}
            >
              {loading ? "Saving..." : isLast ? "Create Bot →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [stats, setStats] = useState({ total: 0, keywords: 0, joins: 0, today: 0 });
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [botsRes, statsRes] = await Promise.all([
        authFetch("/api/bots"),
        authFetch("/api/logs/stats"),
      ]);
      setBots(await botsRes.json());
      setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleStart = async (id) => {
    await authFetch(`/api/bots/${id}/start`, { method: "POST" });
    await loadData();
  };

  const handleStop = async (id) => {
    await authFetch(`/api/bots/${id}/stop`, { method: "POST" });
    await loadData();
  };

  const handleDelete = async (id) => {
    await authFetch(`/api/bots/${id}`, { method: "DELETE" });
    await loadData();
  };

  const onlineBots = bots.filter(b => b.live_status === "online").length;

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 36, animation: "fadeUp 0.4s ease both" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1.5, marginBottom: 4 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
          Welcome back, {user?.username} — {onlineBots} bot{onlineBots !== 1 ? "s" : ""} active
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 36, animation: "fadeUp 0.5s ease 0.1s both" }}>
        <StatCard label="Total Events" value={stats.total} />
        <StatCard label="Keyword Hits" value={stats.keywords} accent="var(--accent-2)" />
        <StatCard label="Joins Tracked" value={stats.joins} accent="var(--green)" />
        <StatCard label="Today" value={stats.today} accent="var(--yellow)" />
      </div>

      {/* Bots section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>Your Bots</h2>
        <button
          onClick={() => setShowSetup(true)}
          style={{
            padding: "10px 20px",
            background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
            color: "white",
            borderRadius: "var(--radius-sm)",
            fontSize: 13, fontWeight: 700,
            fontFamily: "var(--font-display)",
            boxShadow: "0 0 20px var(--accent-glow)",
            transition: "opacity 0.2s",
          }}
          onMouseOver={e => e.currentTarget.style.opacity = "0.85"}
          onMouseOut={e => e.currentTarget.style.opacity = "1"}
        >
          + Add Bot
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 13 }}>
          loading...
        </div>
      ) : bots.length === 0 ? (
        <div style={{
          background: "var(--bg-1)",
          border: "1px dashed var(--border)",
          borderRadius: "var(--radius)",
          padding: 60,
          textAlign: "center",
          animation: "fadeUp 0.5s ease 0.2s both",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⬡</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No bots yet</h3>
          <p style={{ fontSize: 13, color: "var(--text-2)", fontFamily: "var(--font-mono)", marginBottom: 24 }}>
            Add your first bot to start monitoring Discord servers
          </p>
          <button
            onClick={() => setShowSetup(true)}
            style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
              color: "white",
              borderRadius: "var(--radius-sm)",
              fontSize: 14, fontWeight: 700,
              fontFamily: "var(--font-display)",
              boxShadow: "0 0 30px var(--accent-glow)",
            }}
          >
            Set Up Your First Bot →
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {bots.map((bot, i) => (
            <div key={bot.id} style={{ animationDelay: `${i * 0.05}s` }}>
              <BotCard
                bot={bot}
                onStart={() => handleStart(bot.id)}
                onStop={() => handleStop(bot.id)}
                onDelete={() => handleDelete(bot.id)}
                onClick={() => navigate(`/bot/${bot.id}`)}
              />
            </div>
          ))}
        </div>
      )}

      {showSetup && (
        <SetupModal
          onClose={() => setShowSetup(false)}
          onCreated={() => { setShowSetup(false); loadData(); }}
          authFetch={authFetch}
        />
      )}
    </div>
  );
}
