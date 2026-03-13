import React from "react";
import { IconBell, IconBookmark, IconClock, IconReadLater, IconSettings, IconShield, IconStar, IconMcp } from "./icons.js";

function NavLink({ label, active, onClick, icon, count }) {
  return React.createElement(
    "button",
    {
      className: `bm-side-link${active ? " active" : ""}`,
      type: "button",
      onClick
    },
    icon,
    React.createElement("span", { className: "bm-side-label" }, label),
    count !== undefined && count !== null && React.createElement("span", { className: "bm-side-count" }, count)
  );
}

export function Sidebar({ filter, section, onSectionChange, onFilterChange, total, starred, unreadCount }) {
  function openBookmarks(nextFilter) {
    onSectionChange("bookmarks");
    onFilterChange(nextFilter);
  }

  return React.createElement(
    "aside",
    { className: "bm-sidebar" },
    React.createElement(NavLink, {
      label: "AI Chat",
      icon: React.createElement(IconMcp, { className: "bm-icon" }),
      active: section === "aichat",
      onClick: () => onSectionChange("aichat")
    }),
    React.createElement("div", { className: "bm-side-title" }, "Library"),
    React.createElement(NavLink, {
      label: "All Bookmarks",
      count: total,
      icon: React.createElement(IconBookmark, { className: "bm-icon" }),
      active: section === "bookmarks" && filter === "all",
      onClick: () => openBookmarks("all")
    }),
    React.createElement(NavLink, {
      label: "Starred",
      count: starred,
      icon: React.createElement(IconStar, { className: "bm-icon" }),
      active: section === "bookmarks" && filter === "starred",
      onClick: () => openBookmarks("starred")
    }),
    React.createElement(NavLink, {
      label: "Recent",
      icon: React.createElement(IconClock, { className: "bm-icon" }),
      active: section === "bookmarks" && filter === "recent",
      onClick: () => openBookmarks("recent")
    }),
    React.createElement(NavLink, {
      label: "Read Later",
      icon: React.createElement(IconReadLater, { className: "bm-icon" }),
      active: section === "bookmarks" && filter === "unread",
      onClick: () => openBookmarks("unread")
    }),
    React.createElement(NavLink, {
      label: "Notifications",
      count: unreadCount,
      icon: React.createElement(IconBell, { className: "bm-icon" }),
      active: section === "notifications",
      onClick: () => onSectionChange("notifications")
    }),
    React.createElement("div", { className: "bm-side-divider" }),
    React.createElement(NavLink, {
      label: "System Health",
      icon: React.createElement(IconShield, { className: "bm-icon" }),
      active: section === "syshealth",
      onClick: () => onSectionChange("syshealth")
    }),
    React.createElement(NavLink, {
      label: "MCP Setup",
      icon: React.createElement(IconSettings, { className: "bm-icon" }),
      active: section === "mcp",
      onClick: () => onSectionChange("mcp")
    })
  );
}

export function MobileNav({ section, unreadCount, onSectionChange }) {
  function NavTab({ id, label, icon, count }) {
    return React.createElement(
      "button",
      {
        className: `bm-mobile-tab${section === id ? " active" : ""}`,
        type: "button",
        onClick: () => onSectionChange(id)
      },
      icon,
      React.createElement("span", { className: "bm-mobile-label" }, label),
      count !== undefined && count !== null && count > 0 && React.createElement("span", { className: "bm-mobile-count" }, count > 99 ? "99+" : String(count))
    );
  }

  return React.createElement(
    "nav",
    { className: "bm-mobile-nav", "aria-label": "Primary" },
    React.createElement(NavTab, {
      id: "aichat",
      label: "AI Chat",
      icon: React.createElement(IconMcp, { className: "bm-icon" })
    }),
    React.createElement(NavTab, {
      id: "bookmarks",
      label: "Library",
      icon: React.createElement(IconBookmark, { className: "bm-icon" })
    }),
    React.createElement(NavTab, {
      id: "notifications",
      label: "Alerts",
      icon: React.createElement(IconBell, { className: "bm-icon" }),
      count: unreadCount
    }),
    React.createElement(NavTab, {
      id: "syshealth",
      label: "Health",
      icon: React.createElement(IconShield, { className: "bm-icon" })
    }),
    React.createElement(NavTab, {
      id: "mcp",
      label: "MCP",
      icon: React.createElement(IconSettings, { className: "bm-icon" })
    })
  );
}
