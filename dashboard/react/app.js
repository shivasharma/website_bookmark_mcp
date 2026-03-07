import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { baseCss } from "./styles.js";
import { SysHealthPage } from "./SysHealthPage.js";
import { McpPage } from "./McpPage.js";

function RouteTabs() {
  return React.createElement(
    "div",
    { className: "route-tabs wrap", style: { paddingBottom: 0, marginBottom: 0 } },
    React.createElement(
      NavLink,
      {
        to: "/syshealth",
        className: ({ isActive }) => `route-tab${isActive ? " active" : ""}`
      },
      "System Health"
    ),
    React.createElement(
      NavLink,
      {
        to: "/mcp",
        className: ({ isActive }) => `route-tab${isActive ? " active" : ""}`
      },
      "MCP Setup"
    )
  );
}

function App() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement("style", null, baseCss),
    React.createElement(RouteTabs),
    React.createElement(
      Routes,
      null,
      React.createElement(Route, { path: "/syshealth", element: React.createElement(SysHealthPage) }),
      React.createElement(Route, { path: "/mcp", element: React.createElement(McpPage) }),
      React.createElement(Route, { path: "*", element: React.createElement(Navigate, { to: "/syshealth", replace: true }) })
    )
  );
}

const rootNode = document.getElementById("root");
const root = createRoot(rootNode);
root.render(React.createElement(BrowserRouter, null, React.createElement(App)));
