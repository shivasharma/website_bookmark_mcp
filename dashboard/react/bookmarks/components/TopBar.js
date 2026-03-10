import React from "react";
import { IconBell, IconBookmark, IconMcp } from "./icons.js";

export function TopBar({ onOpenMcp, onOpenNotifications, unreadCount, currentUser, onLogout }) {
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
