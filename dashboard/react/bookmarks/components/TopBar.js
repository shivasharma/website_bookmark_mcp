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


export function TopBar({ onOpenNotifications, unreadCount, currentUser, onLogout, onAddBookmark }) {
  const userLabel = currentUser ? currentUser.name || currentUser.email || "User" : "";
  const initial = userLabel ? String(userLabel).charAt(0).toUpperCase() : "U";
  const avatarUrl = currentUser?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userLabel || "User") + "&background=06c0e0&color=fff";

  return React.createElement(
    "header",
    { className: "modern-topbar" },
    React.createElement("div", { className: "topbar-left" },
      React.createElement("span", { className: "topbar-logo" },
        React.createElement(IconBookmark, { className: "bm-icon" }),
        "LinkSync"
      )
    ),
    React.createElement("div", { className: "topbar-center" },
      React.createElement("input", {
        className: "topbar-search",
        type: "text",
        placeholder: "Search bookmarks..."
      })
    ),
    React.createElement("div", { className: "topbar-right" },
      React.createElement(
        "button",
        {
          className: "topbar-bell-btn",
          type: "button",
          onClick: () => {
            if (onOpenNotifications) {
              onOpenNotifications();
            }
          },
          title: unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"
        },
        React.createElement(IconBell, { className: "bm-icon" }),
        unreadCount > 0 && React.createElement("span", { className: "topbar-bell-badge" }, String(unreadCount > 99 ? "99+" : unreadCount))
      ),
      !currentUser && React.createElement("a", { className: "btn", href: "/register" }, "GitHub Login"),
      !!currentUser && React.createElement("button", { className: "btn", type: "button", onClick: onLogout }, "Logout"),
      !!currentUser && React.createElement("div", { className: "bm-avatar", title: `Logged in as ${userLabel}` }, initial)
    )
  );
}
