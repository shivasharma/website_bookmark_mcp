import React, { useState } from "react";

function toOptionalText(value) {
  const trimmed = String(value || "").trim();
  return trimmed || undefined;
}

function parseTags(tagsText) {
  return String(tagsText || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function QuickAddPanel({ onSave }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");

  function clearForm() {
    setUrl("");
    setTitle("");
    setDescription("");
    setNotes("");
    setTags("");
  }

  async function submit() {
    const normalizedUrl = toOptionalText(url);
    if (!normalizedUrl) {
      return;
    }

    const payload = {
      url: normalizedUrl,
      title: toOptionalText(title),
      description: toOptionalText(description),
      notes: toOptionalText(notes),
      tags: parseTags(tags)
    };

    await onSave(payload);
    clearForm();
  }

  return React.createElement(
    "section",
    { className: "card" },
    React.createElement("h2", null, "Quick Add"),
    React.createElement("input", { className: "bm-input", placeholder: "https://example.com", value: url, onChange: (e) => setUrl(e.target.value) }),
    React.createElement("input", { className: "bm-input", placeholder: "Title", value: title, onChange: (e) => setTitle(e.target.value) }),
    React.createElement("input", { className: "bm-input", placeholder: "Description", value: description, onChange: (e) => setDescription(e.target.value) }),
    React.createElement("input", { className: "bm-input", placeholder: "Tags (ai, dev, tools)", value: tags, onChange: (e) => setTags(e.target.value) }),
    React.createElement("textarea", { className: "bm-input", placeholder: "Notes", value: notes, onChange: (e) => setNotes(e.target.value), rows: 3 }),
    React.createElement(
      "div",
      null,
      React.createElement("button", { className: "btn", type: "button", onClick: clearForm }, "Clear"),
      React.createElement("button", { className: "btn primary", type: "button", onClick: submit }, "Save")
    )
  );
}
