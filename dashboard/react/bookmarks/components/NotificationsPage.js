import React from "react";

export function NotificationsPage({ items, unreadCount, onMarkAllRead, onMarkRead, onClearAll }) {
  return React.createElement(
    "section",
    { className: "card" },
    React.createElement(
      "div",
      { className: "bm-panel-head" },
      React.createElement("h2", null, "Notifications"),
      React.createElement(
        "div",
        null,
        React.createElement(
          "button",
          {
            className: "btn",
            type: "button",
            onClick: onMarkAllRead,
            disabled: unreadCount <= 0
          },
          unreadCount > 0 ? `Mark all read (${unreadCount})` : "All caught up"
        ),
        React.createElement(
          "button",
          {
            className: "btn",
            type: "button",
            onClick: onClearAll,
            disabled: items.length <= 0
          },
          "Clear all"
        )
      )
    ),
    items.length === 0 && React.createElement("p", { className: "sub" }, "No notifications yet. Events from MCP/Portal/Server will appear here in real time."),
    items.length > 0 &&
      React.createElement(
        "div",
        { className: "bm-notification-list" },
        ...items.map((item) =>
          React.createElement(
            "article",
            {
              className: `bm-notification-item${item.read ? " is-read" : ""}`,
              key: item.id
            },
            React.createElement(
              "div",
              { className: "bm-notification-head" },
              React.createElement("span", { className: `bm-activity-source bm-source-${String(item.source || "portal").toLowerCase()}` }, item.source),
              React.createElement("span", { className: `bm-activity-action bm-action-${item.action}` }, item.action),
              React.createElement("span", { className: "bm-activity-time" }, item.at)
            ),
            React.createElement("div", { className: "bm-notification-text" }, item.text),
            !item.read &&
              React.createElement(
                "button",
                {
                  className: "btn",
                  type: "button",
                  onClick: () => onMarkRead(String(item.id))
                },
                "Mark read"
              )
          )
        )
      )
  );
}
