import React from "react";
import { Settings, X } from "lucide-react";
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
}) => {
  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "rgba(10, 15, 29, 0.85)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          color: "var(--color-info)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          transition: "all 0.2s ease",
          padding: 0,
        }}
        title="Opciones del Mapa"
      >
        <Settings size={15} />
      </button>
    );
  }

  return (
    <div
      style={{
        width: "260px",
        background: "rgba(10, 15, 28, 0.94)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "12px",
        padding: "10px 12px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
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
            fontSize: "0.72rem",
            fontWeight: 800,
            color: "var(--color-info)",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Settings size={13} /> Opciones del Mapa
        </span>
        <button
          onClick={onToggle}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
          }}
          title="Ocultar opciones"
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
    </div>
  );
};
