import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, toUiBookmark } from "./api.js";
import { TopBar } from "./components/TopBar.js";
import { Sidebar } from "./components/Sidebar.js";
import { StatsStrip } from "./components/StatsStrip.js";
import { BookmarkPanel } from "./components/BookmarkPanel.js";
import { QuickAddPanel } from "./components/QuickAddPanel.js";
import { AddBookmarkModal } from "./components/AddBookmarkModal.js";
import { SystemHealthPanel } from "./components/SystemHealthPanel.js";
import { McpSetupPanel } from "./components/McpSetupPanel.js";

const PAGE_SIZE = 30;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function openExternal(url) {
  try {
    const parsed = new URL(String(url || ""));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return;
    }
    window.open(parsed.toString(), "_blank", "noopener,noreferrer");
  } catch {
    return;
  }
}

function buildBookmarkQueryParams({ search, filter, page }) {
  const params = new URLSearchParams();
  const query = search.trim();
  if (query) {
    params.set("search", query);
  }
  if (filter === "starred") {
    params.set("favorite", "true");
  }
  params.set("page", String(page));
  params.set("pageSize", String(PAGE_SIZE));
  return params;
}

function normalizeSharedUrl(value) {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }
  try {
    const parsed = new URL(input);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return "";
  } catch {
    try {
      const parsed = new URL(`https://${input}`);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString();
      }
      return "";
    } catch {
      return "";
    }
  }
}

function formatNotificationTarget(payload) {
  const title = String(payload?.bookmark_title || "").trim();
  if (title) {
    return title;
  }
  return String(payload?.bookmark_url || "bookmark").trim() || "bookmark";
}

function normalizeAction(action) {
  const value = String(action || "updated").toLowerCase();
  if (value === "created" || value === "deleted" || value === "updated") {
    return value;
  }
  return "updated";
}

function getSourceLabel(source) {
  const value = String(source || "portal").toLowerCase();
  if (value === "mcp") {
    return "MCP";
  }
  if (value === "server") {
    return "Server";
  }
  return "Portal";
}

function getRealtimeMessage(payload) {
  const action = String(payload?.action || "").toLowerCase();
  const source = getSourceLabel(payload?.source);
  const target = formatNotificationTarget(payload);

  if (action === "created") {
    return `${source}: added ${target}`;
  }
  if (action === "deleted") {
    return `${source}: deleted ${target}`;
  }
  if (action === "updated") {
    return `${source}: updated ${target}`;
  }
  return `${source}: bookmarks updated`;
}

export function BookmarksPage() {
  const [pathname, setPathname] = useState(window.location.pathname || "/bookmarks");
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkStats, setBookmarkStats] = useState({ total: 0, favorites: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedTotal, setLoadedTotal] = useState(0);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("list");
  const [search, setSearch] = useState("");
  const [authBlocked, setAuthBlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [message, setMessage] = useState("");
  const [activity, setActivity] = useState([]);
  const sectionRef = useRef("bookmarks");

  function pushActivity(text, source = "portal", action = "updated") {
    const normalizedAction = normalizeAction(action);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      source: getSourceLabel(source),
      action: normalizedAction,
      at: new Date().toLocaleTimeString()
    };
    setActivity((prev) => [entry, ...prev].slice(0, 12));
  }

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

  async function loadStats() {
    try {
      const { response, payload } = await api("/stats", { method: "GET" });
      if (!response.ok || !payload || !payload.success || !payload.data) {
        setBookmarkStats({ total: 0, favorites: 0 });
        return;
      }
      setBookmarkStats({
        total: Number(payload.data.total || 0),
        favorites: Number(payload.data.favorites || 0)
      });
    } catch {
      setBookmarkStats({ total: 0, favorites: 0 });
    }
  }

  async function loadBookmarks(pageToLoad = 1, append = false) {
    if (append) {
      setLoadingMore(true);
    }

    try {
      const params = buildBookmarkQueryParams({ search, filter, page: pageToLoad });

      const { response, payload } = await api(`/bookmarks?${params.toString()}`, { method: "GET" });
      if (!response.ok || !payload || !payload.success) {
        setAuthBlocked(response.status === 401);
        if (!append) {
          setBookmarks([]);
          setLoadedTotal(0);
          setCurrentPage(1);
        }
        setHasMore(false);
        return;
      }
      setAuthBlocked(false);
      const nextItems = (Array.isArray(payload.data) ? payload.data : []).map(toUiBookmark);
      setBookmarks((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setLoadedTotal(Number(payload.total || 0));
      setCurrentPage(pageToLoad);
      setHasMore(Boolean(payload.hasMore));
    } catch {
      if (!append) {
        setBookmarks([]);
        setLoadedTotal(0);
        setCurrentPage(1);
      }
      setHasMore(false);
    } finally {
      if (append) {
        setLoadingMore(false);
      }
    }
  }

  async function refreshAll() {
    await Promise.all([loadCurrentUser(), loadStats()]);
    if (section === "bookmarks") {
      await loadBookmarks(1, false);
    }
  }

  useEffect(() => {
    Promise.all([loadCurrentUser(), loadStats()]);
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

  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  const sectionTitle = section === "syshealth" ? "System Health" : section === "mcp" ? "MCP Setup" : "Bookmarks";

  const filteredItems = useMemo(() => {
    const now = Date.now();
    const sorted = [...bookmarks].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return sorted.filter((item) => {
      if (filter === "recent") {
        const createdAt = new Date(item.created_at || 0).getTime();
        return Number.isFinite(createdAt) && now - createdAt <= RECENT_WINDOW_MS;
      }
      if (filter === "unread") {
        return false;
      }
      return true;
    });
  }, [bookmarks, filter]);

  useEffect(() => {
    if (section !== "bookmarks") {
      return;
    }
    loadBookmarks(1, false);
  }, [section, filter, search]);

  useEffect(() => {
    if (section !== "bookmarks") {
      return;
    }

    const query = new URLSearchParams(window.location.search || "");
    const sharedUrl = normalizeSharedUrl(query.get("url"));
    const sharedTitle = String(query.get("title") || "").trim();
    const sharedText = String(query.get("text") || "").trim();

    if (!sharedUrl) {
      return;
    }

    setEditingBookmark({
      url: sharedUrl,
      title: sharedTitle,
      description: sharedText,
      notes: sharedText,
      tags: []
    });
    setModalOpen(true);

    const targetPath = window.location.pathname || "/bookmarks";
    if (window.location.search) {
      window.history.replaceState({}, "", targetPath);
    }
  }, [section]);

  useEffect(() => {
    let isDisposed = false;
    const eventSource = new EventSource("/api/events", { withCredentials: true });

    function onBookmarkEvent(event) {
      if (isDisposed) {
        return;
      }

      let payload = null;
      try {
        payload = JSON.parse(event.data || "{}");
      } catch {
        payload = null;
      }

      const realtimeMessage = getRealtimeMessage(payload);
      setMessage(realtimeMessage);
      pushActivity(realtimeMessage, payload?.source, payload?.action);

      if (sectionRef.current === "bookmarks") {
        loadBookmarks(1, false);
      }
      loadStats();
    }

    function onError() {
      if (isDisposed) {
        return;
      }
      setMessage("Realtime notifications disconnected. Retrying...");
    }

    eventSource.addEventListener("bookmark", onBookmarkEvent);
    eventSource.onerror = onError;

    return () => {
      isDisposed = true;
      eventSource.removeEventListener("bookmark", onBookmarkEvent);
      eventSource.close();
    };
  }, []);

  const total = Number(bookmarkStats.total || 0);
  const starred = Number(bookmarkStats.favorites || 0);
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
      pushActivity(id ? "Portal: updated bookmark" : "Portal: added bookmark", "portal", id ? "updated" : "created");
      setModalOpen(false);
      setEditingBookmark(null);
      await Promise.all([loadStats(), loadBookmarks(1, false)]);
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
      pushActivity("Portal: deleted bookmark", "portal", "deleted");
      await Promise.all([loadStats(), loadBookmarks(1, false)]);
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
      pushActivity(!bookmark.starred ? "Portal: starred bookmark" : "Portal: unstarred bookmark", "portal", "updated");
      await Promise.all([loadStats(), loadBookmarks(1, false)]);
    } catch {
      setMessage("Network error while updating");
    }
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore) {
      return;
    }
    await loadBookmarks(currentPage + 1, true);
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
  }

  return React.createElement(
    "div",
    { className: "bm-shell" },
    React.createElement(TopBar, {
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
            activity.length > 0 &&
              React.createElement(
                "section",
                { className: "card bm-activity" },
                React.createElement("h2", null, "Recent Activity"),
                React.createElement(
                  "div",
                  { className: "bm-activity-list" },
                  ...activity.map((entry) =>
                    React.createElement(
                      "div",
                      { className: "bm-activity-item", key: entry.id },
                      React.createElement("span", { className: `bm-activity-source bm-source-${entry.source.toLowerCase()}` }, entry.source),
                      React.createElement("span", { className: `bm-activity-action bm-action-${entry.action}` }, entry.action),
                      React.createElement("span", { className: "bm-activity-text" }, entry.text),
                      React.createElement("span", { className: "bm-activity-time" }, entry.at)
                    )
                  )
                )
              ),
            React.createElement(
              "div",
              { className: "bm-content-grid" },
              React.createElement(BookmarkPanel, {
                items: filteredItems,
                view,
                onViewChange: setView,
                search,
                onSearchChange: setSearch,
                filter,
                onFilterChange: setFilter,
                onOpen: openExternal,
                hasMore,
                loadingMore,
                loadedCount: bookmarks.length,
                totalCount: loadedTotal,
                onLoadMore: handleLoadMore,
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
