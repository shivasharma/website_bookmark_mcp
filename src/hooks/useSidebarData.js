import { useState, useEffect, useCallback } from "react";
import { isVideoUrl } from "../lib/videoUtils";

/**
 * Fetches lightweight bookmark stats for the Sidebar.
 * Fetches up to 200 bookmarks on mount; counts are approximate for larger libraries.
 */
export function useSidebarData() {
  const [data, setData] = useState({
    total: 0,
    starred: 0,
    noTags: 0,
    thisWeek: 0,
    videos: [],
    topTags: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks?pageSize=200", { credentials: "include" });
      const json = await res.json();
      if (!json.success) return;

      const bookmarks = json.data;
      const total = json.total ?? bookmarks.length;
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const starred  = bookmarks.filter((b) => b.is_favorite).length;
      const noTags   = bookmarks.filter((b) => !b.tags?.length).length;
      const thisWeek = bookmarks.filter((b) => new Date(b.created_at) > weekAgo).length;

      const tagMap = {};
      for (const b of bookmarks) {
        for (const tag of b.tags || []) tagMap[tag] = (tagMap[tag] || 0) + 1;
      }
      const topTags = Object.entries(tagMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }));

      const videos = bookmarks.filter((b) => isVideoUrl(b.url)).slice(0, 6);

      setData({ total, starred, noTags, thisWeek, videos, topTags });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, refresh: load };
}
