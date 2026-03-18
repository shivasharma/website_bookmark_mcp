/**
 * Centralized API utilities for bookmark operations.
 * All fetch calls go through here — auth headers, base URL,
 * and error handling only need to change in one place.
 */

async function apiFetch(path, options = {}) {
  const res = await fetch(path, { credentials: "include", ...options });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

export async function deleteBookmark(id) {
  const { res } = await apiFetch(`/api/bookmarks/${id}`, { method: "DELETE" });
  return res.ok;
}

export async function toggleFavorite(bookmark) {
  const { json } = await apiFetch(`/api/bookmarks/${bookmark.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_favorite: !bookmark.is_favorite }),
  });
  return json.success ? json.data : null;
}

export async function fetchUrlMetadata(url) {
  const { json } = await apiFetch(`/api/url-metadata?url=${encodeURIComponent(url)}`);
  return json.success ? json.data : null;
}

export async function createBookmark(payload) {
  const { res, json } = await apiFetch("/api/bookmarks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !json.success) throw new Error(json.error || "Failed to save bookmark.");
  return json.data;
}

export async function updateBookmark(id, payload) {
  const { res, json } = await apiFetch(`/api/bookmarks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok || !json.success) throw new Error(json.error || "Failed to update bookmark.");
  return json.data;
}
