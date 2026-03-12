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

// 70/30 Split Card Layout and Hover-Only Actions
function BookmarkListItem({ bookmark, onOpen, onEdit, onDelete, onToggleFavorite, onDragStart }) {
  const starIcon = bookmark.starred ? React.createElement(IconStarFilled, { className: "bm-icon" }) : React.createElement(IconStar, { className: "bm-icon" });
  return React.createElement(
    "div",
    {
      className: "bk-preview-card bk-split-card",
      onClick: () => onOpen(bookmark.url),
      draggable: true,
      onDragStart: (e) => onDragStart && onDragStart(e, bookmark)
    },
    React.createElement(
      "div",
      { className: "bk-split-main" },
      React.createElement(
        "div",
        { className: "bk-split-left" },
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
        { className: "bk-split-right" },
        bookmark.thumbnailUrl
          ? React.createElement("img", { src: bookmark.thumbnailUrl, alt: "preview", className: "bk-preview-thumb" })
          : bookmark.faviconUrl
            ? React.createElement("img", { src: bookmark.faviconUrl, alt: "favicon", className: "bk-preview-fav-large" })
            : React.createElement("div", { className: "bk-preview-fav-large" }, "🔖")
      )
    ),
    React.createElement(
      "div",
      { className: "bk-preview-actions hover-only" },
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

function BookmarkGridItem({ bookmark, onOpen, onEdit, onDelete, onToggleFavorite, onDragStart }) {
  const starIcon = bookmark.starred ? React.createElement(IconStarFilled, { className: "bm-icon" }) : React.createElement(IconStar, { className: "bm-icon" });
  return React.createElement(
    "div",
    {
      className: "bm-grid-item",
      onClick: () => onOpen(bookmark.url),
      draggable: true,
      onDragStart: (e) => onDragStart && onDragStart(e, bookmark)
    },
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

function BookmarkTable({ items, onOpen, onEdit, onDelete, onToggleFavorite, onDragStart }) {
  return React.createElement(
    "div",
    { className: "bk-table-wrap" },
    React.createElement(
      "table",
      { className: "bk-table" },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          null,
          React.createElement("th", null, "Favicon"),
          React.createElement("th", null, "Title"),
          React.createElement("th", null, "URL"),
          React.createElement("th", null, "Date Added"),
          React.createElement("th", null, "Tags"),
          React.createElement("th", null, "Actions")
        )
      ),
      React.createElement(
        "tbody",
        null,
        ...items.map((bookmark) =>
          React.createElement(
            "tr",
            {
              key: `table-${bookmark.id}`,
              draggable: true,
              onDragStart: (e) => onDragStart && onDragStart(e, bookmark)
            },
            React.createElement(
              "td",
              null,
              bookmark.faviconUrl
                ? React.createElement("img", { src: bookmark.faviconUrl, alt: "favicon", style: { width: 20, height: 20, borderRadius: "50%" } })
                : "🔖"
            ),
            React.createElement(
              "td",
              { className: "bk-table-title", onClick: () => onOpen(bookmark.url), style: { cursor: "pointer" } },
              bookmark.title
            ),
            React.createElement(
              "td",
              { style: { maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
              bookmark.url
            ),
            React.createElement(
              "td",
              null,
              bookmark.dateLabel || bookmark.timeAgo
            ),
            React.createElement(
              "td",
              null,
              (bookmark.tags || []).map((tag, i) => React.createElement("span", { className: `bm-tag ${tagClass(tag)}`, key: `table-tag-${i}` }, tag))
            ),
            React.createElement(
              "td",
              null,
              React.createElement(
                "button",
                { className: "btn", type: "button", onClick: (e) => { e.stopPropagation(); onEdit(bookmark); } },
                "Edit"
              ),
              React.createElement(
                "button",
                { className: "btn", type: "button", onClick: (e) => { e.stopPropagation(); onDelete(bookmark); } },
                "Delete"
              ),
              React.createElement(
                "button",
                { className: "btn", type: "button", onClick: (e) => { e.stopPropagation(); onToggleFavorite(bookmark); } },
                bookmark.starred ? "★" : "☆"
              )
            )
          )
        )
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
  onAddClick,
  onBookmarkDragStart
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
        ),
        React.createElement(
          "button",
          { className: `btn${view === "table" ? " primary" : ""}`, type: "button", onClick: () => onViewChange("table") },
          "Table"
        )
      )
    ),
    view === "table"
      ? React.createElement(BookmarkTable, { items, onOpen, onEdit, onDelete, onToggleFavorite, onDragStart: onBookmarkDragStart })
      : view === "list"
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
              onToggleFavorite,
              onDragStart: onBookmarkDragStart
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
              onToggleFavorite,
              onDragStart: onBookmarkDragStart
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
