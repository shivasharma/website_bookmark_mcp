import React, { useState, useEffect, useRef } from "react";
import { Tag, X, Plus } from "lucide-react";

const POPULAR_TAGS = [
  "ai", "dev", "design", "docs", "video", "tutorial",
  "news", "tool", "cloud", "security", "database", "productivity",
];

export default function TagInput({ tags, onChange }) {
  const [input, setInput]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allTags, setAllTags]       = useState([]);
  const [open, setOpen]             = useState(false);
  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  // Fetch existing tags once
  useEffect(() => {
    fetch("/api/bookmarks?pageSize=200", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const unique = [...new Set(json.data.flatMap((b) => b.tags || []))].sort();
          setAllTags(unique);
        }
      })
      .catch(() => {});
  }, []);

  // Filter dropdown suggestions
  useEffect(() => {
    const q = input.trim().toLowerCase();
    if (!q) { setSuggestions([]); setOpen(false); return; }
    const filtered = allTags.filter(
      (t) => t.toLowerCase().includes(q) && !tags.includes(t)
    );
    setSuggestions(filtered);
    setOpen(true);
  }, [input, allTags, tags]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target) && !inputRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function addTag(tag) {
    const t = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKeyDown(e) {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showAddNew =
    input.trim() &&
    !allTags.some((t) => t.toLowerCase() === input.trim().toLowerCase()) &&
    !tags.includes(input.trim().toLowerCase());

  // Popular tags not yet added
  const popularAvailable = POPULAR_TAGS.filter((t) => !tags.includes(t));

  return (
    <div className="space-y-2">
      {/* Input area */}
      <div className="relative" ref={dropRef}>
        <div
          className="min-h-[42px] w-full bg-background border border-border rounded-md px-3 py-2 flex flex-wrap gap-1.5 cursor-text focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/30 transition-all"
          onClick={() => inputRef.current?.focus()}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-accent/15 border border-accent/25 text-accent font-medium"
            >
              <Tag size={9} />
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="text-accent/60 hover:text-accent ml-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X size={9} />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.trim() && setOpen(true)}
            placeholder={tags.length ? "Add more…" : "Type a tag and press Enter…"}
            className="flex-1 min-w-[120px] bg-transparent text-text-primary text-sm placeholder-text-muted outline-none"
          />
        </div>

        {/* Dropdown */}
        {open && (suggestions.length > 0 || showAddNew) && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-card overflow-hidden">
            {suggestions.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-card-hover hover:text-text-primary transition-colors text-left"
              >
                <Tag size={12} className="text-accent shrink-0" />
                {tag}
              </button>
            ))}
            {showAddNew && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addTag(input); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-accent hover:bg-accent/10 transition-colors text-left border-t border-border"
              >
                <Plus size={12} className="shrink-0" />
                Add &ldquo;{input.trim()}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>

      {/* Popular tags */}
      {popularAvailable.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {popularAvailable.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-border text-text-muted hover:border-accent/40 hover:text-accent hover:bg-accent/8 transition-all"
            >
              <Plus size={8} />
              {tag}
            </button>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-muted">
        Enter or comma to add · Backspace to remove
      </p>
    </div>
  );
}
