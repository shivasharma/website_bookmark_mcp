

# LinkSync AI

Your links, synced smarter by MCP + AI.

LinkSync AI is a bookmark manager + MCP bridge that lets AI clients work with your saved links using natural language.


## Live Demo
 - <a href="https://ai.shivaprogramming.com" target="_blank">https://ai.shivaprogramming.com</a>
 - <img src="/dashboard/icons/linksync-hero.svg" alt="LinkSync AI" width="400" alt/>

## SEO Key Points

- Target keywords: `bookmark manager`, `MCP integration`, `AI bookmark sync`, `link management`
- Unique value proposition: LinkSync AI combines MCP + AI integration so assistants can work directly with bookmark context.
- Call-to-action for indexing: `Login with GitHub or Google`
- Structured data: `SoftwareApplication` schema markup is included in the dashboard entry page.

## What Problem This Solves

Most bookmark tools are built for manual use in the browser. AI clients (Cursor, Claude Desktop, VS Code MCP, etc.) cannot easily access those bookmarks in a structured way.

This project solves that by providing:
- A web dashboard to manage bookmarks (create, edit, favorite, search)
- A backend API for bookmark operations
- An MCP server so AI clients can read and use bookmark data through MCP tools

## Technology Used

- `TypeScript` for API and MCP server code
- `Node.js + Express` for HTTP routes and dashboard serving
- `PostgreSQL` for bookmark persistence
- `OAuth login` for user sessions in the dashboard
- `Model Context Protocol (MCP)` with stdio transport for client integrations
- `HTML/CSS/Vanilla JS` for a lightweight dashboard UI
- `Docker Compose` for local or server containerized runtime

## Project Structure

- `server/api.ts` - REST API, dashboard routes, session user endpoints
- `server/mcp/index.ts` - MCP server entry point (stdio)
- `dashboard/index.html` - Main dashboard UI (Bookmarks, Health, Account, MCP Setup)
- `dashboard/mcp-setup.html` - Guided MCP setup screen
- `configs/mcp/` - MCP client configuration examples
- `docs/mcp-clients.md` - Additional client setup notes

## Run Locally

```bash
npm install
npm run build
```

Start servers:

- API server: `npm run start:api`
- MCP server: `npm run start:mcp`
- API dev mode: `npm run dev:api`
- MCP dev mode: `npm run dev:mcp`

### Local Mode Without Login (read existing DB bookmarks)

Use this when you want to see all bookmarks from your local database before enabling OAuth.

PowerShell (current terminal session):

```powershell
$env:ALLOW_LOCAL_FALLBACK="true"
$env:SESSION_COOKIE_SECURE="false"
npm run dev:api
```

Then open:

- `http://localhost:3001/bookmarks`

Notes:

- With `ALLOW_LOCAL_FALLBACK=true`, `/api/bookmarks` reads from the local default user and does not require login.
- Existing bookmarks already in PostgreSQL will be listed immediately.
- For Docker Compose, you can set `ALLOW_LOCAL_FALLBACK=true` in your environment before `docker compose up`.

## MCP Client Integration

### Recommended flow (UI based)

1. Open the dashboard and log in.
2. Go to the `MCP Setup` tab (or `/mcp-setup`).
3. Click `Generate Token`.
4. Use `Copy Token` and `Copy Config` buttons.
5. Paste the config into your MCP client settings.

### MCP config template

Use this as the base template in your MCP client:

```json
{
	"mcpServers": {
		"bookmark": {
			"command": "npx",
			"args": ["-y", "github:shivasharma/website_bookmark_mcp"],
			"env": {
				"BOOKMARK_API_BASE_URL": "https://ai.shivaprogramming.com",
				"BOOKMARK_API_TOKEN": "paste-token-here"
			}
		}
	}
}
```

## MCP Usage Examples

After client setup, you can ask your AI assistant things like:
- "Find my bookmarks about Docker health checks"
- "Show my favorite MCP resources"
- "List recent links tagged with TypeScript"

## Dashboard Features

- `Bookmarks` tab with favorites and full list views
- `System Health` mini dashboard
- `About Project` with README view
- `Account` tab with session state
- `MCP Setup` tab with token generation and one-click copy actions

