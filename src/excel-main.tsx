import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./excel.css";
import { ExcelApp } from "./ExcelApp";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <ExcelApp />
  </StrictMode>
);
