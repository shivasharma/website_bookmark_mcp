import React from "react";
import { IconBookmark, IconMcp, IconPlus, IconSearch } from "./icons.js";

export function TopBar({ search, onSearchChange, onAddClick, onOpenMcp, currentUser, onLogout }) {
  const userLabel = currentUser ? currentUser.name || currentUser.email || "User" : "";
  const initial = userLabel ? String(userLabel).charAt(0).toUpperCase() : "U";

  return React.createElement(
    "header",
    { className: "bm-top" },
    React.createElement(
      "div",
      { className: "bm-brand" },
      React.createElement(IconBookmark, { className: "bm-icon" }),
      React.createElement("span", null, "Markd")
    ),
    React.createElement(
      "div",
      { className: "bm-search" },
      React.createElement(IconSearch, { className: "bm-icon bm-search-icon" }),
      React.createElement("input", {
        value: search,
        onChange: (event) => onSearchChange(event.target.value),
        placeholder: "Search bookmarks..."
      })
    ),
    React.createElement(
      "div",
      { className: "bm-top-actions" },
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
      React.createElement(
        "button",
        {
          className: "btn primary",
          type: "button",
          onClick: onAddClick
        },
        React.createElement(IconPlus, { className: "bm-icon" }),
        "Add Bookmark"
      ),
      !currentUser && React.createElement("a", { className: "btn", href: "/register" }, "GitHub Login"),
      !!currentUser && React.createElement("button", { className: "btn", type: "button", onClick: onLogout }, "Logout"),
      !!currentUser && React.createElement("div", { className: "bm-avatar", title: `Logged in as ${userLabel}` }, initial)
    )
  );
}
