import React from "react";
import { ChevronDown, ChevronRight, Settings } from "lucide-react";
import type { LayerVisibility } from "../types";

interface MapSettingsPanelProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (layerName: keyof LayerVisibility) => void;
  expanded: boolean;
  onToggle: () => void;
}

const TOGGLES: Array<{ key: keyof LayerVisibility; label: string }> = [
  { key: "sketch", label: "Herramientas de Dibujo" },
  { key: "polygonLabels", label: "Nombres de Polígonos" },
  { key: "pointLabels", label: "Nombres de Sitios de Trabajo" },
  { key: "hideNestedAreas", label: "Ocultar Áreas Anidadas" },
  { key: "allowLabelOverlap", label: "Permitir Solapamiento de Etiquetas" },
];

export const MapSettingsPanel: React.FC<MapSettingsPanelProps> = ({
  layerVisibility,
  onToggleLayer,
  expanded,
  onToggle,
}) => (
  <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
    <button
      onClick={onToggle}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--color-info)",
        cursor: "pointer",
        fontSize: "0.75rem",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "4px 0",
        width: "100%",
        textAlign: "left",
        outline: "none",
      }}
    >
      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      <Settings size={14} /> Ajustes del Mapa y Visibilidad
    </button>

    {expanded && (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", paddingLeft: "8px" }}>
        {TOGGLES.map(({ key, label }) => (
          <div key={key} className="toggle-item">
            <span className="toggle-label" style={{ fontSize: "0.72rem" }}>
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
    )}
  </div>
);
