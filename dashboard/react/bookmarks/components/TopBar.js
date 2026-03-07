import React from "react";

export function TopBar({ search, onSearchChange, onAddClick, onOpenMcp, currentUser, onLogout }) {
  const userLabel = currentUser ? currentUser.name || currentUser.email || "User" : "";
  const initial = userLabel ? String(userLabel).charAt(0).toUpperCase() : "U";

  return React.createElement(
    "header",
    { className: "bm-top" },
    React.createElement("div", { className: "bm-brand" }, "Markd"),
    React.createElement(
      "div",
      { className: "bm-search" },
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
        "MCP"
      ),
      React.createElement(
        "button",
        {
          className: "btn primary",
          type: "button",
          onClick: onAddClick
        },
        "Add Bookmark"
      ),
      !currentUser && React.createElement("a", { className: "btn", href: "/register" }, "GitHub Login"),
      !!currentUser && React.createElement("button", { className: "btn", type: "button", onClick: onLogout }, "Logout"),
      !!currentUser && React.createElement("div", { className: "bm-avatar", title: `Logged in as ${userLabel}` }, initial)
    )
  );
}
