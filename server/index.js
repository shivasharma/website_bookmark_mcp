#!/usr/bin/env node
// index.js - MCP Server for Bookmarks
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  saveBookmark,
  listBookmarks,
  updateBookmark,
  deleteBookmark,
  getBookmarkById,
  getStats,
} from "./db.js";

// ── MCP Server Setup ──────────────────────────────────────────────────────────

const server = new McpServer({
  name: "bookmark-manager",
  version: "1.0.0",
});

// ── Tool: save_bookmark ───────────────────────────────────────────────────────

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
      // Auto-fetch favicon
      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

      const bookmark = saveBookmark({ url, title, description, tags, notes, favicon });

      return {
        content: [
          {
            type: "text",
            text: `✅ Bookmark saved!\n\n` +
              `📌 **ID:** ${bookmark.id}\n` +
              `🔗 **URL:** ${bookmark.url}\n` +
              `📝 **Title:** ${bookmark.title || "(no title)"}\n` +
              `🏷️  **Tags:** ${bookmark.tags.length ? bookmark.tags.join(", ") : "none"}\n` +
              `📅 **Saved at:** ${bookmark.created_at}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error saving bookmark: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: list_bookmarks ──────────────────────────────────────────────────────

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
      const bookmarks = listBookmarks({ search, tag, favorite }).slice(0, limit);

      if (bookmarks.length === 0) {
        return {
          content: [{ type: "text", text: "No bookmarks found." }],
        };
      }

      const lines = bookmarks.map(
        (b, i) =>
          `${i + 1}. [ID:${b.id}] ${b.is_favorite ? "⭐ " : ""}**${b.title || b.url}**\n` +
          `   🔗 ${b.url}\n` +
          `   🏷️  ${b.tags.length ? b.tags.join(", ") : "no tags"}\n` +
          `   📅 ${b.created_at}`
      );

      return {
        content: [
          {
            type: "text",
            text: `📚 Found ${bookmarks.length} bookmark(s):\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error listing bookmarks: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: update_bookmark ─────────────────────────────────────────────────────

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
      const existing = getBookmarkById(id);
      if (!existing) {
        return {
          content: [{ type: "text", text: `❌ No bookmark found with ID ${id}` }],
          isError: true,
        };
      }

      const updated = updateBookmark(id, { title, description, tags, notes, is_favorite });

      return {
        content: [
          {
            type: "text",
            text: `✅ Bookmark #${id} updated!\n\n` +
              `🔗 **URL:** ${updated.url}\n` +
              `📝 **Title:** ${updated.title || "(no title)"}\n` +
              `📄 **Description:** ${updated.description || "(none)"}\n` +
              `🏷️  **Tags:** ${updated.tags.length ? updated.tags.join(", ") : "none"}\n` +
              `📓 **Notes:** ${updated.notes || "(none)"}\n` +
              `⭐ **Favorite:** ${updated.is_favorite ? "Yes" : "No"}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error updating bookmark: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: delete_bookmark ─────────────────────────────────────────────────────

server.tool(
  "delete_bookmark",
  "Delete a bookmark permanently by its ID.",
  {
    id: z.number().describe("The ID of the bookmark to delete"),
  },
  async ({ id }) => {
    try {
      const deleted = deleteBookmark(id);
      if (!deleted) {
        return {
          content: [{ type: "text", text: `❌ No bookmark found with ID ${id}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text", text: `🗑️ Deleted bookmark #${id}: ${deleted.url}` }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error deleting bookmark: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Tool: get_stats ───────────────────────────────────────────────────────────

server.tool(
  "get_bookmark_stats",
  "Get summary statistics about your bookmark collection.",
  {},
  async () => {
    try {
      const stats = getStats();
      return {
        content: [
          {
            type: "text",
            text: `📊 Bookmark Stats:\n\n` +
              `📚 Total: ${stats.total}\n` +
              `⭐ Favorites: ${stats.favorites}\n` +
              `🆕 Added this week: ${stats.recent}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `❌ Error getting stats: ${err.message}` }],
        isError: true,
      };
    }
  }
);

// ── Start Server ──────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("🔖 Bookmark MCP Server running on stdio");

export { server };
