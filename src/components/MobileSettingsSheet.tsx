import React from "react";
import type { LayerVisibility } from "../types";
import { Settings } from "lucide-react";

interface MobileSettingsSheetProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (name: keyof LayerVisibility) => void;
  canEditMap?: boolean;
}

const TOGGLES: Array<{ key: keyof LayerVisibility; label: string; description: string }> = [
  { key: "sketch", label: "Herramientas de Dibujo", description: "Mostrar barra para crear o editar puntos y áreas" },
  { key: "polygonLabels", label: "Nombres de Polígonos", description: "Mostrar nombres de sectores en el mapa" },
  { key: "pointLabels", label: "Nombres de Sitios de Trabajo", description: "Mostrar etiquetas y tarjetas de puntos" },
  { key: "basemapLabels", label: "Etiquetas de Calles y Mapa Base", description: "Mostrar vías y referencias del mapa satelital" },
  { key: "hideNestedAreas", label: "Ocultar Áreas Anidadas", description: "Evitar superposición de sub-sectores" },
];

export const MobileSettingsSheet: React.FC<MobileSettingsSheetProps> = ({
  layerVisibility,
  onToggleLayer,
  canEditMap = false,
}) => {
  const visibleToggles = TOGGLES.filter((t) => t.key !== "sketch" || canEditMap);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--font-sans)", color: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
        <Settings size={16} style={{ color: "#fdba74" }} />
        <div>
          <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#f8fafc" }}>
            Opciones del Mapa
          </div>
          <div style={{ fontSize: "0.66rem", color: "#94a3b8" }}>
            Visibilidad de etiquetas y controles cartográficos
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {visibleToggles.map(({ key, label, description }) => {
          const active = !!layerVisibility[key];
          return (
            <div
              key={key}
              onClick={() => onToggleLayer(key)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "11px 12px",
                background: active ? "rgba(249, 115, 22, 0.08)" : "rgba(255, 255, 255, 0.025)",
                borderRadius: "10px",
                border: `1px solid ${active ? "rgba(249, 115, 22, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
                  {label}
                </div>
                <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
                  {description}
                </div>
              </div>
              <label className="toggle-switch" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggleLayer(key)}
                />
                <span className="slider" />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
};
