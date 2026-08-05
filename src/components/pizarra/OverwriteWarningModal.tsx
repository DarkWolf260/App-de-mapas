import React from "react";
import { ShieldAlert } from "lucide-react";

interface OverwriteWarningModalProps {
  open: boolean;
  saving: boolean;
  date: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const OverwriteWarningModal: React.FC<OverwriteWarningModalProps> = ({ open, saving, date, onCancel, onConfirm }) => {
  if (!open) return null;
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
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-primary)",
          border: "1px solid rgba(249, 115, 22, 0.4)",
          borderRadius: "14px",
          padding: "24px",
          width: "420px",
          maxWidth: "90vw",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-orange)",
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc", margin: 0 }}>
              Registro Existente Detectado
            </h3>
            <p style={{ fontSize: "0.72rem", color: "var(--accent-orange)", fontWeight: 600, margin: 0 }}>
              Día: {date.split("-").reverse().join("/")}
            </p>
          </div>
        </div>

        <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
          Ya se encuentra guardada una Pizarra Operacional para esta fecha. Si continúas, <strong>se actualizará y sobreescribirá el registro existente del día</strong> con los datos actuales.
        </p>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={onCancel}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "var(--text-muted)",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, var(--accent-orange), #ea580c)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "var(--sans-font)",
              boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
            }}
          >
            {saving ? "Actualizando..." : "Sí, Actualizar Registro"}
          </button>
        </div>
      </div>
    </div>
  );
};
