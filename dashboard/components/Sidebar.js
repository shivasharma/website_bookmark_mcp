// Sidebar.js
// Sidebar component
import React from 'react';

export default function Sidebar({ section, onSectionChange, filter, onFilterChange, view, onViewChange, groupByCategory, onGroupByCategory }) {
  return (
    <aside className="sidebar-nav">
      <div className="sidebar-section">
        <h3>Library</h3>
        <button className={filter === 'all' ? 'active' : ''} onClick={() => onFilterChange('all')}>All</button>
        <button className={filter === 'starred' ? 'active' : ''} onClick={() => onFilterChange('starred')}>Starred</button>
        <button className={filter === 'recent' ? 'active' : ''} onClick={() => onFilterChange('recent')}>Recent</button>
        <button className={filter === 'unread' ? 'active' : ''} onClick={() => onFilterChange('unread')}>Read Later</button>
      </div>
      <div className="sidebar-section">
        <h3>Tools</h3>
        <button className={section === 'syshealth' ? 'active' : ''} onClick={() => onSectionChange('syshealth')}>System Health</button>
        <button className={section === 'mcp' ? 'active' : ''} onClick={() => onSectionChange('mcp')}>MCP Setup</button>
      </div>
      <div className="sidebar-section">
        <h3>View</h3>
        <button className={view === 'list' ? 'active' : ''} onClick={() => onViewChange('list')}>List</button>
        <button className={view === 'grid' ? 'active' : ''} onClick={() => onViewChange('grid')}>Grid</button>
        <button className={view === 'table' ? 'active' : ''} onClick={() => onViewChange('table')}>Table</button>
        <button className={groupByCategory ? 'active' : ''} onClick={onGroupByCategory}>Group by Category</button>
      </div>
    </aside>
  );
}
