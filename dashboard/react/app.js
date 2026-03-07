import React from "react";
import { createRoot } from "react-dom/client";
import { BookmarksPage } from "./bookmarks/BookmarksPage.js";

function App() {
  return React.createElement(BookmarksPage);
}

const rootNode = document.getElementById("root");
const root = createRoot(rootNode);
root.render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(App)
  )
);
