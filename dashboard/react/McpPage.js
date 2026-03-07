import React, { useEffect, useState } from "react";

export function McpPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Token not generated yet.");
  const [statusClass, setStatusClass] = useState("status");

  const callbackUrl = `${window.location.origin}/auth/github/callback`;

  function configText() {
    return JSON.stringify(
      {
        mcpServers: {
          bookmark: {
            command: "npx",
            args: ["-y", "github:shivasharma/website_bookmark_mcp"],
            env: {
              BOOKMARK_API_BASE_URL: window.location.origin,
              BOOKMARK_API_TOKEN: token || "paste-token-here"
            }
          }
        }
      },
      null,
      2
    );
  }

  async function copyText(value) {
    const text = String(value || "").trim();
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.focus();
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      area.remove();
      return ok;
    }
  }

  async function loadCurrentUser() {
    try {
      const response = await fetch("/api/me", { credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || !payload.success) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(payload.data || null);
    } catch {
      setCurrentUser(null);
    }
  }

  async function generateToken() {
    if (!currentUser) {
      setStatusClass("status warn");
      setStatus("Login required before generating token.");
      return;
    }

    setStatusClass("status");
    setStatus("Generating token...");

    try {
      const response = await fetch("/api/mcp-token?expires_in_days=30", { credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || !payload.success || !payload.data || !payload.data.token) {
        throw new Error(payload && payload.error ? payload.error : "Could not generate token.");
      }
      setToken(payload.data.token);
      setStatusClass("status ok");
      setStatus("Token generated.");
    } catch (error) {
      setStatusClass("status danger");
      setStatus(error instanceof Error ? error.message : "Could not generate token.");
    }
  }

  async function copyToken() {
    const ok = await copyText(token);
    setStatusClass(ok ? "status ok" : "status danger");
    setStatus(ok ? "Token copied." : "Unable to copy token.");
  }

  async function copyConfig() {
    const ok = await copyText(configText());
    setStatusClass(ok ? "status ok" : "status danger");
    setStatus(ok ? "Config copied." : "Unable to copy config.");
  }

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const userName = currentUser && (currentUser.name || currentUser.email || "User");

  return React.createElement(
    "div",
    { className: "wrap" },
    React.createElement(
      "div",
      { className: "top" },
      React.createElement(
        "div",
        null,
        React.createElement("h1", { className: "title" }, "MCP Setup"),
        React.createElement("p", { className: "sub" }, "Generate token and copy config for Claude Desktop, Cursor, or VS Code.")
      ),
      React.createElement("a", { className: "btn", href: "/bookmarks" }, "Back to Bookmarks")
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Session"),
      !currentUser && React.createElement("p", { className: "sub" }, "You are not logged in. Login first to generate MCP token."),
      !!currentUser && React.createElement("p", { className: "sub" }, "Logged in as ", React.createElement("strong", null, userName), "."),
      !currentUser && React.createElement("a", { className: "btn", href: "/register" }, "Login / Register")
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Token"),
      React.createElement("p", { className: "sub" }, "Generate a token and use it in MCP config."),
      React.createElement("button", { className: "btn primary", type: "button", onClick: generateToken }, "Generate Token"),
      !!token && React.createElement("button", { className: "btn", type: "button", onClick: copyToken }, "Copy Token"),
      React.createElement("div", { className: statusClass }, status),
      React.createElement("pre", null, token || "Click Generate Token")
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Config Template"),
      React.createElement("button", { className: "btn", type: "button", onClick: copyConfig }, "Copy Config"),
      React.createElement("pre", null, configText())
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "OAuth Callback"),
      React.createElement("p", { className: "sub" }, "GitHub callback should be set to this URL only:"),
      React.createElement("pre", null, callbackUrl)
    )
  );
}
