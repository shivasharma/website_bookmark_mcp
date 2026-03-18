import React from "react";
import { Bell, Plus, ChevronDown, Menu, LogIn, Sun, Moon } from "lucide-react";
import { useLocation, NavLink } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useSession } from "../hooks/useSession";

const pageTitles = {
  "/":             "Home",
  "/dashboard":    "Dashboard",
  "/allbookmarks": "All Bookmarks",
  "/starred":      "Starred Bookmarks",
  "/recent":       "Recent",
  "/systemhealth": "System Health",
  "/mcp":          "MCP Setup",
  "/chat":         "Bookmark Chat",
  "/notifications":"Notifications",
  "/about":        "About",
};

const pageSubtitles = {
  "/dashboard":    "Your library at a glance",
  "/allbookmarks": "Browse and manage your links",
  "/starred":      "Your favourite bookmarks",
  "/recent":       "Recently added links",
  "/systemhealth": "Monitor sync & service health",
  "/mcp":          "Connect AI agents to your library",
};

/* ── Theme toggle ───────────────────────────────────────────────── */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="p-2 rounded-md text-text-muted hover:text-text-primary hover:bg-card border border-transparent hover:border-border transition-all"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}


// ── Navbar ──────────────────────────────────────────────────────
const Navbar = ({ onAddBookmark, onMenuToggle }) => {
  const location  = useLocation();
  const title    = pageTitles[location.pathname] ?? "LinkSync AI";
  const subtitle = pageSubtitles[location.pathname];
  const { session, loading } = useSession();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Helper for avatar (fallback to initials if no image)
  function getAvatarUrl(user) {
    if (!user || !user.email) return "https://i.pravatar.cc/32?img=11";
    const hash = user.email.trim().toLowerCase().split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 70 + 1;
    return `https://i.pravatar.cc/32?img=${hash}`;
  }

  React.useEffect(() => {
    if (!dropdownOpen) return;
    function onClick(e) {
      if (!e.target.closest(".user-dropdown")) setDropdownOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    window.location.reload();
  };

  const userSection = loading ? null : session ? (
    <div className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-border cursor-pointer group relative user-dropdown" onClick={() => setDropdownOpen((v) => !v)}>
      <div className="relative">
        <img
          src={getAvatarUrl(session)}
          alt="Profile"
          className="rounded-full w-8 h-8 ring-2 ring-accent/20"
        />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-success rounded-full border border-background" />
      </div>
      <div className="hidden lg:block">
        <div className="text-text-primary text-xs font-semibold leading-tight">{session.name || "User"}</div>
        <div className="text-text-muted text-[10px] leading-tight mt-0.5">{session.email || ""}</div>
      </div>
      <ChevronDown size={14} className="text-text-muted hidden lg:block" />
      {dropdownOpen && (
        <div className="absolute right-0 top-12 min-w-[180px] bg-card border border-border rounded-md shadow-card z-50 animate-fade-in p-2">
          <div className="px-3 py-2 text-xs text-text-primary font-semibold border-b border-border">{session.name}</div>
          <div className="px-3 py-2 text-xs text-text-muted border-b border-border">{session.email}</div>
          <NavLink to="/profile" className="block px-3 py-2 text-xs text-text-primary hover:bg-card-hover rounded-md">Profile</NavLink>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-xs text-error hover:bg-error/10 rounded-md mt-1">Log out</button>
        </div>
      )}
    </div>
  ) : (
    <NavLink
      to="/login"
      className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-text-secondary text-xs font-medium hover:bg-card hover:text-text-primary hover:border-accent/30 transition-all"
    >
      <LogIn size={14} />
      <span className="hidden sm:inline">Login</span>
    </NavLink>
  );

  return (
    <header className="shrink-0 z-30 w-full glass-nav border-b border-border">
      {/* Main row */}
      <div className="flex items-center justify-between px-5 md:px-8 h-[68px] gap-4">

        {/* Left — hamburger (mobile) + page title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-text-muted hover:text-text-primary hover:bg-card rounded-md transition-all shrink-0"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-text-primary font-semibold text-[15px] leading-tight truncate">{title}</h1>
            {subtitle && (
              <p className="text-text-muted text-[11px] leading-tight truncate hidden sm:block mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative p-2 text-text-muted hover:text-text-primary hover:bg-card rounded-md transition-all"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          </button>

          {/* Add Bookmark */}
          <button
            onClick={onAddBookmark}
            className="flex items-center gap-2 bg-accent text-white rounded-md font-semibold hover:bg-accent/90 transition-all hover:scale-[1.02] px-3 py-2 md:px-5"
          >
            <Plus size={16} />
            <span className="hidden md:inline text-sm">Add Bookmark</span>
          </button>

          {userSection}
        </div>
      </div>


    </header>
  );
};

export default Navbar;
