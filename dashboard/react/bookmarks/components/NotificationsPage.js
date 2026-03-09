import React from "react";

export function NotificationsPage({ items, unreadCount, page = 1, pageSize = 25, total = 0, onPageChange, onMarkAllRead, onMarkRead, onClearAll }) {
  const totalPages = Math.max(1, Math.ceil(Number(total || 0) / Number(pageSize || 25)));
  const canGoPrev = Number(page) > 1;
  const canGoNext = Number(page) < totalPages;

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
    React.createElement(
      "div",
      { className: "bm-panel-head" },
      React.createElement("p", { className: "sub" }, `Showing ${items.length} of ${Number(total || 0)} notifications • Page ${page} of ${totalPages}`),
      React.createElement(
        "div",
        null,
        React.createElement(
          "button",
          {
            className: "btn",
            type: "button",
            onClick: () => onPageChange && onPageChange(Number(page) - 1),
            disabled: !canGoPrev
          },
          "Previous"
        ),
        React.createElement(
          "button",
          {
            className: "btn",
            type: "button",
            onClick: () => onPageChange && onPageChange(Number(page) + 1),
            disabled: !canGoNext
          },
          "Next"
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
