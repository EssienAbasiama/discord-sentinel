import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import BotDetail from "./pages/BotDetail";
import LogsPage from "./pages/LogsPage";
import Layout from "./components/Layout";
import "./index.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/auth" replace />;
}

function LoadingScreen() {
  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)",
      flexDirection: "column", gap: "20px"
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "2px solid var(--border)",
        borderTop: "2px solid var(--accent)",
        animation: "spinRing 0.8s linear infinite"
      }} />
      <span style={{ color: "var(--text-2)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
        initializing...
      </span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="bot/:id" element={<BotDetail />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
