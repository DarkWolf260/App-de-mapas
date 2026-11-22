import React, { useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, children, height = "55vh" }) => {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.65)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 250,
          animation: "sheetFadeIn 0.18s ease-out",
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          maxHeight: "84dvh",
          background: "rgba(10, 15, 29, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "16px 16px 0 0",
          boxShadow: "0 -12px 36px rgba(0, 0, 0, 0.65)",
          zIndex: 251,
          display: "flex",
          flexDirection: "column",
          animation: "sheetSlideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 16px 8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "38px",
              height: "4px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.22)",
              cursor: "pointer",
            }}
            onClick={onClose}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            style={{
              position: "absolute",
              right: "12px",
              top: "8px",
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
              width: "30px",
              height: "30px",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "4px 16px 20px" }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes sheetFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sheetSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};
