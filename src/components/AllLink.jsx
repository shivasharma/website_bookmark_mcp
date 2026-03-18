import React, { useState, useEffect, useCallback } from "react";
import {
  Search, Star, ExternalLink, Trash2, Tag, Loader2,
  BookmarkX, RefreshCw, Filter, X, Pencil,
} from "lucide-react";
import EditBookmarkModal from "./EditBookmarkModal";

/* ── Bookmark Card ─────────────────────────────────────────────── */
function BookmarkCard({ bookmark, onDelete, onToggleFavorite, onEdit }) {
  const [deleting, setDeleting] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  const domain = (() => {
    try { return new URL(bookmark.url).hostname.replace(/^www\./, ""); }
    catch { return bookmark.url; }
  })();

  async function handleDelete() {
    if (!confirm(`Delete "${bookmark.title || bookmark.url}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) onDelete(bookmark.id);
    } finally {
      setDeleting(false);
    }
  }

  async function handleFavorite() {
    setFavoriting(true);
    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ is_favorite: !bookmark.is_favorite }),
      });
      const json = await res.json();
      if (json.success) onToggleFavorite(json.data);
    } finally {
      setFavoriting(false);
    }
  }

  return (
    <div className="group flex flex-col bg-gradient-to-br from-card to-card-hover border border-border rounded-2xl p-4 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200">

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {bookmark.favicon ? (
          <img
            src={bookmark.favicon}
            alt=""
            className="w-8 h-8 rounded-lg shrink-0 bg-card-hover object-contain p-0.5"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-8 h-8 rounded-lg shrink-0 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold">
            {domain.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary text-sm font-semibold leading-snug truncate">
            {bookmark.title || domain}
          </h3>
          <p className="text-text-muted text-[11px] truncate mt-0.5">{domain}</p>
        </div>
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="text-text-secondary text-xs leading-relaxed line-clamp-2 mb-3">
          {bookmark.description}
        </p>
      )}

      {/* Tags */}
      {bookmark.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {bookmark.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium"
            >
              <Tag size={9} />
              {tag}
            </span>
          ))}
          {bookmark.tags.length > 4 && (
            <span className="text-[10px] text-text-muted px-1">+{bookmark.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-2 border-t border-border">
        <span className="text-text-muted text-[10px]">
          {new Date(bookmark.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleFavorite}
            disabled={favoriting}
            title={bookmark.is_favorite ? "Unfavorite" : "Favorite"}
            className={`p-1.5 rounded-lg transition-all ${
              bookmark.is_favorite
                ? "text-warning"
                : "text-text-muted hover:text-warning hover:bg-warning/10"
            }`}
          >
            <Star size={13} fill={bookmark.is_favorite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => onEdit(bookmark)}
            title="Edit"
            className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all"
          >
            <Pencil size={13} />
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open link"
            className="p-1.5 rounded-lg text-text-muted hover:text-accent2 hover:bg-accent2/10 transition-all"
          >
            <ExternalLink size={13} />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all"
          >
            {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function AllLink() {
  const [bookmarks, setBookmarks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  const PAGE_SIZE = 24;

  const fetchBookmarks = useCallback(async (q, tag, p) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: p, pageSize: PAGE_SIZE });
      if (q) params.set("search", q);
      if (tag) params.set("tag", tag);
      const res = await fetch(`/api/bookmarks?${params}`, { credentials: "include" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load bookmarks");
      if (p === 1) {
        setBookmarks(json.data);
      } else {
        setBookmarks((prev) => [...prev, ...json.data]);
      }
      setTotal(json.total);
      setHasMore(json.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchBookmarks(search, activeTag, 1);
    }, 300);
    return () => clearTimeout(t);
  }, [search, activeTag, fetchBookmarks]);

  function handleDelete(id) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    setTotal((t) => t - 1);
  }

  function handleToggleFavorite(updated) {
    setBookmarks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function handleSaved(updated) {
    setBookmarks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchBookmarks(search, activeTag, next);
  }

  // Collect all unique tags from loaded bookmarks
  const allTags = [...new Set(bookmarks.flatMap((b) => b.tags || []))].slice(0, 20);

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Toolbar */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 md:px-6 py-3 border-b border-border">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks…"
            className="w-full bg-card border border-border text-text-primary placeholder-text-muted rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1">
            <Filter size={13} className="text-text-muted shrink-0" />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
                className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                  activeTag === tag
                    ? "bg-accent/20 border-accent/40 text-accent"
                    : "bg-card border-border text-text-muted hover:border-accent/30 hover:text-text-secondary"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Count */}
        <span className="shrink-0 text-text-muted text-xs sm:ml-auto">
          {total} bookmark{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5">
        {error && (
          <div className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-xl px-4 py-3 mb-4">
            {error}
            <button onClick={() => fetchBookmarks(search, activeTag, 1)} className="ml-auto text-text-muted hover:text-text-primary">
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* Initial loading */}
        {loading && page === 1 && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-sm">Loading bookmarks…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && bookmarks.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <BookmarkX size={36} className="text-border" />
            <p className="text-sm">
              {search || activeTag ? "No bookmarks match your filter." : "No bookmarks yet. Save your first one!"}
            </p>
            {(search || activeTag) && (
              <button
                onClick={() => { setSearch(""); setActiveTag(""); }}
                className="text-accent text-xs hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {bookmarks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bookmarks.map((b) => (
              <BookmarkCard
                key={b.id}
                bookmark={b}
                onDelete={handleDelete}
                onToggleFavorite={handleToggleFavorite}
                onEdit={setEditingBookmark}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border text-text-secondary text-sm font-medium hover:bg-card hover:text-text-primary hover:border-accent/30 transition-all"
            >
              Load more
            </button>
          </div>
        )}

        {/* Load more spinner */}
        {loading && page > 1 && (
          <div className="flex justify-center mt-6">
            <Loader2 size={20} className="animate-spin text-accent" />
          </div>
        )}
      </div>

      <EditBookmarkModal
        bookmark={editingBookmark}
        onClose={() => setEditingBookmark(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
