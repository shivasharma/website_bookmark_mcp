import React from "react";
import { IconBell, IconBookmark, IconClock, IconReadLater, IconSettings, IconShield, IconStar } from "./icons.js";

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

// Patch NavLink (category support removed, if any)
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
    return (
      <aside className="bm-sidebar sidebar-two-col">
        <div className="sidebar-col">
          <div className="bm-side-title">Library</div>
          <NavLink
            label="All Bookmarks"
            count={total}
            icon={<IconBookmark className="bm-icon" />}
            active={section === "bookmarks" && filter === "all"}
            onClick={() => openBookmarks("all")}
          />
          <NavLink
            label="Starred"
            count={starred}
            icon={<IconStar className="bm-icon" />}
            active={section === "bookmarks" && filter === "starred"}
            onClick={() => openBookmarks("starred")}
          />
          <NavLink
            label="Recent"
            icon={<IconClock className="bm-icon" />}
            active={section === "bookmarks" && filter === "recent"}
            onClick={() => openBookmarks("recent")}
          />
          <NavLink
            label="Remind Me Later"
            icon={<IconReadLater className="bm-icon" />}
            active={section === "bookmarks" && filter === "unread"}
            onClick={() => openBookmarks("unread")}
          />
        </div>
        <div className="sidebar-col">
          <div className="bm-side-title">Tools</div>
          <NavLink
            label="System Health"
            icon={<IconShield className="bm-icon" />}
            active={section === "syshealth"}
            onClick={() => onSectionChange("syshealth")}
          />
          <NavLink
            label="MCP Setup"
            icon={<IconSettings className="bm-icon" />}
            active={section === "mcp"}
            onClick={() => onSectionChange("mcp")}
          />
          <NavLink
            label="Bookmark Chat"
            icon={<IconAIChat className="bm-icon" />}
            active={section === "aichat"}
            onClick={() => onSectionChange("aichat")}
          />
          <NavLink
            label="Notifications"
            count={unreadCount}
            icon={<IconBell className="bm-icon" />}
            active={section === "notifications"}
            onClick={() => onSectionChange("notifications")}
          />
          <NavLink
            label="Share"
            icon={<span className="bm-icon">&#x1F517;</span>}
            active={section === "share"}
            onClick={() => onSectionChange("share")}
          />
        </div>
      </aside>
    );
  }
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
      icon: React.createElement(IconAIChat, { className: "bm-icon" })
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
