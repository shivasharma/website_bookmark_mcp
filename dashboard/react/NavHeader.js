import React, { useState } from "react";
import { FaPlus, FaChevronDown } from "react-icons/fa";

export default function NavHeader({
  search,
  onSearchChange,
  onAddBookmark,
  user,
  quickFilter,
  onQuickFilter,
  refineOptions,
  onRefineChange
}) {
  const [refineOpen, setRefineOpen] = useState(false);
  return (
    <>
      <nav className="nav-header">
        <div className="nav-header-left">
          {/* Logo or left content can go here if needed */}
        </div>
        <div className="nav-header-center">
          <div className="nav-header-search">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="nav-header-right">
          <button className="btn-add-bookmark" onClick={onAddBookmark}>
            <FaPlus /> Add Bookmark
          </button>
          <div className="profile-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            ) : (
              user?.initials || "U"
            )}
          </div>
        </div>
      </nav>
      <div className="quick-filters-row">
        {["All", "Starred", "Recent", "Unread"].map((label) => (
          <button
            key={label}
            className={
              "quick-filter-chip" + (quickFilter === label.toLowerCase() ? " active" : "")
            }
            onClick={() => onQuickFilter(label.toLowerCase())}
          >
            {label}
          </button>
        ))}
        <div className={"refine-dropdown" + (refineOpen ? " open" : "")}
          tabIndex={0}
          onBlur={() => setRefineOpen(false)}
        >
          <button
            className="refine-dropdown-btn"
            onClick={() => setRefineOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={refineOpen}
          >
            Refine <FaChevronDown style={{ fontSize: 13 }} />
          </button>
          <div className="refine-dropdown-content">
            {/* Example advanced filters: Time, Tags */}
            <div className="refine-dropdown-section">
              <div className="refine-dropdown-label">Time</div>
              <select
                value={refineOptions.time || "all"}
                onChange={e => onRefineChange({ ...refineOptions, time: e.target.value })}
              >
                <option value="all">Any time</option>
                <option value="today">Saved today</option>
                <option value="week">This week</option>
              </select>
            </div>
            <div className="refine-dropdown-section">
              <div className="refine-dropdown-label">Tags</div>
              <input
                type="text"
                placeholder="Filter by tag..."
                value={refineOptions.tags || ""}
                onChange={e => onRefineChange({ ...refineOptions, tags: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
