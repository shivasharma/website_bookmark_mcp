// helpers.js - shared utility functions and state
export function esc(v) { return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
export function safeDomain(url) { try { return new URL(url).hostname.replace('www.', ''); } catch (e) { return ''; } }
export function fmt(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
export function tagClass(t) { const TAG_COLORS = { ai: 'mt1', dev: 'mt2', design: 'mt3', 'read later': 'mt4', tools: 'mt5', favourite: 'mt6', rss: 'mt1', feeds: 'mt1' }; return TAG_COLORS[t.toLowerCase()] || 'mt2'; }
export function tagDotClass(t) { const map = { mt1: 'td1', mt2: 'td2', mt3: 'td3', mt4: 'td4', mt5: 'td5', mt6: 'td6' }; return map[tagClass(String(t || ''))] || 'td2'; }
