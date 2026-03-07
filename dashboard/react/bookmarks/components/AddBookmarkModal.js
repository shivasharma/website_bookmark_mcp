import React, { useEffect, useState } from "react";

export function AddBookmarkModal({ open, bookmark, onClose, onSave }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!open) return;
    setUrl(bookmark?.url || "");
    setTitle(bookmark?.title || "");
    setDescription(bookmark?.description || "");
    setNotes(bookmark?.notes || "");
    setTags(Array.isArray(bookmark?.tags) ? bookmark.tags.join(", ") : "");
  }, [open, bookmark]);

  if (!open) return null;

  async function submit() {
    if (!url.trim()) return;
    const payload = {
      url: url.trim(),
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      notes: notes.trim() || undefined,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean)
    };
    await onSave(payload, bookmark?.id || null);
  }

  return React.createElement(
    "div",
    {
      className: "bm-modal-overlay",
      onClick: (event) => {
        if (event.target === event.currentTarget) onClose();
      }
    },
    React.createElement(
      "div",
      { className: "bm-modal" },
      React.createElement(
        "div",
        { className: "bm-modal-head" },
        React.createElement("h3", null, bookmark?.id ? "Edit Bookmark" : "Add Bookmark"),
        React.createElement("button", { className: "btn", type: "button", onClick: onClose }, "Close")
      ),
      React.createElement("input", { className: "bm-input", placeholder: "https://example.com", value: url, onChange: (e) => setUrl(e.target.value) }),
      React.createElement("input", { className: "bm-input", placeholder: "Title", value: title, onChange: (e) => setTitle(e.target.value) }),
      React.createElement("input", { className: "bm-input", placeholder: "Description", value: description, onChange: (e) => setDescription(e.target.value) }),
      React.createElement("input", { className: "bm-input", placeholder: "Tags (ai, dev, tools)", value: tags, onChange: (e) => setTags(e.target.value) }),
      React.createElement("textarea", { className: "bm-input", placeholder: "Notes", value: notes, onChange: (e) => setNotes(e.target.value), rows: 4 }),
      React.createElement(
        "div",
        null,
        React.createElement("button", { className: "btn", type: "button", onClick: onClose }, "Cancel"),
        React.createElement("button", { className: "btn primary", type: "button", onClick: submit }, bookmark?.id ? "Update" : "Save")
      )
    )
  );
}
