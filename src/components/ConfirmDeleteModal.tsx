import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  itemTitle?: string;
  itemType?: "point" | "polygon" | "polyline" | string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  itemTitle = "este elemento",
  itemType,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const typeLabel =
    itemType === "point"
      ? "el punto"
      : itemType === "polygon"
      ? "el polígono"
      : itemType === "polyline"
      ? "la línea"
      : "el elemento";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 20000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "10px",
          padding: "18px 20px",
          width: "340px",
          maxWidth: "90vw",
          boxShadow: "0 12px 35px rgba(0, 0, 0, 0.5)",
          color: "var(--text-main)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trash2 size={16} style={{ color: "#ef4444" }} />
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#f8fafc",
              }}
            >
              Eliminar {typeLabel}
            </span>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Mensaje principal */}
        <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: 0, lineHeight: 1.45 }}>
          ¿Estás seguro de que deseas eliminar <strong style={{ color: "#f8fafc" }}>"{itemTitle}"</strong>? Esta acción no se puede deshacer.
        </p>

        {/* Acciones */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "4px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "6px",
              padding: "6px 12px",
              color: "#cbd5e1",
              fontSize: "0.74rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: "#ef4444",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              color: "#ffffff",
              fontSize: "0.74rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
