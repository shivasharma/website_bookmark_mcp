const { spawn } = require("child_process");

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/bookmark_mcp",
};

const child = spawn(process.execPath, ["dist/mcp/index.js"], {
  cwd: process.cwd(),
  env,
});

let stdout = "";
let stderr = "";
child.stdout.on("data", (chunk) => {
  stdout += chunk.toString();
});
child.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

function shutdown(exitCode, message) {
  try {
    child.kill("SIGTERM");
  } catch {
    // Ignore kill errors on process shutdown
  }
  setTimeout(() => {
    process.stdout.write(`${message}\n`);
    if (stdout.trim()) {
      process.stdout.write(`STDOUT\n${stdout.trim()}\n`);
    }
    if (stderr.trim()) {
      process.stdout.write(`STDERR\n${stderr.trim()}\n`);
    }
    process.exit(exitCode);
  }, 500);
}

setTimeout(() => {
  if (stderr.includes("Bookmark MCP Server running on stdio")) {
    shutdown(0, "MCP_STARTUP_OK");
    return;
  }
  shutdown(1, "MCP_STARTUP_ERR=missing startup marker");
}, 3500);

setTimeout(() => {
  shutdown(1, "TIMEOUT waiting for MCP startup");
}, 15000);
