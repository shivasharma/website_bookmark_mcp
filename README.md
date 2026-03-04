# 🔖 Bookmark Vault — MCP Server

A personal bookmark manager powered by an MCP server. Save URLs via Claude, view/edit them in a slick web dashboard.

---

## Project Structure

```
bookmark-mcp/
├── server/
│   ├── index.js        ← MCP Server (Claude talks to this)
│   ├── api.js          ← REST API (Dashboard talks to this)
│   ├── db.js           ← SQLite database helpers
│   └── package.json
└── dashboard/
    └── index.html      ← Web dashboard (open in browser)
```

---

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Start the REST API (for the dashboard)

```bash
node api.js
# → Running at http://localhost:3001
```

### 3. Open the Dashboard

Open `dashboard/index.html` in your browser.

---

## Connecting to Claude

### Option A: Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bookmarks": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/bookmark-mcp/server/index.js"]
    }
  }
}
```

Restart Claude Desktop. You'll see a 🔌 icon confirming the MCP server is connected.

### Option B: Claude Code (CLI)

```bash
claude mcp add bookmarks node /absolute/path/to/server/index.js
```

---

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `save_bookmark` | Save a URL with optional title, tags, description, notes |
| `list_bookmarks` | List all bookmarks, filter by search/tag/favorite |
| `update_bookmark` | Edit a bookmark by ID |
| `delete_bookmark` | Delete a bookmark by ID |
| `get_bookmark_stats` | Get total/favorite/recent counts |

---

## Example Claude Prompts

```
"Save this link for me: https://github.com/anthropics/mcp"

"Bookmark https://tailwindcss.com with tags: css, tools"

"Show me all my bookmarks tagged 'ai'"

"Update bookmark #3 — add tag 'important' and mark as favorite"

"Delete bookmark #7"

"How many bookmarks do I have?"
```

---

## Dashboard Features

- 🔍 **Search** by URL, title, description, or notes
- 🏷️ **Filter by tag** — click any tag on a card
- ⭐ **Favorites** toggle
- ✏️ **Edit** any bookmark inline
- 🗑️ **Delete** with one click
- 🔄 **Auto-refreshes** every 10 seconds

---

## Database

SQLite file is created automatically at `server/bookmarks.db`.

**Bookmark schema:**

| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER | Auto-incremented |
| url | TEXT | Required |
| title | TEXT | Optional |
| description | TEXT | Optional |
| tags | TEXT | JSON array |
| favicon | TEXT | Auto-fetched |
| notes | TEXT | Personal notes |
| is_favorite | INTEGER | 0 or 1 |
| created_at | TEXT | Auto set |
| updated_at | TEXT | Auto updated |
