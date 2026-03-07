import React from "react";

function NavLink({ label, active, onClick }) {
  return React.createElement(
    "button",
    {
      className: `bm-side-link${active ? " active" : ""}`,
      type: "button",
      onClick
    },
    label
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
    React.createElement(NavLink, { label: `All Bookmarks (${total})`, active: section === "bookmarks" && filter === "all", onClick: () => openBookmarks("all") }),
    React.createElement(NavLink, { label: `Starred (${starred})`, active: section === "bookmarks" && filter === "starred", onClick: () => openBookmarks("starred") }),
    React.createElement(NavLink, { label: "Recent", active: section === "bookmarks" && filter === "recent", onClick: () => openBookmarks("recent") }),
    React.createElement(NavLink, { label: "Read Later", active: section === "bookmarks" && filter === "unread", onClick: () => openBookmarks("unread") }),
    React.createElement("div", { className: "bm-side-divider" }),
    React.createElement(NavLink, { label: "System Health", active: section === "syshealth", onClick: () => onSectionChange("syshealth") }),
    React.createElement(NavLink, { label: "MCP Setup", active: section === "mcp", onClick: () => onSectionChange("mcp") })
  );
}
