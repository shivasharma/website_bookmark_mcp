import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
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
const root = createRoot(rootNode);
root.render(React.createElement(BrowserRouter, null, React.createElement(App)));
