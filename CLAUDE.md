# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LinkSync AI is a React-based bookmark management application built with Vite. It features a dark-themed UI with a sidebar navigation, dashboard with statistics, and bookmark organization capabilities.

## Build Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint on all files

## Architecture

### Tech Stack
- **Framework**: React 19 with React Router 7
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React
- **Linting**: ESLint with React Hooks and Refresh plugins

### Project Structure

```
src/
├── main.jsx              # App entry point (root render)
├── App.jsx               # Re-exports AppRouter
├── AppRouter.jsx         # Root layout with Navbar, Sidebar, Main
├── index.css             # Tailwind imports + custom CSS variables
├── layout/
│   ├── Navbar.jsx        # Top header with search, notifications
│   ├── Sidebar.jsx       # Left navigation with sections (LIBRARY, TOOLS)
│   ├── Main.jsx          # Main content wrapper with Outlet
│   └── MainRouter.jsx    # Route definitions for pages
└── components/           # Page components
    ├── Intro.jsx
    ├── Dashboard.jsx
    ├── AllLink.jsx
    ├── SystemHealth.jsx
    ├── MCP.jsx
    ├── About.jsx
    ├── BookmarkGrid.jsx
    └── BookmarkToolbar.jsx
```

### Routing Architecture

The routing uses a nested structure:
1. `AppRouter.jsx` - Root layout with `BrowserRouter`, contains Navbar, Sidebar, and a catch-all Route
2. `Main.jsx` - Layout component using `Outlet` for nested routes
3. `MainRouter.jsx` - Defines actual page routes (`/`, `/dashboard`, `/alllink`, etc.)

Routes:
- `/` → Intro
- `/dashboard` → Dashboard with stats and recent bookmarks
- `/alllink` → All bookmarks view
- `/systemhealth` → System health monitor
- `/mcp` → MCP setup page
- `/about` → About page

### Styling Patterns

**Tailwind Configuration** (`tailwind.config.js`):
- Custom color palette with CSS variable-like naming: `background`, `sidebar`, `card`, `card-hover`, `border`, `accent`, `accent2` (cyan), `accent3` (pink)
- Custom shadows: `shadow-glow`, `shadow-card`, `shadow-card-hover`
- Custom gradients: `bg-gradient-primary`, `bg-gradient-card`, `bg-gradient-accent`
- Animations: `animate-pulse-slow`, `animate-glow`, `animate-float`

**Common UI Patterns**:
- Cards: `bg-gradient-to-br from-card to-card-hover rounded-2xl border border-border`
- Hover states: `hover:border-accent/50 hover:-translate-y-1 hover:shadow-card-hover`
- Buttons: `bg-gradient-to-r from-accent to-accent2 rounded-xl hover:shadow-glow`
- Text gradients: `bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent`

### Component Conventions

- All components are default exports in PascalCase
- Layout components are in `src/layout/`
- Page components are in `src/components/`
- Components use Tailwind classes for styling (no CSS modules)
- Icons imported individually from `lucide-react`

### ESLint Configuration

- Uses flat config format (`eslint.config.js`)
- Ignores `dist/` directory
- Rules: `no-unused-vars` ignores variables starting with uppercase (component patterns)
