import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirmar",
  message,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(10, 15, 29, 0.98)",
          border: "1px solid rgba(251, 146, 60, 0.3)",
          borderRadius: "10px",
          padding: "14px 16px",
          width: "90%",
          maxWidth: "360px",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.6)",
          color: "var(--text-main)",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          animation: "fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "7px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(251, 146, 60, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertTriangle size={12} style={{ color: "#fb923c" }} />
            </div>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.03em" }}>{title}</span>
          </div>
          <button onClick={onCancel} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "3px" }}>
            <X size={13} />
          </button>
        </div>

        {/* Message */}
        <p style={{ fontSize: "0.68rem", color: "#e2e8f0", margin: 0, lineHeight: 1.4 }}>{message}</p>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "7px", marginTop: "2px" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "6px",
              padding: "6px 11px",
              color: "#94a3b8",
              fontSize: "0.66rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: "rgba(239, 68, 68, 0.18)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "6px",
              padding: "6px 11px",
              color: "#ef4444",
              fontSize: "0.66rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Trash2 size={11} />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
