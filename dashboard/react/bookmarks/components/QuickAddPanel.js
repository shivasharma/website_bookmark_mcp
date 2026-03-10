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

export function QuickAddPanel({ onSave, tagFrequency, existingUrls }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [selectedSuggestedTags, setSelectedSuggestedTags] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [metaMessage, setMetaMessage] = useState("");
  const [urlStatus, setUrlStatus] = useState("idle");
  const [tagSearch, setTagSearch] = useState("");
  const [customTagInput, setCustomTagInput] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [savedConfirm, setSavedConfirm] = useState(null);
  const savedTimerRef = React.useRef(null);

  const urlSet = existingUrls || new Set();

  const freq = tagFrequency || {};

  const topTags = React.useMemo(() => {
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([t]) => t);
  }, [freq]);

  const allVisibleTags = React.useMemo(() => {
    const merged = new Set([...suggestedTags, ...topTags]);
    return [...merged];
  }, [suggestedTags, topTags]);

  const filteredTags = React.useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    if (!q) return allVisibleTags;
    return allVisibleTags.filter((t) => t.toLowerCase().includes(q));
  }, [allVisibleTags, tagSearch]);

  function validateUrlLive(value) {
    const trimmed = String(value || "").trim();
    if (!trimmed) {
      setUrlStatus("idle");
      setDuplicateWarning("");
      return;
    }
    const normalized = normalizeUrlCandidate(trimmed);
    if (!normalized) {
      setUrlStatus("invalid");
      setDuplicateWarning("");
      return;
    }
    setUrlStatus("valid");
    if (urlSet.has(normalized)) {
      setDuplicateWarning("This URL is already in your bookmarks.");
    } else {
      setDuplicateWarning("");
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        validateUrlLive(text.trim());
        const normalized = normalizeUrlCandidate(text.trim());
        if (normalized) {
          const metadata = await enrichFromUrl(text.trim());
          if (metadata.url) {
            setUrl(metadata.url);
            if (!toOptionalText(title) && metadata.title) setTitle(metadata.title);
            if (!toOptionalText(description) && metadata.description) setDescription(metadata.description);
            const inferred = inferTags({ url: metadata.url, title: metadata.title, description: metadata.description });
            setSuggestedTags(inferred);
            setSelectedSuggestedTags(inferred);
            setMetaMessage("Pasted and auto-filled details.");
          }
        }
      }
    } catch {
      /* clipboard read not available */
    }
  }

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
    setUrlStatus("idle");
    setTagSearch("");
    setCustomTagInput("");
    setShowMore(false);
    setDuplicateWarning("");
  }

  function cancelConfirmTimer() {
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = null;
    }
  }

  function undoSave() {
    cancelConfirmTimer();
    if (savedConfirm) {
      setUrl(savedConfirm.url || "");
      setTitle(savedConfirm.title || "");
      setDescription(savedConfirm.description || "");
      setNotes(savedConfirm.notes || "");
      setSelectedSuggestedTags(savedConfirm.tags || []);
      setSuggestedTags(savedConfirm.tags || []);
    }
    setSavedConfirm(null);
  }

  function addCustomTag() {
    const raw = customTagInput.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 50);
    if (!raw) return;
    if (!suggestedTags.includes(raw)) {
      setSuggestedTags((prev) => [...prev, raw]);
    }
    if (!selectedSuggestedTags.includes(raw)) {
      setSelectedSuggestedTags((prev) => [...prev, raw]);
    }
    setCustomTagInput("");
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

  async function submit(keepForm) {
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

    const snapshot = { ...payload };
    await onSave(payload);

    cancelConfirmTimer();
    setSavedConfirm(snapshot);

    if (keepForm) {
      setUrl("");
      setUrlStatus("idle");
      setDuplicateWarning("");
      setMetaMessage("Saved! Enter another URL.");
    } else {
      clearForm();
    }

    savedTimerRef.current = setTimeout(() => {
      setSavedConfirm(null);
    }, 5000);
  }

  return React.createElement(
    "section",
    { className: "card" },
    React.createElement("h2", null, "Quick Add Bookmark"),
    React.createElement(
      "p",
      { className: "sub" },
      "Paste a URL or type a domain — we handle the rest."
    ),

    // ── Section 1: URL Input ──
    React.createElement(
      "div",
      { className: "bm-form-section" },
      React.createElement("div", { className: "bm-form-section-label" }, "URL"),
      React.createElement(
        "div",
        { className: "bm-url-wrap" },
        React.createElement("input", {
          className: `bm-input${urlStatus === "valid" ? " is-valid" : ""}${urlStatus === "invalid" ? " is-invalid" : ""}`,
          placeholder: "e.g., github.com or https://example.com",
          value: url,
          onChange: (e) => { setUrl(e.target.value); validateUrlLive(e.target.value); },
          onBlur: autoFillMetadata,
          "aria-label": "Bookmark URL",
          "aria-invalid": urlStatus === "invalid" ? "true" : undefined
        }),
        React.createElement(
          "button",
          {
            className: "bm-paste-btn",
            type: "button",
            onClick: handlePaste,
            "aria-label": "Paste URL from clipboard",
            title: "Paste from clipboard"
          },
          React.createElement("svg", { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" },
            React.createElement("rect", { x: 9, y: 9, width: 13, height: 13, rx: 2, ry: 2 }),
            React.createElement("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
          )
        ),
        urlStatus === "valid" && React.createElement(
          "span",
          { className: "bm-url-status is-valid", "aria-label": "Valid URL" },
          React.createElement("svg", { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2.5, viewBox: "0 0 24 24" },
            React.createElement("polyline", { points: "20 6 9 17 4 12" })
          )
        ),
        urlStatus === "invalid" && React.createElement(
          "span",
          { className: "bm-url-status is-invalid", "aria-label": "Invalid URL" },
          React.createElement("svg", { width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 2.5, viewBox: "0 0 24 24" },
            React.createElement("line", { x1: 18, y1: 6, x2: 6, y2: 18 }),
            React.createElement("line", { x1: 6, y1: 6, x2: 18, y2: 18 })
          )
        )
      ),
      !!metaMessage && React.createElement("p", { className: "sub bm-meta-msg" }, metaMessage),
      !!duplicateWarning && React.createElement("p", { className: "bm-dup-warning", role: "alert" }, duplicateWarning)
    ),

    // ── Section 2: Auto-filled Details ──
    React.createElement(
      "div",
      { className: "bm-form-section" },
      React.createElement("div", { className: "bm-form-section-label" }, "Details"),
      React.createElement("input", {
        className: "bm-input",
        placeholder: "e.g., My Favorite Tool",
        value: title,
        onChange: (e) => setTitle(e.target.value),
        "aria-label": "Bookmark title"
      }),
      !showMore && React.createElement(
        "button",
        {
          className: "bm-expand-btn",
          type: "button",
          onClick: () => setShowMore(true),
          "aria-expanded": false
        },
        "+ Add description & notes"
      ),
      showMore && React.createElement("input", {
        className: "bm-input",
        placeholder: "e.g., A handy resource for...",
        value: description,
        onChange: (e) => setDescription(e.target.value),
        "aria-label": "Bookmark description"
      }),
      showMore && React.createElement("textarea", {
        className: "bm-input",
        placeholder: "e.g., Check out the API docs section...",
        value: notes,
        onChange: (e) => setNotes(e.target.value),
        rows: 3,
        "aria-label": "Bookmark notes"
      })
    ),

    // ── Section 3: Tag Selection ──
    React.createElement(
      "div",
      { className: "bm-form-section" },
      React.createElement("div", { className: "bm-form-section-label" }, "Tags"),
      React.createElement(
        "div",
        { className: "bm-tag-manager" },
        allVisibleTags.length > 6 &&
          React.createElement("input", {
            className: "bm-input bm-tag-search",
            placeholder: "Search tags...",
            value: tagSearch,
            onChange: (e) => setTagSearch(e.target.value),
            "aria-label": "Filter suggested tags"
          }),
        React.createElement(
          "div",
          { className: "bm-tag-scroll" },
          filteredTags.length === 0 && React.createElement("span", { className: "sub" }, "No matching tags."),
          ...filteredTags.map((tag) => {
            const active = selectedSuggestedTags.includes(tag);
            const count = freq[tag];
            const isSuggested = suggestedTags.includes(tag);
            return React.createElement(
              "button",
              {
                className: `bm-suggest-chip${active ? " is-active" : ""}${isSuggested ? " is-suggested" : ""}`,
                type: "button",
                key: `tag-${tag}`,
                onClick: () => toggleSuggestedTag(tag),
                "aria-label": `${active ? "Remove" : "Add"} tag ${tag}`,
                "aria-pressed": active
              },
              tag,
              count && React.createElement("span", { className: "bm-tag-freq" }, count)
            );
          })
        ),
        React.createElement(
          "div",
          { className: "bm-custom-tag-row" },
          React.createElement("input", {
            className: "bm-input bm-custom-tag-input",
            placeholder: "New tag name",
            value: customTagInput,
            onChange: (e) => setCustomTagInput(e.target.value),
            onKeyDown: (e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } },
            "aria-label": "Custom tag name"
          }),
          React.createElement(
            "button",
            { className: "btn bm-add-tag-btn", type: "button", onClick: addCustomTag, "aria-label": "Add custom tag" },
            "+ Add tag"
          )
        )
      )
    ),

    // ── Actions ──
    !!savedConfirm && React.createElement(
      "div",
      { className: "bm-saved-banner", role: "status" },
      React.createElement("span", null, "\u2713 Bookmark saved!"),
      React.createElement(
        "button",
        { className: "btn bm-undo-btn", type: "button", onClick: undoSave },
        "Undo"
      )
    ),
    React.createElement(
      "div",
      { className: "bm-quick-actions" },
      React.createElement("button", { className: "btn", type: "button", onClick: clearForm }, "Clear"),
      React.createElement(
        "button",
        { className: "btn", type: "button", onClick: () => submit(true), "aria-label": "Save bookmark and add another" },
        "Save & Add Another"
      ),
      React.createElement("button", { className: "btn primary", type: "button", onClick: () => submit(false), "aria-label": "Save bookmark" }, "Save")
    )
  );
}
