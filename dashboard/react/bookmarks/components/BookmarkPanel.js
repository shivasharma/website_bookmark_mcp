import React from "react";
import { IconEdit, IconGrid, IconList, IconSearch, IconStar, IconStarFilled, IconTrash } from "./icons.js";

function tagClass(tag) {
  const value = String(tag || "").toLowerCase();
  if (value.includes("ai")) return "t1";
  if (value.includes("dev")) return "t2";
  if (value.includes("design")) return "t3";
  if (value.includes("read")) return "t4";
  if (value.includes("tool")) return "t5";
  return "t2";
}

function BookmarkListItem({ bookmark, onOpen, onEdit, onDelete, onToggleFavorite }) {
  const starIcon = bookmark.starred ? React.createElement(IconStarFilled, { className: "bm-icon" }) : React.createElement(IconStar, { className: "bm-icon" });
  return React.createElement(
    "div",
    { className: "bk-preview-card", onClick: () => onOpen(bookmark.url) },
    React.createElement(
      "div",
      { className: "bk-preview-fav" },
      bookmark.faviconUrl
        ? React.createElement("img", { src: bookmark.faviconUrl, alt: "favicon", loading: "lazy" })
        : "🔖"
    ),
    React.createElement(
      "div",
      { className: "bk-preview-body" },
      React.createElement(
        "div",
        { className: "bk-preview-top" },
        React.createElement("span", { className: "bk-preview-title" }, bookmark.title),
        React.createElement("span", { className: "bk-preview-url" }, bookmark.url)
      ),
      bookmark.description && React.createElement(
        "div",
        { className: "bk-preview-excerpt" },
        bookmark.description
      ),
      React.createElement(
        "div",
        { className: "bk-preview-meta" },
        ...(bookmark.tags || []).map((tag, index) =>
          React.createElement("span", { className: `bm-tag ${tagClass(tag)}` , key: `${bookmark.id}-tag-${index}` }, String(tag))
        ),
        React.createElement(
          "span",
          { className: "bk-preview-date" },
          bookmark.timeAgo || bookmark.dateLabel
        )
      )
    ),
    React.createElement(
      "div",
      { className: "bk-preview-actions" },
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: (event) => {
            event.stopPropagation();
            onToggleFavorite(bookmark);
          }
        },
        starIcon
      ),
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: (event) => {
            event.stopPropagation();
            onEdit(bookmark);
          }
        },
        React.createElement(IconEdit, { className: "bm-icon" })
      ),
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: (event) => {
            event.stopPropagation();
            onDelete(bookmark);
          }
        },
        React.createElement(IconTrash, { className: "bm-icon" })
      )
    )
  );
}

function BookmarkGridItem({ bookmark, onOpen, onEdit, onDelete, onToggleFavorite }) {
  const starIcon = bookmark.starred ? React.createElement(IconStarFilled, { className: "bm-icon" }) : React.createElement(IconStar, { className: "bm-icon" });
  return React.createElement(
    "div",
    { className: "bm-grid-item", onClick: () => onOpen(bookmark.url) },
    React.createElement("div", { className: "bm-item-title" }, bookmark.title),
    React.createElement("div", { className: "bm-item-url" }, bookmark.domain || bookmark.url),
    React.createElement(
      "div",
      { className: "bm-tags" },
      ...(bookmark.tags || []).slice(0, 3).map((tag, index) =>
        React.createElement("span", { className: `bm-tag ${tagClass(tag)}`, key: `${bookmark.id}-grid-tag-${index}` }, String(tag))
      )
    ),
    React.createElement(
      "div",
      { className: "bm-grid-actions" },
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: (event) => {
            event.stopPropagation();
            onToggleFavorite(bookmark);
          }
        },
          starIcon,
          bookmark.starred ? "Unstar" : "Star"
      ),
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: (event) => {
            event.stopPropagation();
            onEdit(bookmark);
          }
        },
          React.createElement(IconEdit, { className: "bm-icon" }),
          "Edit"
      ),
      React.createElement(
        "button",
        {
          className: "btn",
          type: "button",
          onClick: (event) => {
            event.stopPropagation();
            onDelete(bookmark);
          }
        },
          React.createElement(IconTrash, { className: "bm-icon" }),
          "Delete"
      )
    )
  );
}

export function BookmarkPanel({
  items,
  view,
  onViewChange,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  hasMore,
  loadingMore,
  loadedCount,
  totalCount,
  onLoadMore,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  authBlocked,
  localFallbackPromptEnabled,
  onLocalFallbackPromptChange,
  onAddClick
}) {
  if (!items.length) {
    if (authBlocked) {
      return React.createElement(
        "div",
        { className: "card" },
        React.createElement("h2", null, "Login Is Blocking Local Data"),
        React.createElement(
          "p",
          { className: "sub" },
          "Use local bookmarks when signed-out access is blocked."
        ),
        React.createElement(
          "label",
          { className: "bm-toggle-row", htmlFor: "local-fallback-toggle" },
          React.createElement("span", { className: "bm-toggle-label" }, "Enable Local Bookmarks Fallback"),
          React.createElement("input", {
            id: "local-fallback-toggle",
            className: "bm-toggle-input",
            type: "checkbox",
            role: "switch",
            checked: !!localFallbackPromptEnabled,
            onChange: (event) => onLocalFallbackPromptChange(!!event.target.checked),
            "aria-label": "Enable Local Bookmarks Fallback"
          })
        ),
        React.createElement(
          "p",
          { className: "sub" },
          localFallbackPromptEnabled
            ? "Fallback request saved for this browser. To fully enable signed-out access, configure the API server with local fallback support and restart it."
            : "Turn this on to remember your fallback preference in this browser."
        ),
        React.createElement(
          "p",
          { className: "sub" },
          "Need help? Ask your admin to enable local fallback support on the API server."
        )
      );
    }

    return React.createElement(
      "div",
      { className: "card" },
      React.createElement("h2", null, "No bookmarks found"),
      React.createElement("p", { className: "sub" }, "Add your first bookmark or change filters."),
      React.createElement("button", { className: "btn primary", type: "button", onClick: onAddClick }, "Add Bookmark")
    );
  }

  return React.createElement(
    "section",
    { className: "card" },
    React.createElement(
      "div",
      { className: "bm-panel-head" },
      React.createElement("h2", null, "Saved Links"),
      React.createElement(
        "div",
        { className: "bm-panel-tools" },
        null,
        React.createElement(
          "button",
          {
            className: `btn${filter === "starred" ? " primary" : ""}`,
            type: "button",
            onClick: () => onFilterChange(filter === "starred" ? "all" : "starred")
          },
          React.createElement(IconStar, { className: "bm-icon" }),
          "Starred"
        ),
        React.createElement(
          "button",
          { className: `btn${view === "list" ? " primary" : ""}`, type: "button", onClick: () => onViewChange("list") },
          React.createElement(IconList, { className: "bm-icon" }),
          "List"
        ),
        React.createElement(
          "button",
          { className: `btn${view === "grid" ? " primary" : ""}`, type: "button", onClick: () => onViewChange("grid") },
          React.createElement(IconGrid, { className: "bm-icon" }),
          "Grid"
        )
      )
    ),
    view === "list"
      ? React.createElement(
          "div",
          { className: "bm-list" },
          ...items.map((bookmark) =>
            React.createElement(BookmarkListItem, {
              key: `list-${bookmark.id}`,
              bookmark,
              onOpen,
              onEdit,
              onDelete,
              onToggleFavorite
            })
          )
        )
      : React.createElement(
          "div",
          { className: "bm-grid" },
          ...items.map((bookmark) =>
            React.createElement(BookmarkGridItem, {
              key: `grid-${bookmark.id}`,
              bookmark,
              onOpen,
              onEdit,
              onDelete,
              onToggleFavorite
            })
          )
        ),
    hasMore &&
      React.createElement(
        "div",
        { style: { marginTop: 12, display: "flex", alignItems: "center", gap: 12 } },
        React.createElement(
          "button",
          {
            className: "btn",
            type: "button",
            onClick: onLoadMore,
            disabled: loadingMore
          },
          loadingMore ? "Loading..." : "Load More"
        ),
        React.createElement("span", { className: "sub" }, `${loadedCount}/${totalCount || loadedCount} loaded`)
      )
  );
}
