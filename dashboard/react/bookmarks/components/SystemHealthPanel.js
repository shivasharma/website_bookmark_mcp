import React, { useEffect, useMemo, useState } from "react";

const SERVICES = [
  { id: "5f1e810ed89f", name: "bookmark_certbot", image: "certbot/certbot:latest", status: "restarting", health: "degraded", uptime: "Restarting (2), recent restart" },
  { id: "4c635d674cae", name: "bookmark_app", image: "ghcr.io/shivasharma/website_bookmark_mcp:latest", status: "running", health: "healthy", uptime: "Up 10 minutes (healthy)" },
  { id: "c4ace7c43db3", name: "bookmark_nginx", image: "nginx:alpine", status: "running", health: "healthy", uptime: "Up 10 minutes" },
  { id: "0ecd54eda46f", name: "bookmark_postgres", image: "postgres:16-alpine", status: "running", health: "healthy", uptime: "Up 21 hours (healthy)" }
];

export function SystemHealthPanel() {
  const [apiStatus, setApiStatus] = useState("checking");

  const kpis = useMemo(() => {
    const total = SERVICES.length;
    const running = SERVICES.filter((s) => s.status === "running").length;
    const healthy = SERVICES.filter((s) => s.health === "healthy").length;
    const restarting = SERVICES.filter((s) => s.status === "restarting").length;
    return [
      ["Containers", total],
      ["Running", running],
      ["Healthy", healthy],
      ["Restarting", restarting]
    ];
  }, []);

  async function refreshHealth() {
    setApiStatus("checking");
    try {
      const response = await fetch("/api/health", { credentials: "include" });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload && payload.success) {
        setApiStatus("ok");
        return;
      }
    } catch {}
    setApiStatus("down");
  }

  useEffect(() => {
    refreshHealth();
  }, []);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Docker Overview"),
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
      React.createElement("p", { className: "sub" }, "Clean view enabled: port mappings and startup commands are intentionally hidden."),
      React.createElement(
        "div",
        { className: "services" },
        SERVICES.map((s) =>
          React.createElement(
            "article",
            { className: "service", key: s.id },
            React.createElement(
              "div",
              { className: "service-head" },
              React.createElement("h3", { className: "service-name" }, s.name),
              React.createElement("span", { className: `pill ${s.status}` }, s.status)
            ),
            React.createElement("div", { className: "meta" }, "Container: ", React.createElement("span", { className: "code-inline" }, s.id.slice(0, 12))),
            React.createElement("div", { className: "meta" }, `Image: ${s.image}`),
            React.createElement("div", { className: "meta" }, `State: ${s.uptime}`),
            React.createElement("div", { className: "meta" }, `Health: ${s.health === "healthy" ? "Healthy" : "Needs attention"}`)
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
        React.createElement("button", { className: "btn", type: "button", onClick: refreshHealth }, "Refresh")
      ),
      apiStatus === "checking" && React.createElement("p", { className: "sub" }, "API status: checking..."),
      apiStatus === "ok" && React.createElement("p", { className: "sub" }, "API status: ", React.createElement("strong", null, "OK")),
      apiStatus === "down" && React.createElement("p", { className: "sub" }, "API status: ", React.createElement("strong", null, "Unavailable"))
    ),
    React.createElement(
      "section",
      { className: "card" },
      React.createElement("h2", null, "Deployment Notes"),
      React.createElement("p", { className: "sub" }, "Stack includes Nginx, app service, Postgres, and certbot. This panel is read-only and designed for quick status checks.")
    )
  );
}
