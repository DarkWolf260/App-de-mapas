import React from "react";
import { Edit3, Lock } from "lucide-react";

interface EditModeBannerProps {
  canEdit: boolean;
  isEditMode: boolean;
}

export const EditModeBanner: React.FC<EditModeBannerProps> = ({ canEdit, isEditMode }) => {
  if (canEdit && isEditMode) {
    return (
      <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-orange)", fontSize: "0.72rem", fontWeight: 600, flexShrink: 0 }}>
        <Edit3 size={14} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
        <span><strong>Modo Edición Activo:</strong> Puedes editar nombres, modificar números de oficiales y agregar/eliminar bases u organismos.</span>
      </div>
    );
  }
  if (!canEdit) {
    return (
      <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "8px 14px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "0.72rem", flexShrink: 0 }}>
        <Lock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span><strong>Modo Solo Lectura:</strong> Tu usuario no posee permisos para modificar los registros.</span>
      </div>
    );
  }
  return null;
};
