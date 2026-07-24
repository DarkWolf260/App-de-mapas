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
  { key: "basemapLabels", label: "Etiquetas de Calles y Mapa Base" },
  { key: "hideNestedAreas", label: "Ocultar Áreas Anidadas" },
  { key: "allowLabelOverlap", label: "Permitir Solapamiento de Etiquetas" },
];

export const MapSettingsPanel: React.FC<MapSettingsPanelProps> = ({
  layerVisibility,
  onToggleLayer,
  expanded,
  onToggle,
}) => (
  <div>
    <button
      onClick={onToggle}
      style={{
        background: "transparent",
        border: "none",
        color: "var(--color-info)",
        cursor: "pointer",
        fontSize: "0.72rem",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        textAlign: "left",
        outline: "none",
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Settings size={13} /> Opciones del Mapa
      </span>
      {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
    </button>

    {expanded && (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "6px" }}>
        {TOGGLES.map(({ key, label }) => (
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
    )}
  </div>
);
