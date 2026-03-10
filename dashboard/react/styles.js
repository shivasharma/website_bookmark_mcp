export const baseCss = `
:root {
  --bg: #080e17;
  --surface: #111e2d;
  --surface-2: #162539;
  --border: #1a3048;
  --text: #eef5ff;
  --muted: #b3c7dd;
  --accent: #06c0e0;
  --ok: #00d4a0;
  --warn: #f5a623;
  --danger: #f05252;
  --radius: 12px;
}
* { box-sizing: border-box; }
:focus-visible {
  outline: 2px solid rgba(6, 192, 224, 0.65);
  outline-offset: 2px;
}
body {
  margin: 0;
  font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
  background: radial-gradient(circle at 20% 20%, rgba(6, 192, 224, 0.08), transparent 40%), var(--bg);
  color: var(--text);
  min-height: 100vh;
  line-height: 1.45;
  font-size: clamp(16px, 1.1vw + 12px, 18px);
}
a { color: inherit; }
.wrap {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 40px;
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.title {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  font-family: "Sora", "Segoe UI", sans-serif;
}
.sub {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: clamp(14px, 0.55vw + 12px, 16px);
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: clamp(16px, 1.2vw + 12px, 24px);
  margin-bottom: 12px;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.card h2 {
  margin: 0 0 10px;
  font-size: clamp(18px, 0.7vw + 14px, 24px);
  font-family: "Sora", "Segoe UI", sans-serif;
}
.btn {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: clamp(14px, 0.5vw + 12px, 16px);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
  margin-bottom: 8px;
  min-height: 48px;
  min-width: 48px;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.bm-icon {
  width: 16px;
  height: 16px;
  display: inline-block;
  flex-shrink: 0;
}
.btn.primary {
  background: #06c0e0;
  border-color: #06c0e0;
  color: #04111b;
  font-weight: 700;
}
.btn:hover { border-color: #224060; }
.btn.primary:hover { background: #1bd4f2; border-color: #1bd4f2; }
.btn:active { transform: translateY(1px); }
.status {
  font-size: 13px;
  color: var(--muted);
  margin-top: 8px;
}
.ok { color: var(--ok); }
.warn { color: var(--warn); }
.danger { color: var(--danger); }
.hidden { display: none; }
pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: #060b12;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  color: #8fd8ff;
  line-height: 1.5;
}
.kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}
.kpi {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
}
.kpi .k {
  text-transform: uppercase;
  letter-spacing: 0.7px;
  font-size: 10px;
  color: var(--muted);
  margin-bottom: 4px;
}
.kpi .v {
  font-size: 24px;
  font-weight: 800;
  font-family: "Sora", "Segoe UI", sans-serif;
}
.services {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.service {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
}
.service-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.service-name {
  margin: 0;
  font-size: 13px;
  word-break: break-word;
}
.meta {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.45;
}
.pill {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: capitalize;
  border: 1px solid transparent;
}
.running { background: rgba(0, 212, 160, 0.14); color: var(--ok); border-color: rgba(0, 212, 160, 0.3); }
.restarting { background: rgba(245, 166, 35, 0.14); color: var(--warn); border-color: rgba(245, 166, 35, 0.3); }
.stopped { background: rgba(240, 82, 82, 0.14); color: var(--danger); border-color: rgba(240, 82, 82, 0.3); }
.code-inline {
  font-family: Consolas, "Courier New", monospace;
  color: #8fd8ff;
}
.route-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.route-tab {
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  text-decoration: none;
  font-size: 12px;
  color: var(--muted);
}
.route-tab.active {
  color: var(--accent);
  border-color: rgba(6, 192, 224, 0.5);
  background: rgba(6, 192, 224, 0.08);
}
@media (max-width: 900px) {
  .kpis { grid-template-columns: repeat(2, minmax(100px, 1fr)); }
}

.bm-shell { min-height: 100vh; }
.bm-top {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(11, 18, 28, 0.85);
  position: sticky;
  top: 0;
  backdrop-filter: blur(8px);
  z-index: 20;
  flex-wrap: wrap;
}
.bm-brand {
  font-family: "Sora", "Segoe UI", sans-serif;
  font-weight: 800;
  letter-spacing: -0.2px;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.bm-search {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.bm-search:focus-within {
  border-color: rgba(6, 192, 224, 0.5);
  box-shadow: 0 0 0 3px rgba(6, 192, 224, 0.12);
}
.bm-search-icon { color: var(--muted); }
.bm-search input {
  width: 100%;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
}
.bm-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}
.bm-bell-btn {
  position: relative;
}
.bm-bell-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.bm-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
}
.bm-main {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: calc(100vh - 62px);
}
.bm-sidebar {
  border-right: 1px solid var(--border);
  padding: 12px;
  background: rgba(17, 30, 45, 0.7);
  position: sticky;
  top: 62px;
  height: calc(100vh - 62px);
  overflow-y: auto;
}
.bm-side-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
  margin: 4px 0 8px;
}
.bm-side-link,
.bm-side-anchor {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: left;
  margin-bottom: 6px;
  padding: 9px 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  border-radius: 8px;
  text-decoration: none;
  font-size: 13px;
  cursor: pointer;
}
.bm-side-label { flex: 1; }
.bm-side-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
}
.bm-side-link:hover,
.bm-side-link.active,
.bm-side-anchor:hover {
  color: var(--text);
  border-color: var(--border);
  background: var(--surface-2);
}
.bm-side-divider {
  height: 1px;
  margin: 10px 0;
  background: var(--border);
}
.bm-content {
  padding: 16px;
  max-width: 1280px;
  width: 100%;
}
.bm-section-title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 800;
  font-family: "Sora", "Segoe UI", sans-serif;
}
.bm-content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-width: 860px;
}
.bm-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(100px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.bm-stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bm-stat-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
}
.bm-stat:nth-child(1) .bm-stat-icon { color: var(--accent); }
.bm-stat:nth-child(2) .bm-stat-icon { color: var(--warn); }
.bm-stat:nth-child(3) .bm-stat-icon { color: var(--accent2); }
.bm-stat:nth-child(4) .bm-stat-icon { color: var(--ok); }
.bm-stat-value {
  font-size: 24px;
  font-weight: 800;
  font-family: "Sora", "Segoe UI", sans-serif;
}
.bm-stat-label { font-size: 11px; color: var(--muted); }
.bm-message {
  margin-bottom: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid rgba(6, 192, 224, 0.3);
  background: rgba(6, 192, 224, 0.08);
  color: var(--text);
  font-size: 13px;
}
.bm-activity {
  margin-bottom: 12px;
}
.bm-activity-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bm-activity-item {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
}
.bm-activity-source {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 999px;
  padding: 2px 8px;
  border: 1px solid transparent;
}
.bm-source-portal {
  color: #06c0e0;
  background: rgba(6, 192, 224, 0.14);
  border-color: rgba(6, 192, 224, 0.3);
}
.bm-source-mcp {
  color: #a78bfa;
  background: rgba(167, 139, 250, 0.14);
  border-color: rgba(167, 139, 250, 0.3);
}
.bm-source-server {
  color: #2f80ed;
  background: rgba(47, 128, 237, 0.14);
  border-color: rgba(47, 128, 237, 0.3);
}
.bm-activity-action {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 999px;
  padding: 2px 8px;
  border: 1px solid transparent;
}
.bm-action-created {
  color: var(--ok);
  background: rgba(0, 212, 160, 0.14);
  border-color: rgba(0, 212, 160, 0.3);
}
.bm-action-updated {
  color: var(--warn);
  background: rgba(245, 166, 35, 0.14);
  border-color: rgba(245, 166, 35, 0.3);
}
.bm-action-deleted {
  color: var(--danger);
  background: rgba(240, 82, 82, 0.14);
  border-color: rgba(240, 82, 82, 0.3);
}
.bm-activity-text {
  font-size: 12px;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bm-activity-time {
  font-size: 11px;
  color: var(--muted);
}
.bm-notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bm-notification-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: var(--surface-2);
}
.bm-notification-item.is-read {
  opacity: 0.82;
}
.bm-notification-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.bm-notification-text {
  font-size: 13px;
  margin-bottom: 8px;
  word-break: break-word;
}
.bm-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}
.bm-panel-tools {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.bm-panel-tools .btn {
  width: 100%;
  justify-content: center;
  margin-right: 0;
}
.bm-notification-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.bm-realtime-status {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid var(--border);
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
}
.bm-realtime-status.is-connected {
  color: var(--ok);
  border-color: rgba(0, 212, 160, 0.35);
  background: rgba(0, 212, 160, 0.1);
}
.bm-realtime-status.is-connecting,
.bm-realtime-status.is-disconnected {
  color: var(--warn);
  border-color: rgba(245, 166, 35, 0.35);
  background: rgba(245, 166, 35, 0.1);
}
.bm-panel-search {
  grid-column: 1 / 2;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.bm-panel-search:focus-within {
  border-color: rgba(6, 192, 224, 0.5);
  box-shadow: 0 0 0 3px rgba(6, 192, 224, 0.12);
}
.bm-panel-search input {
  width: 100%;
  padding: 14px 0;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
  font-size: clamp(15px, 0.45vw + 13px, 17px);
}
.bm-list { display: flex; flex-direction: column; gap: 8px; }
.bm-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  background: var(--surface-2);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.bm-item:hover {
  border-color: #224060;
  background: rgba(22, 37, 57, 0.92);
}
.bm-item-main { min-width: 0; }
.bm-item-title {
  font-family: "Sora", "Segoe UI", sans-serif;
  font-size: 13px;
  font-weight: 700;
}
.bm-item-url {
  color: var(--muted);
  font-size: 11px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.bm-item-right { text-align: right; }
.bm-date { font-size: 11px; color: var(--muted); }
.bm-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; margin-top: 6px; }
.bm-actions .btn,
.bm-grid-actions .btn {
  margin-right: 0;
  margin-bottom: 0;
  padding: 7px 10px;
  font-size: 12px;
}
.bm-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.bm-tag {
  font-size: 10px;
  border-radius: 999px;
  padding: 2px 7px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  font-weight: 700;
}
.bm-tag.t1 { background: rgba(6, 192, 224, 0.14); color: #06c0e0; }
.bm-tag.t2 { background: rgba(47, 128, 237, 0.14); color: #2f80ed; }
.bm-tag.t3 { background: rgba(0, 212, 160, 0.14); color: #00d4a0; }
.bm-tag.t4 { background: rgba(245, 166, 35, 0.14); color: #f5a623; }
.bm-tag.t5 { background: rgba(167, 139, 250, 0.14); color: #a78bfa; }
.bm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 8px;
}
.bm-grid-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  background: var(--surface-2);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.bm-grid-item:hover {
  border-color: #224060;
  background: rgba(22, 37, 57, 0.92);
}
.bm-grid-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.bm-input {
  width: 100%;
  margin-bottom: 8px;
  padding: 14px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  min-height: 48px;
  font-size: clamp(15px, 0.45vw + 13px, 17px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.bm-input.is-valid {
  border-color: #34d399;
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.18);
}
.bm-input.is-invalid {
  border-color: #f87171;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.18);
}
.bm-url-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
}
.bm-url-wrap .bm-input {
  flex: 1;
  margin-bottom: 0;
}
.bm-paste-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface-2);
  color: var(--muted);
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.bm-paste-btn:hover, .bm-paste-btn:focus-visible {
  border-color: var(--accent, #06c0e0);
  color: var(--accent, #06c0e0);
  background: rgba(6, 192, 224, 0.08);
}
.bm-url-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  flex-shrink: 0;
}
.bm-url-status.is-valid { color: #34d399; }
.bm-url-status.is-invalid { color: #f87171; }
.bm-url-wrap + .bm-input { margin-top: 8px; }
.bm-form-section {
  padding: 14px 0;
  border-top: 1px solid var(--border);
}
.bm-form-section:first-of-type {
  border-top: none;
  padding-top: 4px;
}
.bm-form-section-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
  margin-bottom: 10px;
}
.bm-meta-msg {
  margin-top: 6px;
  margin-bottom: 0;
}
.bm-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 44px;
  padding: 10px 0;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: none;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.bm-expand-btn:hover, .bm-expand-btn:focus-visible {
  border-color: var(--accent, #06c0e0);
  color: var(--accent, #06c0e0);
  background: rgba(6, 192, 224, 0.05);
}
.bm-quick-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.bm-dup-warning {
  margin: 6px 0 0;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 193, 7, 0.12);
  color: #ffc107;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}
.bm-saved-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(76, 175, 80, 0.13);
  color: #66bb6a;
  font-size: 14px;
  font-weight: 600;
  animation: bm-banner-in 0.25s ease;
}
@keyframes bm-banner-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
.bm-undo-btn {
  background: transparent;
  border: 1px solid #66bb6a;
  color: #66bb6a;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-height: 36px;
  transition: background 0.2s;
}
.bm-undo-btn:hover, .bm-undo-btn:focus-visible {
  background: rgba(76, 175, 80, 0.15);
}
.bm-suggest-wrap {
  margin-top: 2px;
  margin-bottom: 10px;
}
.bm-tag-manager {
  margin-top: 4px;
  margin-bottom: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-2);
  padding: 12px;
}
.bm-tag-search {
  margin-bottom: 10px !important;
  padding: 10px 12px !important;
  min-height: 40px !important;
  font-size: 13px !important;
}
.bm-tag-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding: 2px 0 6px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.12) transparent;
}
.bm-tag-scroll::-webkit-scrollbar { width: 5px; }
.bm-tag-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
.bm-suggest-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.bm-suggest-chip {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--muted);
  border-radius: 999px;
  min-height: 44px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.bm-suggest-chip.is-suggested {
  border-color: rgba(6, 192, 224, 0.3);
}
.bm-suggest-chip.is-active {
  border-color: rgba(6, 192, 224, 0.5);
  background: rgba(6, 192, 224, 0.15);
  color: #aee9f7;
}
.bm-tag-freq {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  border-radius: 10px;
  background: rgba(255,255,255,0.08);
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0;
  text-transform: none;
}
.bm-suggest-chip.is-active .bm-tag-freq {
  background: rgba(6, 192, 224, 0.2);
  color: #aee9f7;
}
.bm-custom-tag-row {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}
.bm-custom-tag-input {
  flex: 1;
  margin-bottom: 0 !important;
  min-height: 44px !important;
  padding: 10px 12px !important;
  font-size: 13px !important;
}
.bm-add-tag-btn {
  white-space: nowrap;
  min-height: 44px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
}
.bm-toggle-row {
  margin-top: 12px;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.bm-toggle-label {
  font-size: clamp(14px, 0.45vw + 12px, 16px);
  font-weight: 700;
}
.bm-toggle-input {
  appearance: none;
  width: 52px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #0d1c2c;
  position: relative;
  transition: background 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}
.bm-toggle-input::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #d9e6f4;
  transition: transform 0.2s ease;
}
.bm-toggle-input:checked {
  background: rgba(0, 212, 160, 0.2);
  border-color: rgba(0, 212, 160, 0.5);
}
.bm-toggle-input:checked::after {
  transform: translateX(20px);
}
.bm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 9, 18, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}
.bm-modal {
  width: 100%;
  max-width: 520px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
}
.bm-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}
.bm-mobile-nav {
  display: none;
}
@media (max-width: 900px) {
  .bm-main { grid-template-columns: 1fr; }
  .bm-sidebar { display: none; }
  .bm-content-grid { grid-template-columns: 1fr; }
  .bm-content {
    max-width: 100%;
    padding-bottom: 96px;
  }
  .bm-mobile-nav {
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(10px + env(safe-area-inset-bottom, 0px));
    z-index: 40;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    padding: 8px;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: rgba(12, 21, 33, 0.94);
    backdrop-filter: blur(10px);
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
  }
  .bm-mobile-tab {
    border: 0;
    background: transparent;
    color: var(--muted);
    border-radius: 12px;
    padding: 8px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-height: 48px;
    position: relative;
  }
  .bm-mobile-tab .bm-icon {
    width: 18px;
    height: 18px;
  }
  .bm-mobile-tab.active {
    background: rgba(6, 192, 224, 0.14);
    color: var(--text);
  }
  .bm-mobile-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }
  .bm-mobile-count {
    position: absolute;
    top: 2px;
    right: 10px;
    min-width: 17px;
    height: 17px;
    border-radius: 999px;
    background: var(--danger);
    color: #fff;
    font-size: 10px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    font-weight: 700;
  }
}
@media (max-width: 700px) {
  .bm-content { padding: 12px; }
  .bm-stats { grid-template-columns: repeat(2, minmax(100px, 1fr)); }
  .bm-grid { grid-template-columns: 1fr; }
  .bm-panel-tools { grid-template-columns: 1fr; gap: 8px; }
  .bm-panel-search { grid-column: 1 / -1; }
  .bm-panel-tools .btn { margin-right: 0; }
  .bm-item {
    flex-direction: column;
    gap: 8px;
  }
  .bm-item-right {
    text-align: left;
  }
  .bm-actions {
    justify-content: flex-start;
  }
  .bm-activity-item {
    grid-template-columns: 1fr;
    align-items: flex-start;
    gap: 4px;
  }
  .bm-activity-text {
    white-space: normal;
  }
  .bm-suggest-chip {
    min-height: 48px;
    font-size: 14px;
    padding: 10px 16px;
  }
  .bm-custom-tag-row {
    flex-direction: column;
  }
  .bm-custom-tag-input,
  .bm-add-tag-btn {
    min-height: 48px !important;
  }
  .bm-tag-scroll {
    max-height: 220px;
  }
}
@media (max-width: 540px) {
  .bm-top {
    padding: 10px 12px;
    gap: 8px;
  }
  .bm-brand {
    font-size: 18px;
    flex: 1;
  }
  .bm-top-actions {
    margin-left: 0;
    width: auto;
    flex-wrap: nowrap;
    gap: 6px;
  }
  .bm-top-actions .btn {
    min-height: 48px;
    padding: 12px 14px;
    justify-content: center;
    margin-right: 0;
    margin-bottom: 0;
    font-size: 14px;
  }
  .bm-bell-badge {
    top: -4px;
    right: -4px;
  }
  .bm-panel-tools .btn {
    flex: 1 1 100%;
    justify-content: center;
  }
}
`;
