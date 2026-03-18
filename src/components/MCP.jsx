import React, { useState, useEffect, useRef } from "react";
import { Copy, Check, Cpu, RefreshCw, ShieldCheck, Code2, Chrome, Zap, Bot, Code, Info, Activity } from "lucide-react";
// Fetch notifications (activity log) for the current user
async function fetchActivityLog(limit = 20) {
  const res = await fetch("/api/notifications?limit=" + limit, { credentials: "include" });
  const json = await res.json();
  return json.success ? json.data?.items || [] : [];
}
function ActivityLog() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const items = await fetchActivityLog(20);
      if (mounted) setLog(items);
      setLoading(false);
    }
    load();
    intervalRef.current = setInterval(load, 5000); // Poll every 5s
    return () => {
      mounted = false;
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 max-w-2xl w-full mx-auto mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-accent" />
        <span className="font-semibold text-text-primary text-base">MCP Activity Log</span>
      </div>
      {loading ? (
        <div className="text-xs text-text-muted py-6">Loading activity…</div>
      ) : log.length === 0 ? (
        <div className="text-xs text-text-muted py-6">No recent MCP activity.</div>
      ) : (
        <ul className="divide-y divide-border text-xs">
          {log.map((item) => (
            <li key={item.id} className="py-2 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${item.source === "mcp" ? "bg-accent" : "bg-border"}`} />
              <span className="flex-1">
                {item.text}
                <span className="ml-2 text-[10px] text-text-muted">{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const CONFIG_TEMPLATE = (token) => ({
  mcpServers: {
    linksync: {
      command: "npx",
      args: ["-y", "linksync-mcp"],
      env: {
        LINKSYNC_TOKEN: token || "<your-token-here>",
      },
    },
  },
});

function StepCard({ number, title, children }) {
  return (
    <section className="bg-gradient-to-br from-card to-card-hover border border-border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-accent bg-accent/10 border border-accent/25 px-2 py-0.5 rounded-md tracking-widest">
          {number}
        </span>
        <h3 className="text-text-primary font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard denied */
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:border-border-light hover:text-text-primary text-text-secondary transition-all font-medium"
    >
      {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function MCP() {
  const [session, setSession] = useState(null); // null=loading, false=none, object=user
  const [token, setToken] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showMcpInfo, setShowMcpInfo] = useState(false);
  // Example agent connection state (stubbed)
  const [agents, setAgents] = useState([
    { key: "browser",   name: "Browser Extension", icon: Chrome, connected: false },
    { key: "claude",    name: "Claude AI",         icon: Bot,    connected: true },
    { key: "vscode",    name: "VS Code",           icon: Code,   connected: false },
    { key: "zapier",    name: "Zapier",            icon: Zap,    connected: false },
  ]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const json = await res.json();
        setSession(json.success ? json.data : false);
      } catch {
        setSession(false);
      }
    })();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/token", { method: "POST", credentials: "include" });
      const json = await res.json();
      if (json.success) {
        setToken(json.token);
      } else {
        setToken("ERROR: " + (json.message || "Failed to generate token"));
      }
    } catch {
      // Simulate token for dev/offline
      setToken("ls_" + crypto.randomUUID().replace(/-/g, "").slice(0, 32));
    } finally {
      setGenerating(false);
    }
  };

  const configJson = JSON.stringify(CONFIG_TEMPLATE(token), null, 2);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with info tooltip */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center shrink-0">
          <Cpu size={20} className="text-accent" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            MCP Integration Hub
            <button
              className="ml-1 text-accent/80 hover:text-accent"
              onClick={() => setShowMcpInfo((v) => !v)}
              title="What is MCP?"
            >
              <Info size={18} />
            </button>
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            Connect AI agents and automate your bookmarks with Model Context Protocol.
          </p>
        </div>
      </div>
      {showMcpInfo && (
        <div className="bg-card border border-accent/30 rounded-xl p-4 max-w-2xl text-sm text-text-secondary relative">
          <button className="absolute top-2 right-2 text-accent/60 hover:text-accent" onClick={() => setShowMcpInfo(false)}><X size={16} /></button>
          <strong>What is MCP?</strong> MCP (Model Context Protocol) lets you securely connect apps and AI agents (like Claude, VS Code, Zapier, or browser extensions) to your LinkSync library. This enables automations like saving links from conversations, syncing highlights, or triggering workflows. <a href="https://modelcontext.org/quickstart" target="_blank" rel="noopener noreferrer" className="text-accent underline ml-1">Quick-start guide →</a>
        </div>
      )}

      {/* Agent cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {agents.map((agent) => (
          <div key={agent.key} className="bg-gradient-to-br from-card to-card-hover border border-border rounded-2xl p-5 flex flex-col gap-3 items-center shadow-card">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-2">
              <agent.icon size={28} className="text-accent" />
            </div>
            <div className="text-base font-semibold text-text-primary mb-1">{agent.name}</div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${agent.connected ? "bg-success" : "bg-border"}`} />
              <span className={`text-xs ${agent.connected ? "text-success" : "text-text-muted"}`}>{agent.connected ? "Connected" : "Not connected"}</span>
            </div>
            <button
              className={`w-full px-3 py-2 rounded-lg text-xs font-medium border transition-all ${agent.connected ? "bg-success/10 border-success text-success hover:bg-success/20" : "bg-card border-border text-text-secondary hover:border-accent/40"}`}
              disabled={agent.key === "claude"}
            >
              {agent.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>

      {/* Activity Log */}
      <ActivityLog />

      {/* Automation Rules (UI only) */}
      <div className="bg-card border border-border rounded-2xl p-4 max-w-2xl w-full mx-auto mt-8">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-accent" />
          <span className="font-semibold text-text-primary text-base">MCP Automation Rules</span>
        </div>
        <div className="text-xs text-text-muted mb-3">
          Create automations for your agents. Example: <span className="text-text-primary font-semibold">When any MCP agent saves a link tagged 'research', automatically add it to my 'PhD Reading' collection and set a reminder for Friday.</span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="text" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs" placeholder="When agent… (e.g. saves a link tagged 'research')" disabled />
            <span className="text-text-muted">→</span>
            <input type="text" className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs" placeholder="Do this… (e.g. add to 'PhD Reading', set reminder)" disabled />
            <button className="px-3 py-2 rounded-lg bg-accent text-white text-xs font-medium ml-2 opacity-60 cursor-not-allowed" disabled>Add Rule</button>
          </div>
          <div className="text-[11px] text-text-muted italic">(Automation rules coming soon. Let us know what you'd like to automate!)</div>
        </div>
      </div>
      {/* (Keep the original steps and info banner below for now) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        {/* Step 01 — Check Session */}
        <StepCard number="01" title="Check Session">
          <p className="text-text-muted text-xs leading-relaxed">
            Sign in first so token generation and MCP access are enabled for your account.
          </p>
          <div className="mt-1">
            {session === null && (
              <div className="flex items-center gap-2 text-text-muted text-xs">
                <RefreshCw size={13} className="animate-spin" />
                Checking session…
              </div>
            )}
            {session === false && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error" />
                <span className="text-xs text-error font-medium">Not logged in</span>
                <a
                  href="/login"
                  className="text-xs text-accent underline underline-offset-2 ml-1"
                >
                  Sign in →
                </a>
              </div>
            )}
            {session && (
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-success" />
                <span className="text-xs text-success font-medium">
                  Logged in as {session.name}
                  {session.email ? ` (${session.email})` : ""}
                </span>
              </div>
            )}
          </div>
        </StepCard>
        {/* Step 02 — Generate Token */}
        <StepCard number="02" title="Generate Token">
          <p className="text-text-muted text-xs leading-relaxed">
            Create a secure API token for MCP clients and copy it when ready.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-accent2 text-white font-semibold hover:shadow-glow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {generating && <RefreshCw size={12} className="animate-spin" />}
              {generating ? "Generating…" : "Generate Token"}
            </button>
            {token && !token.startsWith("ERROR") && (
              <CopyButton text={token} label="Copy Token" />
            )}
          </div>
          {token && (
            <pre className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px] text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {token}
            </pre>
          )}
          {!token && (
            <p className="text-text-muted text-[11px] italic">Token not generated yet.</p>
          )}
        </StepCard>
        {/* Step 03 — Apply Config */}
        <StepCard number="03" title="Apply Config">
          <p className="text-text-muted text-xs leading-relaxed">
            Paste this JSON in Claude Desktop, Cursor, VS Code, or another MCP-capable client.
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Code2 size={13} />
              <span className="text-[11px]">mcp_config.json</span>
            </div>
            <CopyButton text={configJson} label="Copy Config" />
          </div>
          <pre className="bg-background border border-border rounded-xl px-3 py-2.5 text-[11px] text-text-secondary font-mono overflow-x-auto leading-relaxed">
            {configJson}
          </pre>
        </StepCard>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-accent/5 border border-accent/20 rounded-2xl p-4 mt-8">
        <ShieldCheck size={16} className="text-accent shrink-0 mt-0.5" />
        <p className="text-text-secondary text-xs leading-relaxed">
          Tokens are scoped to your account and can be revoked at any time from your settings.
          Never share your token publicly — treat it like a password.
        </p>
      </div>
    </div>
  );
}
export default MCP;
