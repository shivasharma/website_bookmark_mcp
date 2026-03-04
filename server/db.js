// db.js - File-based JSON "database" for bookmarks (no native deps)
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "bookmarks.json");

// In-memory state backed by JSON file
let state = {
  lastId: 0,
  bookmarks: [],
};

function loadState() {
  if (!existsSync(DB_PATH)) {
    state = { lastId: 0, bookmarks: [] };
    return;
  }
  try {
    const raw = readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.bookmarks)) {
      state = {
        bookmarks: parsed.bookmarks,
        lastId:
          typeof parsed.lastId === "number"
            ? parsed.lastId
            : parsed.bookmarks.reduce((max, b) => Math.max(max, b.id || 0), 0),
      };
    }
  } catch {
    // If file is corrupted, start fresh but don't crash the server
    state = { lastId: 0, bookmarks: [] };
  }
}

// Initial load
loadState();

function persist() {
  writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf8");
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  return [tags];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function saveBookmark({ url, title, description, tags = [], favicon, notes }) {
  loadState();
  const existing = state.bookmarks.find((b) => b.url === url);
  if (existing) {
    return updateBookmark(existing.id, { title, description, tags, favicon, notes });
  }

  const now = new Date().toISOString();
  const bookmark = {
    id: ++state.lastId,
    url,
    title: title || "",
    description: description || "",
    tags: normalizeTags(tags),
    favicon: favicon || "",
    notes: notes || "",
    is_favorite: false,
    created_at: now,
    updated_at: now,
  };

  state.bookmarks.unshift(bookmark);
  persist();
  return bookmark;
}

export function getBookmarkById(id) {
  loadState();
  return state.bookmarks.find((b) => b.id === id) || null;
}

export function listBookmarks({ search, tag, favorite } = {}) {
  loadState();
  let results = [...state.bookmarks];

  if (search) {
    const q = search.toLowerCase();
    results = results.filter((b) => {
      return (
        (b.title || "").toLowerCase().includes(q) ||
        (b.url || "").toLowerCase().includes(q) ||
        (b.description || "").toLowerCase().includes(q) ||
        (b.notes || "").toLowerCase().includes(q)
      );
    });
  }

  if (tag) {
    results = results.filter((b) => Array.isArray(b.tags) && b.tags.includes(tag));
  }

  if (favorite) {
    results = results.filter((b) => !!b.is_favorite);
  }

  // Newest first
  results.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  return results;
}

export function updateBookmark(id, fields) {
  loadState();
  const idx = state.bookmarks.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  const allowed = ["url", "title", "description", "tags", "favicon", "notes", "is_favorite"];
  const current = state.bookmarks[idx];
  const updated = { ...current };

  for (const [key, val] of Object.entries(fields)) {
    if (!allowed.includes(key) || val === undefined) continue;
    if (key === "tags") {
      updated.tags = normalizeTags(val);
    } else {
      updated[key] = val;
    }
  }

  updated.updated_at = new Date().toISOString();
  state.bookmarks[idx] = updated;
  persist();
  return updated;
}

export function deleteBookmark(id) {
  loadState();
  const idx = state.bookmarks.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  const [removed] = state.bookmarks.splice(idx, 1);
  persist();
  return removed;
}

export function getStats() {
  loadState();
  const total = state.bookmarks.length;
  const favorites = state.bookmarks.filter((b) => !!b.is_favorite).length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = state.bookmarks.filter((b) => {
    const created = Date.parse(b.created_at || "");
    return !Number.isNaN(created) && created >= weekAgo;
  }).length;
  return { total, favorites, recent };
}

