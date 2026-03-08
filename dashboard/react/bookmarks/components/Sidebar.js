import React from "react";
import { IconBookmark, IconClock, IconReadLater, IconSettings, IconShield, IconStar } from "./icons.js";

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

export function Sidebar({ filter, section, onSectionChange, onFilterChange, total, starred }) {
  function openBookmarks(nextFilter) {
    onSectionChange("bookmarks");
    onFilterChange(nextFilter);
  }

  return React.createElement(
    "aside",
    { className: "bm-sidebar" },
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
