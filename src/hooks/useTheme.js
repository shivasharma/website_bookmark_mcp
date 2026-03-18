import { useState, useEffect } from "react";

const STORAGE_KEY = "ls-theme";

// Runs synchronously on module import — before React renders — to prevent FOUC.
function initTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    document.documentElement.setAttribute("data-theme", stored);
    return stored;
  }
  const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  document.documentElement.setAttribute("data-theme", preferred);
  return preferred;
}

const initialTheme = initTheme();

/**
 * Manages the active UI theme (light / dark).
 * Respects system preference on first visit; persists choice to localStorage.
 * Applies data-theme attribute to <html> for CSS custom property overrides.
 *
 * Usage:
 *   const { theme, toggleTheme } = useTheme();
 */
export function useTheme() {
  const [theme, setThemeState] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function setTheme(t) {
    if (t === "light" || t === "dark") setThemeState(t);
  }

  function toggleTheme() {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return { theme, setTheme, toggleTheme };
}
