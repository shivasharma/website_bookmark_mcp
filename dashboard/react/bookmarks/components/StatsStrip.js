import React from "react";

function Stat({ label, value }) {
  return React.createElement(
    "div",
    { className: "bm-stat" },
    React.createElement("div", { className: "bm-stat-value" }, String(value)),
    React.createElement("div", { className: "bm-stat-label" }, label)
  );
}

export function StatsStrip({ total, starred, tags, imported }) {
  return React.createElement(
    "section",
    { className: "bm-stats" },
    React.createElement(Stat, { label: "Total Saved", value: total }),
    React.createElement(Stat, { label: "Starred", value: starred }),
    React.createElement(Stat, { label: "Tags Active", value: tags }),
    React.createElement(Stat, { label: "Imported", value: imported })
  );
}
