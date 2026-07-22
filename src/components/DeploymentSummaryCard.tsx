import React from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { getTotalPersonnel } from "../utils/logUtils";
import { Minimize2, Maximize2, LayoutDashboard, Users } from "lucide-react";

interface DeploymentSummaryCardProps {
  drawnFeatures: DrawnFeature[];
  widgetCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onZoomToFeature?: (feat: DrawnFeature) => void;
  selectedDate?: string;
  activeDepartment?: DepartmentView;
}

interface ActivePoint {
  id: number;
  title: string;
  color: string;
  totalOff: number;
  groups: number;
  activeGroups: number;
}

function computeActivePoints(drawnFeatures: DrawnFeature[], activeDepartment?: DepartmentView): ActivePoint[] {
  const todayStr = new Date().toLocaleDateString("en-CA");
  return drawnFeatures
    .filter((f) => f.type === "point")
    .map((f) => {
      const logs = f.dailyLogs?.filter((l) =>
        l.date === todayStr && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      if (!log) return null;
      const totalOff = getTotalPersonnel(log);
      let groups = 0;
      let activeGroups = 0;
      if (log.groupName) {
        groups++;
        if (!log.hasArrivedG1 && !log.arrivalTime) activeGroups++;
      }
      if (log.groupName2) {
        groups++;
        if (!log.hasArrivedG2 && !log.arrivalTime2) activeGroups++;
      }
      if (totalOff === 0 && groups === 0) return null;
      return { id: f.id, title: f.title, color: f.color || "#22c55e", totalOff, groups, activeGroups };
    })
    .filter(Boolean) as ActivePoint[];
}

export const DeploymentSummaryCard: React.FC<DeploymentSummaryCardProps> = ({
  drawnFeatures,
  widgetCollapsed,
  onToggleCollapse,
  onZoomToFeature,
  selectedDate,
  activeDepartment,
}) => {
  const todayStr = selectedDate || new Date().toLocaleDateString("en-CA");
  const activePoints = computeActivePoints(drawnFeatures, activeDepartment);
  const totalOff = activePoints.reduce((acc, item) => acc + item.totalOff, 0);
  const totalGroups = activePoints.reduce((acc, item) => acc + item.groups, 0);
  const totalActiveGroups = activePoints.reduce((acc, item) => acc + item.activeGroups, 0);

  const statDivider = <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.1)" }} />;

  const renderStat = (label: string, value: number, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "7px", fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "1px" }}>{label}</span>
      <span style={{ fontSize: "18px", fontWeight: 800, color: "#fff", textShadow: `0 0 10px ${color.replace("0.7", "0.3")}` }}>{value}</span>
    </div>
  );

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
        <span><LayoutDashboard size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />DESPLIEGUE ACTIVO</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500 }}>{todayStr}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(!widgetCollapsed);
            }}
            style={{ background: "transparent", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "6px", color: "var(--color-info)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)"; e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)"; }}
            title={widgetCollapsed ? "Mostrar listado completo" : "Contraer listado (sólo mostrar totales)"}
          >
            {widgetCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>
      </div>

      {activePoints.length === 0 ? (
        <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
          Sin personal desplegado hoy
        </div>
      ) : widgetCollapsed ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "6px 0" }}>
          {renderStat("Funcionarios", totalOff, "rgba(56, 189, 248, 0.7)")}
          {statDivider}
          {renderStat("Grupos", totalGroups, "rgba(139, 92, 246, 0.7)")}
          {totalActiveGroups > 0 && (
            <>
              {statDivider}
              {renderStat("Activos", totalActiveGroups, "rgba(234, 179, 8, 0.9)")}
            </>
          )}
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
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100px" }}>{pt.title}</span>
              <span style={{ flexShrink: 0, fontWeight: 700, color: "var(--color-green)", fontSize: "9px", display: "flex", alignItems: "center", gap: "3px" }}>
                <Users size={9} />{pt.totalOff} <Users size={9} />{pt.groups}{pt.activeGroups > 0 && <span style={{ color: "#eab308", marginLeft: "4px" }}>●{pt.activeGroups}</span>}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, marginTop: "4px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "var(--color-green)" }}>
            <span>TOTALES:</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={9} />{totalOff} <Users size={9} />{totalGroups}{totalActiveGroups > 0 && <span style={{ color: "#eab308" }}>●{totalActiveGroups}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
