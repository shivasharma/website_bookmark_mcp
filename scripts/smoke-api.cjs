const { spawn } = require("child_process");
const http = require("http");

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/bookmark_mcp",
  ALLOW_LOCAL_FALLBACK: process.env.ALLOW_LOCAL_FALLBACK || "true",
  SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE || "false",
  PORT: process.env.SMOKE_API_PORT || "3301",
};

const child = spawn(process.execPath, ["dist/api.js"], {
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
  http
    .get(`http://localhost:${env.PORT}/api/health`, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk.toString();
      });
      res.on("end", () => {
        shutdown(0, `STATUS=${res.statusCode} BODY=${body}`);
      });
    })
    .on("error", (error) => {
      shutdown(1, `HEALTH_ERR=${error.message}`);
    });
}, 3500);

setTimeout(() => {
  shutdown(1, "TIMEOUT waiting for API health");
}, 15000);
