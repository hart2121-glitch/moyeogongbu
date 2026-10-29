import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/gowun-dodum/400.css";
import "@fontsource/gowun-batang/400.css";
import "@fontsource/gowun-batang/700.css";
import "./styles.css";
import "./study/study.css";
import App from "./app/App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
