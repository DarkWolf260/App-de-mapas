import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared.css";
import { ExcelApp } from "./ExcelApp";
import { ErrorBoundary } from "./components/ErrorBoundary";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <ExcelApp />
    </ErrorBoundary>
  </StrictMode>
);
