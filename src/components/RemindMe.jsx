
import { useEffect, useState } from "react";

function groupRemindersByDate(reminders) {
  // Returns { date: [reminders] } for calendar heatmap and daily grouping
  const map = {};
  for (const r of reminders) {
    const d = new Date(r.created_at).toISOString().slice(0, 10);
    if (!map[d]) map[d] = [];
    map[d].push(r);
  }
  return map;
}

export default function RemindMe() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/notifications?page=1&pageSize=100", { credentials: "include" });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to load reminders");
        setReminders(json.data);
        // Streak: count consecutive days with all reminders marked read
        const byDate = groupRemindersByDate(json.data);
        let streakCount = 0;
        let d = new Date();
        for (let i = 0; i < 30; i++) {
          const key = d.toISOString().slice(0, 10);
          const dayReminders = byDate[key] || [];
          if (dayReminders.length === 0 || dayReminders.every(r => r.is_read)) {
            streakCount++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        setStreak(streakCount);
      } catch (e) {
        setError("Failed to load reminders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Overdue: not read, created_at < now
  const now = new Date();
  const overdue = reminders.filter(r => !r.is_read && new Date(r.created_at) < now);
  // Upcoming: not read, created_at >= now (future scheduled)
  const upcoming = reminders.filter(r => !r.is_read && new Date(r.created_at) >= now);

  // Daily briefing: summarize today's reminders
  const today = new Date().toISOString().slice(0, 10);
  const todaysReminders = (groupRemindersByDate(reminders)[today] || []).filter(r => !r.is_read);
  const videoCount = todaysReminders.filter(r => /youtube|vimeo|loom|video/i.test(r.bookmark_url)).length;
  const articleCount = todaysReminders.length - videoCount;
  // TODO: Calculate total time for videos/articles

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 animate-fade-in">
      {/* Morning Briefing & Streak */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="bg-gradient-to-r from-amber-100/80 to-amber-200/60 border border-amber-300 rounded-2xl px-6 py-4 flex-1 shadow-glow">
          <div className="text-lg font-bold text-amber-900 mb-1">Morning Briefing</div>
          <div className="text-amber-800 text-sm">
            Today you have <span className="font-semibold">{videoCount} videos</span> and <span className="font-semibold">{articleCount} articles</span> scheduled. Ready to start?
          </div>
        </div>
        <div className="flex items-center gap-2 bg-success/10 border border-success/30 rounded-xl px-4 py-2">
          <span className="text-success font-bold text-lg">🔥 {streak}</span>
          <span className="text-xs text-success font-semibold">day streak</span>
        </div>
      </div>

      {/* Split view: Reminders list + Calendar heatmap */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Overdue & Upcoming reminders */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-4">Reminders</h2>
          <div className="mb-6">
            <div className="text-error font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-blink" /> Overdue
            </div>
            {overdue.length === 0 ? (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 mb-4 text-error">No overdue reminders!</div>
            ) : (
              overdue.map(r => (
                <div key={r.id} className="bg-error/10 border border-error/20 rounded-xl p-4 mb-2 flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-error truncate mb-0.5">{r.bookmark_title || r.bookmark_url}</div>
                    <div className="text-xs text-error/80 truncate mb-1">{r.bookmark_url}</div>
                    <div className="text-xs text-error/80">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <button className="text-xs px-3 py-1 rounded bg-success text-white font-semibold">Mark Done</button>
                </div>
              ))
            )}
          </div>
          <div className="mb-6">
            <div className="text-amber-600 font-semibold text-sm mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" /> Upcoming
            </div>
            {upcoming.length === 0 ? (
              <div className="bg-amber-100 border border-amber-200 rounded-xl p-4 mb-4 text-amber-800">No upcoming reminders!</div>
            ) : (
              upcoming.map(r => (
                <div key={r.id} className="bg-amber-100 border border-amber-200 rounded-xl p-4 mb-2 flex flex-col md:flex-row md:items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-amber-900 truncate mb-0.5">{r.bookmark_title || r.bookmark_url}</div>
                    <div className="text-xs text-amber-800 truncate mb-1">{r.bookmark_url}</div>
                    <div className="text-xs text-amber-800">{new Date(r.created_at).toLocaleString()}</div>
                  </div>
                  <button className="text-xs px-3 py-1 rounded bg-success/80 text-white font-semibold">Mark Done</button>
                </div>
              ))
            )}
          </div>
          {/* Quick Finish filter */}
          <button className="mt-2 px-4 py-2 rounded-lg bg-accent text-white font-semibold text-xs shadow-glow">Quick Finish: &lt;5 min</button>
        </div>
        {/* Right: Calendar heatmap */}
        <div className="w-full md:w-80 flex flex-col items-center">
          <h3 className="text-base font-bold mb-2">Reading Calendar</h3>
          <div className="bg-background border border-border rounded-2xl p-4 w-full flex flex-col items-center">
            {/* TODO: Calendar heatmap visualization */}
            <div className="text-text-muted text-sm py-12">Calendar heatmap coming soon…</div>
          </div>
        </div>
      </div>
      {error && <div className="text-error mt-6">{error}</div>}
      {/* TODO: Add Surprise Me, topic nudges, milestone reminders, batch rewards, and AI panel prompts */}
    </div>
  );
}
