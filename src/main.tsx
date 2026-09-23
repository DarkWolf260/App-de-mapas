import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// Optimizar Canvas2D para lecturas frecuentes (OpenLayers) y suprimir advertencia de Chromium
if (typeof window !== "undefined") {
  const patch = (proto: any) => {
    if (!proto?.getContext) return;
    const original = proto.getContext;
    proto.getContext = function (type: string, options?: any) {
      if (type === "2d") {
        const opts = typeof options === "object" && options !== null
          ? { ...options, willReadFrequently: true }
          : { willReadFrequently: true };
        return original.call(this, type, opts);
      }
      return original.call(this, type, options);
    };
  };
  if (typeof HTMLCanvasElement !== "undefined") patch(HTMLCanvasElement.prototype);
  if (typeof OffscreenCanvas !== "undefined") patch(OffscreenCanvas.prototype);
}

// Prevent trackpad/mousepad zoom (Ctrl+scroll and pinch gestures)
document.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey) e.preventDefault();
  },
  { passive: false },
);

document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");
createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);
