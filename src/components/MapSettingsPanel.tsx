import React, { useEffect } from "react";
import { Settings, X } from "lucide-react";
import type { LayerVisibility } from "../types";

interface MapSettingsPanelProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (layerName: keyof LayerVisibility) => void;
  expanded: boolean;
  onToggle: () => void;
  canEditMap?: boolean;
}

const TOGGLES: Array<{ key: keyof LayerVisibility; label: string }> = [
  { key: "sketch", label: "Herramientas de Dibujo" },
  { key: "polygonLabels", label: "Nombres de Polígonos" },
  { key: "pointLabels", label: "Nombres de Sitios de Trabajo" },
  { key: "basemapLabels", label: "Etiquetas de Calles y Mapa Base" },
  { key: "hideNestedAreas", label: "Ocultar Áreas Anidadas" },
];

export const MapSettingsPanel: React.FC<MapSettingsPanelProps> = ({
  layerVisibility,
  onToggleLayer,
  expanded,
  onToggle,
  canEditMap = false,
}) => {
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onToggle();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, onToggle]);

  const visibleToggles = TOGGLES.filter((t) => t.key !== "sketch" || canEditMap);
  if (!expanded) {
    return (
      <button
        type="button"
        className="hud-icon-square-btn"
        onClick={onToggle}
        aria-label="Abrir opciones y capas del mapa"
        aria-expanded={false}
        title="Opciones y Capas del Mapa"
      >
        <Settings size={18} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      role="region"
      aria-label="Opciones del mapa"
      style={{
        width: "270px",
        background: "rgba(10, 15, 28, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: "12px",
        padding: "10px 12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "6px",
          marginBottom: "8px",
        }}
      >
        <span
          style={{
            fontSize: "0.74rem",
            fontWeight: 800,
            color: "#fdba74",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Settings size={13} aria-hidden="true" /> Opciones del Mapa
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Cerrar opciones del mapa"
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
          title="Ocultar opciones"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {visibleToggles.map(({ key, label }) => (
          <div key={key} className="toggle-item">
            <span className="toggle-label" style={{ fontSize: "0.68rem" }}>
              {label}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!layerVisibility[key]}
                onChange={() => onToggleLayer(key)}
              />
              <span className="slider" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};
