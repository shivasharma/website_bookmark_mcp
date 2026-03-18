import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Star, Upload, Bell, HeartPulse, Cpu,
  Zap, Settings, Search, Play, Link2,
  ChevronDown, ChevronRight, Hash,
  Calendar, BookmarkX, AlertTriangle, GripVertical,
  X, Sparkles,
} from "lucide-react";
import { NavLink, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useSidebarData } from "../hooks/useSidebarData";
import { getVideoPlatform, getVideoThumbnail } from "../lib/videoUtils";

/* ── Section group header (collapsible) ─────────────────────── */
function SectionHeader({ label, expanded, onToggle, count }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-card transition-colors"
    >
      <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold flex-1 text-left">
        {label}
      </span>
      {count != null && (
        <span className="text-[10px] text-text-muted bg-border/60 px-1.5 py-0.5 rounded font-medium">
          {count}
        </span>
      )}
      {expanded
        ? <ChevronDown size={12} className="text-text-muted shrink-0" />
        : <ChevronRight size={12} className="text-text-muted shrink-0" />}
    </button>
  );
}

/* ── Nav item ───────────────────────────────────────────────── */
function NavItem({ icon: Icon, label, to, count, status, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-150 text-[13px] group ` +
        (isActive
          ? "font-semibold text-accent"
          : "font-medium text-text-secondary hover:text-text-primary")
      }
      style={{ borderLeft: '2px solid transparent' }}
    >
      {({ isActive }) => (
        <>
          {/* Pill indicator */}
          {isActive && (
            <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-accent" style={{ width: '2px' }} />
          )}
          <Icon
            size={16}
            className={`shrink-0 transition-colors ${
              isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
            }`}
            strokeWidth={isActive ? 2.5 : 1.5}
            fill={isActive ? "currentColor" : "none"}
          />
          <span className="flex-1 truncate">{label}</span>
          {count != null && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
              isActive ? "bg-accent/10 text-accent" : "bg-border text-text-muted"
            }`}>
              {count}
            </span>
          )}
          {status === "live" && (
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── Smart filter item ──────────────────────────────────────── */
function SmartFilterItem({ icon: Icon, label, to, count, iconClass = "text-text-muted", onClick }) {
  const location = useLocation();

  // Compute active state based on full URL match (pathname + filter param)
  const [toPath, toQuery] = to.split("?");
  const toParams   = new URLSearchParams(toQuery || "");
  const curParams  = new URLSearchParams(location.search);
  const isActive   =
    location.pathname === toPath &&
    curParams.get("filter") === toParams.get("filter") &&
    curParams.get("tag")    === (toParams.get("tag") ?? null);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={() =>
        `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all text-[12px] font-medium group ${
          isActive
            ? "bg-accent/12 text-accent border border-accent/20"
            : "text-text-secondary hover:bg-card hover:text-text-primary border border-transparent"
        }`
      }
    >
      <Icon size={13} className={`shrink-0 ${isActive ? "text-accent" : iconClass}`} />
      <span className="flex-1 truncate">{label}</span>
      {count != null && (
        <span className="text-[10px] text-text-muted bg-border/60 px-1.5 py-0.5 rounded font-medium">
          {count}
        </span>
      )}
    </NavLink>
  );
}

/* ── Video bookmark item ────────────────────────────────────── */
function VideoItem({ bookmark }) {
  const platform = getVideoPlatform(bookmark.url);
  const thumb    = getVideoThumbnail(bookmark.url);
  const title    = bookmark.title || bookmark.url;

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card transition-colors group"
    >
      <div className="relative w-11 h-7 rounded-md overflow-hidden shrink-0 bg-card-hover border border-border flex items-center justify-center">
        {thumb
          ? <img src={thumb} alt="" className="w-full h-full object-cover" />
          : <Play size={12} className="text-text-muted" />}
        {platform && (
          <span
            className="absolute bottom-0 right-0 text-[7px] font-bold text-white px-0.5 rounded-tl leading-[1.4]"
            style={{ backgroundColor: platform.color }}
          >
            {platform.label[0]}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-text-primary truncate leading-snug">{title}</div>
        {platform && (
          <div className="text-[10px] text-text-muted mt-0.5">{platform.label}</div>
        )}
      </div>
    </a>
  );
}

/* ── Tag folder item with drag-and-drop ─────────────────────── */
function TagFolderItem({ tag, isDragOver, onDragStart, onDragOver, onDragEnd, onDrop, onClose }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tag.name)}
      onDragOver={(e) => onDragOver(e, tag.name)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, tag.name)}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all group ${
        isDragOver
          ? "bg-accent/10 border border-accent/30"
          : "border border-transparent hover:bg-card"
      }`}
    >
      <GripVertical
        size={11}
        className="text-transparent group-hover:text-text-muted/50 cursor-grab active:cursor-grabbing shrink-0 transition-colors"
      />
      <NavLink
        to={`/allbookmarks?tag=${encodeURIComponent(tag.name)}`}
        onClick={onClose}
        className="flex-1 flex items-center gap-2 min-w-0"
      >
        {({ isActive }) => (
          <>
            <Hash size={12} className={`shrink-0 ${isActive ? "text-accent" : "text-accent/50"}`} />
            <span className={`text-[12px] truncate ${isActive ? "text-accent font-medium" : "text-text-secondary group-hover:text-text-primary"}`}>
              {tag.name}
            </span>
            <span className="ml-auto text-[10px] text-text-muted shrink-0">{tag.count}</span>
          </>
        )}
      </NavLink>
    </div>
  );
}

/* ── Main Sidebar ───────────────────────────────────────────── */
export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { data, loading } = useSidebarData();

  const [sidebarSearch, setSidebarSearch] = useState("");
  const [sectSmartFilters, setSectSmartFilters] = useState(true);
  const [sectVideos,       setSectVideos]       = useState(true);
  const [sectTags,         setSectTags]         = useState(true);
  const [showAllTags,      setShowAllTags]       = useState(false);
  const [tagOrder,         setTagOrder]          = useState(null);
  const [dragOver,         setDragOver]          = useState(null);
  const draggingTag = useRef(null);

  useEffect(() => {
    if (data.topTags.length && !tagOrder) setTagOrder(data.topTags);
  }, [data.topTags, tagOrder]);

  const displayedTags = (tagOrder ?? data.topTags).slice(0, showAllTags ? 15 : 6);
  const extraTagCount = (tagOrder ?? data.topTags).length - 6;

  function handleSearchKey(e) {
    if (e.key === "Enter" && sidebarSearch.trim()) {
      navigate(`/allbookmarks?search=${encodeURIComponent(sidebarSearch.trim())}`);
      setSidebarSearch("");
      onClose();
    }
  }

  function onTagDragStart(e, name) {
    draggingTag.current = name;
    e.dataTransfer.effectAllowed = "move";
  }
  function onTagDragOver(e, name) { e.preventDefault(); setDragOver(name); }
  function onTagDragEnd() { setDragOver(null); draggingTag.current = null; }
  function onTagDrop(e, targetName) {
    e.preventDefault();
    const fromName = draggingTag.current;
    if (!fromName || fromName === targetName) { setDragOver(null); return; }
    setTagOrder((prev) => {
      const list = [...(prev ?? data.topTags)];
      const fromIdx = list.findIndex((t) => t.name === fromName);
      const toIdx   = list.findIndex((t) => t.name === targetName);
      const [moved] = list.splice(fromIdx, 1);
      list.splice(toIdx, 0, moved);
      return list;
    });
    setDragOver(null);
  }

  return (
    <aside className={`
      fixed md:relative inset-y-0 left-0 z-40
      h-screen w-[268px] shrink-0 glass-sidebar border-r border-border flex flex-col
      transform transition-transform duration-200 ease-in-out
      ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
    `}>

      {/* ── Logo ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border shrink-0">
        <div className="w-9 h-9 rounded-md bg-text-primary flex items-center justify-center shrink-0">
          <Zap className="text-background w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-[15px] tracking-tight text-text-primary block leading-tight">
            LinkSync AI
          </span>
          <span className="text-[10px] text-text-muted font-medium">Bookmark Manager</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-text-muted hover:text-text-primary rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-3.5 h-3.5 pointer-events-none" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="Search library…"
            className="w-full bg-background/60 border border-border text-text-primary placeholder-text-muted rounded-md pl-8 pr-8 py-2 text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all"
          />
          {sidebarSearch && (
            <button
              onClick={() => setSidebarSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={11} />
            </button>
          )}
        </div>
        <p className="text-[10px] text-text-muted mt-1.5 px-0.5">Press Enter to search</p>
      </div>

      {/* ── Scrollable nav ──────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">

        {/* LIBRARY */}
        <div className="mb-6">
          <div className="text-[10px] uppercase tracking-widest text-text-muted px-3 mb-3 font-bold">
            Library
          </div>
          <ul className="space-y-0.5">
            <li><NavItem icon={LayoutDashboard} label="Dashboard"     to="/dashboard"    onClick={onClose} /></li>
            <li><NavItem icon={Link2}           label="All Bookmarks" to="/allbookmarks" onClick={onClose} count={loading ? undefined : (data.total || undefined)} /></li>
            <li><NavItem icon={Star}            label="Starred"       to="/starred"      onClick={onClose} count={loading ? undefined : (data.starred || undefined)} /></li>
            <li><NavItem icon={Upload}          label="Import"        to="/import"       onClick={onClose} /></li>
            <li><NavItem icon={Bell}            label="Remind Me"     to="/remindme"       onClick={onClose} /></li>
          </ul>
        </div>

        {/* SMART FILTERS */}
        <div className="mb-5">
          <SectionHeader
            label="Smart Filters"
            expanded={sectSmartFilters}
            onToggle={() => setSectSmartFilters((o) => !o)}
          />
          {sectSmartFilters && (
            <ul className="space-y-0.5 mt-1">
              <li>
                <SmartFilterItem
                  icon={Calendar} label="Added This Week"
                  to="/allbookmarks?filter=this-week"
                  count={loading ? undefined : (data.thisWeek || undefined)}
                  iconClass="text-accent3"
                  onClick={onClose}
                />
              </li>
              <li>
                <SmartFilterItem
                  icon={BookmarkX} label="No Tags"
                  to="/allbookmarks?filter=no-tags"
                  count={loading ? undefined : (data.noTags || undefined)}
                  iconClass="text-warning"
                  onClick={onClose}
                />
              </li>
              <li>
                <SmartFilterItem
                  icon={Play} label="Video Links"
                  to="/allbookmarks?filter=videos"
                  count={loading ? undefined : (data.videos.length || undefined)}
                  iconClass="text-error"
                  onClick={onClose}
                />
              </li>
              <li>
                <SmartFilterItem
                  icon={AlertTriangle} label="Broken Links"
                  to="/allbookmarks?filter=broken"
                  iconClass="text-error"
                  onClick={onClose}
                />
              </li>
            </ul>
          )}
        </div>

        {/* VIDEO LINKS */}
        {(loading || data.videos.length > 0) && (
          <div className="mb-5">
            <SectionHeader
              label="Video Links"
              expanded={sectVideos}
              onToggle={() => setSectVideos((o) => !o)}
              count={data.videos.length || undefined}
            />
            {sectVideos && (
              <div className="mt-1 space-y-0.5">
                {loading ? (
                  <div className="px-3 py-3 text-[11px] text-text-muted">Loading…</div>
                ) : (
                  <>
                    {data.videos.slice(0, 4).map((v, i) => (
                      <VideoItem key={v.id ?? i} bookmark={v} />
                    ))}
                    {data.videos.length > 4 && (
                      <NavLink
                        to="/allbookmarks?filter=videos"
                        onClick={onClose}
                        className="block px-3 py-1.5 text-[11px] text-accent hover:text-accent2 transition-colors font-medium"
                      >
                        View all {data.videos.length} videos →
                      </NavLink>
                    )}
                    <button className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/15 hover:border-accent/30 hover:bg-accent/8 transition-all text-left">
                      <Sparkles size={11} className="text-accent shrink-0" />
                      <span className="text-[11px] text-text-secondary truncate">Ask AI about your videos…</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAG FOLDERS */}
        {(loading || displayedTags.length > 0) && (
          <div className="mb-5">
            <SectionHeader
              label="Tag Folders"
              expanded={sectTags}
              onToggle={() => setSectTags((o) => !o)}
              count={data.topTags.length || undefined}
            />
            {sectTags && (
              <div className="mt-1">
                {loading ? (
                  <div className="px-3 py-3 text-[11px] text-text-muted">Loading…</div>
                ) : (
                  <>
                    {displayedTags.map((tag) => (
                      <TagFolderItem
                        key={tag.name}
                        tag={tag}
                        isDragOver={dragOver === tag.name}
                        onDragStart={onTagDragStart}
                        onDragOver={onTagDragOver}
                        onDragEnd={onTagDragEnd}
                        onDrop={onTagDrop}
                        onClose={onClose}
                      />
                    ))}
                    {!showAllTags && extraTagCount > 0 && (
                      <button
                        onClick={() => setShowAllTags(true)}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-accent hover:text-accent2 transition-colors font-medium"
                      >
                        + {extraTagCount} more tags
                      </button>
                    )}
                    {showAllTags && (
                      <button
                        onClick={() => setShowAllTags(false)}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                      >
                        Show less
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* TOOLS */}
        <div className="pt-2 border-t border-border mt-2">
          <div className="text-[10px] uppercase tracking-widest text-text-muted px-3 mb-3 mt-3 font-bold">
            Tools
          </div>
          <ul className="space-y-0.5">
            <li><NavItem icon={HeartPulse} label="System Health" to="/systemhealth" status="live" onClick={onClose} /></li>
            <li><NavItem icon={Cpu}        label="MCP Integration Hub"     to="/mcp"          onClick={onClose} /></li>
          </ul>
        </div>

      </nav>

      {/* ── User footer ─────────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-border shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-card cursor-pointer transition-colors group">
          <div className="relative shrink-0">
            <img
              src="https://i.pravatar.cc/32?img=11"
              alt="Profile"
              className="rounded-full w-8 h-8 ring-2 ring-accent/20"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-success rounded-full border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-text-primary text-[13px] font-semibold truncate leading-tight">John Doe</div>
            <div className="text-text-muted text-[11px] truncate leading-tight mt-0.5">Pro Plan</div>
          </div>
          <Settings size={14} className="text-text-muted shrink-0 group-hover:text-text-secondary transition-colors" />
        </div>
      </div>

    </aside>
  );
}
