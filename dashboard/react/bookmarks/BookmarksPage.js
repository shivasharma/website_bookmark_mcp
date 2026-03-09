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
import { NotificationsPage } from "./components/NotificationsPage.js";

const PAGE_SIZE = 30;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const NOTIFICATIONS_ACTIVITY_LIMIT = 50;
const NOTIFICATIONS_PAGE_SIZE = 25;

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
  const [notifications, setNotifications] = useState([]);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const notificationsPageRef = useRef(1);
  const sectionRef = useRef("bookmarks");

  async function loadNotifications(options = {}) {
    const mode = options.mode === "page" ? "page" : "activity";
    const page = Math.max(1, Number(options.page || 1));
    const pageSize = mode === "page" ? NOTIFICATIONS_PAGE_SIZE : NOTIFICATIONS_ACTIVITY_LIMIT;
    try {
      const query = mode === "page" ? `page=${page}&pageSize=${pageSize}` : `limit=${pageSize}`;
      const { response, payload } = await api(`/notifications?${query}`, { method: "GET" });
      if (!response.ok || !payload || !payload.success || !Array.isArray(payload.data)) {
        setNotifications([]);
        setNotificationsTotal(0);
        setNotificationsUnread(0);
        return;
      }
      const mapped = payload.data.map((item) => ({
        id: String(item.id),
        text: String(item.text || getRealtimeMessage(item)),
        source: getSourceLabel(item.source),
        action: normalizeAction(item.action),
        at: new Date(String(item.created_at || Date.now())).toLocaleTimeString(),
        read: !!item.is_read
      }));
      setNotifications(mapped);
      setNotificationsTotal(Number(payload.total || mapped.length || 0));
      setNotificationsUnread(Number(payload.unread || 0));
      if (mode === "page") {
        setNotificationsPage(Number(payload.page || page));
      }
    } catch {
      setNotifications([]);
      setNotificationsTotal(0);
      setNotificationsUnread(0);
    }
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
    await Promise.all([loadCurrentUser(), loadStats(), loadNotifications()]);
    if (section === "bookmarks") {
      await loadBookmarks(1, false);
    }
  }

  useEffect(() => {
    Promise.all([loadCurrentUser(), loadStats(), loadNotifications()]);
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
    if (pathname.startsWith("/notifications")) return "notifications";
    return "bookmarks";
  }, [pathname]);

  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  useEffect(() => {
    notificationsPageRef.current = notificationsPage;
  }, [notificationsPage]);

  const sectionTitle = section === "syshealth" ? "System Health" : section === "mcp" ? "MCP Setup" : "Bookmarks";
  const unreadCount = Number(notificationsUnread || 0);

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
    if (section !== "notifications") {
      return;
    }
    loadNotifications({ mode: "page", page: 1 });
    api("/notifications/read-all", { method: "POST" })
      .then(() => loadNotifications({ mode: "page", page: 1 }))
      .catch(() => {});
  }, [section]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (sectionRef.current === "notifications") {
        loadNotifications({ mode: "page", page: notificationsPage });
        return;
      }
      loadNotifications({ mode: "activity" });
    }, 10000);
    return () => clearInterval(interval);
  }, [notificationsPage]);

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
      if (sectionRef.current === "notifications") {
        loadNotifications({ mode: "page", page: notificationsPageRef.current });
      } else {
        loadNotifications({ mode: "activity" });
      }

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
      setModalOpen(false);
      setEditingBookmark(null);
      await Promise.all([loadStats(), loadBookmarks(1, false)]);
    } catch {
      setMessage("Network error while saving");
    }
  }

  async function handleDelete(bookmark) {
    const previousBookmarks = bookmarks;
    const previousStats = bookmarkStats;
    const previousLoadedTotal = loadedTotal;
    const wasFavorite = !!bookmark?.starred;

    setBookmarks((prev) => prev.filter((item) => item.id !== bookmark.id));
    setLoadedTotal((prev) => Math.max(0, Number(prev || 0) - 1));
    setBookmarkStats((prev) => ({
      total: Math.max(0, Number(prev.total || 0) - 1),
      favorites: Math.max(0, Number(prev.favorites || 0) - (wasFavorite ? 1 : 0))
    }));
    setMessage("Deleting bookmark...");

    try {
      const { response, payload } = await api(`/bookmarks/${bookmark.id}`, { method: "DELETE" });
      if (!response.ok || !payload || !payload.success) {
        setBookmarks(previousBookmarks);
        setBookmarkStats(previousStats);
        setLoadedTotal(previousLoadedTotal);
        setMessage((payload && payload.error) || "Delete failed");
        return;
      }
      setMessage("Bookmark deleted");
      const notificationRequest =
        sectionRef.current === "notifications"
          ? loadNotifications({ mode: "page", page: notificationsPageRef.current })
          : loadNotifications({ mode: "activity" });
      await Promise.all([loadStats(), loadBookmarks(1, false), notificationRequest]);
    } catch {
      setBookmarks(previousBookmarks);
      setBookmarkStats(previousStats);
      setLoadedTotal(previousLoadedTotal);
      setMessage("Network error while deleting");
    }
  }

  async function handleToggleFavorite(bookmark) {
    const previousBookmarks = bookmarks;
    const previousStats = bookmarkStats;
    const nextStarred = !bookmark.starred;

    setBookmarks((prev) =>
      prev.map((item) => (item.id === bookmark.id ? { ...item, starred: nextStarred, is_favorite: nextStarred } : item))
    );
    setBookmarkStats((prev) => ({
      total: Number(prev.total || 0),
      favorites: Math.max(0, Number(prev.favorites || 0) + (nextStarred ? 1 : -1))
    }));
    setMessage(nextStarred ? "Starring bookmark..." : "Removing star...");

    try {
      const { response, payload } = await api(`/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_favorite: !bookmark.starred })
      });
      if (!response.ok || !payload || !payload.success) {
        setBookmarks(previousBookmarks);
        setBookmarkStats(previousStats);
        setMessage((payload && payload.error) || "Update failed");
        return;
      }
      setMessage(!bookmark.starred ? "Starred" : "Removed from starred");
      const notificationRequest =
        sectionRef.current === "notifications"
          ? loadNotifications({ mode: "page", page: notificationsPageRef.current })
          : loadNotifications({ mode: "activity" });
      await Promise.all([loadStats(), loadBookmarks(1, false), notificationRequest]);
    } catch {
      setBookmarks(previousBookmarks);
      setBookmarkStats(previousStats);
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
    const target = next === "syshealth" ? "/syshealth" : next === "mcp" ? "/mcp" : next === "notifications" ? "/notifications" : "/bookmarks";
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
      onOpenNotifications: () => handleSectionChange("notifications"),
      unreadCount,
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
        starred,
        unreadCount
      }),
      React.createElement(
        "main",
        { className: "bm-content" },
        React.createElement("h1", { className: "bm-section-title" }, section === "notifications" ? "Notifications" : sectionTitle),
        !!message && React.createElement("div", { className: "bm-message" }, message),
        section === "bookmarks" &&
          React.createElement(
            React.Fragment,
            null,
            React.createElement(StatsStrip, { total, starred, tags: tagsCount, imported: 0 }),
            notifications.length > 0 &&
              React.createElement(
                "section",
                { className: "card bm-activity" },
                React.createElement(
                  "div",
                  { className: "bm-panel-head" },
                  React.createElement("h2", null, "Recent Activity"),
                  React.createElement(
                    "button",
                    {
                      className: "btn",
                      type: "button",
                      onClick: () => handleSectionChange("notifications")
                    },
                    "View all notifications"
                  )
                ),
                React.createElement(
                  "div",
                  { className: "bm-activity-list" },
                  ...notifications.slice(0, 8).map((entry) =>
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
        section === "notifications" &&
          React.createElement(NotificationsPage, {
            items: notifications,
            unreadCount,
            page: notificationsPage,
            pageSize: NOTIFICATIONS_PAGE_SIZE,
            total: notificationsTotal,
            onPageChange: (nextPage) => {
              loadNotifications({ mode: "page", page: nextPage });
            },
            onMarkAllRead: () => {
              api("/notifications/read-all", { method: "POST" })
                .then(() => loadNotifications({ mode: "page", page: notificationsPageRef.current }))
                .catch(() => {});
            },
            onMarkRead: (id) => {
              api(`/notifications/${id}/read`, { method: "PATCH" })
                .then(() => loadNotifications({ mode: "page", page: notificationsPageRef.current }))
                .catch(() => {});
            },
            onClearAll: () => {
              api("/notifications", { method: "DELETE" })
                .then(() => loadNotifications({ mode: "page", page: 1 }))
                .catch(() => {});
            }
          }),
        section === "syshealth" && React.createElement(SystemHealthPanel),
        section === "mcp" && React.createElement(McpSetupPanel, { currentUser, onMessage: setMessage }),
        section !== "bookmarks" && section !== "notifications" && section !== "syshealth" && section !== "mcp" &&
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
