import React from "react";
import { AlertTriangle, X } from "lucide-react";
import { DeleteTarget } from "./types";

export interface DeleteConfirmModalProps {
  deleteTarget: DeleteTarget | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  deleteTarget,
  onClose,
  onConfirm,
}) => {
  if (!deleteTarget) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(10, 15, 29, 0.96)",
          border: "none",
          borderRadius: "12px",
          padding: "20px 24px",
          width: "400px",
          maxWidth: "90vw",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px",
            display: "inline-flex",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              padding: "10px",
              borderRadius: "10px",
              display: "flex",
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc" }}>
              {deleteTarget.title}
            </h3>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.74rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {deleteTarget.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-main)",
              fontSize: "0.74rem",
              fontWeight: 600,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              background: "#ef4444",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.74rem",
              fontWeight: 700,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
              boxShadow: "0 2px 10px rgba(239, 68, 68, 0.3)",
            }}
          >
            Confirmar Eliminación
          </button>
        </div>
      </div>
    </div>
  );
};
