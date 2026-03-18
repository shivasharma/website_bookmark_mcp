import React, { useState, useEffect } from "react";
import {
  Tag, TrendingUp, TrendingDown, ExternalLink, Zap,
  Activity, BarChart2, Loader2, Upload, Sparkles,
  RefreshCw, Bell, BookOpen, CheckCircle2,
  AlertTriangle, Brain, Copy, Radio, Lightbulb,
} from "lucide-react";

/* ─── Sparkline ─────────────────────────────────────────────────── */
function Sparkline({ points, color }) {
  const w = 120, h = 48;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const min = Math.min(...points), max = Math.max(...points);
  const ys = points.map((p) => h - ((p - min) / (max - min || 1)) * (h - 8) - 4);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fill-${color.replace("#", "")})`} />
      <path d={d} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Donut Chart ────────────────────────────────────────────────── */
function DonutChart({ web, video, total }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const t = total || 1;
  const webDash = (web / t) * circ;
  const videoDash = (video / t) * circ;
  const webAngle = (web / t) * 360;

  return (
    <svg viewBox="0 0 80 80" className="w-28 h-28 shrink-0">
      {/* Track */}
      <circle cx="40" cy="40" r={r} fill="none" className="stroke-border" strokeWidth="9" />
      {/* Web segment */}
      {web > 0 && (
        <circle cx="40" cy="40" r={r} fill="none" className="stroke-accent" strokeWidth="9"
          strokeDasharray={`${webDash} ${circ}`}
          transform="rotate(-90 40 40)"
        />
      )}
      {/* Video segment */}
      {video > 0 && (
        <circle cx="40" cy="40" r={r} fill="none" stroke="#8250df" strokeWidth="9"
          strokeDasharray={`${videoDash} ${circ}`}
          transform={`rotate(${-90 + webAngle} 40 40)`}
        />
      )}
      {/* Center label */}
      <text x="40" y="36" textAnchor="middle" className="fill-text-primary" fontSize="11" fontWeight="700">{total}</text>
      <text x="40" y="48" textAnchor="middle" className="fill-text-muted" fontSize="6.5">total links</text>
    </svg>
  );
}

/* ─── Constants ─────────────────────────────────────────────────── */
const TAG_COLORS = ["#0969da", "#8250df", "#cf222e", "#1a7f37", "#9a6700", "#0550ae"];
const VIDEO_RE = /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv|loom\.com|wistia\.com|rumble\.com/i;
const AI_PROMPT = "Analyze my unread bookmarks from the last 7 days and suggest the top 5 I should read today based on my past reading behavior.";

function makeSpark(count) {
  return [0.15, 0.25, 0.2, 0.38, 0.45, 0.55, 0.65, 0.75, 0.88, 1].map(
    (r) => Math.max(1, Math.round(r * count))
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function isVideoUrl(url) {
  try { return VIDEO_RE.test(new URL(url).hostname); } catch { return false; }
}

/* ─── Collection Card ───────────────────────────────────────────── */
function CollectionCard({ c }) {
  return (
    <div className="card-glow-border relative bg-card rounded-md border border-border overflow-hidden hover:border-border-light hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-200 cursor-pointer">
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-text-secondary text-xs font-medium mb-0.5 truncate max-w-[120px]">{c.label}</div>
            <div className="text-text-primary text-2xl font-bold">{c.count}</div>
            <div className="text-text-muted text-[10px] mt-0.5">bookmarks</div>
          </div>
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md ${c.up ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>
            {c.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(c.trend)}%
          </span>
        </div>
        <div className="text-[10px] font-medium" style={{ color: c.color }}>{c.delta}</div>
      </div>
      <div className="h-12"><Sparkline points={c.spark} color={c.color} /></div>
    </div>
  );
}

/* ─── Feature Card ──────────────────────────────────────────────── */
function FeatureCard({ f }) {
  const Icon = f.icon;
  // Only the first feature is primary, others are secondary
  const isPrimary = f.label === "Import Bookmarks";
  return (
    <div className="flex flex-col bg-card border border-border rounded-md p-5 hover:border-accent/50 transition-all duration-200">
      <div className="w-10 h-10 rounded-md bg-border flex items-center justify-center mb-4 transition-colors">
        <Icon size={18} className="text-accent group-hover:text-accent2 transition-colors" />
      </div>
      <h3 className="text-text-primary text-sm font-bold mb-1.5">{f.label}</h3>
      <p className="text-text-secondary text-xs leading-relaxed mb-4 flex-1">{f.description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {f.sources.map((s) => (
          <span key={s} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-card border border-border text-text-secondary font-medium">
            <CheckCircle2 size={8} className="text-success" />{s}
          </span>
        ))}
      </div>
      {isPrimary ? (
        <button className="w-full text-xs font-semibold py-2 rounded-md bg-accent text-white hover:bg-accent/90 transition-all">
          {f.cta}
        </button>
      ) : (
        <button className="w-full text-xs font-semibold py-2 rounded-md border border-border text-text-primary bg-transparent hover:bg-border/40 transition-all">
          {f.cta}
        </button>
      )}
    </div>
  );
}

const features = [
  {
    icon: Upload, label: "Import Bookmarks",
    description: "Bring all your bookmarks from Chrome, Firefox, Safari, Pocket, and Raindrop in one click.",
    cta: "Import Now", sources: ["Chrome", "Firefox", "Safari", "Pocket"],
  },
  {
    icon: Sparkles, label: "AI Auto-Tagging",
    description: "Let AI automatically read, categorize, and tag every bookmark you save based on content.",
    cta: "Enable AI", sources: ["Auto-categorize", "Smart tags", "Content scan"],
  },
  {
    icon: RefreshCw, label: "Real-time Sync",
    description: "Every bookmark you save is instantly synced across all your devices — no delays, no conflicts.",
    cta: "Set Up Sync", sources: ["Desktop", "Mobile", "Browser ext."],
  },
  {
    icon: Bell, label: "Smart Reminders",
    description: "Never forget an important link. Set reminders and get notified at the right time.",
    cta: "Set Reminders", sources: ["Daily digest", "Read later", "Custom alerts"],
  },
];

/* ─── Main export ───────────────────────────────────────────────── */
export default function Dashboard() {
  const [collections, setCollections]     = useState([]);
  const [totalBookmarks, setTotalBookmarks] = useState(null);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [syncWindow, setSyncWindow]       = useState("7 Days");

  const [videoCount, setVideoCount]               = useState(0);
  const [webCount, setWebCount]                   = useState(0);
  const [staleLinks, setStaleLinks]               = useState([]);
  const [staleAlertDismissed, setStaleAlertDismissed] = useState(false);
  const [focusQueue, setFocusQueue]               = useState([]);
  const [activityFeed, setActivityFeed]           = useState([]);
  const [promptCopied, setPromptCopied]           = useState(false);

  function copyPrompt() {
    navigator.clipboard?.writeText(AI_PROMPT).catch(() => {});
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  useEffect(() => {
    async function loadStats() {
      try {
        const all = [];
        let page = 1;
        while (true) {
          const res  = await fetch(`/api/bookmarks?page=${page}&pageSize=100`, { credentials: "include" });
          const json = await res.json();
          if (!json.success) break;
          all.push(...json.data);
          if (!json.hasMore) { setTotalBookmarks(json.total ?? all.length); break; }
          page++;
        }

        const total = all.length;

        /* ── Tag collections ──────────────────────────────────── */
        const counts = {};
        for (const b of all) {
          for (const tag of b.tags || []) counts[tag] = (counts[tag] || 0) + 1;
        }
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([label, count], i) => ({
            label, count,
            trend: parseFloat(((count / Math.max(total, 1)) * 100).toFixed(1)),
            up: true,
            color: TAG_COLORS[i % TAG_COLORS.length],
            spark: makeSpark(count),
            delta: `${count} of ${total} bookmarks`,
          }));
        setCollections(sorted);

        /* ── Video vs Web ratio ───────────────────────────────── */
        const vids = all.filter((b) => isVideoUrl(b.url));
        setVideoCount(vids.length);
        setWebCount(total - vids.length);

        /* ── Stale links (90+ days old) ──────────────────────── */
        const staleThreshold = Date.now() - 90 * 24 * 60 * 60 * 1000;
        const stale = all
          .filter((b) => new Date(b.created_at) < staleThreshold)
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .slice(0, 5);
        setStaleLinks(stale);

        /* ── Focus Queue ─────────────────────────────────────── */
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentUnread = all
          .filter((b) => new Date(b.created_at) >= sevenDaysAgo && !b.is_favorite)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const queue = recentUnread.length >= 3
          ? recentUnread.slice(0, 5)
          : all.filter((b) => !b.is_favorite)
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .slice(0, 5);
        setFocusQueue(queue);

        /* ── Live Activity Feed ──────────────────────────────── */
        const recentAdded = [...all]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4);
        const feed = recentAdded.map((b, i) => {
          const domain = getDomain(b.url);
          const raw    = b.title || domain;
          const title  = raw.length > 32 ? raw.slice(0, 32) + "…" : raw;
          return { label: `Added "${title}"`, time: timeAgo(b.created_at), color: TAG_COLORS[i % TAG_COLORS.length], live: i === 0 };
        });
        if (vids.length > 0) {
          feed.push({ label: `${vids.length} video link${vids.length !== 1 ? "s" : ""} in library`, time: "Library", color: "#8250df", live: false });
        }
        setActivityFeed(feed.slice(0, 5));

      } catch { /* ignore */ }
      finally { setLoadingStats(false); }
    }
    loadStats();
  }, []);


  return (
    <div className="min-h-full space-y-8 animate-fade-in px-2 md:px-0">
      {/* ── Analytics Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <div className="bg-card rounded-md shadow-card p-5 flex flex-col gap-2 border border-border">
          <span className="text-[13px] text-text-muted font-medium">Total Bookmarks</span>
          <span className="text-3xl font-bold text-text-primary">{totalBookmarks ?? '—'}</span>
        </div>
        <div className="bg-card rounded-md shadow-card p-5 flex flex-col gap-2 border border-border">
          <span className="text-[13px] text-text-muted font-medium">New This Week</span>
          <span className="text-3xl font-bold text-accent">{collections.reduce((a, c) => a + c.count, 0)}</span>
        </div>
        <div className="bg-card rounded-md shadow-card p-5 flex flex-col gap-2 border border-border">
          <span className="text-[13px] text-text-muted font-medium">Starred</span>
          <span className="text-3xl font-bold text-success">{focusQueue.length}</span>
        </div>
        <div className="bg-card rounded-md shadow-card p-5 flex flex-col gap-2 border border-border">
          <span className="text-[13px] text-text-muted font-medium">Stale Links</span>
          <span className="text-3xl font-bold text-warning">{staleLinks.length}</span>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-text-primary mr-4">Dashboard</h1>
        <div className="flex gap-2">
          {["All", "Starred", "Unread", "Videos", "Articles"].map((f) => (
            <button key={f} className="px-4 py-1.5 rounded-full text-sm font-medium border border-border bg-card text-text-secondary hover:bg-accent hover:text-white transition-all">
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-1.5 rounded-md bg-accent text-white font-semibold shadow-glow hover:bg-accent2 transition-all">Add Bookmark</button>
          <button className="px-4 py-1.5 rounded-md border border-border text-text-primary font-semibold hover:bg-card-hover transition-all">Export</button>
        </div>
      </div>

      {/* ── Top Collections ───────────────────────────────────────── */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={17} className="text-accent" />
              <h2 className="text-base font-bold text-text-primary">Top Collections</h2>
            </div>
            <p className="text-text-muted text-xs">Your most-used tags ranked by bookmark count</p>
          </div>
          <a href="/allbookmarks" className="text-xs text-text-secondary hover:text-accent transition-colors font-medium shrink-0">View all →</a>
        </div>

        {loadingStats ? (
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-md border border-border bg-card h-28 flex items-center justify-center">
                <Loader2 size={18} className="animate-spin text-accent" />
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-md border border-border bg-card h-28 flex flex-col items-center justify-center gap-2 text-text-muted">
            <Tag size={22} className="text-border" />
            <p className="text-xs">No tags yet — add tags to your bookmarks to see collections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {collections.map((c) => <CollectionCard key={c.label} c={c} />)}
          </div>
        )}
      </div>

      {/* ── Command Center: Donut + Focus Queue ───────────────────── */}
      <div>
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={17} className="text-accent" />
            <h2 className="text-base font-bold text-text-primary">Command Center</h2>
          </div>
          <p className="text-text-muted text-xs">What to read today and how your library is shaped</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Library Composition Donut */}
        <div className="bg-card rounded-md border border-border p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-accent to-accent2 flex items-center justify-center shrink-0">
              <BarChart2 size={13} className="text-white" />
            </div>
            <div>
              <span className="text-text-primary text-sm font-semibold block leading-tight">Library Composition</span>
              <span className="text-text-muted text-[10px]">Web vs video breakdown</span>
            </div>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center h-28">
              <Loader2 size={18} className="animate-spin text-accent" />
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart web={webCount} video={videoCount} total={totalBookmarks || 0} />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                    <span className="text-text-secondary text-xs">Web Links</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-primary text-sm font-bold">{webCount}</span>
                    {totalBookmarks > 0 && (
                      <span className="text-text-muted text-[10px] ml-1.5">
                        {Math.round((webCount / totalBookmarks) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#8250df" }} />
                    <span className="text-text-secondary text-xs">Video Links</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-primary text-sm font-bold">{videoCount}</span>
                    {totalBookmarks > 0 && (
                      <span className="text-text-muted text-[10px] ml-1.5">
                        {Math.round((videoCount / totalBookmarks) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-text-muted text-[10px] leading-relaxed">
                    {videoCount === 0
                      ? "No video links detected yet. YouTube, Vimeo, Twitch and more are auto-detected."
                      : videoCount > webCount
                      ? "Heavy video library — consider organizing by channel or series."
                      : "Mostly web articles and docs."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Focus Queue */}
        <div className="bg-card rounded-md border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-tr from-accent to-accent2">
                <Lightbulb size={13} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-text-primary text-sm font-semibold leading-tight">Focus Queue</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-semibold">AI</span>
                </div>
                <span className="text-text-muted text-[10px]">Your top reads for today</span>
              </div>
            </div>
          </div>

          {loadingStats ? (
            <div className="flex items-center justify-center h-28">
              <Loader2 size={18} className="animate-spin text-accent" />
            </div>
          ) : focusQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2 text-text-muted">
              <BookOpen size={22} className="text-border" />
              <p className="text-xs text-center">No unread bookmarks. You're all caught up!</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {focusQueue.slice(0, 4).map((b, i) => {
                const domain = getDomain(b.url);
                const title  = b.title || domain;
                return (
                  <li key={b.id}>
                    <a href={b.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 group hover:bg-card-hover rounded-md px-2 py-1.5 -mx-2 transition-all">
                      <span className="text-text-muted text-[10px] w-4 shrink-0 font-bold tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-text-secondary text-xs truncate group-hover:text-text-primary transition-colors">{title}</p>
                        <p className="text-text-muted text-[10px]">{domain}</p>
                      </div>
                      <ExternalLink size={11} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                  </li>
                );
              })}
            </ul>
          )}

          {/* AI prompt suggestion */}
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start gap-2 bg-background rounded-md p-2.5">
              <Brain size={12} className="text-accent shrink-0 mt-0.5" />
              <p className="text-text-muted text-[10px] leading-relaxed flex-1 italic">"{AI_PROMPT}"</p>
              <button onClick={copyPrompt}
                title="Copy AI prompt"
                className="text-text-muted hover:text-accent transition-colors shrink-0 ml-1">
                {promptCopied
                  ? <CheckCircle2 size={12} className="text-success" />
                  : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* ── Stale Links Alert ─────────────────────────────────────── */}
      {!staleAlertDismissed && staleLinks.length > 0 && (
        <div className="bg-card rounded-md border border-warning/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={13} className="text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-text-primary text-xs font-semibold">Stale Links Detected</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/15 text-warning font-semibold">{staleLinks.length}</span>
                </div>
                <button onClick={() => setStaleAlertDismissed(true)}
                  className="text-text-muted hover:text-text-primary text-[10px] transition-colors shrink-0">
                  Dismiss
                </button>
              </div>
              <p className="text-text-muted text-[11px] mb-3">
                These bookmarks haven't been revisited in 90+ days and may be outdated or broken. Consider archiving or deleting them.
              </p>
              <div className="space-y-1.5">
                {staleLinks.slice(0, 3).map((b) => {
                  const domain = getDomain(b.url);
                  return (
                    <div key={b.id} className="flex items-center gap-2 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning/60 shrink-0" />
                      <p className="text-text-secondary text-[11px] truncate flex-1 min-w-0">{b.title || domain}</p>
                      <span className="text-text-muted text-[10px] shrink-0">
                        {new Date(b.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                      </span>
                      <a href={b.url} target="_blank" rel="noopener noreferrer"
                        className="text-text-muted hover:text-accent2 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  );
                })}
                {staleLinks.length > 3 && (
                  <p className="text-text-muted text-[10px] pt-1">
                    +{staleLinks.length - 3} more stale link{staleLinks.length - 3 !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Command Center Panel ──────────────────────────────── */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio size={17} className="text-accent" />
              <h2 className="text-base font-bold text-text-primary">Live Command Center</h2>
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-semibold ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                LIVE
              </span>
            </div>
            <p className="text-text-muted text-xs">AI sorting, sync status, and real-time activity</p>
          </div>
        </div>

        <div className="bg-card rounded-md border border-border overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">

            {/* Smart Collections */}
            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-accent to-accent2 flex items-center justify-center shrink-0">
                  <Zap size={13} className="text-white" />
                </div>
                <div>
                  <span className="text-text-primary text-sm font-semibold block leading-tight">Smart Collections</span>
                  <span className="text-text-muted text-[10px]">AI-powered organization</span>
                </div>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed mb-4">
                Let AI auto-organize your bookmarks into collections based on topic and tags.
              </p>
              <button className="w-full text-xs font-semibold py-2 rounded-md bg-accent text-white hover:bg-accent/90 transition-all mb-2">
                Enable AI Sorting
              </button>
              <button className="w-full border border-border text-text-secondary text-xs font-medium py-2 rounded-md hover:border-border-light hover:text-text-primary transition-all">
                Import from Browser
              </button>
            </div>

            {/* Sync Window */}
            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <RefreshCw size={15} className="text-accent" />
                <div>
                  <span className="text-text-primary text-sm font-semibold block leading-tight">Sync Window</span>
                  <span className="text-text-muted text-[10px]">Choose your sync range</span>
                </div>
              </div>
              <div className="flex gap-1.5 mb-3">
                {["7 Days", "30 Days", "All Time"].map((t) => (
                  <button key={t} onClick={() => setSyncWindow(t)}
                    className={`flex-1 text-[10px] py-1.5 rounded-md font-medium transition-all ${
                      syncWindow === t
                        ? "bg-accent/15 text-accent border border-accent/25"
                        : "bg-background border border-border text-text-muted hover:text-text-primary"
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="relative h-1.5 bg-border rounded-full overflow-hidden mb-1.5">
                <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent to-accent2 rounded-full transition-all"
                  style={{ width: syncWindow === "7 Days" ? "33%" : syncWindow === "30 Days" ? "66%" : "100%" }} />
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted text-[9px]">Mar 1</span>
                <span className="text-text-muted text-[9px]">Mar 17</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                {[
                  { label: "Synced",  value: loadingStats ? "…" : (totalBookmarks ?? "—") },
                  { label: "Pending", value: "0" },
                ].map((s) => (
                  <div key={s.label} className="bg-background rounded-md p-2 text-center">
                    <div className="text-text-primary text-sm font-bold">{s.value}</div>
                    <div className="text-text-muted text-[10px]">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <Radio size={15} className="text-accent" />
                <div className="flex-1">
                  <span className="text-text-primary text-sm font-semibold block leading-tight">Live Activity</span>
                  <span className="text-text-muted text-[10px]">Real-time library events</span>
                </div>
                {!loadingStats && activityFeed.length > 0 && (
                  <span className="flex items-center gap-1 text-[9px] text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                    syncing
                  </span>
                )}
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 size={16} className="animate-spin text-accent" />
                </div>
              ) : activityFeed.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4 text-text-muted">
                  <Activity size={20} className="text-border" />
                  <p className="text-[11px]">No activity yet</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {activityFeed.map((a, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="relative mt-1.5 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                        {a.live && (
                          <div className="absolute inset-0 rounded-full animate-ping"
                            style={{ backgroundColor: a.color, opacity: 0.6 }} />
                        )}
                      </div>
                      <div>
                        <div className="text-text-secondary text-[11px] leading-snug">{a.label}</div>
                        <div className="text-text-muted text-[10px] mt-0.5">{a.time}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Feature Showcase ──────────────────────────────────────── */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={17} className="text-accent" />
              <h2 className="text-base font-bold text-text-primary">Powerful Features</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold border border-accent/20">NEW</span>
            </div>
            <p className="text-text-muted text-xs">Import, organize, sync, and never miss a link</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => <FeatureCard key={f.label} f={f} />)}
        </div>
      </div>

    </div>
  );
}
