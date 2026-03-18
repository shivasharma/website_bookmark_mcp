/**
 * Video URL detection and metadata utilities.
 * Supports YouTube, Vimeo, Loom, Wistia, Dailymotion.
 */

const PLATFORMS = [
  { key: "youtube",     pattern: /youtube\.com|youtu\.be/i,    label: "YouTube",     color: "#ff0000" },
  { key: "vimeo",       pattern: /vimeo\.com/i,                label: "Vimeo",       color: "#1ab7ea" },
  { key: "loom",        pattern: /loom\.com/i,                 label: "Loom",        color: "#625df5" },
  { key: "wistia",      pattern: /wistia\.com|wi\.st/i,        label: "Wistia",      color: "#e8582c" },
  { key: "dailymotion", pattern: /dailymotion\.com/i,          label: "DM",          color: "#0066dc" },
];

export function getVideoPlatform(url) {
  for (const p of PLATFORMS) {
    if (p.pattern.test(url)) return p;
  }
  return null;
}

export function isVideoUrl(url) {
  return !!getVideoPlatform(url);
}

/** Returns a thumbnail URL for YouTube videos, null for others. */
export function getVideoThumbnail(url) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}
