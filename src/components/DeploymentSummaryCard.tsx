import React, { useState, useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { getTotalPersonnel } from "../utils/logUtils";
import { Minimize2, Maximize2, LayoutDashboard, Users, MapPin, Tag } from "lucide-react";

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

interface TeamEntry {
  id: string;
  groupName: string;
  pointTitle: string;
  pointId: number;
  color: string;
  officersCount: string;
  hasArrived: boolean;
  isActive: boolean;
}

type ViewMode = "sitios" | "equipos";

function computeActivePoints(drawnFeatures: DrawnFeature[], targetDate: string, activeDepartment?: DepartmentView): ActivePoint[] {
  return drawnFeatures
    .filter((f) => f.type === "point")
    .map((f) => {
      const logs = f.dailyLogs?.filter((l) =>
        l.date === targetDate && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
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

function computeTeams(drawnFeatures: DrawnFeature[], targetDate: string, activeDepartment?: DepartmentView): TeamEntry[] {
  const teams: TeamEntry[] = [];
  drawnFeatures
    .filter((f) => f.type === "point")
    .forEach((f) => {
      const logs = f.dailyLogs?.filter((l) =>
        l.date === targetDate && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      if (!log) return;
      const color = f.color || "#22c55e";
      if (log.groupName?.trim()) {
        const arrived = !!log.hasArrivedG1 || (!!log.arrivalTime && log.arrivalTime.trim() !== "");
        const off = parseInt(log.officersCount || "0", 10);
        teams.push({
          id: `${f.id}-g1`,
          groupName: log.groupName.trim(),
          pointTitle: f.title,
          pointId: f.id,
          color,
          officersCount: log.officersCount || "0",
          hasArrived: arrived,
          isActive: off > 0 && !arrived,
        });
      }
      if (log.groupName2?.trim()) {
        const arrived = !!log.hasArrivedG2 || (!!log.arrivalTime2 && log.arrivalTime2.trim() !== "");
        const off = parseInt(log.officersCount2 || "0", 10);
        teams.push({
          id: `${f.id}-g2`,
          groupName: log.groupName2.trim(),
          pointTitle: f.title,
          pointId: f.id,
          color,
          officersCount: log.officersCount2 || "0",
          hasArrived: arrived,
          isActive: off > 0 && !arrived,
        });
      }
    });
  return teams.sort((a, b) => a.groupName.localeCompare(b.groupName, "es"));
}

export const DeploymentSummaryCard: React.FC<DeploymentSummaryCardProps> = ({
  drawnFeatures,
  widgetCollapsed,
  onToggleCollapse,
  onZoomToFeature,
  selectedDate,
  activeDepartment,
}) => {
  const targetDateStr = selectedDate || new Date().toLocaleDateString("en-CA");
  const [viewMode, setViewMode] = useState<ViewMode>("sitios");
  const activePoints = useMemo(() => computeActivePoints(drawnFeatures, targetDateStr, activeDepartment), [drawnFeatures, targetDateStr, activeDepartment]);
  const teams = useMemo(() => computeTeams(drawnFeatures, targetDateStr, activeDepartment), [drawnFeatures, targetDateStr, activeDepartment]);
  const sortedPoints = useMemo(() => [...activePoints].sort((a, b) => a.title.localeCompare(b.title, "es")), [activePoints]);
  const totalOff = activePoints.reduce((acc, item) => acc + item.totalOff, 0);
  const totalGroups = activePoints.reduce((acc, item) => acc + item.groups, 0);
  const totalActiveGroups = activePoints.reduce((acc, item) => acc + item.activeGroups, 0);

  const statDivider = <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.1)" }} />;

  const renderStat = (label: string, value: number, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "7px", fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "1px" }}>{label}</span>
      <span style={{ fontSize: "16px", fontWeight: 800, color: "#f8fafc" }}>{value}</span>
    </div>
  );

  const hasData = viewMode === "sitios" ? activePoints.length > 0 : teams.length > 0;

  return (
    <div
      className="deployed-staff-widget"
      style={{
        position: "absolute",
        bottom: "52px",
        right: "16px",
        background: "rgba(10, 15, 28, 0.92)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        color: "#f8fafc",
        padding: "10px 12px",
        borderRadius: "12px",
        fontSize: "11px",
        fontFamily: "var(--font-sans)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100,
        width: "260px",
        maxHeight: "240px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {/* Header */}
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
        <span><LayoutDashboard size={12} style={{ verticalAlign: "middle", marginRight: "4px" }} />PERSONAL DESPLEGADO</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500 }}>{targetDateStr}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(!widgetCollapsed); }}
            style={{ background: "transparent", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: "6px", color: "var(--color-info)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(56, 189, 248, 0.1)"; e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.2)"; }}
            title={widgetCollapsed ? "Mostrar listado completo" : "Contraer listado (sólo mostrar totales)"}
          >
            {widgetCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      {!widgetCollapsed && (
        <div style={{ display: "flex", gap: "3px", padding: "1px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
          <button
            onClick={() => setViewMode("sitios")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
              padding: "3px 6px", borderRadius: "5px", border: "1px solid transparent",
              background: viewMode === "sitios" ? "rgba(56, 189, 248, 0.12)" : "transparent",
              borderColor: viewMode === "sitios" ? "rgba(56, 189, 248, 0.3)" : "transparent",
              color: viewMode === "sitios" ? "var(--color-info)" : "var(--text-muted)",
              fontSize: "8px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
              cursor: "pointer", transition: "all 0.15s ease", fontFamily: "var(--font-sans)",
            }}
          >
            <MapPin size={9} /> Sitios
          </button>
          <button
            onClick={() => setViewMode("equipos")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
              padding: "3px 6px", borderRadius: "5px", border: "1px solid transparent",
              background: viewMode === "equipos" ? "rgba(139, 92, 246, 0.12)" : "transparent",
              borderColor: viewMode === "equipos" ? "rgba(139, 92, 246, 0.3)" : "transparent",
              color: viewMode === "equipos" ? "rgba(139, 92, 246, 1)" : "var(--text-muted)",
              fontSize: "8px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
              cursor: "pointer", transition: "all 0.15s ease", fontFamily: "var(--font-sans)",
            }}
          >
            <Tag size={9} /> Equipos
          </button>
        </div>
      )}

      {/* Content */}
      {!hasData ? (
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
      ) : viewMode === "sitios" ? (
        /* Sitios view — sorted alphabetically */
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {sortedPoints.map((pt) => (
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
              <span style={{ flexShrink: 0, fontWeight: 700, color: "var(--color-green)", fontSize: "9px", display: "flex", alignItems: "center", gap: "3px" }}>
                <Users size={9} />{pt.totalOff} <Tag size={9} />{pt.groups}{pt.activeGroups > 0 && <span style={{ color: "#eab308", marginLeft: "2px" }}>●{pt.activeGroups}</span>}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, marginTop: "3px", paddingTop: "3px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "var(--color-green)" }}>
            <span>TOTALES:</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={9} />{totalOff} <Tag size={9} />{totalGroups}{totalActiveGroups > 0 && <span style={{ color: "#eab308" }}>●{totalActiveGroups}</span>}
            </span>
          </div>
        </div>
      ) : (
        /* Equipos view — sorted alphabetically by group name */
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {teams.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                const featObj = drawnFeatures.find((f) => f.id === t.pointId);
                if (featObj && onZoomToFeature) onZoomToFeature(featObj);
              }}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", padding: "3.5px 5px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${t.color}`, cursor: "pointer", transition: "background 0.2s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              title={`${t.groupName} — ${t.pointTitle}`}
            >
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>{t.groupName}</span>
                <span style={{ fontSize: "8px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.pointTitle}</span>
              </div>
              <span style={{ flexShrink: 0, fontWeight: 700, fontSize: "9px", display: "flex", alignItems: "center", gap: "3px", marginLeft: "4px" }}>
                {t.hasArrived ? (
                  <span style={{ color: "var(--text-muted)", fontSize: "8px" }}>Llego</span>
                ) : t.isActive ? (
                  <span style={{ color: "#eab308" }}>●<Users size={8} style={{ marginLeft: "1px" }} />{t.officersCount}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)", fontSize: "8px" }}>Despl.</span>
                )}
              </span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, marginTop: "3px", paddingTop: "3px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "var(--color-green)" }}>
            <span>TOTALES:</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={9} />{totalOff} <Tag size={9} />{totalGroups}{totalActiveGroups > 0 && <span style={{ color: "#eab308" }}>●{totalActiveGroups}</span>}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
