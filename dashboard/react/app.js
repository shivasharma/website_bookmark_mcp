import React from "react";
import { createRoot } from "react-dom/client";
import { baseCss } from "./styles.js";
import { BookmarksPage } from "./bookmarks/BookmarksPage.js";

function App() {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement("style", null, baseCss),
    React.createElement(BookmarksPage)
  );
}

const rootNode = document.getElementById("root");
if (!rootNode) {
  throw new Error("Root element #root not found");
}

const root = createRoot(rootNode);
root.render(
  React.createElement(
    React.StrictMode,
    null,
    React.createElement(App)
  )
);
