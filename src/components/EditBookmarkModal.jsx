import React, { useState, useEffect } from "react";
import { X, Link2, FileText, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import TagInput from "./TagInput";
import { fetchUrlMetadata, updateBookmark } from "../lib/bookmarkApi";

export default function EditBookmarkModal({ bookmark, onClose, onSaved }) {
  const [form, setForm] = useState({ url: "", title: "", description: "", notes: "" });
  const [tags, setTags] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Populate form when bookmark changes
  useEffect(() => {
    if (bookmark) {
      setForm({
        url: bookmark.url || "",
        title: bookmark.title || "",
        description: bookmark.description || "",
        notes: bookmark.notes || "",
      });
      setTags(bookmark.tags || []);
      setError("");
      setSuccess(false);
    }
  }, [bookmark]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function fetchMeta() {
    const url = form.url.trim();
    if (!url) return;
    setFetching(true);
    try {
      const data = await fetchUrlMetadata(url);
      if (data) {
        setForm((f) => ({
          ...f,
          url: data.url || f.url,
          title: data.title || f.title,
          description: data.description || f.description,
        }));
      }
    } catch { /* ignore */ }
    finally { setFetching(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.url.trim()) { setError("URL is required."); return; }

    const payload = {
      url: form.url.trim(),
      title: form.title.trim() || undefined,
      description: form.description.trim() || undefined,
      tags,          // always send — empty array explicitly clears tags
      notes: form.notes.trim() || undefined,
    };

    setSaving(true);
    setError("");
    try {
      const updated = await updateBookmark(bookmark.id, payload);
      setSuccess(true);
      setTimeout(() => { onSaved(updated); onClose(); }, 900);
    } catch (err) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setSaving(false);
    }
  }

  if (!bookmark) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full sm:max-w-lg bg-card border border-border sm:rounded-md rounded-t-2xl overflow-hidden max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Link2 size={14} className="text-white" />
            </div>
            <h2 className="text-text-primary font-semibold text-sm">Edit Bookmark</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-card-hover rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">

          {/* URL */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              URL <span className="text-accent">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.url}
                onChange={set("url")}
                className="flex-1 bg-background border border-border text-text-primary placeholder-text-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
              />
              <button
                type="button"
                onClick={fetchMeta}
                disabled={fetching || !form.url.trim()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-accent text-accent text-xs font-semibold hover:bg-accent/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {fetching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {fetching ? "Fetching…" : "Re-fetch"}
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              className="w-full bg-background border border-border text-text-primary placeholder-text-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              className="w-full bg-background border border-border text-text-primary placeholder-text-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">Tags</label>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              <FileText size={11} className="inline mr-1" />Notes
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              className="w-full bg-background border border-border text-text-primary placeholder-text-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-error text-xs bg-error/10 border border-error/20 rounded-md px-3 py-2">
              <AlertCircle size={13} />{error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-success text-xs bg-success/10 border border-success/20 rounded-md px-3 py-2">
              <CheckCircle2 size={13} />Bookmark updated!
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-md border border-border text-text-secondary text-sm font-medium hover:bg-card-hover hover:text-text-primary transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.url.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? "Saving…" : "Update Bookmark"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
