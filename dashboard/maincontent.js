// maincontent.js - main content logic (bookmarks, rendering, search)
import { esc, safeDomain, fmt, tagClass, tagDotClass } from './helpers.js';
import { api } from './api.js';

let bookmarks = [];

export async function loadBookmarks() {
  try {
    const { response, payload } = await api('/bookmarks', { method: 'GET' });
    if (!response.ok || !payload?.success) {
      bookmarks = [];
      return;
    }
    bookmarks = (Array.isArray(payload.data) ? payload.data : []).map(toUiBookmark);
  } catch (e) { bookmarks = []; }
}

function toUiBookmark(item) {
  const domain = safeDomain(item.url || '');
  return {
    ...item,
    title: item.title || domain || item.url || 'Untitled',
    tags: Array.isArray(item.tags) ? item.tags : [],
    starred: !!item.is_favorite,
    domain,
    date: item.created_at ? fmt(new Date(item.created_at)) : fmt(new Date()),
    readTime: item.readTime || '--',
    ai: false,
    imported: !!item.imported
  };
}

export function renderBookmarks() {
  // Placeholder: implement rendering logic for bookmarks
}
