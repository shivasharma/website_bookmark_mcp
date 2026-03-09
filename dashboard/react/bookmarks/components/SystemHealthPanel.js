import React, { useEffect, useMemo, useState } from "react";

const POLL_INTERVAL_MS = 10000;

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const unitValue = bytes / 1024 ** unitIndex;
  return `${unitValue.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatUptime(seconds) {
  const totalSeconds = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function SystemHealthPanel() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState(null);

  const kpis = useMemo(() => {
    if (!snapshot) {
      return [
        ["API", "--"],
        ["Database", "--"],
        ["Uptime", "--"],
        ["Memory", "--"]
      ];
    }

    const apiUp = snapshot.api?.status === "ok";
    const dbUp = snapshot.database?.status === "ok";
    return [
      ["API", apiUp ? "OK" : "Down"],
      ["Database", dbUp ? "OK" : "Down"],
      ["Uptime", formatUptime(snapshot.api?.uptimeSec)],
      ["Memory", formatBytes(snapshot.system?.memory?.rss)]
    ];
  }, [snapshot]);

  async function refreshHealth(signal) {
    setError("");
    try {
      const response = await fetch("/api/system-health", {
        credentials: "include",
        cache: "no-store",
        signal
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || !payload.success || !payload.data) {
        throw new Error("Unable to fetch health data");
      }
      setSnapshot(payload.data);
      setLoading(false);
    } catch (fetchError) {
      if (fetchError && typeof fetchError === "object" && fetchError.name === "AbortError") {
        return;
      }
      setError("Unable to reach real-time health endpoint");
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    refreshHealth(controller.signal);
    const timer = window.setInterval(() => {
      refreshHealth(controller.signal);
    }, POLL_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  const apiStatus = snapshot?.api?.status === "ok" ? "ok" : error ? "down" : "checking";
  const dbStatus = snapshot?.database?.status === "ok" ? "ok" : error ? "down" : "checking";
  const lastUpdated = snapshot?.timestamp ? new Date(snapshot.timestamp).toLocaleTimeString() : "--";

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Runtime Overview"),
      React.createElement(
        "div",
        { className: "kpis" },
        kpis.map(([label, value]) =>
          React.createElement(
            "div",
            { className: "kpi", key: label },
            React.createElement("div", { className: "k" }, label),
            React.createElement("div", { className: "v" }, String(value))
          )
        )
      ),
      React.createElement("p", { className: "sub" }, `Real-time polling every ${Math.floor(POLL_INTERVAL_MS / 1000)}s. Last update: ${lastUpdated}`),
      React.createElement(
        "div",
        { className: "services" },
        [
          {
            id: "api",
            name: "Application API",
            status: apiStatus,
            details: snapshot?.api
              ? `PID ${snapshot.api.pid} • Node ${snapshot.api.nodeVersion} • Uptime ${formatUptime(snapshot.api.uptimeSec)}`
              : "Collecting runtime metrics..."
          },
          {
            id: "database",
            name: "PostgreSQL",
            status: dbStatus,
            details: snapshot?.database
              ? `Latency ${snapshot.database.latencyMs ?? "--"} ms${snapshot.database.serverTime ? ` • DB time ${new Date(snapshot.database.serverTime).toLocaleTimeString()}` : ""}`
              : "Collecting database metrics..."
          },
          {
            id: "host",
            name: "Host Runtime",
            status: "ok",
            details: snapshot?.system
              ? `${snapshot.system.platform}/${snapshot.system.arch} • CPU ${snapshot.system.cpuCount} • Load ${Number(snapshot.system.loadAvg1 || 0).toFixed(2)}`
              : "Collecting host metrics..."
          }
        ].map((service) =>
          React.createElement(
            "article",
            { className: "service", key: service.id },
            React.createElement(
              "div",
              { className: "service-head" },
              React.createElement("h3", { className: "service-name" }, service.name),
              React.createElement("span", { className: `pill ${service.status === "ok" ? "running" : service.status}` }, service.status)
            ),
            React.createElement("div", { className: "meta" }, service.details)
          )
        )
      )
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement(
        "div",
        { className: "bm-panel-head" },
        React.createElement("h2", null, "Service Health"),
        React.createElement(
          "button",
          {
            className: "btn",
            type: "button",
            onClick: () => refreshHealth()
          },
          "Refresh"
        )
      ),
      loading && React.createElement("p", { className: "sub" }, "Loading health telemetry..."),
      apiStatus === "checking" && React.createElement("p", { className: "sub" }, "API status: checking..."),
      apiStatus === "ok" && React.createElement("p", { className: "sub" }, "API status: ", React.createElement("strong", null, "OK")),
      apiStatus === "down" && React.createElement("p", { className: "sub" }, "API status: ", React.createElement("strong", null, "Unavailable")),
      dbStatus === "ok" && React.createElement("p", { className: "sub" }, "Database status: ", React.createElement("strong", null, "OK")),
      dbStatus === "down" && React.createElement("p", { className: "sub" }, "Database status: ", React.createElement("strong", null, "Unavailable")),
      !!error && React.createElement("p", { className: "sub" }, error)
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Deployment Notes"),
      React.createElement("p", { className: "sub" }, "Values are now read from live API and database probes instead of static constants. Extend /api/system-health to include container orchestrator metrics if needed.")
    )
  );
}
