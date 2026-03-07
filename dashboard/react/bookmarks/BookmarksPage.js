import React, { useEffect, useMemo, useState } from "react";
import { api, toUiBookmark } from "./api.js";
import { TopBar } from "./components/TopBar.js";
import { Sidebar } from "./components/Sidebar.js";
import { StatsStrip } from "./components/StatsStrip.js";
import { BookmarkPanel } from "./components/BookmarkPanel.js";
import { QuickAddPanel } from "./components/QuickAddPanel.js";
import { AddBookmarkModal } from "./components/AddBookmarkModal.js";
import { SystemHealthPanel } from "./components/SystemHealthPanel.js";
import { McpSetupPanel } from "./components/McpSetupPanel.js";

function openExternal(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function BookmarksPage() {
  const [pathname, setPathname] = useState(window.location.pathname || "/bookmarks");
  const [bookmarks, setBookmarks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [authBlocked, setAuthBlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [message, setMessage] = useState("");

  async function loadCurrentUser() {
    try {
      const { response, payload } = await api("/me", { method: "GET" });
      if (!response.ok || !payload || !payload.success) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(payload.data || null);
    } catch {
      setCurrentUser(null);
    }
  }

  async function loadBookmarks() {
    try {
      const { response, payload } = await api("/bookmarks", { method: "GET" });
      if (!response.ok || !payload || !payload.success) {
        setAuthBlocked(response.status === 401);
        setBookmarks([]);
        return;
      }
      setAuthBlocked(false);
      setBookmarks((Array.isArray(payload.data) ? payload.data : []).map(toUiBookmark));
    } catch {
      setBookmarks([]);
    }
  }

  async function refreshAll() {
    await Promise.all([loadCurrentUser(), loadBookmarks()]);
  }

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    function onPopState() {
      setPathname(window.location.pathname || "/bookmarks");
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const section = useMemo(() => {
    if (pathname.startsWith("/syshealth")) return "syshealth";
    if (pathname.startsWith("/mcp")) return "mcp";
    return "bookmarks";
  }, [pathname]);

  const sectionTitle = section === "syshealth" ? "System Health" : section === "mcp" ? "MCP Setup" : "Bookmarks";

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...bookmarks].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return sorted.filter((item) => {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      const passFilter =
        filter === "all" ||
        (filter === "starred" && item.starred) ||
        (filter === "recent" && true) ||
        (filter === "unread" && false);
      const passQuery =
        !q ||
        String(item.title || "").toLowerCase().includes(q) ||
        String(item.url || "").toLowerCase().includes(q) ||
        String(item.description || "").toLowerCase().includes(q) ||
        String(item.notes || "").toLowerCase().includes(q) ||
        tags.join(" ").toLowerCase().includes(q);
      return passFilter && passQuery;
    });
  }, [bookmarks, filter, search]);

  const total = bookmarks.length;
  const starred = bookmarks.filter((item) => item.starred).length;
  const tagsCount = new Set(bookmarks.flatMap((item) => item.tags || []).map((tag) => String(tag).toLowerCase())).size;

  async function handleSave(payload, id) {
    const endpoint = id ? `/bookmarks/${id}` : "/bookmarks";
    const method = id ? "PATCH" : "POST";
    try {
      const { response, payload: result } = await api(endpoint, { method, body: JSON.stringify(payload) });
      if (!response.ok || !result || !result.success) {
        setMessage((result && result.error) || "Save failed");
        return;
      }
      setMessage(id ? "Bookmark updated" : "Bookmark saved");
      setModalOpen(false);
      setEditingBookmark(null);
      await loadBookmarks();
    } catch {
      setMessage("Network error while saving");
    }
  }

  async function handleDelete(bookmark) {
    try {
      const { response, payload } = await api(`/bookmarks/${bookmark.id}`, { method: "DELETE" });
      if (!response.ok || !payload || !payload.success) {
        setMessage((payload && payload.error) || "Delete failed");
        return;
      }
      setMessage("Bookmark deleted");
      await loadBookmarks();
    } catch {
      setMessage("Network error while deleting");
    }
  }

  async function handleToggleFavorite(bookmark) {
    try {
      const { response, payload } = await api(`/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_favorite: !bookmark.starred })
      });
      if (!response.ok || !payload || !payload.success) {
        setMessage((payload && payload.error) || "Update failed");
        return;
      }
      setMessage(!bookmark.starred ? "Starred" : "Removed from starred");
      await loadBookmarks();
    } catch {
      setMessage("Network error while updating");
    }
  }

  async function handleLogout() {
    try {
      await api("/logout", { method: "POST" });
    } catch {}
    await refreshAll();
    setMessage("Logged out");
  }

  function handleSectionChange(next) {
    const target = next === "syshealth" ? "/syshealth" : next === "mcp" ? "/mcp" : "/bookmarks";
    if (window.location.pathname !== target) {
      window.history.pushState({}, "", target);
    }
    setPathname(target);

    if (next === "syshealth") {
      return;
    }
    if (next === "mcp") {
      return;
    }
  }

  return React.createElement(
    "div",
    { className: "bm-shell" },
    React.createElement(TopBar, {
      search,
      onSearchChange: setSearch,
      onAddClick: () => {
        setEditingBookmark(null);
        setModalOpen(true);
      },
      onOpenMcp: () => handleSectionChange("mcp"),
      currentUser,
      onLogout: handleLogout
    }),
    React.createElement(
      "div",
      { className: "bm-main" },
      React.createElement(Sidebar, {
        filter,
        section,
        onSectionChange: handleSectionChange,
        onFilterChange: setFilter,
        total,
        starred
      }),
      React.createElement(
        "main",
        { className: "bm-content" },
        React.createElement("h1", { className: "bm-section-title" }, sectionTitle),
        !!message && React.createElement("div", { className: "bm-message" }, message),
        section === "bookmarks" &&
          React.createElement(
            React.Fragment,
            null,
            React.createElement(StatsStrip, { total, starred, tags: tagsCount, imported: 0 }),
            React.createElement(
              "div",
              { className: "bm-content-grid" },
              React.createElement(BookmarkPanel, {
                items: filteredItems,
                view,
                onViewChange: setView,
                onOpen: openExternal,
                onEdit: (bookmark) => {
                  setEditingBookmark(bookmark);
                  setModalOpen(true);
                },
                onDelete: handleDelete,
                onToggleFavorite: handleToggleFavorite,
                authBlocked,
                onAddClick: () => {
                  setEditingBookmark(null);
                  setModalOpen(true);
                }
              }),
              React.createElement(QuickAddPanel, {
                onSave: async (payload) => {
                  await handleSave(payload, null);
                }
              })
            )
          ),
        section === "syshealth" && React.createElement(SystemHealthPanel),
        section === "mcp" && React.createElement(McpSetupPanel, { currentUser, onMessage: setMessage }),
        section !== "bookmarks" && section !== "syshealth" && section !== "mcp" &&
          React.createElement("div", { className: "bm-message" }, "Unknown section. Returning to bookmarks...")
      )
    ),
    React.createElement(AddBookmarkModal, {
      open: modalOpen,
      bookmark: editingBookmark,
      onClose: () => {
        setModalOpen(false);
        setEditingBookmark(null);
      },
      onSave: handleSave
    })
  );
}
