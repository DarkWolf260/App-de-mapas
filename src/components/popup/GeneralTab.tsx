import React from "react";
import { Save, Lock } from "lucide-react";
import type { DrawnFeature } from "../../types";
import { inputStyle, labelStyle, saveBtnStyle } from "./popupStyles";

interface GeneralTabProps {
  activeFeat: DrawnFeature;
  localTitle: string;
  localDescription: string;
  localColor: string;
  generalSaveSuccess: boolean;
  onRename: (title: string) => void;
  onDescription: (desc: string) => void;
  onColor: (color: string) => void;
  onSave: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  activeFeat,
  localTitle,
  localDescription,
  localColor,
  generalSaveSuccess,
  onRename,
  onDescription,
  onColor,
  onSave,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "12px", height: "100%" }}>
    {/* 1. AVISO DE UBICACIÓN BLOQUEADA EN LA PARTE SUPERIOR */}
    {activeFeat.locked && (
      <div
        style={{
          fontSize: "0.68rem",
          color: "var(--color-high)",
          background: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "6px",
          padding: "6px 10px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Lock size={14} style={{ flexShrink: 0 }} />
        <span>Ubicación bloqueada. Para mover este punto en el mapa, deshaz el candado en el encabezado.</span>
      </div>
    )}

    {/* Fila Horizontal: Nombre + Color */}
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "10px", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Nombre del elemento</label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => onRename(e.target.value)}
          style={{ ...inputStyle, fontSize: "0.78rem", padding: "6px 8px" }}
          placeholder="Ej. Punto de Control A"
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>Color Distintivo</label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-subtle)", height: "34px" }}>
          <input
            type="color"
            value={localColor}
            onChange={(e) => onColor(e.target.value)}
            style={{ width: "24px", height: "24px", border: "none", background: "transparent", cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono, monospace)", color: localColor, fontWeight: 700 }}>{localColor}</span>
        </div>
      </div>
    </div>

    {/* 2. DESCRIPCIÓN Y NOTAS CON MÁS ESPACIO */}
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <label style={labelStyle}>Descripción o notas del elemento</label>
      <textarea
        value={localDescription}
        onChange={(e) => onDescription(e.target.value)}
        style={{
          ...inputStyle,
          resize: "vertical",
          minHeight: "140px",
          height: "160px",
          fontSize: "0.75rem",
          lineHeight: 1.4,
          padding: "8px 10px",
        }}
        placeholder="Detalles sobre el punto, sector u observaciones..."
      />
    </div>

    {/* 3. BOTÓN DE GUARDAR EN LA PARTE INFERIOR DEL SIDEBAR */}
    <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
      <button type="button" onClick={onSave} style={{ ...saveBtnStyle(generalSaveSuccess), width: "100%", padding: "10px", fontSize: "0.78rem", fontWeight: 700 }}>
        <Save size={14} /> {generalSaveSuccess ? "¡Guardado con éxito!" : "Guardar Cambios"}
      </button>
    </div>
  </div>
);
