import React from "react";
import { IconEdit, IconGrid, IconList, IconStar, IconStarFilled, IconTrash } from "./icons.js";

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
    { className: "bm-item", onClick: () => onOpen(bookmark.url) },
    React.createElement(
      "div",
      { className: "bm-item-main" },
      React.createElement("div", { className: "bm-item-title" }, bookmark.title),
      React.createElement("div", { className: "bm-item-url" }, bookmark.url),
      React.createElement(
        "div",
        { className: "bm-tags" },
        ...(bookmark.tags || []).map((tag, index) =>
          React.createElement("span", { className: `bm-tag ${tagClass(tag)}`, key: `${bookmark.id}-tag-${index}` }, String(tag))
        )
      )
    ),
    React.createElement(
      "div",
      { className: "bm-item-right" },
      React.createElement("div", { className: "bm-date" }, bookmark.dateLabel),
      React.createElement(
        "div",
        { className: "bm-actions" },
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
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  authBlocked,
  onAddClick
}) {
  if (!items.length) {
    if (authBlocked) {
      return React.createElement(
        "div",
        { className: "card" },
        React.createElement("h2", null, "Login Is Blocking Local Data"),
        React.createElement("p", { className: "sub" }, "Enable local fallback on API to read existing DB bookmarks locally: ", React.createElement("span", { className: "code-inline" }, "ALLOW_LOCAL_FALLBACK=true"), ".")
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
        null,
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
        )
  );
}
