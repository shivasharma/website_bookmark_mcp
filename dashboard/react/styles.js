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
`;
