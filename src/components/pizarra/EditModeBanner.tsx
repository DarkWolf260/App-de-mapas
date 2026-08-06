import React from "react";
import { Edit3, Lock } from "lucide-react";

interface EditModeBannerProps {
  canEdit: boolean;
  isEditMode: boolean;
  isToday?: boolean;
  canEditHistorical?: boolean;
}

export const EditModeBanner: React.FC<EditModeBannerProps> = ({
  canEdit,
  isEditMode,
  isToday = true,
  canEditHistorical = false,
}) => {
  if (canEdit && isEditMode) {
    return (
      <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }}>
        <Edit3 size={14} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
        <span><strong>Modo Edición Activo:</strong> Puedes modificar las entradas y registros operacionales de la fecha.</span>
      </div>
    );
  }
  if (!canEdit) {
    const isHistorical = !isToday && !canEditHistorical;
    return (
      <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.72rem", flexShrink: 0 }}>
        <Lock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span>
          <strong>Modo Solo Lectura:</strong>{" "}
          {isHistorical
            ? "Los operadores solo pueden modificar registros y entradas de la fecha actual."
            : "Tu usuario no posee permisos para modificar estos registros."}
        </span>
      </div>
    );
  }
  return null;
};
