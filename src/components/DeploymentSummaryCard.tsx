import React from "react";
import type { DrawnFeature } from "../types";
import { getTotalPersonnel } from "../utils/logUtils";

interface DeploymentSummaryCardProps {
  drawnFeatures: DrawnFeature[];
  widgetCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onZoomToFeature?: (feat: DrawnFeature) => void;
}

interface ActivePoint {
  id: number;
  title: string;
  color: string;
  totalOff: number;
  groups: number;
}

function computeActivePoints(drawnFeatures: DrawnFeature[]): ActivePoint[] {
  const todayStr = new Date().toLocaleDateString("en-CA");
  return drawnFeatures
    .filter((f) => f.type === "point")
    .map((f) => {
      const log = f.dailyLogs?.find((l) => l.date === todayStr);
      if (!log) return null;
      const totalOff = getTotalPersonnel(log);
      let groups = 0;
      if (log.groupName || log.unitOut || log.managerName) groups++;
      if (log.groupName2 || log.unitOut2 || log.managerName2) groups++;
      if (totalOff === 0 && groups === 0) return null;
      return { id: f.id, title: f.title, color: f.color || "#22c55e", totalOff, groups };
    })
    .filter(Boolean) as ActivePoint[];
}

export const DeploymentSummaryCard: React.FC<DeploymentSummaryCardProps> = ({
  drawnFeatures,
  widgetCollapsed,
  onToggleCollapse,
  onZoomToFeature,
}) => {
  const todayStr = new Date().toLocaleDateString("en-CA");
  const activePoints = computeActivePoints(drawnFeatures);
  const totalOff = activePoints.reduce((acc, item) => acc + item.totalOff, 0);
  const totalGroups = activePoints.reduce((acc, item) => acc + item.groups, 0);

  return (
    <div
      className="deployed-staff-widget"
      style={{
        position: "absolute",
        bottom: "52px",
        right: "16px",
        background: "rgba(10, 15, 29, 0.92)",
        border: "1px solid rgba(56, 189, 248, 0.35)",
        color: "#f8fafc",
        padding: "10px 12px",
        borderRadius: "10px",
        fontSize: "11px",
        fontFamily: "var(--font-sans)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100,
        width: "240px",
        maxHeight: "220px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      <div
        style={{
          fontWeight: 800,
          fontSize: "11px",
          color: "var(--color-info)",
          letterSpacing: "0.05em",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "4px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>📊 DESPLIEGUE ACTIVO</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500 }}>{todayStr}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(!widgetCollapsed);
            }}
            style={{ background: "transparent", border: "none", color: "var(--color-info)", cursor: "pointer", fontSize: "10px", fontWeight: 800, padding: "0 2px", lineHeight: 1 }}
            title={widgetCollapsed ? "Mostrar listado completo" : "Contraer listado (sólo mostrar totales)"}
          >
            {widgetCollapsed ? "[ + ]" : "[ − ]"}
          </button>
        </div>
      </div>

      {activePoints.length === 0 ? (
        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
          Sin personal desplegado hoy
        </div>
      ) : widgetCollapsed ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, color: "var(--color-green)", padding: "4px 2px 2px 2px" }}>
          <span>TOTALES:</span>
          <span>👮 {totalOff} | 👥 {totalGroups}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {activePoints.map((pt) => (
            <div
              key={pt.id}
              onClick={() => {
                const featObj = drawnFeatures.find((f) => f.id === pt.id);
                if (featObj && onZoomToFeature) onZoomToFeature(featObj);
              }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", padding: "3.5px 5px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${pt.color}`, cursor: "pointer", transition: "background 0.2s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              title={`Haga clic para enfocar ${pt.title}`}
            >
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{pt.title}</span>
              <span style={{ flexShrink: 0, fontWeight: 700, color: "var(--color-green)" }}>👮 {pt.totalOff} | 👥 {pt.groups}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, marginTop: "4px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "var(--color-green)" }}>
            <span>TOTALES:</span>
            <span>👮 {totalOff} | 👥 {totalGroups}</span>
          </div>
        </div>
      )}
    </div>
  );
};
