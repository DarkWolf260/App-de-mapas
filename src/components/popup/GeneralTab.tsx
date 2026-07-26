import React from "react";
import { Save, Lock, Tag, AlertTriangle, FileText } from "lucide-react";
import type { DrawnFeature } from "../../types";
import { inputStyle, labelStyle, saveBtnStyle, sectionBox } from "./popupStyles";

interface GeneralTabProps {
  activeFeat: DrawnFeature;
  localTitle: string;
  localDescription: string;
  localColor: string;
  localIsCollapsed?: boolean;
  localCollapsedCount?: string;
  generalSaveSuccess: boolean;
  onRename: (title: string) => void;
  onDescription: (desc: string) => void;
  onColor: (color: string) => void;
  onIsCollapsedChange?: (val: boolean) => void;
  onCollapsedCountChange?: (val: string) => void;
  onSave: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  activeFeat,
  localTitle,
  localDescription,
  localColor,
  localIsCollapsed = false,
  localCollapsedCount = "1",
  generalSaveSuccess,
  onRename,
  onDescription,
  onColor,
  onIsCollapsedChange,
  onCollapsedCountChange,
  onSave,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%" }}>
    {/* Aviso de ubicación bloqueada */}
    {activeFeat.locked && (
      <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", color: "var(--color-high)" }}>
        <Lock size={14} style={{ flexShrink: 0 }} />
        <span>Ubicación bloqueada. Para mover este punto en el mapa, deshaz el candado en el encabezado.</span>
      </div>
    )}

    {/* Sección: Identificación */}
    <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
        <Tag size={10} /> Identificación
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "8px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={labelStyle}>Nombre del elemento</label>
          <input
            type="text"
            value={localTitle}
            onChange={(e) => onRename(e.target.value)}
            style={{ ...inputStyle, fontSize: "0.75rem", padding: "5px 8px" }}
            placeholder="Ej. Punto de Control A"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={labelStyle}>Color Distintivo</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-subtle)", height: "32px" }}>
            <input
              type="color"
              value={localColor}
              onChange={(e) => onColor(e.target.value)}
              style={{ width: "22px", height: "22px", border: "none", background: "transparent", cursor: "pointer" }}
            />
            <span style={{ fontSize: "0.7rem", fontFamily: "var(--font-mono, monospace)", color: localColor, fontWeight: 700 }}>{localColor}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Sección: Estado — Edificio Colapsado (solo puntos) */}
    {activeFeat.type === "point" && (
      <div style={{ ...sectionBox, background: localIsCollapsed ? "rgba(239, 68, 68, 0.06)" : "rgba(255, 255, 255, 0.02)", borderColor: localIsCollapsed ? "rgba(239, 68, 68, 0.25)" : "rgba(255,255,255,0.04)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: localIsCollapsed ? "#f87171" : "var(--color-high)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
          <AlertTriangle size={10} /> Estado
        </div>
        {localIsCollapsed ? (
          <div style={{ background: "rgba(239, 68, 68, 0.14)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f87171", fontSize: "0.72rem", fontWeight: 700 }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0 }}>
              <input
                type="checkbox"
                checked
                onChange={(e) => onIsCollapsedChange?.(e.target.checked)}
                style={{ width: "14px", height: "14px", accentColor: "#ef4444", cursor: "pointer" }}
              />
              <span>Estructura Colapsada</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ background: "#ef4444", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.62rem", fontWeight: 800 }}>
                Cant: {localCollapsedCount || "1"}
              </span>
              <input
                type="number"
                min={1}
                value={localCollapsedCount || "1"}
                onChange={(e) => onCollapsedCountChange?.(e.target.value)}
                style={{ width: "44px", padding: "2px 4px", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "5px", color: "#f87171", fontWeight: 800, fontSize: "0.72rem", textAlign: "center" }}
              />
            </div>
          </div>
        ) : (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", padding: "2px 0" }}>
            <input
              type="checkbox"
              checked={false}
              onChange={(e) => onIsCollapsedChange?.(e.target.checked)}
              style={{ width: "14px", height: "14px", accentColor: "#ef4444", cursor: "pointer" }}
            />
            <span>Edificio Colapsado</span>
          </label>
        )}
      </div>
    )}

    {/* Sección: Detalles */}
    <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)", flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
        <FileText size={10} /> Detalles
      </div>
      <textarea
        value={localDescription}
        onChange={(e) => onDescription(e.target.value)}
        style={{
          ...inputStyle,
          resize: "vertical",
          minHeight: "100px",
          height: "100%",
          fontSize: "0.72rem",
          lineHeight: 1.4,
          padding: "6px 8px",
          flex: 1,
        }}
        placeholder="Detalles sobre el punto, sector u observaciones..."
      />
    </div>

    {/* Botón Guardar */}
    <div style={{ marginTop: "auto" }}>
      <button type="button" onClick={onSave} style={{ ...saveBtnStyle(generalSaveSuccess), width: "100%", padding: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
        <Save size={13} /> {generalSaveSuccess ? "¡Guardado con éxito!" : "Guardar Cambios"}
      </button>
    </div>
  </div>
);
