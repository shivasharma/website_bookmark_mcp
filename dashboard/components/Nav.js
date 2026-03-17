// Nav.js
// Top navigation bar component
import React from 'react';

export default function Nav({ theme, onThemeToggle, user, notifications, section, onSectionChange }) {
  return (
    <nav className="top-bar">
      <div className="nav-left">
        <button className="theme-toggle" onClick={onThemeToggle} title="Toggle theme">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        <span className="nav-title" onClick={() => onSectionChange('bookmarks')}>LinkSync AI</span>
      </div>
      <div className="nav-center">
        <button className={section === 'bookmarks' ? 'active' : ''} onClick={() => onSectionChange('bookmarks')}>Bookmarks</button>
        <button className={section === 'syshealth' ? 'active' : ''} onClick={() => onSectionChange('syshealth')}>System Health</button>
        <button className={section === 'mcp' ? 'active' : ''} onClick={() => onSectionChange('mcp')}>MCP Setup</button>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="user-avatar" title={user.name || user.email}>{user.name?.[0] || 'U'}</span>
            <button className="notify-btn" title="Notifications">
              🔔{notifications > 0 && <span className="notify-badge">{notifications}</span>}
            </button>
          </>
        ) : (
          <button className="sign-in-btn">Sign In</button>
        )}
      </div>
    </nav>
  );
}
