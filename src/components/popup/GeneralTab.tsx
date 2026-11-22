import React, { useState, useEffect } from "react";
import { Save, Lock, Tag, AlertTriangle, FileText, Tent, Stethoscope, MapPin } from "lucide-react";
import type { DrawnFeature } from "../../types";
import { inputStyle, labelStyle, saveBtnStyle, sectionBox, sectionTitleStyle } from "./popupStyles";

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

const HEX_FULL_RE = /^#[0-9a-fA-F]{6}$/;
const HEX_SHORT_RE = /^#[0-9a-fA-F]{3}$/;

function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (HEX_FULL_RE.test(withHash)) return withHash.toLowerCase();
  if (HEX_SHORT_RE.test(withHash)) {
    const [, r, g, b] = withHash;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
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
}) => {
  const [hexInput, setHexInput] = useState(localColor);

  useEffect(() => {
    setHexInput(localColor);
  }, [localColor]);

  const handleHexChange = (val: string) => {
    const cleaned = val.replace(/[^#0-9a-fA-F]/g, "").slice(0, 7);
    setHexInput(cleaned);
    const parsed = normalizeHex(cleaned);
    if (parsed) {
      onColor(parsed);
    }
  };

  const handleHexBlur = () => {
    const parsed = normalizeHex(hexInput);
    if (parsed) {
      setHexInput(parsed);
      onColor(parsed);
    } else {
      setHexInput(localColor);
    }
  };

  const safePickerColor = normalizeHex(localColor) || "#991b1b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
      {/* Aviso de ubicación bloqueada */}
      {activeFeat.locked && (
        <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "7px 10px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", color: "#fca5a5" }}>
          <Lock size={14} style={{ flexShrink: 0 }} />
          <span>Ubicación bloqueada. Para mover este punto en el mapa, desbloquea el candado en el encabezado.</span>
        </div>
      )}

      {/* Sección: Identificación */}
      <div style={sectionBox}>
        <div style={sectionTitleStyle}>
          <Tag size={11} style={{ color: "#94a3b8" }} /> Identificación
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "8px", alignItems: "end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Nombre del elemento</label>
            <input
              type="text"
              value={localTitle}
              onChange={(e) => onRename(e.target.value)}
              style={{ ...inputStyle, fontSize: "0.75rem", padding: "6px 8px" }}
              placeholder="Ej. Punto de Control A"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={labelStyle}>Color (Hex)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(15, 23, 42, 0.85)", padding: "3px 7px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.14)", height: "32px", boxSizing: "border-box" }}>
              <input
                type="color"
                aria-label="Selector de color"
                value={safePickerColor}
                onChange={(e) => {
                  setHexInput(e.target.value);
                  onColor(e.target.value);
                }}
                style={{
                  width: "20px",
                  height: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.55)",
                  borderRadius: "4px",
                  background: "transparent",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                }}
              />
              <input
                type="text"
                aria-label="Código hexadecimal del color"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                onBlur={handleHexBlur}
                placeholder="#991b1b"
                maxLength={7}
                style={{
                  width: "100%",
                  minWidth: 0,
                  background: "transparent",
                  border: "none",
                  color: "#f8fafc",
                  fontSize: "0.74rem",
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 700,
                  textTransform: "lowercase",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Clasificación / Estado del Punto */}
      {activeFeat.type === "point" && (
        <div style={sectionBox}>
          <div style={sectionTitleStyle}>
            <AlertTriangle size={11} style={{ color: "#94a3b8" }} /> Clasificación / Estado del Punto
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* 1. Estructura Colapsada */}
            <div style={{ background: localIsCollapsed ? "rgba(239, 68, 68, 0.1)" : "rgba(0,0,0,0.22)", border: `1px solid ${localIsCollapsed ? "rgba(239, 68, 68, 0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: "6px", padding: "7px 9px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "0.72rem", fontWeight: 700, color: localIsCollapsed ? "#fca5a5" : "#e2e8f0" }}>
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
                    <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600 }}>Cant:</span>
                    <input
                      type="number"
                      min={1}
                      value={localCollapsedCount || "1"}
                      onChange={(e) => onCollapsedCountChange?.(e.target.value)}
                      style={{ width: "45px", padding: "2px 4px", background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(239, 68, 68, 0.4)", borderRadius: "4px", color: "#fca5a5", fontWeight: 800, fontSize: "0.7rem", textAlign: "center" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 2. Campamento / Refugio */}
            <div style={{ background: localIsCampement ? "rgba(245, 158, 11, 0.1)" : "rgba(0,0,0,0.22)", border: `1px solid ${localIsCampement ? "rgba(245, 158, 11, 0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: "6px", padding: "7px 9px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "0.72rem", fontWeight: 700, color: localIsCampement ? "#fcd34d" : "#e2e8f0" }}>
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
                    <span style={{ fontSize: "0.6rem", color: "#94a3b8", fontWeight: 600 }}>Personas:</span>
                    <input
                      type="text"
                      placeholder="Ej: 50"
                      value={localCampementCount || ""}
                      onChange={(e) => onCampementCountChange?.(e.target.value)}
                      style={{ width: "55px", padding: "2px 4px", background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(245, 158, 11, 0.4)", borderRadius: "4px", color: "#fcd34d", fontWeight: 800, fontSize: "0.7rem", textAlign: "center" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 3. Centro Asistencial / Salud */}
            <div style={{ background: localIsHealthCenter ? "rgba(56, 189, 248, 0.1)" : "rgba(0,0,0,0.22)", border: `1px solid ${localIsHealthCenter ? "rgba(56, 189, 248, 0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: "6px", padding: "7px 9px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0, fontSize: "0.72rem", fontWeight: 700, color: localIsHealthCenter ? "#7dd3fc" : "#e2e8f0" }}>
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
                    style={{ width: "105px", padding: "2px 6px", background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "4px", color: "#7dd3fc", fontWeight: 700, fontSize: "0.68rem" }}
                  />
                )}
              </div>
            </div>

            {/* 4. Otro / Categoría Personalizada */}
            <div style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", padding: "7px 9px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#cbd5e1", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={11} style={{ color: "#94a3b8" }} /> Otro:
                </span>
                <input
                  type="text"
                  placeholder="Especificar categoría (Ej: Punto de acopio)..."
                  value={localOtherCategoryName || ""}
                  onChange={(e) => onOtherCategoryNameChange?.(e.target.value)}
                  style={{ ...inputStyle, fontSize: "0.68rem", flex: 1, padding: "4px 7px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección: Detalles */}
      <div style={{ ...sectionBox, flex: 1 }}>
        <div style={sectionTitleStyle}>
          <FileText size={11} style={{ color: "#94a3b8" }} /> Detalles
        </div>
        <textarea
          value={localDescription}
          onChange={(e) => onDescription(e.target.value)}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: "80px",
            height: "100%",
            fontSize: "0.74rem",
            lineHeight: 1.4,
            padding: "7px 9px",
            flex: 1,
          }}
          placeholder="Detalles sobre el punto, sector u observaciones..."
        />
      </div>

      {/* Botón Guardar */}
      <div style={{ marginTop: "auto" }}>
        <button type="button" onClick={onSave} style={saveBtnStyle(generalSaveSuccess)}>
          <Save size={13} /> {generalSaveSuccess ? "¡Guardado con éxito!" : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
};
