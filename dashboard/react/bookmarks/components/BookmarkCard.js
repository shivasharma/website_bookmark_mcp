import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

export default function BookmarkCard({
  favicon,
  title,
  url,
  description,
  dateSaved,
  tags,
  onEdit,
  onDelete
}) {
  const [tab, setTab] = React.useState("details");
  return (
    <div className="bookmark-card">
      <div className="bookmark-card-tabs">
        <button
          className={tab === "details" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTab("details")}
        >
          Details
        </button>
        <button
          className={tab === "tags" ? "tab-pill active" : "tab-pill"}
          onClick={() => setTab("tags")}
        >
          Tags
        </button>
      </div>
      {tab === "details" && (
        <div className="bookmark-card-main">
          <div className="bookmark-card-favicon">
            <img src={favicon} alt="favicon" />
          </div>
          <div className="bookmark-card-body">
            <div className="bookmark-card-title">{title}</div>
            <div className="bookmark-card-url" title={url}>{url}</div>
            <div className="bookmark-card-desc">{description}</div>
          </div>
          <div className="bookmark-card-actions">
            <button className="icon-btn" onClick={onEdit} title="Edit"><FaEdit /></button>
            <button className="icon-btn" onClick={onDelete} title="Delete"><FaTrash /></button>
          </div>
        </div>
      )}
      {tab === "tags" && (
        <div className="bookmark-card-tags-panel">
          <span className="bookmark-card-date">{dateSaved}</span>
          {tags && tags.length > 0 ? (
            <span className="bookmark-card-tags">
              {tags.map((tag, i) => (
                <span className="bookmark-card-tag" key={i}>{tag}</span>
              ))}
            </span>
          ) : (
            <span className="bookmark-card-tags-empty">No tags</span>
          )}
        </div>
      )}
    </div>
  );
}
