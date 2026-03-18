import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search, Star, ExternalLink, Trash2, Tag, Loader2,
  BookmarkX, X, Pencil, LayoutGrid, List,
  Folder, Hash, ChevronDown, ChevronRight,
  RefreshCw, ArrowUpDown, Globe, Calendar,
  Filter, SlidersHorizontal,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import EditBookmarkModal from "./EditBookmarkModal";
import { deleteBookmark, toggleFavorite } from "../lib/bookmarkApi";
import { isVideoUrl } from "../lib/videoUtils";

const SMART_FILTER_LABELS = {
  "no-tags":   "No Tags",
  "this-week": "Added This Week",
  "videos":    "Video Links",
  "broken":    "Broken Links",
};

/* ── Constants ─────────────────────────────────────────────────── */
const VIEW_MODES = [
  { key: "card",   icon: LayoutGrid,  label: "Card"   },
  { key: "table",  icon: List,        label: "Table"  },
  { key: "folder", icon: Folder,      label: "Folder" },
  { key: "tag",    icon: Hash,        label: "Tag"    },
];

const SORT_OPTIONS = [
  { key: "newest",    label: "Newest first"    },
  { key: "oldest",    label: "Oldest first"    },
  { key: "name",      label: "Name A–Z"        },
  { key: "favorites", label: "Favorites first" },
];

const TAG_COLORS = [
  "#0969da","#8250df","#cf222e","#1a7f37",
  "#9a6700","#0550ae","#bf3989","#1b7c83",
];

function tagColor(tag, allTags) {
  const i = allTags.indexOf(tag);
  return TAG_COLORS[i % TAG_COLORS.length];
}

/* ── Helpers ───────────────────────────────────────────────────── */
function domain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
}

function applySort(list, sort) {
  return [...list].sort((a, b) => {
    if (sort === "newest")    return new Date(b.created_at) - new Date(a.created_at);
    if (sort === "oldest")    return new Date(a.created_at) - new Date(b.created_at);
    if (sort === "name")      return (a.title || domain(a.url)).localeCompare(b.title || domain(b.url));
    if (sort === "favorites") return (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0);
    return 0;
  });
}

/* ── Shared bookmark action hook ──────────────────────────────── */
function useBookmarkActions(bookmark, onDelete, onToggleFavorite) {
  const [deleting, setDeleting] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${bookmark.title || bookmark.url}"?`)) return;
    setDeleting(true);
    try {
      if (await deleteBookmark(bookmark.id)) onDelete(bookmark.id);
    } finally { setDeleting(false); }
  }

  async function handleFavorite() {
    setFavoriting(true);
    try {
      const updated = await toggleFavorite(bookmark);
      if (updated) onToggleFavorite(updated);
    } finally { setFavoriting(false); }
  }

  return { deleting, favoriting, handleDelete, handleFavorite };
}

/* ── Favicon / Initial ─────────────────────────────────────────── */
function faviconUrl(bookmark) {
  if (bookmark.favicon) return bookmark.favicon;
  try {
    const d = new URL(bookmark.url).hostname;
    return `https://www.google.com/s2/favicons?domain=${d}&sz=64`;
  } catch { return null; }
}

function SiteIcon({ bookmark, size = "md" }) {
  const [failed, setFailed] = React.useState(false);
  const d = domain(bookmark.url);
  const sz = size === "sm" ? "w-6 h-6 text-[9px]" : "w-8 h-8 text-xs";
  const src = faviconUrl(bookmark);

  if (src && !failed) {
    return (
      <img
        src={src} alt=""
        className={`${sz} rounded-lg shrink-0 bg-card-hover object-contain p-0.5`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`${sz} rounded-lg shrink-0 bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold`}>
      {d.charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Action Buttons ────────────────────────────────────────────── */
function Actions({ bookmark, onDelete, onToggleFavorite, onEdit, deleting, favoriting }) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={onToggleFavorite} disabled={favoriting}
        title={bookmark.is_favorite ? "Unfavorite" : "Favorite"}
        className={`p-1.5 rounded-lg transition-all ${bookmark.is_favorite ? "text-warning" : "text-text-muted hover:text-warning hover:bg-warning/10"}`}
      >
        <Star size={13} fill={bookmark.is_favorite ? "currentColor" : "none"} />
      </button>
      <button onClick={() => onEdit(bookmark)} title="Edit"
        className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-all">
        <Pencil size={13} />
      </button>
      <a href={bookmark.url} target="_blank" rel="noopener noreferrer" title="Open"
        className="p-1.5 rounded-lg text-text-muted hover:text-accent2 hover:bg-accent2/10 transition-all">
        <ExternalLink size={13} />
      </a>
      <button onClick={onDelete} disabled={deleting} title="Delete"
        className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-all">
        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  );
}

/* ── Card View ─────────────────────────────────────────────────── */
function BookmarkCard({ bookmark, onDelete, onToggleFavorite, onEdit }) {
  const { deleting, favoriting, handleDelete, handleFavorite } =
    useBookmarkActions(bookmark, onDelete, onToggleFavorite);
  const d = domain(bookmark.url);

  return (
    <div className="group flex flex-col bg-card border border-border rounded-lg overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 hover:border-accent/25 transition-all duration-200">

      {/* Top accent strip */}
      <div className="h-0.5 w-full bg-gradient-to-r from-accent to-accent2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      <div className="flex flex-col flex-1 p-4">
        {/* Header: icon + title + domain */}
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 mt-0.5">
            <SiteIcon bookmark={bookmark} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-text-primary text-sm font-semibold leading-snug line-clamp-2 mb-0.5">
              {bookmark.title || d}
            </h3>
            <div className="flex items-center gap-1.5">
              <Globe size={10} className="text-text-muted shrink-0" />
              <p className="text-text-muted text-[11px] truncate">{d}</p>
            </div>
          </div>
          {bookmark.is_favorite && (
            <Star size={13} className="text-warning shrink-0 mt-0.5" fill="currentColor" />
          )}
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
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-accent/8 text-accent font-medium border border-accent/15">
                <Tag size={8} />{tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="text-[10px] text-text-muted font-medium">+{bookmark.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Calendar size={11} className="shrink-0" />
            <span className="text-xs font-medium">
              {new Date(bookmark.created_at).toLocaleDateString(undefined, {
                month: "short", day: "numeric", year: "numeric",
              })}
            </span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Actions
              bookmark={bookmark} onDelete={handleDelete}
              onToggleFavorite={handleFavorite} onEdit={onEdit}
              deleting={deleting} favoriting={favoriting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Table Row ─────────────────────────────────────────────────── */
function TableRow({ bookmark, onDelete, onToggleFavorite, onEdit, isOdd }) {
  const { deleting, favoriting, handleDelete, handleFavorite } =
    useBookmarkActions(bookmark, onDelete, onToggleFavorite);
  const d = domain(bookmark.url);

  return (
    <tr className={`group border-b border-border transition-colors ${isOdd ? "bg-card/30" : ""} hover:bg-accent/5`}>
      {/* Title */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <SiteIcon bookmark={bookmark} size="sm" />
          <div className="min-w-0">
            <div className="text-text-primary text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
              {bookmark.title || d}
            </div>
            <div className="text-text-muted text-[11px] truncate">{d}</div>
          </div>
        </div>
      </td>
      {/* Tags — hidden on mobile */}
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="flex flex-wrap gap-1">
          {bookmark.tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-medium">
              {tag}
            </span>
          ))}
          {(bookmark.tags?.length ?? 0) > 3 && (
            <span className="text-[10px] text-text-muted">+{bookmark.tags.length - 3}</span>
          )}
        </div>
      </td>
      {/* Date — hidden on small */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-text-muted text-xs whitespace-nowrap">
          {new Date(bookmark.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </td>
      {/* Actions */}
      <td className="px-4 py-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
          <Actions
            bookmark={bookmark} onDelete={handleDelete}
            onToggleFavorite={handleFavorite} onEdit={onEdit}
            deleting={deleting} favoriting={favoriting}
          />
        </div>
      </td>
    </tr>
  );
}

/* ── Folder / Tag Group Section ────────────────────────────────── */
function GroupSection({ title, count, color, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-card hover:bg-card-hover transition-colors text-left"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="flex-1 text-text-primary text-sm font-semibold truncate">{title}</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ backgroundColor: `${color}20`, color }}>
          {count}
        </span>
        {open
          ? <ChevronDown size={15} className="text-text-muted shrink-0" />
          : <ChevronRight size={15} className="text-text-muted shrink-0" />}
      </button>
      {open && <div className="p-3 bg-background/40">{children}</div>}
    </div>
  );
}

/* ── Compact List Row (used inside group sections) ─────────────── */
function CompactRow({ bookmark, onDelete, onToggleFavorite, onEdit, allTags }) {
  const { deleting, favoriting, handleDelete, handleFavorite } =
    useBookmarkActions(bookmark, onDelete, onToggleFavorite);
  const d = domain(bookmark.url);

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-card transition-colors">
      <SiteIcon bookmark={bookmark} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-text-primary text-sm font-medium truncate">{bookmark.title || d}</span>
          {bookmark.is_favorite && <Star size={10} className="text-warning shrink-0" fill="currentColor" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-text-muted text-[11px] truncate">{d}</span>
          {bookmark.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0 rounded-full font-medium"
              style={{ backgroundColor: `${tagColor(tag, allTags)}20`, color: tagColor(tag, allTags) }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Actions
          bookmark={bookmark} onDelete={handleDelete}
          onToggleFavorite={handleFavorite} onEdit={onEdit}
          deleting={deleting} favoriting={favoriting}
        />
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────────────────────────── */
function EmptyState({ hasFilter, onClear, favoritesOnly }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
      <BookmarkX size={40} className="text-border" />
      <p className="text-sm">
        {hasFilter
          ? "No bookmarks match your filter."
          : favoritesOnly
          ? "No starred bookmarks yet. Star a bookmark to see it here!"
          : "No bookmarks yet. Save your first one!"}
      </p>
      {hasFilter && (
        <button onClick={onClear} className="text-accent text-xs hover:underline">Clear filters</button>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */
export default function AllBookmarks({ favoritesOnly = false }) {
  const [searchParams] = useSearchParams();

  const [bookmarks, setBookmarks]         = useState([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [search, setSearch]               = useState(() => searchParams.get("search") || "");
  const [activeTag, setActiveTag]         = useState(() => searchParams.get("tag") || "");
  const [smartFilter, setSmartFilter]     = useState(() => searchParams.get("filter") || "");
  const [viewMode, setViewMode]           = useState("card");
  const [sort, setSort]                   = useState("newest");
  const [sortOpen, setSortOpen]           = useState(false);
  const [filterOpen, setFilterOpen]       = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);

  /* ── Fetch (auto-paginate up to backend max of 100/page) ── */
  const fetchBookmarks = useCallback(async (q, tag) => {
    setLoading(true);
    setError("");
    try {
      const all = [];
      let page = 1;
      let totalCount = 0;
      while (true) {
        const params = new URLSearchParams({ page, pageSize: 100 });
        if (q)           params.set("search", q);
        if (tag)         params.set("tag", tag);
        if (favoritesOnly) params.set("favorite", "true");
        const res  = await fetch(`/api/bookmarks?${params}`, { credentials: "include" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load bookmarks");
        all.push(...json.data);
        totalCount = json.total ?? all.length;
        if (!json.hasMore) break;
        page++;
      }
      setBookmarks(all);
      setTotal(totalCount);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [favoritesOnly]);

  // Sync URL params → local state when sidebar navigates here
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
    setActiveTag(searchParams.get("tag") || "");
    setSmartFilter(searchParams.get("filter") || "");
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => fetchBookmarks(search, activeTag), 300);
    return () => clearTimeout(t);
  }, [search, activeTag, fetchBookmarks]);

  /* ── Mutations ── */
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

  /* ── Derived data ── */
  const sorted   = useMemo(() => applySort(bookmarks, sort), [bookmarks, sort]);
  const allTags  = useMemo(() => [...new Set(bookmarks.flatMap((b) => b.tags || []))], [bookmarks]);

  // Smart filter applied on top of sort
  const smartFiltered = useMemo(() => {
    if (!smartFilter) return sorted;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    switch (smartFilter) {
      case "no-tags":   return sorted.filter((b) => !b.tags?.length);
      case "this-week": return sorted.filter((b) => new Date(b.created_at) > weekAgo);
      case "videos":    return sorted.filter((b) => isVideoUrl(b.url));
      case "broken":
        return sorted.filter((b) => {
          // Malformed URL
          try { new URL(b.url); } catch { return true; }
          // No metadata was ever fetched — likely dead when saved
          if (!b.title && !b.description && !b.favicon) return true;
          // Known-bad title patterns from scrapers that fail
          const t = (b.title || "").toLowerCase();
          if (t === "website" || t === "untitled" || t === b.url || t === "") return true;
          return false;
        });
      default:           return sorted;
    }
  }, [sorted, smartFilter]);

  // Folder view: group by first tag (or "Uncategorized")
  const folderGroups = useMemo(() => {
    const map = {};
    for (const b of smartFiltered) {
      const key = b.tags?.[0] ?? "__none__";
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return Object.entries(map).sort((a, b) => {
      if (a[0] === "__none__") return 1;
      if (b[0] === "__none__") return -1;
      return b[1].length - a[1].length;
    });
  }, [smartFiltered]);

  // Tag view: group by each tag (bookmarks may appear in multiple groups)
  const tagGroups = useMemo(() => {
    const map = {};
    for (const b of smartFiltered) {
      if (!b.tags?.length) {
        if (!map["__none__"]) map["__none__"] = [];
        map["__none__"].push(b);
      } else {
        for (const tag of b.tags) {
          if (!map[tag]) map[tag] = [];
          map[tag].push(b);
        }
      }
    }
    return Object.entries(map).sort((a, b) => {
      if (a[0] === "__none__") return 1;
      if (b[0] === "__none__") return -1;
      return b[1].length - a[1].length;
    });
  }, [smartFiltered]);

  const hasFilter = !!(search || activeTag || smartFilter);

  /* ── Render views ── */
  function renderCard() {
    if (!smartFiltered.length) return <EmptyState hasFilter={hasFilter} onClear={() => { setSearch(""); setActiveTag(""); setSmartFilter(""); }} favoritesOnly={favoritesOnly} />;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {smartFiltered.map((b) => (
          <BookmarkCard key={b.id} bookmark={b}
            onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onEdit={setEditingBookmark} />
        ))}
      </div>
    );
  }

  function renderTable() {
    if (!smartFiltered.length) return <EmptyState hasFilter={hasFilter} onClear={() => { setSearch(""); setActiveTag(""); setSmartFilter(""); }} favoritesOnly={favoritesOnly} />;
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider">Bookmark</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Tags</th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Added</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {smartFiltered.map((b, i) => (
                <TableRow key={b.id} bookmark={b} isOdd={i % 2 === 1}
                  onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onEdit={setEditingBookmark} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderGroups(groups, groupIcon, isTag = false) {
    if (!groups.length) return <EmptyState hasFilter={hasFilter} onClear={() => { setSearch(""); setActiveTag(""); setSmartFilter(""); }} favoritesOnly={favoritesOnly} />;
    return (
      <div className="space-y-3">
        {groups.map(([key, items], gi) => {
          const label = key === "__none__" ? "Uncategorized" : key;
          const color = key === "__none__" ? "#888" : TAG_COLORS[gi % TAG_COLORS.length];
          return (
            <GroupSection key={key} title={label} count={items.length} color={color} icon={groupIcon} defaultOpen={gi < 3}>
              <div className="space-y-0.5">
                {items.map((b) => (
                  <CompactRow key={b.id} bookmark={b} allTags={allTags}
                    onDelete={handleDelete} onToggleFavorite={handleToggleFavorite} onEdit={setEditingBookmark} />
                ))}
              </div>
            </GroupSection>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-6 py-3 border-b border-border space-y-3">

        {/* Row 1: search + controls */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text" value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookmarks…"
              className="w-full bg-card border border-border text-text-primary placeholder-text-muted rounded-md pl-10 pr-8 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tag filter toggle (mobile) */}
          {allTags.length > 0 && (
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs font-medium transition-all ${
                filterOpen || activeTag
                  ? "bg-accent/15 border-accent/40 text-accent"
                  : "bg-card border-border text-text-muted hover:text-text-primary"
              }`}
            >
              <SlidersHorizontal size={13} />
              Filter
              {activeTag && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
            </button>
          )}

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen((o) => !o)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-card border border-border text-text-muted hover:text-text-primary text-xs font-medium transition-all whitespace-nowrap"
            >
              <ArrowUpDown size={13} />
              <span className="hidden sm:inline">{SORT_OPTIONS.find((s) => s.key === sort)?.label}</span>
              <span className="sm:hidden">Sort</span>
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-card border border-border rounded-md shadow-card-hover overflow-hidden min-w-[160px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSort(opt.key); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors ${
                        sort === opt.key
                          ? "bg-accent/15 text-accent"
                          : "text-text-secondary hover:bg-card-hover hover:text-text-primary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-card border border-border rounded-md overflow-hidden shrink-0">
            {VIEW_MODES.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                title={label}
                className={`p-2 transition-all ${
                  viewMode === key
                    ? "bg-accent/20 text-accent"
                    : "text-text-muted hover:text-text-primary hover:bg-card-hover"
                }`}
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          {/* Count */}
          <span className="text-text-muted text-xs whitespace-nowrap ml-auto hidden sm:block">
            {smartFilter ? smartFiltered.length : total} bookmark{(smartFilter ? smartFiltered.length : total) !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Row 2: tag chips (desktop always visible, mobile toggleable) */}
        {allTags.length > 0 && (
          <div className={`${filterOpen ? "flex" : "hidden md:flex"} items-center gap-1.5 overflow-x-auto no-scrollbar`}>
            <Filter size={12} className="text-text-muted shrink-0" />
            <button
              onClick={() => setActiveTag("")}
              className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all ${
                !activeTag
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "bg-card border-border text-text-muted hover:border-accent/30"
              }`}
            >
              All
            </button>
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
            <span className="ml-auto shrink-0 text-text-muted text-xs sm:hidden">
              {total} bookmark{total !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5">

        {/* Smart filter banner */}
        {smartFilter && SMART_FILTER_LABELS[smartFilter] && (
          <div className="flex items-center gap-2 text-xs bg-accent/8 border border-accent/20 text-accent rounded-md px-3 py-2 mb-4">
            <Filter size={12} className="shrink-0" />
            <span className="flex-1">Showing: <strong>{SMART_FILTER_LABELS[smartFilter]}</strong></span>
            <button
              onClick={() => setSmartFilter("")}
              className="text-accent/60 hover:text-accent transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-error text-sm bg-error/10 border border-error/20 rounded-md px-4 py-3 mb-4">
            {error}
            <button onClick={() => fetchBookmarks(search, activeTag)} className="ml-auto text-text-muted hover:text-text-primary">
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-48 gap-3 text-text-muted">
            <Loader2 size={24} className="animate-spin text-accent" />
            <span className="text-sm">Loading bookmarks…</span>
          </div>
        )}

        {/* Views */}
        {!loading && !error && (
          <>
            {viewMode === "card"   && renderCard()}
            {viewMode === "table"  && renderTable()}
            {viewMode === "folder" && renderGroups(folderGroups, Folder)}
            {viewMode === "tag"    && renderGroups(tagGroups, Hash, true)}
          </>
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
