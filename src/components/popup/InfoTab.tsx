import React, { useState, useMemo, useCallback } from "react";
import { Copy, Check, Activity, Save, FileText, AlertTriangle, Tent, HeartPulse, Tag, History } from "lucide-react";
import type { DrawnFeature, DailyLog, DepartmentView, Department, NovedadEntry } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { getNormalizedGroupList, mergeLogs, logHasAnyData } from "../../utils/logUtils";
import { labelStyle, sectionBox, inputStyle } from "./popupStyles";
import { formatCoordinates, getCoordLabel, METRIC_FIELDS, getMetricValue } from "./metricFields";
import { MetricDisplayGrid } from "./MetricGrid";
import { useGrouping } from "./useGrouping";
import { aggregatePolygonLog } from "./aggregatePolygonLog";
import { WorkTeamsSection, buildDisplayItems } from "./WorkTeamsSection";

import { CustomActivitiesSection } from "./CustomActivitiesSection";

export function getPointReportSummary(ptLog: Partial<DailyLog>) {
  const groups = getNormalizedGroupList(ptLog);
  let totalPersonnel = 0;
  let totalRescued = parseInt(ptLog.rescuedCount || "0", 10) || 0;
  let totalRecovered = parseInt(ptLog.recoveredCount || "0", 10) || 0;
  let totalPets = parseInt(ptLog.rescuedPetsCount || "0", 10) || 0;
  let totalPrehospital = parseInt(ptLog.prehospitalCareCount || "0", 10) || 0;
  let totalTransfers = parseInt(ptLog.transfersCount || "0", 10) || 0;
  let hasArrived = false;

  for (const g of groups) {
    totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;
    totalRescued += parseInt(g.rescuedCount || "0", 10) || 0;
    totalRecovered += parseInt(g.recoveredCount || "0", 10) || 0;
    totalPets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
    totalPrehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
    totalTransfers += parseInt(g.transfersCount || "0", 10) || 0;
    if (g.hasArrived) hasArrived = true;
  }

  const hasAnyLogData =
    logHasAnyData(ptLog) ||
    totalPersonnel > 0 ||
    totalRescued > 0 ||
    totalRecovered > 0 ||
    totalPets > 0 ||
    totalPrehospital > 0 ||
    totalTransfers > 0 ||
    hasArrived ||
    (Array.isArray(ptLog.novedades) && ptLog.novedades.length > 0) ||
    !!(ptLog.observations && ptLog.observations.trim());

  return {
    totalPersonnel,
    totalRescued,
    totalRecovered,
    totalPets,
    totalPrehospital,
    totalTransfers,
    hasArrived,
    hasAnyLogData,
  };
}

interface InfoTabProps {
  activeFeat: DrawnFeature;
  dailyLog: Partial<DailyLog> | undefined;
  localLog?: Partial<DailyLog>;
  onEdit: () => void;
  drawnFeatures?: DrawnFeature[];
  mergedLog?: Partial<DailyLog>;
  popupEditDate: string;
  isAdmin?: boolean;
  canEdit?: boolean;
  canToggleArrival?: boolean;
  onToggleArrivalGroup?: (groupIndex: 1 | 2 | 3 | 4, hasArrived: boolean) => Promise<void>;
  onGroupFieldChange?: (
    groupIdx: number,
    field: string,
    value: string | boolean,
    dept?: "pc" | "bomberos",
    groupId?: string
  ) => void;
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
  onViewHistory?: () => void;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  activeFeat, dailyLog, localLog, mergedLog, drawnFeatures = [], popupEditDate,
  isAdmin = false, canEdit = false, canToggleArrival = false, onToggleArrivalGroup,
  onGroupFieldChange, onGeneralFieldChange, onSaveStats, saveSuccess,
  activeDepartment = "pc",
  selectedDept = "pc",
  onDepartmentSelect,
  onViewHistory,
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
      const ptCoords = f.geojsonGeometry?.coordinates && Array.isArray(f.geojsonGeometry.coordinates)
        ? (f.geojsonGeometry.coordinates as number[])
        : (f as any).coordinates?.longitude !== undefined
        ? [(f as any).coordinates.longitude, (f as any).coordinates.latitude]
        : null;
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
    if (mergedLog) return mergedLog;
    const allLogs = activeFeat.dailyLogs?.filter((l) => l.date === popupEditDate) || [];
    if (allLogs.length === 0) return null;
    return mergeLogs(allLogs);
  }, [activeDepartment, mergedLog, activeFeat.dailyLogs, popupEditDate]);

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

  const log = isPolygon ? aggregatedLog : (mergedLogForDisplay || localLog || dailyLog || {});

  const activeGroups = isPolygon ? polygonGroups : pointGroups;

  const onGroupEdit = useCallback((displayIdx: number, field: string, value: string | boolean) => {
    const displayGroup = activeGroups[displayIdx];
    onGroupFieldChange?.(
      displayIdx,
      field,
      value,
      displayGroup?.department as any,
      displayGroup?.id
    );
  }, [onGroupFieldChange, activeGroups]);

  const onToggleArrival = useCallback((displayIdx: number, hasArrived: boolean) => {
    onToggleArrivalGroup?.((displayIdx + 1) as 1 | 2 | 3 | 4, hasArrived);
  }, [onToggleArrivalGroup]);

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
            <div style={{ background: "rgba(239, 68, 68, 0.14)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f87171", fontSize: "0.74rem", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>Estructura Colapsada</span>
              </div>
              <span style={{ background: "#ef4444", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 800 }}>
                Cantidad: {activeFeat.collapsedCount || "1"}
              </span>
            </div>
          )}
          {activeFeat.isCampement && (
            <div style={{ background: "rgba(245, 158, 11, 0.14)", border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fbbf24", fontSize: "0.74rem", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Tent size={14} style={{ flexShrink: 0 }} />
                <span>Campamento / Refugio</span>
              </div>
              {activeFeat.campementCount && (
                <span style={{ background: "#f59e0b", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 800 }}>
                  Personas: {activeFeat.campementCount}
                </span>
              )}
            </div>
          )}
          {activeFeat.isHealthCenter && (
            <div style={{ background: "rgba(56, 189, 248, 0.14)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#38bdf8", fontSize: "0.74rem", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <HeartPulse size={14} style={{ flexShrink: 0 }} />
                <span>Centro Asistencial / Salud</span>
              </div>
              {activeFeat.healthCenterType && (
                <span style={{ background: "#0284c7", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: 800 }}>
                  {activeFeat.healthCenterType}
                </span>
              )}
            </div>
          )}
          {activeFeat.otherCategoryName && (
            <div style={{ background: "rgba(168, 85, 247, 0.14)", border: "1px solid rgba(168, 85, 247, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", color: "#c084fc", fontSize: "0.74rem", fontWeight: 700 }}>
              <Tag size={14} style={{ flexShrink: 0 }} />
              <span>Clasificación:</span>
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
            <button onClick={handleCopy} style={{ background: copied ? "#22c55e" : "rgba(255, 255, 255, 0.08)", border: "1px solid " + (copied ? "#22c55e" : "var(--border-subtle)"), borderRadius: "4px", padding: "4px 6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", transition: "all 0.2s ease" }} title={copied ? "¡Copiado!" : "Copiar coordenadas"}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      )}

      {activeFeat.dailyLogs && activeFeat.dailyLogs.length > 0 && onViewHistory && (
        <button
          type="button"
          onClick={onViewHistory}
          style={{
            background: "linear-gradient(135deg, rgba(56, 189, 248, 0.1) 0%, rgba(14, 165, 233, 0.04) 100%)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: "6px",
            padding: "6px 10px",
            color: "var(--color-info, #38bdf8)",
            fontSize: "0.68rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transition: "all 0.18s ease",
            marginTop: "2px",
            marginBottom: "2px",
            width: "100%",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <History size={13} />
            <span>{isPolygon ? "Ver Historial del Sector" : "Ver Historial del Punto"}</span>
          </span>
          <span
            style={{
              background: "rgba(56, 189, 248, 0.2)",
              padding: "1px 7px",
              borderRadius: "10px",
              fontSize: "0.6rem",
              fontWeight: 800,
              border: "1px solid rgba(56, 189, 248, 0.35)",
            }}
          >
            {activeFeat.dailyLogs.length} {activeFeat.dailyLogs.length === 1 ? "registro" : "registros"}
          </span>
        </button>
      )}

      {isPolygon && (
        <>
          {canEdit && (
            <div style={{ ...sectionBox, background: "rgba(16, 185, 129, 0.04)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#10b981", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "3px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Activity size={12} /> Estadistica del Sector
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>Independiente de grupos</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                {METRIC_FIELDS.map(({ label, field, color }) => (
                  <div key={field} style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>{label}</span>
                    {canEdit && onGeneralFieldChange ? (
                      <input type="number" min="0" placeholder="0" value={getMetricValue(polygonOwnLog, field) || ""} onChange={(e) => onGeneralFieldChange(field, e.target.value)} style={{ textAlign: "center", padding: "3px 2px", fontSize: "0.74rem", color, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", width: "100%", outline: "none", fontFamily: "inherit" }} />
                    ) : (
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color }}>{getMetricValue(polygonOwnLog, field) || "0"}</span>
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

          {containedWithLogs.length > 0 && (() => {
            const reportedPoints = containedWithLogs.filter(({ log }) => getPointReportSummary(log).hasAnyLogData);
            return (
              <div style={sectionBox}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "4px", marginBottom: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Puntos con reporte ({reportedPoints.length} de {containedPoints.length})</span>
                </div>
                {reportedPoints.length === 0 ? (
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", padding: "4px 0" }}>
                    No hay puntos con actividad registrada en esta fecha
                  </div>
                ) : (
                  <div style={{ width: "100%", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                          <th style={{ textAlign: "left", padding: "4px 5px", color: "var(--text-muted)", fontWeight: 600 }}>Punto</th>
                          <th style={{ textAlign: "center", padding: "4px 5px", color: "var(--color-info)", fontWeight: 700, minWidth: "30px" }}>Resc.</th>
                          <th style={{ textAlign: "center", padding: "4px 5px", color: "#ef4444", fontWeight: 700, minWidth: "30px" }}>Recup.</th>
                          <th style={{ textAlign: "center", padding: "4px 5px", color: "var(--color-green)", fontWeight: 700, minWidth: "30px" }}>Masc.</th>
                          <th style={{ textAlign: "center", padding: "4px 5px", color: "#0ea5e9", fontWeight: 700, minWidth: "30px" }}>Atenc.</th>
                          <th style={{ textAlign: "center", padding: "4px 5px", color: "var(--color-purple)", fontWeight: 700, minWidth: "30px" }}>Trasl.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportedPoints.map(({ point, log: ptLog }) => {
                          const summary = getPointReportSummary(ptLog);
                          return (
                            <tr key={point.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                              <td style={{ textAlign: "left", padding: "5px 5px", color: "var(--text-main)", fontWeight: 600 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                  {summary.hasArrived && (
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 4px #22c55e", flexShrink: 0 }} title="Personal en el sitio" />
                                  )}
                                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", display: "inline-block" }}>
                                    {point.title}
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalRescued > 0 ? "var(--color-info)" : "var(--text-muted)", fontWeight: summary.totalRescued > 0 ? 700 : 400 }}>
                                {summary.totalRescued > 0 ? summary.totalRescued : "-"}
                              </td>
                              <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalRecovered > 0 ? "#ef4444" : "var(--text-muted)", fontWeight: summary.totalRecovered > 0 ? 700 : 400 }}>
                                {summary.totalRecovered > 0 ? summary.totalRecovered : "-"}
                              </td>
                              <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalPets > 0 ? "var(--color-green)" : "var(--text-muted)", fontWeight: summary.totalPets > 0 ? 700 : 400 }}>
                                {summary.totalPets > 0 ? summary.totalPets : "-"}
                              </td>
                              <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalPrehospital > 0 ? "#0ea5e9" : "var(--text-muted)", fontWeight: summary.totalPrehospital > 0 ? 700 : 400 }}>
                                {summary.totalPrehospital > 0 ? summary.totalPrehospital : "-"}
                              </td>
                              <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)", fontWeight: summary.totalTransfers > 0 ? 700 : 400 }}>
                                {summary.totalTransfers > 0 ? summary.totalTransfers : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          <div style={sectionBox}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "3px", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={12} /> Total del Sector
            </div>
            <MetricDisplayGrid source={aggregatedLog} />
          </div>

          {polygonGroups.length === 0 && !hasGeneralStats && !(polygonOwnLog.customActivities && polygonOwnLog.customActivities.length > 0) && !(log.customActivities && log.customActivities.length > 0) && containedWithLogs.length === 0 && (
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
              No hay grupos ni datos cargados en esta zona
            </div>
          )}
        </>
      )}

      {!isPolygon && pointGroups.length === 0 && !pointHasMetrics && !canEdit && (
        <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
          Sin datos registrados para hoy
        </div>
      )}

      {!isPolygon && canEdit && (
        <div style={{ ...sectionBox, background: "rgba(249, 115, 22, 0.04)", borderColor: "rgba(249, 115, 22, 0.2)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f97316", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "3px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={12} /> Estadisticas del Area de Trabajo
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>Independiente de grupos</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
            {METRIC_FIELDS.map(({ label, field, color }) => (
              <div key={field} style={{ textAlign: "center" }}>
                <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>{label}</span>
                {onGeneralFieldChange ? (
                  <input type="number" min="0" placeholder="0" value={getMetricValue(localLog || {}, field) || ""} onChange={(e) => onGeneralFieldChange(field, e.target.value)} style={{ textAlign: "center", padding: "3px 2px", fontSize: "0.74rem", color, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "4px", width: "100%", outline: "none", fontFamily: "inherit" }} />
                ) : (
                  <span style={{ fontSize: "0.82rem", fontWeight: 800, color }}>{getMetricValue(localLog || {}, field) || "0"}</span>
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
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "3px", marginBottom: "3px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={12} /> Reportes de Hoy
          </div>
          <MetricDisplayGrid source={log} />
        </div>
      )}

      {canEdit && onGeneralFieldChange && (
        <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "3px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <FileText size={12} /> Observación / Notas del Día
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: "48px", resize: "vertical", fontSize: "0.76rem" }}
            placeholder="Notas u observaciones del día..."
            value={localLog?.observations || log.observations || ""}
            onChange={(e) => onGeneralFieldChange("observations", e.target.value)}
          />
        </div>
      )}

      {!canEdit && log.observations && (
        <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)" }}>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "3px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <FileText size={12} /> Observaciones del Día
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--text-main)", whiteSpace: "pre-wrap" }}>
            {log.observations}
          </div>
        </div>
      )}

      {canEdit && onSaveStats && (
        <div style={{ marginTop: "6px", marginBottom: "40px", width: "100%" }}>
          <button type="button" onClick={onSaveStats} style={{ width: "100%", background: saveSuccess ? "rgba(34, 197, 94, 0.18)" : "rgba(56, 189, 248, 0.12)", border: `1px solid ${saveSuccess ? "rgba(34, 197, 94, 0.5)" : "rgba(56, 189, 248, 0.35)"}`, borderRadius: "7px", color: saveSuccess ? "#22c55e" : "#38bdf8", fontSize: "0.76rem", fontWeight: 700, padding: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s ease" }}>
            {saveSuccess ? <Check size={14} /> : <Save size={14} />}
            {saveSuccess ? "¡Estadísticas Guardadas!" : "Guardar Estadísticas"}
          </button>
        </div>
      )}

    </div>
  );
};
