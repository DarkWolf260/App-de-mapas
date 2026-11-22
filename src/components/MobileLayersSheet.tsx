import React, { useState, useEffect } from "react";
import type { LayerVisibility } from "../types";
import { Layers, MapPin, Building2, Eye, EyeOff, ArrowRightLeft, GraduationCap, Hammer } from "lucide-react";

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
    const handleState = (e: Event) => {
      setSwipeActive(Boolean((e as CustomEvent).detail));
    };
    window.addEventListener("swipe-state-changed", handleState);
    return () => window.removeEventListener("swipe-state-changed", handleState);
  }, []);

  const handleToggleSwipe = () => {
    window.dispatchEvent(new CustomEvent("toggle-swipe"));
  };

  const isOperativoDefault =
    !layerVisibility.formacion && !layerVisibility.demolidos && !layerVisibility.inspecciones;

  const handleActivateOperativo = () => {
    if (layerVisibility.formacion) onToggleLayer("formacion");
    if (layerVisibility.demolidos) onToggleLayer("demolidos");
    if (layerVisibility.inspecciones) onToggleLayer("inspecciones");
  };

  const cardStyle = (active: boolean, borderColor = "rgba(249, 115, 22, 0.45)", bgColor = "rgba(249, 115, 22, 0.1)"): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "11px 12px",
    background: active ? bgColor : "rgba(255, 255, 255, 0.025)",
    borderRadius: "10px",
    border: `1px solid ${active ? borderColor : "rgba(255, 255, 255, 0.08)"}`,
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  const badgeStyle = (active: boolean, color = "#fdba74", bg = "rgba(249, 115, 22, 0.18)", border = "rgba(249, 115, 22, 0.4)"): React.CSSProperties => ({
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "0.62rem",
    fontWeight: 800,
    background: active ? bg : "rgba(255, 255, 255, 0.04)",
    color: active ? color : "#64748b",
    border: `1px solid ${active ? border : "rgba(255, 255, 255, 0.09)"}`,
    flexShrink: 0,
    letterSpacing: "0.03em",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--font-sans)", color: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
        <Layers size={16} style={{ color: "#fdba74" }} />
        <div>
          <div style={{ fontSize: "0.84rem", fontWeight: 800, color: "#f8fafc" }}>
            Capas del Mapa
          </div>
          <div style={{ fontSize: "0.66rem", color: "#94a3b8" }}>
            Selecciona la capa temática que deseas visualizar
          </div>
        </div>
      </div>

      {/* 1. Vista Operativa Completa */}
      <div style={cardStyle(isOperativoDefault)} onClick={handleActivateOperativo}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{ background: "rgba(249, 115, 22, 0.14)", padding: "8px", borderRadius: "8px", color: "#fdba74", display: "flex", flexShrink: 0 }}>
            <MapPin size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
              Áreas de Trabajo (Vista General)
            </div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
              Sectores, frentes operativos, equipos e indicadores
            </div>
          </div>
        </div>
        <span style={badgeStyle(isOperativoDefault)}>
          {isOperativoDefault ? "ACTIVA" : "VER"}
        </span>
      </div>

      {/* 2. Capa Formación y Prevención Comunitaria */}
      <div
        style={cardStyle(!!layerVisibility.formacion, "rgba(139, 92, 246, 0.5)", "rgba(139, 92, 246, 0.12)")}
        onClick={() => onToggleLayer("formacion")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(139, 92, 246, 0.4)", padding: "8px", borderRadius: "8px", color: "#c4b5fd", display: "flex", flexShrink: 0 }}>
            <GraduationCap size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
              Formación y Prevención
            </div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
              Charlas educativas, capacitaciones, simulacros y QR
            </div>
          </div>
        </div>
        <span style={badgeStyle(!!layerVisibility.formacion, "#c4b5fd", "rgba(139, 92, 246, 0.2)", "rgba(139, 92, 246, 0.5)")}>
          {layerVisibility.formacion ? "ACTIVA" : "OCULTA"}
        </span>
      </div>

      {/* 3. Capa Edificios Demolidos */}
      <div
        style={cardStyle(!!layerVisibility.demolidos, "rgba(248, 250, 252, 0.45)", "rgba(255, 255, 255, 0.08)")}
        onClick={() => onToggleLayer("demolidos")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{ background: "#111827", border: "1px solid rgba(248, 250, 252, 0.35)", padding: "8px", borderRadius: "8px", color: "#f8fafc", display: "flex", flexShrink: 0 }}>
            <Hammer size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
              Edificios Demolidos
            </div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
              Edificaciones demolidas y Urbanismo Hugo Chávez
            </div>
          </div>
        </div>
        <span style={badgeStyle(!!layerVisibility.demolidos, "#ffffff", "rgba(248, 250, 252, 0.14)", "rgba(248, 250, 252, 0.4)")}>
          {layerVisibility.demolidos ? "ACTIVA" : "OCULTA"}
        </span>
      </div>

      {/* 4. Capa Inspecciones de Infraestructura */}
      <div style={cardStyle(!!layerVisibility.inspecciones)} onClick={() => onToggleLayer("inspecciones")}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{ background: "rgba(249, 115, 22, 0.14)", padding: "8px", borderRadius: "8px", color: "#fb923c", display: "flex", flexShrink: 0 }}>
            <Building2 size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
              Inspecciones de Infraestructura
            </div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
              Evaluaciones de edificaciones en La Guaira
            </div>
          </div>
        </div>
        <span style={badgeStyle(!!layerVisibility.inspecciones)}>
          {layerVisibility.inspecciones ? "ACTIVA" : "OCULTA"}
        </span>
      </div>

      {/* 5. Antes / Después */}
      <div style={cardStyle(swipeActive)} onClick={handleToggleSwipe}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "8px", borderRadius: "8px", color: swipeActive ? "#fdba74" : "#cbd5e1", display: "flex", flexShrink: 0 }}>
            <ArrowRightLeft size={17} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
              Antes / Después (Satélite)
            </div>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8" }}>
              Cortina deslizable para comparar imágenes pre y post sismo
            </div>
          </div>
        </div>
        <span style={badgeStyle(swipeActive)}>
          {swipeActive ? "ACTIVA" : "OFF"}
        </span>
      </div>

      {/* Etiquetas rápidas */}
      <div style={{ marginTop: "2px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => onToggleLayer("pointLabels")}
          style={{
            flex: 1,
            padding: "9px 10px",
            borderRadius: "8px",
            background: layerVisibility.pointLabels ? "rgba(249, 115, 22, 0.14)" : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${layerVisibility.pointLabels ? "rgba(249, 115, 22, 0.4)" : "rgba(255, 255, 255, 0.09)"}`,
            color: layerVisibility.pointLabels ? "#fdba74" : "#94a3b8",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            fontFamily: "inherit",
          }}
        >
          {layerVisibility.pointLabels ? <Eye size={13} /> : <EyeOff size={13} />}
          Etiq. Puntos
        </button>

        <button
          type="button"
          onClick={() => onToggleLayer("polygonLabels")}
          style={{
            flex: 1,
            padding: "9px 10px",
            borderRadius: "8px",
            background: layerVisibility.polygonLabels ? "rgba(249, 115, 22, 0.14)" : "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${layerVisibility.polygonLabels ? "rgba(249, 115, 22, 0.4)" : "rgba(255, 255, 255, 0.09)"}`,
            color: layerVisibility.polygonLabels ? "#fdba74" : "#94a3b8",
            fontSize: "0.7rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            fontFamily: "inherit",
          }}
        >
          {layerVisibility.polygonLabels ? <Eye size={13} /> : <EyeOff size={13} />}
          Etiq. Sectores
        </button>
      </div>
    </div>
  );
};
