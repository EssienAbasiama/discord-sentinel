// Cloudflared wrapper for PM2.
//
// Runs a NAMED tunnel so the public URL is permanent and survives restarts.
// One-time setup (see README): `cloudflared tunnel login`,
// `cloudflared tunnel create <name>`, `cloudflared tunnel route dns <name> <host>`,
// then create ~/.cloudflared/config.yml pointing the hostname at localhost:3001.
//
// The tunnel name defaults to "watchcord" and can be overridden with the
// TUNNEL_NAME env var. cloudflared reads credentials + ingress from config.yml.
const { spawn } = require("child_process");

const tunnelName = process.env.TUNNEL_NAME || "watchcord";

const child = spawn("cloudflared", ["tunnel", "run", tunnelName], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code));
