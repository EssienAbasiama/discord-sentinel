const { spawn } = require("child_process");
const child = spawn("cloudflared", ["tunnel", "--url", "http://localhost:3001"], { stdio: "inherit" });
child.on("exit", (code) => process.exit(code));