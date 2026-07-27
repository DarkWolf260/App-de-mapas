import React, { useState, useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { getTotalPersonnel, getNormalizedGroupList, mergeLogs } from "../utils/logUtils";
import { LayoutDashboard, Users, MapPin, Tag, X, BarChart2, List } from "lucide-react";

interface DeploymentSummaryCardProps {
  drawnFeatures: DrawnFeature[];
  widgetCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onZoomToFeature?: (feat: DrawnFeature) => void;
  onOpenEditFeature?: (feat: DrawnFeature) => void;
  selectedDate?: string;
  activeDepartment?: DepartmentView;
  style?: React.CSSProperties;
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
    .map((f) => {
      const logs = f.dailyLogs?.filter((l) =>
        l.date === targetDate && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
      ) || [];
      const log = mergeLogs(logs);
      if (!log) return null;
      const totalOff = getTotalPersonnel(log);
      const groupList = getNormalizedGroupList(log);
      const groups = groupList.length;
      const activeGroups = groupList.filter((g) => !g.hasArrived).length;
      if (totalOff === 0 && groups === 0) return null;
      return { id: f.id, title: f.title, color: f.color || "#22c55e", totalOff, groups, activeGroups };
    })
    .filter(Boolean) as ActivePoint[];
}

function computeTeams(drawnFeatures: DrawnFeature[], targetDate: string, activeDepartment?: DepartmentView): TeamEntry[] {
  const teams: TeamEntry[] = [];
  drawnFeatures.forEach((f) => {
    const logs = f.dailyLogs?.filter((l) =>
      l.date === targetDate && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
    ) || [];
    const log = mergeLogs(logs);
    if (!log) return;
    const color = f.color || "#22c55e";
    const groupList = getNormalizedGroupList(log);
    groupList.forEach((g, idx) => {
      if (g.groupName?.trim()) {
        const arrived = !!g.hasArrived;
        const off = parseInt(g.officersCount || "0", 10);
        teams.push({
          id: `${f.id}-g${idx + 1}`,
          groupName: g.groupName.trim(),
          pointTitle: f.title,
          pointId: f.id,
          color,
          officersCount: g.officersCount || "0",
          hasArrived: arrived,
          isActive: off > 0 && !arrived,
        });
      }
    });
  });
  return teams.sort((a, b) => a.groupName.localeCompare(b.groupName, "es"));
}

export const DeploymentSummaryCard: React.FC<DeploymentSummaryCardProps> = ({
  drawnFeatures,
  widgetCollapsed,
  onToggleCollapse,
  onZoomToFeature,
  onOpenEditFeature,
  selectedDate,
  activeDepartment,
  style: customStyle,
}) => {
  const targetDateStr = selectedDate || new Date().toLocaleDateString("en-CA");
  const [viewMode, setViewMode] = useState<ViewMode>("sitios");
  const [isCompact, setIsCompact] = useState<boolean>(false);

  const activePoints = useMemo(() => computeActivePoints(drawnFeatures, targetDateStr, activeDepartment), [drawnFeatures, targetDateStr, activeDepartment]);
  const teams = useMemo(() => computeTeams(drawnFeatures, targetDateStr, activeDepartment), [drawnFeatures, targetDateStr, activeDepartment]);
  const sortedPoints = useMemo(() => [...activePoints].sort((a, b) => a.title.localeCompare(b.title, "es")), [activePoints]);
  const totalOff = activePoints.reduce((acc, item) => acc + item.totalOff, 0);
  const totalGroups = activePoints.reduce((acc, item) => acc + item.groups, 0);
  const totalActiveGroups = activePoints.reduce((acc, item) => acc + item.activeGroups, 0);

  const statDivider = <div style={{ width: "1px", height: "28px", background: "rgba(255,255,255,0.1)" }} />;

  const renderStat = (label: string, value: number, color: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "7px", fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1px" }}>{label}</span>
      <span style={{ fontSize: "16px", fontWeight: 800, color: "#f8fafc" }}>{value}</span>
    </div>
  );

  const hasData = viewMode === "sitios" ? activePoints.length > 0 : teams.length > 0;

  // Modo 1: Icono Discreto (completamente minimizado)
  if (widgetCollapsed) {
    return (
      <button
        onClick={() => onToggleCollapse(false)}
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
          ...customStyle,
        }}
        title={`Personal Desplegado: ${totalOff} funcionarios (${targetDateStr})`}
      >
        <Users size={16} />
      </button>
    );
  }

  return (
    <div
      className="deployed-staff-widget"
      style={{
        background: "rgba(10, 15, 28, 0.94)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        color: "#f8fafc",
        padding: "10px 12px",
        borderRadius: "12px",
        fontSize: "11px",
        fontFamily: "var(--font-sans)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100,
        width: "330px",
        maxHeight: "260px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        ...customStyle,
      }}
    >
      {/* Header en una sola línea */}
      <div
        style={{
          fontWeight: 800,
          fontSize: "11px",
          color: "var(--color-info)",
          letterSpacing: "0.04em",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          paddingBottom: "6px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
          <LayoutDashboard size={12} style={{ flexShrink: 0 }} />
          PERSONAL DESPLEGADO
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
          <span style={{ fontSize: "9.5px", color: "var(--text-muted)", fontWeight: 600 }}>{targetDateStr}</span>
          
          {/* Botón para alternar entre vista de Totales (números) y Lista completa */}
          <button
            onClick={() => setIsCompact(!isCompact)}
            style={{
              background: "transparent",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "4px",
              color: "var(--color-info)",
              cursor: "pointer",
              padding: "2px 4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            title={isCompact ? "Ver lista completa" : "Ver solo números de totales"}
          >
            {isCompact ? <List size={12} /> : <BarChart2 size={12} />}
          </button>

          {/* Botón para ocultar a icono discreto */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCollapse(true); }}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "2px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            title="Ocultar a icono discreto"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Modo 2: Vista de Totales (sólo muestra los números) */}
      {isCompact ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "10px 0" }}>
          {renderStat("Funcionarios", totalOff, "rgba(56, 189, 248, 0.85)")}
          {statDivider}
          {renderStat("Grupos", totalGroups, "rgba(139, 92, 246, 0.85)")}
          {totalActiveGroups > 0 && (
            <>
              {statDivider}
              {renderStat("Activos", totalActiveGroups, "rgba(234, 179, 8, 0.95)")}
            </>
          )}
        </div>
      ) : (
        /* Modo 3: Vista Completa con pestañas e ítems */
        <>
          {/* View Mode Toggle */}
          <div style={{ display: "flex", gap: "3px", padding: "1px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
            <button
              onClick={() => setViewMode("sitios")}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
                padding: "3px 6px", borderRadius: "5px", border: "1px solid transparent",
                background: viewMode === "sitios" ? "rgba(56, 189, 248, 0.12)" : "transparent",
                borderColor: viewMode === "sitios" ? "rgba(56, 189, 248, 0.3)" : "transparent",
                color: viewMode === "sitios" ? "var(--color-info)" : "var(--text-muted)",
                fontSize: "8.5px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
                cursor: "pointer", transition: "all 0.15s ease", fontFamily: "var(--font-sans)",
              }}
            >
              <MapPin size={9} /> Sitios ({sortedPoints.length})
            </button>
            <button
              onClick={() => setViewMode("equipos")}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px",
                padding: "3px 6px", borderRadius: "5px", border: "1px solid transparent",
                background: viewMode === "equipos" ? "rgba(139, 92, 246, 0.12)" : "transparent",
                borderColor: viewMode === "equipos" ? "rgba(139, 92, 246, 0.3)" : "transparent",
                color: viewMode === "equipos" ? "rgba(139, 92, 246, 1)" : "var(--text-muted)",
                fontSize: "8.5px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em",
                cursor: "pointer", transition: "all 0.15s ease", fontFamily: "var(--font-sans)",
              }}
            >
              <Tag size={9} /> Equipos ({teams.length})
            </button>
          </div>

          {/* Content */}
          {!hasData ? (
            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
              Sin personal desplegado hoy
            </div>
          ) : viewMode === "sitios" ? (
            /* Sitios view */
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {sortedPoints.map((pt) => (
                <div
                  key={pt.id}
                  onClick={() => {
                    const featObj = drawnFeatures.find((f) => f.id === pt.id);
                    if (featObj && onZoomToFeature) onZoomToFeature(featObj);
                  }}
                  onDoubleClick={() => {
                    const featObj = drawnFeatures.find((f) => f.id === pt.id);
                    if (featObj && onOpenEditFeature) onOpenEditFeature(featObj);
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", padding: "4px 6px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${pt.color}`, cursor: "pointer", transition: "background 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  title={`Clic para enfocar en mapa, Doble clic para ver/editar ${pt.title}`}
                >
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "170px" }}>{pt.title}</span>
                  <span style={{ flexShrink: 0, fontWeight: 700, color: "var(--color-green)", fontSize: "9.5px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={9} />{pt.totalOff} <Tag size={9} />{pt.groups}{pt.activeGroups > 0 && <span style={{ color: "#eab308", marginLeft: "2px" }}>●{pt.activeGroups}</span>}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, marginTop: "3px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "var(--color-green)" }}>
                <span>TOTALES:</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Users size={10} />{totalOff} Func. <Tag size={10} />{totalGroups} Grupos {totalActiveGroups > 0 && <span style={{ color: "#eab308" }}>●{totalActiveGroups}</span>}
                </span>
              </div>
            </div>
          ) : (
            /* Equipos view */
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {teams.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    const featObj = drawnFeatures.find((f) => f.id === t.pointId);
                    if (featObj && onZoomToFeature) onZoomToFeature(featObj);
                  }}
                  onDoubleClick={() => {
                    const featObj = drawnFeatures.find((f) => f.id === t.pointId);
                    if (featObj && onOpenEditFeature) onOpenEditFeature(featObj);
                  }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", padding: "4px 6px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${t.color}`, cursor: "pointer", transition: "background 0.2s ease" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  title={`Clic para enfocar en mapa, Doble clic para ver/editar ${t.groupName}`}
                >
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "10px" }}>{t.groupName}</span>
                    <span style={{ fontSize: "8.5px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.pointTitle}</span>
                  </div>
                  <span style={{ flexShrink: 0, fontWeight: 700, fontSize: "9.5px", display: "flex", alignItems: "center", gap: "3px", marginLeft: "6px" }}>
                    {t.hasArrived ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "8.5px" }}>Llego</span>
                    ) : t.isActive ? (
                      <span style={{ color: "#eab308" }}>●<Users size={9} style={{ marginLeft: "1px" }} />{t.officersCount}</span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "8.5px" }}>Despl.</span>
                    )}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontWeight: 800, marginTop: "3px", paddingTop: "4px", borderTop: "1px solid rgba(255,255,255,0.1)", color: "var(--color-green)" }}>
                <span>TOTALES:</span>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Users size={10} />{totalOff} Func. <Tag size={10} />{totalGroups} Grupos {totalActiveGroups > 0 && <span style={{ color: "#eab308" }}>●{totalActiveGroups}</span>}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
