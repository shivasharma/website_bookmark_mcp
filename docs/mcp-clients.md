# MCP Client Setup (Claude Desktop, Cursor, VS Code)

This project has a separate MCP server entrypoint:
- `server/mcp/index.ts` (source)
- `dist/mcp/index.js` (built file used by clients)
- MCP server calls hosted API by default: `http://66.179.137.126:3001`

## 1) Build once

```bash
npm install
npm run build
```

## 2) Client configs

Ready-made config files:
- `configs/mcp/claude-desktop.json`
- `configs/mcp/cursor.json`
- `configs/mcp/vscode.json`

All three use the same command:
- `node D:/Project2026/AI/website_bookmark_mcp/dist/mcp/index.js`

## 3) Optional override URL

If needed, set:

```env
BOOKMARK_API_BASE_URL=http://your-host:3001
```

## 4) Required auth token (per-user data isolation)

MCP now uses Bearer token auth for user-specific data.

1. Login in browser at `http://66.179.137.126:3001/register`
2. Create your token:

```bash
curl -X POST http://66.179.137.126:3001/api/mcp-token \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -d "{\"expires_in_days\":30}"
```

3. Put returned `token` into `BOOKMARK_API_TOKEN` in your client config.

## 5) Where to paste

1. Claude Desktop: open Claude MCP config and merge the content from `configs/mcp/claude-desktop.json`
2. Cursor: open Cursor MCP settings and merge the content from `configs/mcp/cursor.json`
3. VS Code: open your MCP extension config and merge the content from `configs/mcp/vscode.json`

## 5) Quick smoke checks

1. API health:

```bash
npm run start:api
# then open http://localhost:3001/api/health
```

2. MCP startup:

```bash
npm run start:mcp
```

If MCP starts correctly, it stays connected over stdio and logs:
- `Bookmark MCP Server running on stdio`
