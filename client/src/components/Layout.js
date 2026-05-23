import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", icon: "⬡", exact: true },
  { to: "/logs", label: "Activity Logs", icon: "◈" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{
          padding: collapsed ? "20px 0" : "20px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, flexShrink: 0,
            boxShadow: "0 0 20px var(--accent-glow)",
          }}>⬡</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: "var(--text)" }}>
                Sentinel
              </div>
              <div style={{ fontSize: 10, color: "var(--accent-2)", fontFamily: "var(--font-mono)", marginTop: 1 }}>
                v2.0 DASHBOARD
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: collapsed ? "12px 0" : "12px 20px",
                justifyContent: collapsed ? "center" : "flex-start",
                fontSize: 14,
                fontWeight: 600,
                color: isActive ? "var(--accent-2)" : "var(--text-2)",
                background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
                borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                transition: "all 0.15s ease",
                textDecoration: "none",
              })}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            padding: "12px",
            color: "var(--text-3)",
            fontSize: 18,
            display: "flex",
            justifyContent: "center",
            borderTop: "1px solid var(--border)",
            transition: "color 0.15s",
          }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* User */}
        <div style={{
          padding: collapsed ? "16px 0" : "16px 20px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, var(--accent), #ec4899)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, truncate: true, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.username}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  padding: 0,
                  fontFamily: "var(--font-mono)",
                  transition: "color 0.15s",
                }}
                onMouseOver={e => e.target.style.color = "var(--red)"}
                onMouseOut={e => e.target.style.color = "var(--text-3)"}
              >
                sign out →
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: "auto",
        background: "var(--bg)",
        position: "relative",
      }}>
        {/* Noise texture overlay */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          backgroundSize: "128px",
        }} />
        <div style={{ position: "relative", zIndex: 1, minHeight: "100%" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
