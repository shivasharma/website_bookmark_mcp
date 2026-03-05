# MCP Client Setup (Claude Desktop, Cursor, VS Code)

This project has a separate MCP server entrypoint:
- `server/mcp/index.ts` (source)
- `dist/mcp/index.js` (built file used by clients)
- MCP server calls hosted API by default: `https://ai.shivaprogramming.com`

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

## Easiest Setup (No Technical Steps)

1. Login at `https://ai.shivaprogramming.com/register`
2. Open `https://ai.shivaprogramming.com/mcp-setup`
3. Click `Generate Token`
4. Click `Copy Config`
5. Paste into Claude Desktop / Cursor / VS Code MCP settings
6. Restart the app

## Advanced / Manual Setup

## 4) Required auth token (per-user data isolation)

MCP now uses Bearer token auth for user-specific data.

1. Login in browser at `https://ai.shivaprogramming.com/register`
2. Open this URL in the same browser:
`https://ai.shivaprogramming.com/api/mcp-token?expires_in_days=30`
3. Copy `data.token` from the JSON response.
4. Put it into `BOOKMARK_API_TOKEN` in your client config.

Optional advanced method:
- `POST /api/mcp-token` with JSON body `{ "expires_in_days": 30 }`

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

