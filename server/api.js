// api.js - Express REST API that the Dashboard consumes
import express from "express";
import cors from "cors";
import { saveBookmark, listBookmarks, updateBookmark, deleteBookmark, getBookmarkById, getStats } from "./db.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Add this after your other app.use() calls:
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, "../dashboard")));

// GET /api/bookmarks?search=&tag=&favorite=true
app.get("/api/bookmarks", (req, res) => {
  const { search, tag, favorite } = req.query;
  const bookmarks = listBookmarks({
    search: search || undefined,
    tag: tag || undefined,
    favorite: favorite === "true",
  });
  res.json({ success: true, data: bookmarks, total: bookmarks.length });
});

// GET /api/bookmarks/:id
app.get("/api/bookmarks/:id", (req, res) => {
  const bookmark = getBookmarkById(Number(req.params.id));
  if (!bookmark) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data: bookmark });
});

// POST /api/bookmarks
app.post("/api/bookmarks", (req, res) => {
  try {
    const bookmark = saveBookmark(req.body);
    res.status(201).json({ success: true, data: bookmark });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PATCH /api/bookmarks/:id
app.patch("/api/bookmarks/:id", (req, res) => {
  try {
    const updated = updateBookmark(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ success: false, error: "Not found" });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/bookmarks/:id
app.delete("/api/bookmarks/:id", (req, res) => {
  const deleted = deleteBookmark(Number(req.params.id));
  if (!deleted) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data: deleted });
});

// GET /api/stats
app.get("/api/stats", (req, res) => {
  res.json({ success: true, data: getStats() });
});

app.listen(PORT, () => {
  console.log(`🚀 Bookmark API running at http://localhost:${PORT}`);
});
