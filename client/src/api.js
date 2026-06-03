const BASE = "/api";

function getToken() {
  return localStorage.getItem("wc_token");
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export const api = {
  register: (body) => req("POST", "/auth/register", body),
  login: (body) => req("POST", "/auth/login", body),
  getConfig: () => req("GET", "/config"),
  saveToken: (body) => req("POST", "/config/token", body),
  addServer: (body) => req("POST", "/config/servers", body),
  deleteServer: (id) => req("DELETE", `/config/servers/${id}`),
  addKeyword: (body) => req("POST", "/config/keywords", body),
  deleteKeyword: (id) => req("DELETE", `/config/keywords/${id}`),
  startBot: () => req("POST", "/config/bot/start"),
  stopBot: () => req("POST", "/config/bot/stop"),
  getLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req("GET", `/logs${q ? "?" + q : ""}`);
  },
  clearLogs: () => req("DELETE", "/logs"),

  // ── Super admin ──────────────────────────────────────────────────────────
  adminGetUsers: () => req("GET", "/admin/users"),
  adminUpdateUser: (id, body) => req("PATCH", `/admin/users/${id}`, body),
};
