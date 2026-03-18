import React, { useEffect, useState } from "react";
import { fetchUrlMetadata, createBookmark, updateBookmark, deleteBookmark } from "../lib/bookmarkApi";

function groupByTime(bookmarks) {
  // Returns { section: [bookmarks] } for Just Now, Today, Yesterday, This Week, Earlier
  const now = new Date();
  const buckets = { "Just Now": [], "Today": [], "Yesterday": [], "This Week": [], "Earlier": [] };
  for (const b of bookmarks) {
    const created = new Date(b.created_at);
    const diffMs = now - created;
    const diffMin = diffMs / 60000;
    const diffHr = diffMin / 60;
    const diffDay = diffHr / 24;
    if (diffMin < 5) buckets["Just Now"].push(b);
    else if (created.toDateString() === now.toDateString()) buckets["Today"].push(b);
    else if (diffDay < 2 && created.getDate() === (new Date(now.getTime() - 86400000)).getDate()) buckets["Yesterday"].push(b);
    else if (diffDay < 7) buckets["This Week"].push(b);
    else buckets["Earlier"].push(b);
  }
  return buckets;
}

export default function Recent() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const all = [];
        let page = 1;
        while (true) {
          const res = await fetch(`/api/bookmarks?page=${page}&pageSize=100`, { credentials: "include" });
          const json = await res.json();
          if (!json.success) break;
          all.push(...json.data);
          if (!json.hasMore) break;
          page++;
        }
        setBookmarks(all);
      } catch (e) {
        setError("Failed to load bookmarks");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Unreviewed: not tagged, not starred, not archived (archived not implemented yet)
  const unreviewed = bookmarks.filter(b => (!b.tags || b.tags.length === 0) && !b.is_favorite && !b.archived);
  const processed = bookmarks.filter(b => (b.tags && b.tags.length > 0) || b.is_favorite || b.archived);

  // Group by time for timeline view
  const groupedUnreviewed = groupByTime(unreviewed);
  const groupedProcessed = groupByTime(processed);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">Recent</h1>
      <p className="text-text-muted mb-6">Inbox for new bookmarks. Triage, tag, and organize your latest links.</p>

      {/* Inbox Zero State */}
      {loading ? (
        <div className="text-text-muted py-12 text-center">Loading…</div>
      ) : unreviewed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <span className="text-4xl mb-2">🎉</span>
          <div className="text-xl font-semibold mb-1">You're all caught up — 0 unreviewed links.</div>
          <div className="text-text-muted text-sm">Inbox Zero! Every new bookmark will appear here for review.</div>
        </div>
      ) : (
        <>
          {/* Unreviewed Section */}
          <div className="mb-10">
            <h2 className="text-lg font-bold mb-3">Unreviewed</h2>
            {Object.entries(groupedUnreviewed).map(([section, items]) =>
              items.length > 0 && (
                <div key={section} className="mb-6">
                  <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-1 py-1 font-semibold text-text-secondary text-xs uppercase tracking-widest mb-2">{section}</div>
                  <div className="space-y-3">
                    {items.map((b) => (
                      <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-card">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary truncate mb-0.5">{b.title || b.url}</div>
                          <div className="text-xs text-text-muted truncate mb-1">{b.url}</div>
                          <div className="flex gap-2 mt-1">
                            {/* TODO: Quick actions (tag, star, archive, preview) */}
                            <button className="text-xs px-2 py-1 rounded bg-accent text-white font-medium">Tag</button>
                            <button className="text-xs px-2 py-1 rounded bg-success/80 text-white font-medium">Star</button>
                            <button className="text-xs px-2 py-1 rounded bg-background border border-border text-text-secondary font-medium">Archive</button>
                          </div>
                        </div>
                        {/* TODO: Activity type badges, AI summary, video treatment, etc. */}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>

          {/* Recently Processed Section */}
          <div>
            <h2 className="text-lg font-bold mb-3">Recently Processed</h2>
            {Object.entries(groupedProcessed).map(([section, items]) =>
              items.length > 0 && (
                <div key={section} className="mb-6">
                  <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-1 py-1 font-semibold text-text-secondary text-xs uppercase tracking-widest mb-2">{section}</div>
                  <div className="space-y-3">
                    {items.map((b) => (
                      <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 shadow-card opacity-70">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-text-primary truncate mb-0.5">{b.title || b.url}</div>
                          <div className="text-xs text-text-muted truncate mb-1">{b.url}</div>
                          <div className="flex gap-2 mt-1">
                            {/* TODO: Quick actions (edit tags, unstar, unarchive) */}
                            <button className="text-xs px-2 py-1 rounded bg-background border border-border text-text-secondary font-medium">Edit Tags</button>
                            <button className="text-xs px-2 py-1 rounded bg-warning/80 text-white font-medium">Unstar</button>
                            <button className="text-xs px-2 py-1 rounded bg-background border border-border text-text-secondary font-medium">Unarchive</button>
                          </div>
                        </div>
                        {/* TODO: Activity type badges, AI summary, etc. */}
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </>
      )}
      {error && <div className="text-error mt-6">{error}</div>}
    </div>
  );
}
