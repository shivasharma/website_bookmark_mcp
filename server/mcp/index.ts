#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

type Bookmark = {
  id: number;
  url: string;
  title: string;
  description: string;
  tags: string[];
  notes: string;
  is_favorite: boolean;
  created_at: string;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

type BookmarkStats = {
  total: number;
  favorites: number;
  recent: number;
};

const API_BASE_URL = (process.env.BOOKMARK_API_BASE_URL ?? "http://66.179.137.126:3001").replace(/\/+$/, "");
const API_TOKEN = process.env.BOOKMARK_API_TOKEN?.trim();

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (API_TOKEN) {
    headers.set("Authorization", `Bearer ${API_TOKEN}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    throw new Error(json.error || `Request failed (${response.status})`);
  }
  return json.data;
}

const server = new McpServer({
  name: "bookmark-manager",
  version: "2.1.0",
});

server.tool(
  "save_bookmark",
  "Save a website URL as a bookmark. Provide the URL and optional metadata like title, description, tags, and notes.",
  {
    url: z.string().url().describe("The URL of the website to bookmark"),
    title: z.string().optional().describe("Title of the webpage"),
    description: z.string().optional().describe("Brief description of the page"),
    tags: z.array(z.string()).optional().describe("Array of tags to categorize the bookmark, e.g. ['ai', 'tools']"),
    notes: z.string().optional().describe("Your personal notes about this bookmark"),
  },
  async ({ url, title, description, tags, notes }) => {
    try {
      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
      const bookmark = await apiRequest<Bookmark>("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify({ url, title, description, tags, notes, favicon }),
      });
      return {
        content: [
          {
            type: "text",
            text:
              `Bookmark saved.\n\n` +
              `ID: ${bookmark.id}\n` +
              `URL: ${bookmark.url}\n` +
              `Title: ${bookmark.title || "(no title)"}\n` +
              `Tags: ${bookmark.tags.length ? bookmark.tags.join(", ") : "none"}\n` +
              `Saved at: ${bookmark.created_at}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error saving bookmark: ${message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "list_bookmarks",
  "List all saved bookmarks. Optionally filter by search query, tag, or show only favorites.",
  {
    search: z.string().optional().describe("Search term to filter by URL, title, description, or notes"),
    tag: z.string().optional().describe("Filter by a specific tag"),
    favorite: z.boolean().optional().describe("If true, show only favorited bookmarks"),
    limit: z.number().optional().default(20).describe("Max number of results to return"),
  },
  async ({ search, tag, favorite, limit }) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (tag) params.set("tag", tag);
      if (favorite) params.set("favorite", "true");
      const query = params.toString();
      const bookmarks = (await apiRequest<Bookmark[]>(`/api/bookmarks${query ? `?${query}` : ""}`)).slice(0, limit);
      if (!bookmarks.length) {
        return { content: [{ type: "text", text: "No bookmarks found." }] };
      }
      const lines = bookmarks.map(
        (bookmark, index) =>
          `${index + 1}. [ID:${bookmark.id}] ${bookmark.is_favorite ? "STAR " : ""}${bookmark.title || bookmark.url}\n` +
          `   URL: ${bookmark.url}\n` +
          `   Tags: ${bookmark.tags.length ? bookmark.tags.join(", ") : "none"}\n` +
          `   Created: ${bookmark.created_at}`,
      );
      return {
        content: [{ type: "text", text: `Found ${bookmarks.length} bookmark(s):\n\n${lines.join("\n\n")}` }],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error listing bookmarks: ${message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "update_bookmark",
  "Update an existing bookmark by its ID. You can change the title, description, tags, notes, or mark it as favorite.",
  {
    id: z.number().describe("The ID of the bookmark to update"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    tags: z.array(z.string()).optional().describe("New array of tags (replaces existing tags)"),
    notes: z.string().optional().describe("Updated personal notes"),
    is_favorite: z.boolean().optional().describe("Mark or unmark as favorite"),
  },
  async ({ id, title, description, tags, notes, is_favorite }) => {
    try {
      const updated = await apiRequest<Bookmark>(`/api/bookmarks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description, tags, notes, is_favorite }),
      });
      return {
        content: [
          {
            type: "text",
            text:
              `Bookmark #${id} updated.\n\n` +
              `URL: ${updated.url}\n` +
              `Title: ${updated.title || "(no title)"}\n` +
              `Description: ${updated.description || "(none)"}\n` +
              `Tags: ${updated.tags.length ? updated.tags.join(", ") : "none"}\n` +
              `Notes: ${updated.notes || "(none)"}\n` +
              `Favorite: ${updated.is_favorite ? "Yes" : "No"}`,
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error updating bookmark: ${message}` }],
        isError: true,
      };
    }
  },
);

server.tool(
  "delete_bookmark",
  "Delete a bookmark permanently by its ID.",
  { id: z.number().describe("The ID of the bookmark to delete") },
  async ({ id }) => {
    try {
      const deleted = await apiRequest<Bookmark>(`/api/bookmarks/${id}`, { method: "DELETE" });
      return { content: [{ type: "text", text: `Deleted bookmark #${id}: ${deleted.url}` }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text", text: `Error deleting bookmark: ${message}` }],
        isError: true,
      };
    }
  },
);

server.tool("get_bookmark_stats", "Get summary statistics about your bookmark collection.", {}, async () => {
  try {
    const stats = await apiRequest<BookmarkStats>("/api/stats");
    return {
      content: [
        {
          type: "text",
          text: `Bookmark Stats:\n\nTotal: ${stats.total}\nFavorites: ${stats.favorites}\nAdded this week: ${stats.recent}`,
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text", text: `Error getting stats: ${message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`Bookmark MCP Server running on stdio (API: ${API_BASE_URL})`);

export { server };
