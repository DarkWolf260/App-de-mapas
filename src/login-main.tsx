import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./shared.css";
import { LoginPage } from "./components/LoginPage";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <LoginPage />
  </StrictMode>
);
