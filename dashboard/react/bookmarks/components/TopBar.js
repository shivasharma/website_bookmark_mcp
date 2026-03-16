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


export function TopBar({ onOpenNotifications, unreadCount, currentUser, onLogout, onAddBookmark, onOpenAIChat }) {
  const userLabel = currentUser ? currentUser.name || currentUser.email || "User" : "";
  const initial = userLabel ? String(userLabel).charAt(0).toUpperCase() : "U";
  const avatarUrl = currentUser?.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userLabel || "User") + "&background=06c0e0&color=fff";

  // Theme toggle handler
  function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
  }

  return (
    <header className="modern-topbar">
      <div className="topbar-left">
        <span className="topbar-logo">
          <IconBookmark className="bm-icon" />
          LinkSync
        </span>
      </div>
      <div className="topbar-center">
        <input
          className="topbar-search"
          type="text"
          placeholder="Search bookmarks..."
        />
      </div>
      <div className="topbar-right">
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          title="Toggle dark mode"
          style={{ marginRight: 8 }}
        >
          <span role="img" aria-label="Theme">🌓</span>
        </button>
        <button
          className="topbar-bell-btn"
          type="button"
          onClick={() => {
            if (onOpenNotifications) {
              onOpenNotifications();
            }
          }}
          title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <IconBell className="bm-icon" />
          {unreadCount > 0 && (
            <span className="topbar-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>
        <button
          className="topbar-ai-btn"
          type="button"
          onClick={onOpenAIChat}
          title="AI Chat"
          style={{ background: "var(--s4)", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: 6 }}
        >
          <IconAIChat style={{ width: 22, height: 22, color: "var(--accent)" }} />
        </button>
        {!currentUser && (
          <a className="btn" href="/register">GitHub Login</a>
        )}
        {!!currentUser && (
          <button className="btn" type="button" onClick={onLogout}>Logout</button>
        )}
        {!!currentUser && (
          <div className="bm-avatar" title={`Logged in as ${userLabel}`} style={{ marginLeft: 8, width: 40, height: 40, borderRadius: "50%", overflow: "hidden", boxShadow: "0 2px 8px rgba(6,192,224,0.10)", border: "2px solid #e6faff", display: "flex", alignItems: "center", justifyContent: "center", background: "#fff" }}>
            <img src={avatarUrl} alt={userLabel} style={{ width: 36, height: 36, borderRadius: "50%" }} />
          </div>
        )}
      </div>
    </header>
  );
}
