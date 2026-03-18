import React, { useState, useEffect, useCallback } from "react";
import { Activity, Clock, Users, Server, RefreshCw, HeartPulse, Database, Cpu, MemoryStick, Zap } from "lucide-react";

const POLL_INTERVAL = 30_000;

function fmt(bytes) {
  if (bytes == null) return "--";
  const mb = bytes / 1024 / 1024;
  return mb < 1024 ? `${mb.toFixed(0)} MB` : `${(mb / 1024).toFixed(1)} GB`;
}

function fmtUptime(sec) {
  if (sec == null) return "--";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// 3-tier status pill system
function StatusPill({ status }) {
  if (status === "healthy") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full bg-success/90 text-white shadow-glow">
        <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
        Healthy
      </span>
    );
  }
  if (status === "degraded") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full bg-warning/90 text-white animate-pulse-slow shadow-glow">
        <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
        Degraded
      </span>
    );
  }
  if (status === "critical") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full bg-error/90 text-white animate-blink shadow-glow">
        <span className="w-2 h-2 rounded-full bg-white/80 animate-blink" />
        Critical
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-3 py-1 rounded-full bg-accent/80 text-white">
      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
      Checking
    </span>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color = "accent" }) {
  const colors = {
    accent: "text-accent bg-accent/10 border-accent/30",
    accent2: "text-accent2 bg-accent2/10 border-accent2/30",
    accent3: "text-accent3 bg-accent3/10 border-accent3/30",
    success: "text-success bg-success/10 border-success/30",
    warning: "text-warning bg-warning/10 border-warning/30",
  };
  return (
    <div className="bg-background rounded-md p-4 border border-border flex flex-col gap-2">
      {Icon && (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${colors[color]}`}>
          <Icon size={14} />
        </div>
      )}
      <div className="text-xs text-text-muted">{label}</div>
      <div className="text-xl font-bold text-text-primary">{value ?? "--"}</div>
      {sub && <div className="text-[10px] text-text-muted">{sub}</div>}
    </div>
  );
}

// Helper to map old status to new pill
function getStatusTier(api, db) {
  if (api?.status === "ok" && db?.status === "ok") return "healthy";
  if (api?.status === "down" || db?.status === "down") return "critical";
  if (api?.status === "degraded" || db?.status === "degraded") return "degraded";
  return "checking";
}

export default function SystemHealth() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/system-health", { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed");
      setData(json.data);
      setLastUpdated(new Date());
      setError("");
      setCountdown(POLL_INTERVAL / 1000);
    } catch (e) {
      setError(e.message || "Could not reach backend");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial + polling
  useEffect(() => {
    fetchHealth();
    const poll = setInterval(fetchHealth, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchHealth]);

  // Countdown ticker
  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : POLL_INTERVAL / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  const api = data?.api;
  const db = data?.database;
  const users = data?.users;
  const sys = data?.system;


  const overallTier = getStatusTier(api, db);

  const commandItems = [
    { label: "Overall", status: overallTier, value: overallTier.charAt(0).toUpperCase() + overallTier.slice(1) },
    { label: "API", status: api?.status ?? "checking", value: api?.status === "ok" ? "Online" : api?.status === "down" ? "Offline" : "Checking" },
    { label: "Database", status: db?.status ?? "checking", value: db?.status === "ok" ? "Online" : db?.status === "down" ? "Offline" : "Checking" },
    { label: "Runtime", status: "ok", value: "Live" },
  ];

  const stateClass = (status) => {
    if (status === "ok") return "bg-gradient-to-br from-card to-card-hover border-success/40 text-success shadow-[0_0_15px_rgba(0,232,122,0.15)]";
    if (status === "down") return "bg-gradient-to-br from-card to-card-hover border-error/40 text-error shadow-[0_0_15px_rgba(255,68,114,0.15)]";
    return "bg-gradient-to-br from-card to-card-hover border-accent/30 text-accent";
  };

  return (
    <div className="space-y-8 pb-8 px-2 md:px-0">
      {/* Fixed Overall Status Banner */}
      <div className={`fixed top-0 left-0 w-full z-40 shadow-card border-b transition-all
        ${overallTier === "healthy" ? "bg-success/10 border-success/20" :
          overallTier === "degraded" ? "bg-warning/10 border-warning/20 animate-pulse-slow" :
          overallTier === "critical" ? "bg-error/10 border-error/20 animate-blink" :
          "bg-accent/10 border-accent/20"}
      `}>
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-4 md:px-8 py-3">
          <HeartPulse className={
            overallTier === "healthy" ? "text-success" :
            overallTier === "degraded" ? "text-warning animate-pulse-slow" :
            overallTier === "critical" ? "text-error animate-blink" :
            "text-accent"
          } size={24} />
          <div className="flex-1">
            <span className="text-lg md:text-2xl font-bold mr-2 align-middle">System Health</span>
            <StatusPill status={overallTier} />
            <span className="ml-3 text-xs text-text-muted hidden sm:inline">Live updates</span>
          </div>
          <span className="text-xs text-text-muted">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""}</span>
        </div>
      </div>
      <div className="h-16 md:h-[60px]" />

      {/* Last Incident Banner */}
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-3 rounded-lg bg-card border border-border flex items-center gap-3 mb-2 shadow-card">
        <span className="text-xs text-text-muted font-medium">
          <span className="font-semibold text-text-primary">Last Incident:</span> No incidents in the last 30 days
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-5xl mx-auto flex items-center gap-3 text-error text-sm bg-error/10 border border-error/20 rounded-lg px-4 py-3 mb-2 shadow-card">
          <span className="flex-1">{error}</span>
          <button onClick={fetchHealth} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-error/30 hover:bg-error/10 transition-all">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Status cards with new pill */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {commandItems.map((item) => (
          <div key={item.label} className={`rounded-lg p-4 border bg-card shadow-card flex flex-col items-center text-center transition-all duration-300 hover:shadow-card-hover ${stateClass(item.status)}`}>
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{item.label}</div>
            <div className="text-xl font-bold mb-1">{item.value}</div>
            <StatusPill status={item.status} />
          </div>
        ))}
      </div>

      {/* Runtime overview */}
      <div className="max-w-5xl mx-auto bg-card rounded-lg border border-border p-6 shadow-card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-accent/10 border border-accent/30">
              <Activity className="text-accent w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Runtime Overview</h2>
          </div>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-background border border-border hover:border-accent hover:text-accent transition-all text-sm text-text-secondary"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="API Latency"
            value={api ? "< 1ms" : "--"}
            sub={api?.nodeVersion}
            icon={Zap}
            color="accent"
          />
          <KpiCard
            label="DB Latency"
            value={db?.latencyMs != null ? `${db.latencyMs} ms` : "--"}
            sub={db?.serverTime ? `Server: ${new Date(db.serverTime).toLocaleTimeString()}` : undefined}
            icon={Database}
            color="accent2"
          />
          <KpiCard
            label="Uptime"
            value={fmtUptime(api?.uptimeSec)}
            sub={api?.pid ? `PID ${api.pid}` : undefined}
            icon={Clock}
            color="success"
          />
          <KpiCard
            label="Heap Used"
            value={fmt(sys?.memory?.heapUsed)}
            sub={sys?.memory?.heapTotal ? `of ${fmt(sys.memory.heapTotal)}` : undefined}
            icon={MemoryStick}
            color="warning"
          />
        </div>

        <p className="text-xs text-text-muted mt-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          Auto-refreshes every {POLL_INTERVAL / 1000}s — next in {countdown}s
          {lastUpdated && ` · Last updated ${lastUpdated.toLocaleTimeString()}`}
        </p>
      </div>

      {/* User activity */}
      <div className="bg-gradient-to-br from-card to-card-hover rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-md bg-accent2/10 border border-accent2/30">
            <Users className="text-accent2 w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">User Activity</h2>
          <span className="text-xs text-text-muted ml-auto">Live snapshot from active sessions</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Total Users" value={users?.totalUsers ?? "--"} icon={Users} color="accent2" />
          <KpiCard label="Live Sessions" value={users?.liveSessions ?? "--"} icon={Activity} color="accent" />
          <KpiCard label="Authenticated" value={users?.authenticatedSessions ?? "--"} icon={HeartPulse} color="success" />
          <KpiCard
            label="Load Avg (1m)"
            value={sys?.loadAvg1 != null ? sys.loadAvg1.toFixed(2) : "--"}
            sub={sys ? `5m: ${sys.loadAvg5?.toFixed(2)}  15m: ${sys.loadAvg15?.toFixed(2)}` : undefined}
            icon={Cpu}
            color="warning"
          />
        </div>
      </div>

      {/* Services */}
      <div className="bg-gradient-to-br from-card to-card-hover rounded-lg border border-border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-md bg-accent3/10 border border-accent3/30">
            <Server className="text-accent3 w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-text-primary">Services</h2>
        </div>

        <div className="space-y-3">
          {[
            {
              name: "Node.js API",
              detail: api?.nodeVersion ?? "–",
              status: api?.status ?? "checking",
              sub: api?.uptimeSec != null ? `Up ${fmtUptime(api.uptimeSec)}` : "–",
              icon: Zap,
            },
            {
              name: "PostgreSQL",
              detail: db?.latencyMs != null ? `${db.latencyMs} ms latency` : "–",
              status: db?.status ?? "checking",
              sub: db?.serverTime ? new Date(db.serverTime).toLocaleString() : "–",
              icon: Database,
            },
            {
              name: "System",
              detail: sys ? `${sys.platform} · ${sys.arch} · ${sys.cpuCount} CPU` : "–",
              status: "ok",
              sub: sys?.memory?.rss ? `RSS ${fmt(sys.memory.rss)}` : "–",
              icon: Server,
            },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center gap-4 bg-background rounded-md px-4 py-3 border border-border">
              <div className="w-8 h-8 rounded-lg bg-card-hover border border-border flex items-center justify-center shrink-0">
                <svc.icon size={15} className="text-text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-text-primary">{svc.name}</div>
                <div className="text-xs text-text-muted truncate">{svc.detail} · {svc.sub}</div>
              </div>
              <StatusPill status={svc.status === "ok" ? "healthy" : svc.status === "down" ? "critical" : svc.status === "degraded" ? "degraded" : "checking"} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
