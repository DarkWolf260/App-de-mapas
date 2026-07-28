import React, { useEffect } from "react";
import { X } from "lucide-react";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string;
}

export const Sheet: React.FC<SheetProps> = ({ open, onClose, children, height = "50vh" }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 250,
          animation: "sheetFadeIn 0.2s ease-out",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          maxHeight: "85vh",
          background: "rgba(10, 15, 28, 0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px 16px 0 0",
          zIndex: 251,
          display: "flex",
          flexDirection: "column",
          animation: "sheetSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          overflow: "hidden",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 0 4px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "36px",
              height: "4px",
              borderRadius: "2px",
              background: "rgba(255, 255, 255, 0.25)",
              cursor: "pointer",
            }}
            onClick={onClose}
          />
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              right: "12px",
              top: "6px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "50%",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              width: "28px",
              height: "28px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
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
