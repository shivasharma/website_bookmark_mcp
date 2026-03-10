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

function normalizeUrlCandidate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function uniqueTags(tags, max = 12) {
  const seen = new Set();
  const result = [];
  for (const item of tags) {
    const normalized = String(item || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= max) {
      break;
    }
  }
  return result;
}

function inferTags({ url, title, description }) {
  const combined = `${url || ""} ${title || ""} ${description || ""}`.toLowerCase();
  const tags = [];
  if (/github|gitlab|bitbucket|stackoverflow|api|developer|javascript|typescript|python|node/.test(combined)) tags.push("dev");
  if (/openai|anthropic|huggingface|llm|ai|machine learning|neural/.test(combined)) tags.push("ai");
  if (/docs|documentation|guide|reference/.test(combined)) tags.push("docs");
  if (/design|figma|ux|ui|dribbble|behance/.test(combined)) tags.push("design");
  if (/video|youtube|youtu\.be|podcast/.test(combined)) tags.push("video");
  if (/news|announcement|release|update|blog/.test(combined)) tags.push("news");
  if (/tool|extension|plugin|app|platform/.test(combined)) tags.push("tool");
  if (!tags.length) tags.push("read-later");
  return uniqueTags(tags, 8);
}

export function QuickAddPanel({ onSave }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedSuggestedTags, setSelectedSuggestedTags] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaMessage, setMetaMessage] = useState("");

  function toggleSuggestedTag(tag) {
    setSelectedSuggestedTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }

  async function enrichFromUrl(inputUrl) {
    const normalized = normalizeUrlCandidate(inputUrl);
    if (!normalized) {
      return { url: "", title: "", description: "" };
    }

    setLoadingMeta(true);
    try {
      const response = await fetch(`/api/url-metadata?url=${encodeURIComponent(normalized)}`, {
        method: "GET",
        credentials: "include"
      });
      const payload = await response.json().catch(() => null);
      if (response.ok && payload?.success && payload.data) {
        return {
          url: String(payload.data.url || normalized),
          title: String(payload.data.title || "").trim(),
          description: String(payload.data.description || "").trim()
        };
      }
      return { url: normalized, title: "", description: "" };
    } catch {
      return { url: normalized, title: "", description: "" };
    } finally {
      setLoadingMeta(false);
    }
  }

  function clearForm() {
    setUrl("");
    setTitle("");
    setDescription("");
    setNotes("");
    setTags("");
    setSuggestedTags([]);
    setSelectedSuggestedTags([]);
    setMetaMessage("");
  }

  async function autoFillMetadata() {
    const rawUrl = toOptionalText(url);
    if (!rawUrl) {
      return;
    }
    const metadata = await enrichFromUrl(rawUrl);
    if (!metadata.url) {
      return;
    }
    setUrl(metadata.url);
    if (!toOptionalText(title) && metadata.title) {
      setTitle(metadata.title);
    }
    if (!toOptionalText(description) && metadata.description) {
      setDescription(metadata.description);
    }

    const inferred = inferTags({
      url: metadata.url,
      title: metadata.title || title,
      description: metadata.description || description
    });
    setSuggestedTags(inferred);
    setSelectedSuggestedTags(inferred);
    setMetaMessage(inferred.length ? "Auto-filled details and suggested tags." : "Auto-filled details.");
  }

  async function submit() {
    const normalizedUrl = toOptionalText(url);
    if (!normalizedUrl) {
      return;
    }

    const metadata = await enrichFromUrl(normalizedUrl);
    const mergedTags = uniqueTags([...parseTags(tags), ...selectedSuggestedTags]);
    const finalTitle = toOptionalText(title) || toOptionalText(metadata.title);
    const finalDescription = toOptionalText(description) || toOptionalText(metadata.description);
    const finalUrl = toOptionalText(metadata.url) || normalizedUrl;

    const payload = {
      url: finalUrl,
      title: finalTitle,
      description: finalDescription,
      notes: toOptionalText(notes),
      tags: mergedTags
    };

    await onSave(payload);
    clearForm();
  }

  return React.createElement(
    "section",
    { className: "card" },
    React.createElement("h2", null, "Quick Add Bookmark"),
    React.createElement(
      "p",
      { className: "sub" },
      "Enter a domain or URL. We will auto-fill title and description, then suggest organized tags you can tap to keep or remove."
    ),
    React.createElement("input", {
      className: "bm-input",
      placeholder: "example.com or https://example.com",
      value: url,
      onChange: (e) => setUrl(e.target.value),
      onBlur: autoFillMetadata,
      "aria-label": "Bookmark URL"
    }),
    React.createElement("input", { className: "bm-input", placeholder: "Title", value: title, onChange: (e) => setTitle(e.target.value), "aria-label": "Bookmark title" }),
    React.createElement("input", {
      className: "bm-input",
      placeholder: "Description",
      value: description,
      onChange: (e) => setDescription(e.target.value),
      "aria-label": "Bookmark description"
    }),
    React.createElement("input", {
      className: "bm-input",
      placeholder: "Tags (ai, dev, tools)",
      value: tags,
      onChange: (e) => setTags(e.target.value),
      "aria-label": "Bookmark tags"
    }),
    React.createElement("textarea", {
      className: "bm-input",
      placeholder: "Notes",
      value: notes,
      onChange: (e) => setNotes(e.target.value),
      rows: 3,
      "aria-label": "Bookmark notes"
    }),
    !!metaMessage && React.createElement("p", { className: "sub" }, metaMessage),
    suggestedTags.length > 0 &&
      React.createElement(
        "div",
        { className: "bm-suggest-wrap" },
        React.createElement("p", { className: "sub", style: { marginTop: 0 } }, "Suggested tags (tap to toggle):"),
        React.createElement(
          "div",
          { className: "bm-suggest-tags" },
          ...suggestedTags.map((tag) => {
            const active = selectedSuggestedTags.includes(tag);
            return React.createElement(
              "button",
              {
                className: `bm-suggest-chip${active ? " is-active" : ""}`,
                type: "button",
                key: `quick-suggest-${tag}`,
                onClick: () => toggleSuggestedTag(tag),
                "aria-label": `${active ? "Remove" : "Add"} suggested tag ${tag}`,
                "aria-pressed": active
              },
              tag
            );
          })
        )
      ),
    React.createElement(
      "div",
      { className: "bm-quick-actions" },
      React.createElement("button", { className: "btn", type: "button", onClick: clearForm }, "Clear"),
      React.createElement(
        "button",
        { className: "btn", type: "button", onClick: autoFillMetadata, disabled: loadingMeta, "aria-label": "Auto fill title and description" },
        loadingMeta ? "Fetching..." : "Auto Fill"
      ),
      React.createElement("button", { className: "btn primary", type: "button", onClick: submit, "aria-label": "Quick add bookmark" }, "Quick Add")
    )
  );
}
