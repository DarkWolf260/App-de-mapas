import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./shared.css";
import { AdminApp } from "./AdminApp";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>
);
