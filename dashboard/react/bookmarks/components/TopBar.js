import React from "react";
import { IconBell, IconBookmark, IconMcp } from "./icons.js";

function IconAIChat(props = {}) {
  return React.createElement(
    "svg",
    { ...{
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.8,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": true,
      focusable: false,
      ...props
    } },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("path", { d: "M8 15c1.5-2 6.5-2 8 0" }),
    React.createElement("circle", { cx: 9, cy: 10, r: 1 }),
    React.createElement("circle", { cx: 15, cy: 10, r: 1 })
  );
}

export function TopBar({ onOpenMcp, onOpenNotifications, unreadCount, currentUser, onLogout, onAddBookmark }) {
  const userLabel = currentUser ? currentUser.name || currentUser.email || "User" : "";
  const initial = userLabel ? String(userLabel).charAt(0).toUpperCase() : "U";

  return React.createElement(
    "header",
    { className: "bm-top" },
    React.createElement(
      "div",
      { className: "bm-brand" },
      React.createElement(IconBookmark, { className: "bm-icon" }),
      React.createElement("span", null, "BookMark"),
      React.createElement("em", { style: { color: "var(--accent, #06c0e0)", fontStyle: "normal" } }, "Manager")
    ),
    React.createElement(
      "div",
      { className: "bm-top-actions" },
      React.createElement(
        "button",
        {
          className: "btn primary",
          type: "button",
          style: { fontWeight: 700 },
          onClick: onAddBookmark,
          title: "Add Bookmark"
        },
        React.createElement("span", { style: { fontSize: 18, marginRight: 6 } }, "+"),
        "Add Bookmark"
      ),
      React.createElement(
        "button",
        {
          className: "btn bm-aichat-btn",
          type: "button",
          title: "AI Chat",
          onClick: () => window.location.assign("/chat")
        },
        React.createElement(IconAIChat, { className: "bm-icon" }),
        "AI Chat"
      ),
      React.createElement(
        "button",
        {
          className: "btn bm-bell-btn",
          type: "button",
          onClick: () => {
            if (onOpenNotifications) {
              onOpenNotifications();
            }
          },
          title: unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"
        },
        React.createElement(IconBell, { className: "bm-icon" }),
        "Notifications",
        unreadCount > 0 && React.createElement("span", { className: "bm-bell-badge" }, String(unreadCount > 99 ? "99+" : unreadCount))
      ),
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: () => {
            if (onOpenMcp) {
              onOpenMcp();
              return;
            }
            window.location.assign("/mcp");
          }
        },
        React.createElement(IconMcp, { className: "bm-icon" }),
        "MCP"
      ),
      !currentUser && React.createElement("a", { className: "btn", href: "/register" }, "GitHub Login"),
      !!currentUser && React.createElement("button", { className: "btn", type: "button", onClick: onLogout }, "Logout"),
      !!currentUser && React.createElement("div", { className: "bm-avatar", title: `Logged in as ${userLabel}` }, initial)
    )
  );
}
