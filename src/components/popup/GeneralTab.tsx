import React from "react";
import { Save, Lock, Tag, AlertTriangle, FileText, Tent, Stethoscope, MapPin } from "lucide-react";
import type { DrawnFeature } from "../../types";
import { inputStyle, labelStyle, saveBtnStyle, sectionBox } from "./popupStyles";

interface GeneralTabProps {
  activeFeat: DrawnFeature;
  localTitle: string;
  localDescription: string;
  localColor: string;
  localIsCollapsed?: boolean;
  localCollapsedCount?: string;
  localIsCampement?: boolean;
  localCampementCount?: string;
  localIsHealthCenter?: boolean;
  localHealthCenterType?: string;
  localOtherCategoryName?: string;
  generalSaveSuccess: boolean;
  onRename: (title: string) => void;
  onDescription: (desc: string) => void;
  onColor: (color: string) => void;
  onIsCollapsedChange?: (val: boolean) => void;
  onCollapsedCountChange?: (val: string) => void;
  onIsCampementChange?: (val: boolean) => void;
  onCampementCountChange?: (val: string) => void;
  onIsHealthCenterChange?: (val: boolean) => void;
  onHealthCenterTypeChange?: (val: string) => void;
  onOtherCategoryNameChange?: (val: string) => void;
  onSave: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  activeFeat,
  localTitle,
  localDescription,
  localColor,
  localIsCollapsed = false,
  localCollapsedCount = "1",
  localIsCampement = false,
  localCampementCount = "",
  localIsHealthCenter = false,
  localHealthCenterType = "",
  localOtherCategoryName = "",
  generalSaveSuccess,
  onRename,
  onDescription,
  onColor,
  onIsCollapsedChange,
  onCollapsedCountChange,
  onIsCampementChange,
  onCampementCountChange,
  onIsHealthCenterChange,
  onHealthCenterTypeChange,
  onOtherCategoryNameChange,
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

    {/* Sección: Clasificación / Estado del Punto */}
    {activeFeat.type === "point" && (
      <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.04)", borderColor: "rgba(168, 85, 247, 0.2)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#c084fc", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
          <AlertTriangle size={10} /> Clasificación / Tipo de Punto
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* 1. Estructura Colapsada */}
          <div style={{ background: localIsCollapsed ? "rgba(239, 68, 68, 0.12)" : "rgba(0,0,0,0.25)", border: `1px solid ${localIsCollapsed ? "rgba(239, 68, 68, 0.35)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", padding: "6px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "0.72rem", fontWeight: 700, color: localIsCollapsed ? "#f87171" : "var(--text-main)" }}>
                <input
                  type="checkbox"
                  checked={localIsCollapsed}
                  onChange={(e) => onIsCollapsedChange?.(e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "#ef4444", cursor: "pointer" }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertTriangle size={11} style={{ color: "#ef4444" }} /> Estructura Colapsada
                </span>
              </label>
              {localIsCollapsed && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>Cant:</span>
                  <input
                    type="number"
                    min={1}
                    value={localCollapsedCount || "1"}
                    onChange={(e) => onCollapsedCountChange?.(e.target.value)}
                    style={{ width: "45px", padding: "2px 4px", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "4px", color: "#f87171", fontWeight: 800, fontSize: "0.7rem", textAlign: "center" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Campamento / Refugio */}
          <div style={{ background: localIsCampement ? "rgba(245, 158, 11, 0.12)" : "rgba(0,0,0,0.25)", border: `1px solid ${localIsCampement ? "rgba(245, 158, 11, 0.35)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", padding: "6px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "0.72rem", fontWeight: 700, color: localIsCampement ? "#fbbf24" : "var(--text-main)" }}>
                <input
                  type="checkbox"
                  checked={localIsCampement}
                  onChange={(e) => onIsCampementChange?.(e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "#f59e0b", cursor: "pointer" }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Tent size={11} style={{ color: "#f59e0b" }} /> Campamento / Refugio
                </span>
              </label>
              {localIsCampement && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 600 }}>Personas:</span>
                  <input
                    type="text"
                    placeholder="Ej: 50"
                    value={localCampementCount || ""}
                    onChange={(e) => onCampementCountChange?.(e.target.value)}
                    style={{ width: "55px", padding: "2px 4px", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "4px", color: "#fbbf24", fontWeight: 800, fontSize: "0.7rem", textAlign: "center" }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. Centro Asistencial / Salud */}
          <div style={{ background: localIsHealthCenter ? "rgba(56, 189, 248, 0.12)" : "rgba(0,0,0,0.25)", border: `1px solid ${localIsHealthCenter ? "rgba(56, 189, 248, 0.35)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", padding: "6px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "0.72rem", fontWeight: 700, color: localIsHealthCenter ? "#38bdf8" : "var(--text-main)" }}>
                <input
                  type="checkbox"
                  checked={localIsHealthCenter}
                  onChange={(e) => onIsHealthCenterChange?.(e.target.checked)}
                  style={{ width: "14px", height: "14px", accentColor: "#38bdf8", cursor: "pointer" }}
                />
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Stethoscope size={11} style={{ color: "#38bdf8" }} /> Centro Asistencial
                </span>
              </label>
              {localIsHealthCenter && (
                <input
                  type="text"
                  placeholder="Ej: Hospital / CDI"
                  value={localHealthCenterType || ""}
                  onChange={(e) => onHealthCenterTypeChange?.(e.target.value)}
                  style={{ width: "100px", padding: "2px 6px", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "4px", color: "#38bdf8", fontWeight: 700, fontSize: "0.68rem" }}
                />
              )}
            </div>
          </div>

          {/* 4. Otro / Categoría Personalizada */}
          <div style={{ background: !!localOtherCategoryName ? "rgba(168, 85, 247, 0.12)" : "rgba(0,0,0,0.25)", border: `1px solid ${!!localOtherCategoryName ? "rgba(168, 85, 247, 0.35)" : "rgba(255,255,255,0.06)"}`, borderRadius: "6px", padding: "6px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={11} style={{ color: "#c084fc" }} /> Otro:
              </span>
              <input
                type="text"
                placeholder="Especificar categoría (Ej: Punto de acopio)..."
                value={localOtherCategoryName || ""}
                onChange={(e) => onOtherCategoryNameChange?.(e.target.value)}
                style={{ ...inputStyle, fontSize: "0.68rem", flex: 1, padding: "3px 6px" }}
              />
            </div>
          </div>
        </div>
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
          minHeight: "80px",
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
