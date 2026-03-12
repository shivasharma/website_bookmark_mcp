import React from "react";
import { IconBell, IconBookmark, IconClock, IconReadLater, IconSettings, IconShield, IconStar } from "./icons.js";

// Patch NavLink to support drop for tags/categories
function NavLink({ label, active, onClick, icon, count, onDrop, onDragOver }) {
  return React.createElement(
    "button",
    {
      className: `bm-side-link${active ? " active" : ""}`,
      type: "button",
      onClick,
      onDrop: onDrop,
      onDragOver: onDragOver,
      style: onDrop ? { border: "2px dashed var(--accent)" } : undefined
    },
    icon,
    React.createElement("span", { className: "bm-side-label" }, label),
    count !== undefined && count !== null && React.createElement("span", { className: "bm-side-count" }, count)
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return React.createElement(
    "div",
    { className: `bm-collapsible-section${open ? " open" : ""}` },
    React.createElement(
      "button",
      {
        className: "bm-collapsible-header",
        type: "button",
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open
      },
      React.createElement("span", null, title),
      React.createElement("span", { className: "bm-collapsible-arrow" }, open ? "▾" : "▸")
    ),
    open && React.createElement("div", { className: "bm-collapsible-body" }, children)
  );
}

export function Sidebar({ filter, section, onSectionChange, onFilterChange, total, starred, unreadCount, onBookmarkDrop }) {
  function openBookmarks(nextFilter) {
    onSectionChange("bookmarks");
    onFilterChange(nextFilter);
  }

  // Helper for drop
  function handleDropTag(tag) {
    return (e) => {
      e.preventDefault();
      const bookmarkId = e.dataTransfer.getData("bookmarkId");
      if (bookmarkId && onBookmarkDrop) {
        onBookmarkDrop(Number(bookmarkId), tag);
      }
    };
  }
  function allowDrop(e) { e.preventDefault(); }

  return React.createElement(
    "aside",
    { className: "bm-sidebar" },
    React.createElement("div", { className: "bm-side-title" }, "Library"),
    React.createElement(CollapsibleSection, {
      title: "Bookmarks",
      defaultOpen: true,
      children: [
        React.createElement(NavLink, {
          key: "all",
          label: "All Bookmarks",
          count: total,
          icon: React.createElement(IconBookmark, { className: "bm-icon" }),
          active: section === "bookmarks" && filter === "all",
          onClick: () => openBookmarks("all")
        }),
        React.createElement(NavLink, {
          key: "starred",
          label: "Starred",
          count: starred,
          icon: React.createElement(IconStar, { className: "bm-icon" }),
          active: section === "bookmarks" && filter === "starred",
          onClick: () => openBookmarks("starred")
        }),
        React.createElement(NavLink, {
          key: "recent",
          label: "Recent",
          icon: React.createElement(IconClock, { className: "bm-icon" }),
          active: section === "bookmarks" && filter === "recent",
          onClick: () => openBookmarks("recent")
        }),
        React.createElement(NavLink, {
          key: "unread",
          label: "Read Later",
          icon: React.createElement(IconReadLater, { className: "bm-icon" }),
          active: section === "bookmarks" && filter === "unread",
          onClick: () => openBookmarks("unread")
        })
      ]
    }),
    React.createElement(CollapsibleSection, {
      title: "Tools",
      defaultOpen: false,
      children: [
        React.createElement(NavLink, {
          key: "notifications",
          label: "Notifications",
          count: unreadCount,
          icon: React.createElement(IconBell, { className: "bm-icon" }),
          active: section === "notifications",
          onClick: () => onSectionChange("notifications")
        }),
        React.createElement(NavLink, {
          key: "syshealth",
          label: "System Health",
          icon: React.createElement(IconShield, { className: "bm-icon" }),
          active: section === "syshealth",
          onClick: () => onSectionChange("syshealth")
        }),
        React.createElement(NavLink, {
          key: "mcp",
          label: "MCP Setup",
          icon: React.createElement(IconSettings, { className: "bm-icon" }),
          active: section === "mcp",
          onClick: () => onSectionChange("mcp")
        })
      ]
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
