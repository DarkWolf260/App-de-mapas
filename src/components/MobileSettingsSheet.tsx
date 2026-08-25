import React from "react";
import type { LayerVisibility } from "../types";
import { Eye, EyeOff } from "lucide-react";

interface MobileSettingsSheetProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (name: keyof LayerVisibility) => void;
}

const toggleStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px",
  background: "rgba(255,255,255,0.03)",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.06)",
  cursor: "pointer",
  fontSize: "0.78rem",
  fontWeight: 600,
  transition: "background 0.15s",
};

export const MobileSettingsSheet: React.FC<MobileSettingsSheetProps> = ({
  layerVisibility,
  onToggleLayer,
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--font-sans)", color: "#f8fafc" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Ajustes de Mapa
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("sketch")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.sketch ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Capa de Dibujo
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.sketch ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.sketch ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.sketch ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.sketch ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("polygonLabels")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.polygonLabels ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Etiquetas de Polígonos
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.polygonLabels ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.polygonLabels ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.polygonLabels ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.polygonLabels ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("pointLabels")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.pointLabels ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Etiquetas de Puntos
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.pointLabels ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.pointLabels ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.pointLabels ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.pointLabels ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("inspecciones")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.inspecciones ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Inspecciones de Edificaciones (2,564 pts)
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.inspecciones ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.inspecciones ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.inspecciones ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.inspecciones ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("hideNestedAreas")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.hideNestedAreas ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Ocultar Áreas Anidadas
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.hideNestedAreas ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.hideNestedAreas ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.hideNestedAreas ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.hideNestedAreas ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("allowLabelOverlap")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.allowLabelOverlap ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Permitir Solapamiento Etiquetas
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.allowLabelOverlap ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.allowLabelOverlap ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.allowLabelOverlap ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.allowLabelOverlap ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>

      <div style={toggleStyle} onClick={() => onToggleLayer("svgOverlay")}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {layerVisibility.svgOverlay ? <Eye size={16} color="#22c55e" /> : <EyeOff size={16} color="var(--text-muted)" />}
          Dibujo SVG (modo compatible)
        </span>
        <span style={{
          width: "32px", height: "18px", borderRadius: "9px",
          background: layerVisibility.svgOverlay ? "rgba(34,197,94,0.3)" : "var(--bg-tertiary)",
          border: `1px solid ${layerVisibility.svgOverlay ? "rgba(34,197,94,0.5)" : "var(--border-color)"}`,
          position: "relative", transition: "all 0.2s",
        }}>
          <span style={{
            position: "absolute", top: "2px", left: layerVisibility.svgOverlay ? "16px" : "2px",
            width: "12px", height: "12px", borderRadius: "50%",
            background: layerVisibility.svgOverlay ? "#22c55e" : "var(--text-muted)",
            transition: "left 0.2s",
          }} />
        </span>
      </div>
    </div>
  );
};
