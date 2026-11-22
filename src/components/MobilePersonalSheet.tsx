import React, { useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { getDayStats, getTotalPersonnel, getNormalizedGroupList, mergeLogs } from "../utils/logUtils";
import { Users, Tag, MapPin } from "lucide-react";
import { DepartmentTabs } from "./DepartmentTabs";

interface MobilePersonalSheetProps {
  drawnFeatures: DrawnFeature[];
  selectedDate: string;
  activeDepartment?: DepartmentView;
  onDepartmentChange?: (dept: DepartmentView) => void;
  onSelectFeature?: (feat: DrawnFeature) => void;
}

export const MobilePersonalSheet: React.FC<MobilePersonalSheetProps> = ({
  drawnFeatures,
  selectedDate,
  activeDepartment = "mixto",
  onDepartmentChange,
  onSelectFeature,
}) => {
  const dayStats = useMemo(
    () => getDayStats(drawnFeatures, selectedDate, activeDepartment),
    [drawnFeatures, selectedDate, activeDepartment]
  );

  const activePoints = useMemo(() => {
    return drawnFeatures
      .map((f) => {
        const logs =
          f.dailyLogs?.filter(
            (l) =>
              l.date === selectedDate &&
              (activeDepartment === "mixto" || !activeDepartment || (l.department || "pc") === activeDepartment)
          ) || [];
        const log = mergeLogs(logs);
        if (!log) return null;
        const totalOff = getTotalPersonnel(log);
        const groups = getNormalizedGroupList(log);
        if (totalOff === 0 && groups.length === 0) return null;
        return {
          id: f.id,
          title: f.title,
          color: f.color || "#991b1b",
          feat: f,
          totalOff,
          totalGroups: groups.length,
          activeGroups: groups.filter((g) => !g.hasArrived).length,
        };
      })
      .filter(Boolean) as Array<{
      id: number | string;
      title: string;
      color: string;
      feat: DrawnFeature;
      totalOff: number;
      totalGroups: number;
      activeGroups: number;
    }>;
  }, [drawnFeatures, selectedDate, activeDepartment]);

  const totalOff = activePoints.reduce((acc, p) => acc + p.totalOff, 0);
  const totalGroups = activePoints.reduce((acc, p) => acc + p.totalGroups, 0);
  const totalActiveGroups = activePoints.reduce((acc, p) => acc + p.activeGroups, 0);

  const hasMetrics =
    dayStats.totalRescued > 0 ||
    dayStats.totalRecovered > 0 ||
    dayStats.totalPets > 0 ||
    dayStats.totalPrehospitalCare > 0 ||
    dayStats.totalTransfers > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-sans)", color: "#f8fafc" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
        <span style={{ fontSize: "0.84rem", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={15} style={{ color: "#fdba74" }} />
          Personal Desplegado
        </span>
        <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {selectedDate}
        </span>
      </div>

      {onDepartmentChange && (
        <DepartmentTabs activeDepartment={activeDepartment} onDepartmentChange={onDepartmentChange} />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "rgba(255, 255, 255, 0.03)",
          borderRadius: "10px",
          padding: "10px 8px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Funcionarios
          </span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>{totalOff}</div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Grupos
          </span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#f8fafc" }}>{totalGroups}</div>
        </div>
        <div style={{ width: "1px", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ textAlign: "center" }}>
          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#fdba74", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            En Sitio
          </span>
          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#fdba74" }}>{totalActiveGroups}</div>
        </div>
      </div>

      {hasMetrics && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            flexWrap: "wrap",
            padding: "7px 10px",
            background: "rgba(255, 255, 255, 0.025)",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {dayStats.totalRescued > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#38bdf8" }}>{dayStats.totalRescued} Resc.</span>}
          {dayStats.totalRecovered > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ef4444" }}>{dayStats.totalRecovered} Recup.</span>}
          {dayStats.totalPets > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e" }}>{dayStats.totalPets} Masc.</span>}
          {dayStats.totalPrehospitalCare > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#fb923c" }}>{dayStats.totalPrehospitalCare} Atenc.</span>}
          {dayStats.totalTransfers > 0 && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#cbd5e1" }}>{dayStats.totalTransfers} Trasl.</span>}
        </div>
      )}

      {activePoints.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ fontSize: "0.64rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "5px" }}>
            <MapPin size={11} /> Sitios activos ({activePoints.length})
          </div>
          {activePoints.map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => onSelectFeature?.(pt.feat)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                padding: "10px 12px",
                background: "rgba(255, 255, 255, 0.025)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.74rem",
                color: "#f8fafc",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    background: pt.color,
                    border: "1.5px solid rgba(255, 255, 255, 0.75)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pt.title}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                <span style={{ color: "#e2e8f0", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Users size={11} style={{ color: "#94a3b8" }} /> {pt.totalOff}
                </span>
                <span style={{ color: "#94a3b8", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                  <Tag size={10} /> {pt.totalGroups}
                </span>
                {pt.activeGroups > 0 && (
                  <span style={{ color: "#fdba74", fontWeight: 800 }}>● {pt.activeGroups}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "24px 12px",
            color: "#64748b",
            fontSize: "0.76rem",
            fontStyle: "italic",
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px dashed rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
          }}
        >
          Sin personal desplegado en esta fecha
        </div>
      )}
    </div>
  );
};
