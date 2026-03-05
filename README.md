# Bookmark Vault (TypeScript + PostgreSQL + OAuth)

This repo now has a clean split:
- `server/api.ts` -> HTTP API + dashboard + OAuth
- `server/mcp/index.ts` -> MCP server (stdio transport)

## Quick start

1. Copy `.env.example` to `.env`
2. Start Postgres + API (optional dashboard/auth flow):

```bash
docker compose up --build -d
```

Production note: public traffic should use `https://ai.shivaprogramming.com` on port `443`. Port `3001` is internal app HTTP behind Nginx.

3. Build MCP server:

```bash
npm install
npm run build
```

## Run servers

- MCP server (stdio): `npm run start:mcp`
- API server: `npm run start:api`
- MCP dev mode: `npm run dev:mcp`
- API dev mode: `npm run dev:api`

## MCP client setup

Client-specific MCP configs are now in `configs/mcp/`.
Setup instructions are in `docs/mcp-clients.md`.
MCP defaults to hosted API `https://ai.shivaprogramming.com` (no DB config needed in client settings).
MCP requests should include `BOOKMARK_API_TOKEN` (generated via `POST /api/mcp-token` after login).
Non-technical flow: open `https://ai.shivaprogramming.com/mcp-setup` after login and use the setup wizard.

## OAuth setup (API only)

Set these in `.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback

CLIENT_ID_GITHUB=
CLIENT_SECRET_GITHUB=
CALLBACK_URL_GITHUB=http://localhost:3001/auth/github/callback
```

## Local fallback

`ALLOW_LOCAL_FALLBACK=true` lets API work locally without OAuth.
Set `ALLOW_LOCAL_FALLBACK=false` in production.

