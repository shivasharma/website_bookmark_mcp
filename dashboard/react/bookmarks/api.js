export async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
}

export function safeDomain(url) {
  try {
    return new URL(url || "").hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function toUiBookmark(item) {
  const domain = safeDomain(item.url || "");
  return {
    ...item,
    title: item.title || domain || item.url || "Untitled",
    tags: Array.isArray(item.tags) ? item.tags : [],
    starred: !!item.is_favorite,
    domain,
    dateLabel: formatDate(item.created_at),
    readTime: item.readTime || "--"
  };
}
