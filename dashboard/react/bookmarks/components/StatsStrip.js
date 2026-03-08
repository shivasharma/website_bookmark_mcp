import React from "react";
import { IconBookmark, IconDownload, IconStarFilled, IconTag } from "./icons.js";

function Stat({ label, value, icon }) {
  return React.createElement(
    "div",
    { className: "bm-stat" },
    React.createElement("div", { className: "bm-stat-icon" }, icon),
    React.createElement("div", { className: "bm-stat-value" }, String(value)),
    React.createElement("div", { className: "bm-stat-label" }, label)
  );
}

export function StatsStrip({ total, starred, tags, imported }) {
  return React.createElement(
    "section",
    { className: "bm-stats" },
    React.createElement(Stat, { label: "Total Saved", value: total, icon: React.createElement(IconBookmark, { className: "bm-icon" }) }),
    React.createElement(Stat, { label: "Starred", value: starred, icon: React.createElement(IconStarFilled, { className: "bm-icon" }) }),
    React.createElement(Stat, { label: "Tags Active", value: tags, icon: React.createElement(IconTag, { className: "bm-icon" }) }),
    React.createElement(Stat, { label: "Imported", value: imported, icon: React.createElement(IconDownload, { className: "bm-icon" }) })
  );
}
