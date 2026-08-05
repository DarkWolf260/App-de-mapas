import React, { useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { getDayStats, getTotalPersonnel, getNormalizedGroupList, mergeLogs } from "../utils/logUtils";
import { Users, Tag, MapPin } from "lucide-react";

interface MobilePersonalSheetProps {
  drawnFeatures: DrawnFeature[];
  selectedDate: string;
  activeDepartment?: DepartmentView;
  onSelectFeature?: (feat: DrawnFeature) => void;
}

export const MobilePersonalSheet: React.FC<MobilePersonalSheetProps> = ({
  drawnFeatures,
  selectedDate,
  activeDepartment = "mixto",
  onSelectFeature,
}) => {
  const dayStats = useMemo(() => getDayStats(drawnFeatures, selectedDate, activeDepartment), [drawnFeatures, selectedDate, activeDepartment]);

  const activePoints = useMemo(() => {
    return drawnFeatures
      .map((f) => {
        const logs = f.dailyLogs?.filter((l) =>
          l.date === selectedDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
        ) || [];
        const log = mergeLogs(logs);
        if (!log) return null;
        const totalOff = getTotalPersonnel(log);
        const groups = getNormalizedGroupList(log);
        if (totalOff === 0 && groups.length === 0) return null;
        return { id: f.id, title: f.title, color: f.color || "#22c55e", feat: f, totalOff, totalGroups: groups.length, activeGroups: groups.filter((g) => !g.hasArrived).length };
      })
      .filter(Boolean)
      .sort((a, b) => a!.title.localeCompare(b!.title, "es")) as NonNullable<typeof points[0]>[];
  }, [drawnFeatures, selectedDate, activeDepartment]);

  const totalOff = activePoints.reduce((acc, p) => acc + p.totalOff, 0);
  const totalGroups = activePoints.reduce((acc, p) => acc + p.totalGroups, 0);
  const totalActiveGroups = activePoints.reduce((acc, p) => acc + p.activeGroups, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-sans)", color: "#f8fafc" }}>
      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--color-info)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Personal Desplegado
      </div>

      <div style={{ display: "flex", justifyContent: "space-around", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 8px", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase" }}>Func.</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{totalOff}</div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#a855f7", textTransform: "uppercase" }}>Grupos</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>{totalGroups}</div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#eab308", textTransform: "uppercase" }}>Activos</span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#eab308" }}>{totalActiveGroups}</div>
        </div>
      </div>

      {(dayStats.totalRescued > 0 || dayStats.totalRecovered > 0 || dayStats.totalPets > 0 || dayStats.totalPrehospitalCare > 0 || dayStats.totalTransfers > 0) && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap", padding: "6px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
          {dayStats.totalRescued > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e" }}>{dayStats.totalRescued} Resc.</span>}
          {dayStats.totalRecovered > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ef4444" }}>{dayStats.totalRecovered} Recup.</span>}
          {dayStats.totalPets > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a855f7" }}>{dayStats.totalPets} Masc.</span>}
          {dayStats.totalPrehospitalCare > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#38bdf8" }}>{dayStats.totalPrehospitalCare} Atenc.</span>}
          {dayStats.totalTransfers > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#c084fc" }}>{dayStats.totalTransfers} Trasl.</span>}
        </div>
      )}

      {activePoints.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "4px" }}>
            <MapPin size={11} /> Sitios activos ({activePoints.length})
          </div>
          {activePoints.map((pt) => (
            <div
              key={pt.id}
              onClick={() => onSelectFeature?.(pt.feat)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 10px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                borderLeft: `3px solid ${pt.color}`,
                cursor: "pointer",
                fontSize: "0.72rem",
              }}
            >
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{pt.title}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", flexShrink: 0 }}>
                <span style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "2px" }}><Users size={10} />{pt.totalOff}</span>
                <span style={{ color: "#a855f7", display: "flex", alignItems: "center", gap: "2px" }}><Tag size={10} />{pt.totalGroups}</span>
                {pt.activeGroups > 0 && <span style={{ color: "#eab308" }}>●{pt.activeGroups}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {activePoints.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
          Sin personal desplegado hoy
        </div>
      )}
    </div>
  );
};
