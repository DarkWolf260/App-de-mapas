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
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
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
          background: "rgba(10, 15, 29, 0.96)",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          borderRadius: "14px",
          padding: "20px 24px",
          width: "380px",
          maxWidth: "90vw",
          boxShadow: "0 20px 50px rgba(239, 68, 68, 0.2)",
          color: "var(--text-main)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          animation: "fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header con icono de alerta */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "#f8fafc",
                letterSpacing: "0.03em",
              }}
            >
              Confirmar Eliminación
            </span>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensaje principal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "0.76rem", color: "#e2e8f0", margin: 0, lineHeight: 1.4 }}>
            ¿Está seguro de que desea eliminar {typeLabel}{" "}
            <strong style={{ color: "#f43f5e", fontWeight: 700 }}>"{itemTitle}"</strong> del mapa?
          </p>

          <div
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              padding: "8px 10px",
              fontSize: "0.68rem",
              color: "#fca5a5",
              lineHeight: 1.35,
            }}
          >
            ⚠️ Esta acción es permanente y eliminará todas las métricas, observaciones y registros de personal vinculados en la base de datos de Supabase.
          </div>
        </div>

        {/* Acciones */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "6px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "8px 14px",
              color: "#94a3b8",
              fontSize: "0.74rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              background: "rgba(239, 68, 68, 0.22)",
              border: "1px solid rgba(239, 68, 68, 0.5)",
              borderRadius: "8px",
              padding: "8px 14px",
              color: "#ef4444",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 0 12px rgba(239, 68, 68, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            <Trash2 size={13} />
            Eliminar Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
};
