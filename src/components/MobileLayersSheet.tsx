import React, { useState, useEffect } from "react";
import type { LayerVisibility } from "../types";
import { Layers, Pencil, Building2, Eye, EyeOff, ArrowRightLeft } from "lucide-react";

interface MobileLayersSheetProps {
  layerVisibility: LayerVisibility;
  onToggleLayer: (name: keyof LayerVisibility) => void;
}

export const MobileLayersSheet: React.FC<MobileLayersSheetProps> = ({
  layerVisibility,
  onToggleLayer,
}) => {
  const [swipeActive, setSwipeActive] = useState(false);

  useEffect(() => {
    const handleState = (e: any) => {
      setSwipeActive(!!e.detail);
    };
    window.addEventListener("swipe-state-changed", handleState);
    return () => window.removeEventListener("swipe-state-changed", handleState);
  }, []);

  const handleToggleSwipe = () => {
    window.dispatchEvent(new CustomEvent("toggle-swipe"));
  };

  const cardStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    background: active ? "rgba(56, 189, 248, 0.1)" : "rgba(255, 255, 255, 0.03)",
    borderRadius: "10px",
    border: `1px solid ${active ? "rgba(56, 189, 248, 0.35)" : "rgba(255, 255, 255, 0.06)"}`,
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-sans)", color: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
        <Layers size={18} style={{ color: "var(--color-info)" }} />
        <div>
          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ffffff" }}>
            Selección de Capas del Mapa
          </div>
          <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Activa o conmuta la capa deseada para el análisis del territorio
          </div>
        </div>
      </div>

      {/* 1. Capa Operativa (Sketch / Dibujo) */}
      <div style={cardStyle(!!layerVisibility.sketch)} onClick={() => onToggleLayer("sketch")}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(56, 189, 248, 0.15)", padding: "8px", borderRadius: "8px", color: "#38bdf8", display: "flex" }}>
            <Pencil size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffffff" }}>
              Capa Operativa (Dibujos y Puntos)
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              Puntos de control, polígonos, personal e indicadores
            </div>
          </div>
        </div>

        <span style={{
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "0.6rem",
          fontWeight: 800,
          background: layerVisibility.sketch ? "rgba(34, 197, 94, 0.2)" : "rgba(255,255,255,0.05)",
          color: layerVisibility.sketch ? "#4ade80" : "var(--text-muted)",
          border: `1px solid ${layerVisibility.sketch ? "rgba(34, 197, 94, 0.4)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {layerVisibility.sketch ? "ACTIVA" : "OCULTA"}
        </span>
      </div>

      {/* 2. Capa de Inspecciones (Kobo) */}
      <div style={cardStyle(!!layerVisibility.inspecciones)} onClick={() => onToggleLayer("inspecciones")}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "8px", borderRadius: "8px", color: "#818cf8", display: "flex" }}>
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffffff" }}>
              Capa de Inspecciones Kobo
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              2,564 evaluaciones de estructuras e infraestructuras
            </div>
          </div>
        </div>

        <span style={{
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "0.6rem",
          fontWeight: 800,
          background: layerVisibility.inspecciones ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.05)",
          color: layerVisibility.inspecciones ? "#818cf8" : "var(--text-muted)",
          border: `1px solid ${layerVisibility.inspecciones ? "rgba(99, 102, 241, 0.4)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {layerVisibility.inspecciones ? "ACTIVA" : "OCULTA"}
        </span>
      </div>

      {/* 3. Capa Antes y Después (Comparación Satelital) */}
      <div style={cardStyle(swipeActive)} onClick={handleToggleSwipe}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(249, 115, 22, 0.15)", padding: "8px", borderRadius: "8px", color: "#f97316", display: "flex" }}>
            <ArrowRightLeft size={18} />
          </div>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#ffffff" }}>
              Antes / Después (Comparación Satelital)
            </div>
            <div style={{ fontSize: "0.6rem", color: "var(--text-muted)" }}>
              Cortina deslizable para comparar imágenes pre/post sismo
            </div>
          </div>
        </div>

        <span style={{
          padding: "3px 8px",
          borderRadius: "12px",
          fontSize: "0.6rem",
          fontWeight: 800,
          background: swipeActive ? "rgba(249, 115, 22, 0.2)" : "rgba(255,255,255,0.05)",
          color: swipeActive ? "#fb923c" : "var(--text-muted)",
          border: `1px solid ${swipeActive ? "rgba(249, 115, 22, 0.4)" : "rgba(255,255,255,0.1)"}`,
        }}>
          {swipeActive ? "CORTINA ON" : "INACTIVA"}
        </span>
      </div>

      {/* Opciones adicionales de etiquetas */}
      <div style={{ marginTop: "4px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onToggleLayer("pointLabels")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            background: layerVisibility.pointLabels ? "rgba(56, 189, 248, 0.15)" : "rgba(0,0,0,0.3)",
            border: `1px solid ${layerVisibility.pointLabels ? "rgba(56, 189, 248, 0.3)" : "rgba(255,255,255,0.08)"}`,
            color: layerVisibility.pointLabels ? "#38bdf8" : "var(--text-muted)",
            fontSize: "0.68rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          {layerVisibility.pointLabels ? <Eye size={12} /> : <EyeOff size={12} />}
          Etiq. Puntos
        </button>

        <button
          type="button"
          onClick={() => onToggleLayer("polygonLabels")}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "6px",
            background: layerVisibility.polygonLabels ? "rgba(56, 189, 248, 0.15)" : "rgba(0,0,0,0.3)",
            border: `1px solid ${layerVisibility.polygonLabels ? "rgba(56, 189, 248, 0.3)" : "rgba(255,255,255,0.08)"}`,
            color: layerVisibility.polygonLabels ? "#38bdf8" : "var(--text-muted)",
            fontSize: "0.68rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
          }}
        >
          {layerVisibility.polygonLabels ? <Eye size={12} /> : <EyeOff size={12} />}
          Etiq. Áreas
        </button>
      </div>
    </div>
  );
};
