import React from "react";
import { createRoot } from "react-dom/client";
import { baseCss } from "./styles.js";
import { BookmarksPage } from "./bookmarks/BookmarksPage.js";
// App.js
// Main React entry point for dashboard modularization
import React, { useState, useEffect } from 'react';
import Nav from '../components/Nav';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';

// Utility functions (from main.js)
function getInitialTheme() {
  const saved = localStorage.getItem('linksync-theme');
  if (saved) return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme:light)').matches) return 'light';
  return 'dark';
}

export default function App() {
  // State
  const [theme, setTheme] = useState(getInitialTheme());
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState(0);
  const [section, setSection] = useState('bookmarks');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState('list');
  const [sort, setSort] = useState('newest');
  const [bookmarks, setBookmarks] = useState([]);
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [search, setSearch] = useState('');
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [totalImported, setTotalImported] = useState(0);
  const [currentTimeFilter, setCurrentTimeFilter] = useState('all');

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('linksync-theme', theme);
  }, [theme]);

  // Simulate loading user and notifications (replace with real API calls)
  useEffect(() => {
    // Example: fetch user and notifications
    // setUser(...)
    // setNotifications(...)
  }, []);

  // Simulate loading bookmarks (replace with real API calls)
  useEffect(() => {
    // setBookmarks(...)
  }, []);

  // Handlers
  const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const handleSectionChange = (sec) => setSection(sec);
  const handleFilterChange = (f) => setFilter(f);
  const handleViewChange = (v) => setView(v);
  const handleSortChange = (s) => setSort(s);
  const handleGroupByCategory = () => setGroupByCategory((g) => !g);
  const handleSearchChange = (q) => setSearch(q);
  const handleAdvancedFiltersToggle = () => setAdvancedFiltersOpen((a) => !a);
  const handleRecentSearches = (arr) => setRecentSearches(arr);
  const handleTotalImported = (n) => setTotalImported(n);
  const handleTimeFilter = (t) => setCurrentTimeFilter(t);

  return (
    <div className="dashboard-app">
      <Nav
        theme={theme}
        onThemeToggle={handleThemeToggle}
        user={user}
        notifications={notifications}
        section={section}
        onSectionChange={handleSectionChange}
      />
      <Sidebar
        section={section}
        onSectionChange={handleSectionChange}
        filter={filter}
        onFilterChange={handleFilterChange}
        view={view}
        onViewChange={handleViewChange}
        groupByCategory={groupByCategory}
        onGroupByCategory={handleGroupByCategory}
      />
      <MainContent
        section={section}
        filter={filter}
        view={view}
        sort={sort}
        bookmarks={bookmarks}
        groupByCategory={groupByCategory}
        search={search}
        onSearchChange={handleSearchChange}
        advancedFiltersOpen={advancedFiltersOpen}
        onAdvancedFiltersToggle={handleAdvancedFiltersToggle}
        recentSearches={recentSearches}
        onRecentSearches={handleRecentSearches}
        totalImported={totalImported}
        onTotalImported={handleTotalImported}
        currentTimeFilter={currentTimeFilter}
        onTimeFilter={handleTimeFilter}
        user={user}
      />
    </div>
  );
}
