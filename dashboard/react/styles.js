export const baseCss = `
:root {
  --bg: #080e17;
  --surface: #111e2d;
  --surface-2: #162539;
  --border: #1a3048;
  --text: #eef5ff;
  --muted: #7aa3c4;
  --accent: #06c0e0;
  --ok: #00d4a0;
  --warn: #f5a623;
  --danger: #f05252;
  --radius: 12px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Plus Jakarta Sans", "Segoe UI", sans-serif;
  background: radial-gradient(circle at 20% 20%, rgba(6, 192, 224, 0.08), transparent 40%), var(--bg);
  color: var(--text);
  min-height: 100vh;
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
  font-size: 14px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  margin-bottom: 12px;
}
.card h2 {
  margin: 0 0 10px;
  font-size: 16px;
  font-family: "Sora", "Segoe UI", sans-serif;
}
.btn {
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-right: 8px;
  margin-bottom: 8px;
}
.btn.primary {
  background: #06c0e0;
  border-color: #06c0e0;
  color: #04111b;
  font-weight: 700;
}
.btn:hover { border-color: #224060; }
.btn.primary:hover { background: #1bd4f2; border-color: #1bd4f2; }
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
}
.bm-search {
  flex: 1;
  min-width: 220px;
}
.bm-search input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
}
.bm-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
  display: block;
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
.bm-content { padding: 16px; }
.bm-content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 12px;
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
}
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
.bm-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.bm-list { display: flex; flex-direction: column; gap: 8px; }
.bm-item {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: var(--surface-2);
  cursor: pointer;
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
  grid-template-columns: repeat(2, minmax(190px, 1fr));
  gap: 8px;
}
.bm-grid-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px;
  background: var(--surface-2);
  cursor: pointer;
}
.bm-grid-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.bm-input {
  width: 100%;
  margin-bottom: 8px;
  padding: 10px 11px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
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
@media (max-width: 1100px) {
  .bm-main { grid-template-columns: 1fr; }
  .bm-sidebar { display: none; }
  .bm-content-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .bm-stats { grid-template-columns: repeat(2, minmax(100px, 1fr)); }
  .bm-grid { grid-template-columns: 1fr; }
}
`;
