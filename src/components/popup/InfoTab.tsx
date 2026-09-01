import React, { useState, useMemo, useCallback } from "react";
import { Copy, Check, Activity, Save, FileText } from "lucide-react";
import type { DrawnFeature, DailyLog, DepartmentView, Department, NovedadEntry } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { getNormalizedGroupList, mergeLogs } from "../../utils/logUtils";
import { labelStyle, sectionBox, inputStyle } from "./popupStyles";
import { formatCoordinates, getCoordLabel, METRIC_FIELDS, getMetricValue } from "./metricFields";
import { MetricDisplayGrid } from "./MetricGrid";
import { useGrouping } from "./useGrouping";
import { aggregatePolygonLog } from "./aggregatePolygonLog";
import { WorkTeamsSection, buildDisplayItems } from "./WorkTeamsSection";

import { CustomActivitiesSection } from "./CustomActivitiesSection";

interface InfoTabProps {
  activeFeat: DrawnFeature;
  dailyLog: Partial<DailyLog> | undefined;
  localLog?: Partial<DailyLog>;
  onEdit: () => void;
  drawnFeatures: DrawnFeature[];
  popupEditDate: string;
  isAdmin?: boolean;
  canEdit?: boolean;
  canToggleArrival?: boolean;
  onToggleArrivalGroup?: (groupIndex: 1 | 2 | 3 | 4, hasArrived: boolean) => Promise<void>;
  onGroupFieldChange?: (groupIdx: number, field: string, value: string | boolean) => void;
  onGeneralFieldChange?: (field: string, value: any) => void;
  onSaveStats?: () => void;
  saveSuccess?: boolean;
  novedades?: NovedadEntry[];
  onAddNovedad?: (time: string, text: string) => Promise<void>;
  onDeleteNovedad?: (id: string) => Promise<void>;
  onUpdateNovedad?: (entryId: string, newText: string, newTime?: string) => Promise<void>;
  containedNovedades?: Array<{ origin: string; originFeatId?: number | string; novedades: NovedadEntry[] }>;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
  activeDepartment?: DepartmentView;
  selectedDept?: Department;
  onDepartmentSelect?: (dept: Department) => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  activeFeat, dailyLog, localLog, drawnFeatures, popupEditDate,
  isAdmin = false, canEdit = false, canToggleArrival = false, onToggleArrivalGroup,
  onGroupFieldChange, onGeneralFieldChange, onSaveStats, saveSuccess,
  activeDepartment = "pc",
  selectedDept = "pc",
  onDepartmentSelect,
}) => {
  const showArrivalCheckbox = isAdmin || canToggleArrival;
  const canViewDetails = isAdmin || canEdit || canToggleArrival;
  const [copied, setCopied] = useState(false);
  const isPolygon = activeFeat.type === "polygon";
  const coords = formatCoordinates(activeFeat);

  const containedPoints = useMemo(() => {
    if (!isPolygon) return [];
    const polyCoords = activeFeat.geojsonGeometry?.coordinates as number[][][];
    if (!polyCoords || !polyCoords[0]) return [];
    const vs = polyCoords[0];
    return drawnFeatures.filter((f) => {
      if (f.type !== "point") return false;
      const ptCoords = f.geojsonGeometry?.coordinates as number[];
      if (!ptCoords) return false;
      return isPointInPolygon(ptCoords[0], ptCoords[1], vs);
    });
  }, [isPolygon, activeFeat, drawnFeatures]);

  const containedWithLogs = useMemo(() => {
    return containedPoints.map((pt) => {
      const logs = pt.dailyLogs?.filter((l) =>
        l.date === popupEditDate &&
        (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
      ) || [];
      const log: Partial<DailyLog> = logs.length > 1 ? (mergeLogs(logs) || {}) : (logs[0] || {});
      return { point: pt, log };
    });
  }, [containedPoints, popupEditDate, activeDepartment]);

  const sourceLog: Partial<DailyLog> = (isPolygon && localLog) ? localLog : (dailyLog || {});
  const polygonOwnLog = isPolygon ? sourceLog : {};

  const mergedLogForDisplay = useMemo(() => {
    if (activeDepartment !== "mixto") return null;
    const allLogs = activeFeat.dailyLogs?.filter((l) => l.date === popupEditDate) || [];
    if (allLogs.length <= 1) return null;
    return mergeLogs(allLogs);
  }, [activeDepartment, activeFeat.dailyLogs, popupEditDate]);

  const polygonGroups = useMemo(() => {
    if (!isPolygon) return [];
    const src = mergedLogForDisplay || polygonOwnLog;
    return getNormalizedGroupList(src);
  }, [isPolygon, polygonOwnLog, mergedLogForDisplay]);

  const pointGroups = useMemo(() => {
    if (isPolygon) return [];
    const src = mergedLogForDisplay || localLog || dailyLog || {};
    return getNormalizedGroupList(src);
  }, [isPolygon, localLog, dailyLog, mergedLogForDisplay]);

  const aggregatedLog = useMemo(() => {
    if (!isPolygon) return dailyLog || {};
    return aggregatePolygonLog(polygonOwnLog, polygonGroups, containedWithLogs);
  }, [isPolygon, dailyLog, containedWithLogs, polygonOwnLog, polygonGroups]);

  const log = isPolygon ? aggregatedLog : (localLog || dailyLog || {});

  const activeGroups = isPolygon ? polygonGroups : pointGroups;

  const editGroups = useMemo(() => {
    if (activeDepartment !== "mixto" || !mergedLogForDisplay) return null;
    return getNormalizedGroupList(localLog || dailyLog || {});
  }, [activeDepartment, mergedLogForDisplay, localLog, dailyLog]);

  const translateGroupIdx = (displayIdx: number): number => {
    if (!editGroups) return displayIdx;
    const displayGroup = activeGroups[displayIdx];
    if (!displayGroup) return displayIdx;
    const localIdx = editGroups.findIndex((g) => g.id === displayGroup.id);
    return localIdx >= 0 ? localIdx : displayIdx;
  };

  const onGroupEdit = useCallback((displayIdx: number, field: string, value: string | boolean) => {
    const displayGroup = activeGroups[displayIdx];
    if (displayGroup && displayGroup.department && displayGroup.department !== selectedDept) {
      onDepartmentSelect?.(displayGroup.department as Department);
      setTimeout(() => {
        onGroupFieldChange?.(translateGroupIdx(displayIdx), field, value);
      }, 0);
    } else {
      onGroupFieldChange?.(translateGroupIdx(displayIdx), field, value);
    }
  }, [onGroupFieldChange, editGroups, activeGroups, selectedDept, onDepartmentSelect]);

  const onToggleArrival = useCallback((displayIdx: number, hasArrived: boolean) => {
    const displayGroup = activeGroups[displayIdx];
    if (displayGroup && displayGroup.department && displayGroup.department !== selectedDept) {
      onDepartmentSelect?.(displayGroup.department as Department);
      setTimeout(() => {
        onToggleArrivalGroup?.((translateGroupIdx(displayIdx) + 1) as 1 | 2 | 3 | 4, hasArrived);
      }, 0);
    } else {
      onToggleArrivalGroup?.((translateGroupIdx(displayIdx) + 1) as 1 | 2 | 3 | 4, hasArrived);
    }
  }, [onToggleArrivalGroup, editGroups, activeGroups, selectedDept, onDepartmentSelect]);

  const { groupingMode, setGroupingMode, selectedIndices, handleGroupSelected, handleUngroup, toggleSelect, exitGroupingMode } = useGrouping({
    polygonGroups: activeGroups,
    onGroupFieldChange: onGroupFieldChange as ((idx: number, field: string, value: string) => void) | undefined,
    onSaveStats,
  });

  const hasGeneralStats = !!METRIC_FIELDS.some((m) => {
    const v = getMetricValue(polygonOwnLog, m.field);
    return v && v !== "0" && v !== "";
  });

  const displayItems = useMemo(() => buildDisplayItems(activeGroups), [activeGroups]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coords);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pointHasMetrics = METRIC_FIELDS.some((m) => {
    const v = getMetricValue(log, m.field);
    return v && v !== "0";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {!isPolygon && (activeFeat.isCollapsed || activeFeat.isCampement || activeFeat.isHealthCenter || activeFeat.otherCategoryName) && canViewDetails && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {activeFeat.isCollapsed && (
            <div style={{ background: "rgba(239, 68, 68, 0.14)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f87171", fontSize: "0.72rem", fontWeight: 700 }}>
              <span>🔴 Estructura Colapsada</span>
              <span style={{ background: "#ef4444", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                Cantidad: {activeFeat.collapsedCount || "1"}
              </span>
            </div>
          )}
          {activeFeat.isCampement && (
            <div style={{ background: "rgba(245, 158, 11, 0.14)", border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fbbf24", fontSize: "0.72rem", fontWeight: 700 }}>
              <span>⛺ Campamento / Refugio</span>
              {activeFeat.campementCount && (
                <span style={{ background: "#f59e0b", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                  Personas: {activeFeat.campementCount}
                </span>
              )}
            </div>
          )}
          {activeFeat.isHealthCenter && (
            <div style={{ background: "rgba(56, 189, 248, 0.14)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#38bdf8", fontSize: "0.72rem", fontWeight: 700 }}>
              <span>🏥 Centro Asistencial / Salud</span>
              {activeFeat.healthCenterType && (
                <span style={{ background: "#0284c7", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                  {activeFeat.healthCenterType}
                </span>
              )}
            </div>
          )}
          {activeFeat.otherCategoryName && (
            <div style={{ background: "rgba(168, 85, 247, 0.14)", border: "1px solid rgba(168, 85, 247, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", color: "#c084fc", fontSize: "0.72rem", fontWeight: 700 }}>
              <span>📍 Clasificación:</span>
              <span style={{ fontWeight: 800, color: "#ffffff" }}>{activeFeat.otherCategoryName}</span>
            </div>
          )}
        </div>
      )}

      {!isPolygon && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label style={labelStyle}>{getCoordLabel(activeFeat)}</label>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.72rem", color: "var(--color-info)", fontFamily: "var(--font-mono, monospace)", background: "rgba(0, 0, 0, 0.3)", padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-subtle)", flex: 1 }}>
              {coords}
            </span>
            <button onClick={handleCopy} style={{ background: copied ? "#22c55e" : "rgba(255, 255, 255, 0.08)", border: "1px solid " + (copied ? "#22c55e" : "var(--border-subtle)"), borderRadius: "4px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s ease" }} title={copied ? "\u00a1Copiado!" : "Copiar coordenadas"}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {isPolygon && (
        <>
          {canEdit && (
            <div style={{ ...sectionBox, background: "rgba(16, 185, 129, 0.04)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#10b981", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Activity size={10} /> Estadistica del Sector
                <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>Independiente de grupos</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                {METRIC_FIELDS.map(({ label, field, color }) => (
                  <div key={field} style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>{label}</span>
                    {canEdit && onGeneralFieldChange ? (
                      <input type="number" min="0" placeholder="0" value={getMetricValue(polygonOwnLog, field) || ""} onChange={(e) => onGeneralFieldChange(field, e.target.value)} style={{ textAlign: "center", padding: "2px 2px", fontSize: "0.68rem", color, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", width: "100%", outline: "none", fontFamily: "inherit" }} />
                    ) : (
                      <span style={{ fontSize: "0.8rem", fontWeight: 800, color }}>{getMetricValue(polygonOwnLog, field) || "0"}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {polygonGroups.length > 0 && (
            <WorkTeamsSection
              variant="polygon"
              displayItems={displayItems}
              activeDepartment={activeDepartment}
              canEdit={canEdit}
              canViewDetails={canViewDetails}
              showArrivalCheckbox={showArrivalCheckbox}
              groupingMode={groupingMode}
              setGroupingMode={setGroupingMode}
              exitGroupingMode={exitGroupingMode}
              selectedIndices={selectedIndices}
              handleGroupSelected={handleGroupSelected}
              toggleSelect={toggleSelect}
              handleUngroup={handleUngroup}
              onGroupEdit={onGroupEdit}
              onToggleArrival={onToggleArrival}
              onDepartmentSelect={onDepartmentSelect}
            />
          )}

          {containedWithLogs.length > 0 && (
            <div style={sectionBox}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span>Puntos con reporte ({containedWithLogs.filter(({ log }) => METRIC_FIELDS.some((m) => { const v = getMetricValue(log, m.field); return v && v !== "0"; })).length})</span>
                <span style={{ fontWeight: 400, fontSize: "0.5rem", color: "var(--text-muted)", textAlign: "right" }}>
                  {METRIC_FIELDS.map((m, i) => (
                    <span key={m.field}>{i > 0 && " | "}<span style={{ color: m.color }}>{m.label.replace(".", "")}</span></span>
                  ))}
                </span>
              </div>
              {containedWithLogs.map(({ point, log: ptLog }) => {
                const hasData = METRIC_FIELDS.some((m) => { const v = getMetricValue(ptLog, m.field); return v && v !== "0"; });
                if (!hasData) return null;
                return (
                  <div key={point.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "var(--text-main)" }}>{point.title}</span>
                    <div style={{ display: "flex", gap: "4px", fontSize: "0.6rem", alignItems: "center" }}>
                      {METRIC_FIELDS.map((m) => {
                        const v = getMetricValue(ptLog, m.field);
                        if (!v || v === "0") return null;
                        const shortLabel = m.label.charAt(0);
                        return <span key={m.field} style={{ color: m.color, fontWeight: 700 }}>{v}{shortLabel}</span>;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={sectionBox}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={10} /> Total del Sector
            </div>
            <MetricDisplayGrid source={aggregatedLog} />
          </div>

          {polygonGroups.length === 0 && !hasGeneralStats && !(polygonOwnLog.customActivities && polygonOwnLog.customActivities.length > 0) && !(log.customActivities && log.customActivities.length > 0) && containedWithLogs.length === 0 && (
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
              No hay grupos ni datos cargados en esta zona
            </div>
          )}
        </>
      )}

      {!isPolygon && pointGroups.length === 0 && !pointHasMetrics && !canEdit && (
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
          Sin datos registrados para hoy
        </div>
      )}

      {!isPolygon && canEdit && (
        <div style={{ ...sectionBox, background: "rgba(249, 115, 22, 0.04)", borderColor: "rgba(249, 115, 22, 0.2)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#f97316", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={10} /> Estadisticas del Area de Trabajo
            <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>Independiente de grupos</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
            {METRIC_FIELDS.map(({ label, field, color }) => (
              <div key={field} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>{label}</span>
                {onGeneralFieldChange ? (
                  <input type="number" min="0" placeholder="0" value={getMetricValue(localLog || {}, field) || ""} onChange={(e) => onGeneralFieldChange(field, e.target.value)} style={{ textAlign: "center", padding: "2px 2px", fontSize: "0.68rem", color, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", width: "100%", outline: "none", fontFamily: "inherit" }} />
                ) : (
                  <span style={{ fontSize: "0.8rem", fontWeight: 800, color }}>{getMetricValue(localLog || {}, field) || "0"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(canEdit || (log.customActivities && log.customActivities.length > 0)) && (
        <CustomActivitiesSection
          customActivities={canEdit ? (localLog?.customActivities || (isPolygon ? polygonOwnLog.customActivities : dailyLog?.customActivities) || []) : (log.customActivities || [])}
          onChange={(acts) => onGeneralFieldChange?.("customActivities", acts)}
          canEdit={canEdit && !!onGeneralFieldChange}
          title={isPolygon ? "Actividades Personalizadas del Sector" : "Actividades Personalizadas del Punto"}
        />
      )}

      {!isPolygon && pointGroups.length > 0 && (
        <WorkTeamsSection
          variant="point"
          displayItems={displayItems}
          activeDepartment={activeDepartment}
          canEdit={canEdit}
          canViewDetails={canViewDetails}
          showArrivalCheckbox={showArrivalCheckbox}
          groupingMode={groupingMode}
          setGroupingMode={setGroupingMode}
          exitGroupingMode={exitGroupingMode}
          selectedIndices={selectedIndices}
          handleGroupSelected={handleGroupSelected}
          toggleSelect={toggleSelect}
          handleUngroup={handleUngroup}
          onGroupEdit={onGroupEdit}
          onToggleArrival={onToggleArrival}
          onDepartmentSelect={onDepartmentSelect}
        />
      )}

      {!isPolygon && pointHasMetrics && pointGroups.length === 0 && canViewDetails && (
        <div style={sectionBox}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={10} /> Reportes de Hoy
          </div>
          <MetricDisplayGrid source={log} />
        </div>
      )}

      {canEdit && onGeneralFieldChange && (
        <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <FileText size={10} /> Observación / Notas del Día
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: "45px", resize: "vertical" }}
            placeholder="Notas u observaciones del día..."
            value={localLog?.observations || log.observations || ""}
            onChange={(e) => onGeneralFieldChange("observations", e.target.value)}
          />
        </div>
      )}

      {!canEdit && log.observations && (
        <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <FileText size={10} /> Observaciones del Día
          </div>
          <div style={{ fontSize: "0.68rem", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
            {log.observations}
          </div>
        </div>
      )}

      {canEdit && onSaveStats && (
        <button type="button" onClick={onSaveStats} style={{ width: "100%", background: saveSuccess ? "rgba(34, 197, 94, 0.18)" : "rgba(56, 189, 248, 0.12)", border: `1px solid ${saveSuccess ? "rgba(34, 197, 94, 0.5)" : "rgba(56, 189, 248, 0.35)"}`, borderRadius: "7px", color: saveSuccess ? "#22c55e" : "#38bdf8", fontSize: "0.72rem", fontWeight: 700, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s ease" }}>
          {saveSuccess ? <Check size={13} /> : <Save size={13} />}
          {saveSuccess ? "¡Estadísticas Guardadas!" : "Guardar Estadísticas"}
        </button>
      )}

    </div>
  );
};
