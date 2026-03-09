import React from "react";

const baseProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false
};

export function IconSearch(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("circle", { cx: 11, cy: 11, r: 6.5 }),
    React.createElement("line", { x1: 16, y1: 16, x2: 21, y2: 21 })
  );
}

export function IconPlus(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("line", { x1: 12, y1: 5, x2: 12, y2: 19 }),
    React.createElement("line", { x1: 5, y1: 12, x2: 19, y2: 12 })
  );
}

export function IconMcp(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("rect", { x: 4, y: 6.5, width: 16, height: 11, rx: 3 }),
    React.createElement("line", { x1: 8, y1: 4, x2: 8, y2: 6.5 }),
    React.createElement("line", { x1: 16, y1: 4, x2: 16, y2: 6.5 }),
    React.createElement("line", { x1: 8, y1: 17.5, x2: 8, y2: 20 }),
    React.createElement("line", { x1: 16, y1: 17.5, x2: 16, y2: 20 })
  );
}

export function IconBookmark(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z" })
  );
}

export function IconStar(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", {
      d: "M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.3L12 16.9 7.4 19l.9-5.3L4.5 10l5.2-.8L12 4.5z"
    })
  );
}

export function IconStarFilled(props = {}) {
  return React.createElement(
    "svg",
    {
      ...baseProps,
      ...props,
      fill: "currentColor",
      stroke: "none"
    },
    React.createElement("path", {
      d: "M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.3L12 16.9 7.4 19l.9-5.3L4.5 10l5.2-.8L12 4.5z"
    })
  );
}

export function IconEdit(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M4 16.8V20h3.2l9.4-9.4-3.2-3.2L4 16.8z" }),
    React.createElement("path", { d: "M13.7 6.3l3.2 3.2" })
  );
}

export function IconTrash(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M4 7h16" }),
    React.createElement("path", { d: "M9 7V5h6v2" }),
    React.createElement("path", { d: "M6.5 7l1 12h9l1-12" })
  );
}

export function IconList(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("line", { x1: 9, y1: 7, x2: 20, y2: 7 }),
    React.createElement("line", { x1: 9, y1: 12, x2: 20, y2: 12 }),
    React.createElement("line", { x1: 9, y1: 17, x2: 20, y2: 17 }),
    React.createElement("circle", { cx: 5, cy: 7, r: 1.5 }),
    React.createElement("circle", { cx: 5, cy: 12, r: 1.5 }),
    React.createElement("circle", { cx: 5, cy: 17, r: 1.5 })
  );
}

export function IconGrid(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("rect", { x: 4, y: 4, width: 7, height: 7, rx: 1.5 }),
    React.createElement("rect", { x: 13, y: 4, width: 7, height: 7, rx: 1.5 }),
    React.createElement("rect", { x: 4, y: 13, width: 7, height: 7, rx: 1.5 }),
    React.createElement("rect", { x: 13, y: 13, width: 7, height: 7, rx: 1.5 })
  );
}

export function IconClock(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("circle", { cx: 12, cy: 12, r: 8 }),
    React.createElement("path", { d: "M12 7v5l3 2" })
  );
}

export function IconReadLater(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M6 5.5h9.5a2 2 0 0 1 2 2V20l-5-2.6L7.5 20V7.5a2 2 0 0 1 2-2z" }),
    React.createElement("path", { d: "M9 9.2h6" }),
    React.createElement("path", { d: "M9 12.6h4.2" })
  );
}

export function IconShield(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M12 4l7 3v5c0 4.2-3 7.8-7 8.5-4-.7-7-4.3-7-8.5V7l7-3z" }),
    React.createElement("path", { d: "M12 9v5" }),
    React.createElement("path", { d: "M9.5 12h5" })
  );
}

export function IconSettings(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("circle", { cx: 12, cy: 12, r: 3.2 }),
    React.createElement("path", { d: "M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4.6a7 7 0 0 0-1.7-1L12 2 9.2 4.6a7 7 0 0 0-1.7 1l-2.4-.6-2 3.5 2 1.5a7 7 0 0 0-.1 1 7 7 0 0 0 .1 1l-2 1.5 2 3.5 2.4-.6a7 7 0 0 0 1.7 1L12 22l2.8-2.6a7 7 0 0 0 1.7-1l2.4.6 2-3.5-2-1.5c.1-.3.1-.7.1-1z" })
  );
}

export function IconTag(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M4 12l8-8h6v6l-8 8-6-6z" }),
    React.createElement("circle", { cx: 16, cy: 8, r: 1.5 })
  );
}

export function IconDownload(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M12 5v9" }),
    React.createElement("path", { d: "M8.5 10.5L12 14l3.5-3.5" }),
    React.createElement("path", { d: "M5 19h14" })
  );
}

export function IconBell(props = {}) {
  return React.createElement(
    "svg",
    { ...baseProps, ...props },
    React.createElement("path", { d: "M6 10a6 6 0 1 1 12 0v4l2 2H4l2-2v-4" }),
    React.createElement("path", { d: "M10 18a2 2 0 0 0 4 0" })
  );
}
