import React, { useState, useMemo, useCallback } from "react";
import { Copy, Check, Edit3, Users, Activity, Link2, Unlink, Save, FileText, Plus, X, Pencil } from "lucide-react";
import type { DrawnFeature, DailyLog, GroupLogEntry, NovedadEntry, DepartmentView } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { getNormalizedGroupList, mergeLogs } from "../../utils/logUtils";
import { labelStyle, sectionBox, readRowStyle, readLabelStyle, readValueStyle } from "./popupStyles";
import { COMMISSION_INDEPENDENT, getGroupColor, formatCoordinates, getCoordLabel, METRIC_FIELDS, getMetricValue } from "./metricFields";
import { MetricInputs, MetricBadges, MetricDisplayGrid } from "./MetricGrid";
import { useGrouping } from "./useGrouping";
import { aggregatePolygonLog } from "./aggregatePolygonLog";
import { ConfirmModal } from "../ConfirmModal";

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
  onGeneralFieldChange?: (field: string, value: string) => void;
  onSaveStats?: () => void;
  saveSuccess?: boolean;
  novedades?: NovedadEntry[];
  onAddNovedad?: (time: string, text: string) => Promise<void>;
  onDeleteNovedad?: (id: string) => Promise<void>;
  onUpdateNovedad?: (entryId: string, newText: string, newTime?: string) => Promise<void>;
  containedNovedades?: Array<{ origin: string; originFeatId?: number; novedades: NovedadEntry[] }>;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
  activeDepartment?: DepartmentView;
}

function ReadRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={readRowStyle}>
      <span style={readLabelStyle}>{label}</span>
      <span style={readValueStyle}>{value || "\u2014"}</span>
    </div>
  );
}

type DisplayItem =
  | { type: "independent"; groupIdx: number; group: GroupLogEntry }
  | { type: "joint"; commissionId: string; groupIndices: number[]; groups: GroupLogEntry[] };

function buildDisplayItems(polygonGroups: GroupLogEntry[]): DisplayItem[] {
  const result: DisplayItem[] = [];
  const processedComms = new Set<string>();
  polygonGroups.forEach((g, idx) => {
    const cid = g.commissionId || COMMISSION_INDEPENDENT;
    if (cid === COMMISSION_INDEPENDENT) {
      result.push({ type: "independent", groupIdx: idx, group: g });
    } else if (!processedComms.has(cid)) {
      processedComms.add(cid);
      const allInComm = polygonGroups
        .map((gg, ii) => ({ gg, ii }))
        .filter(({ gg }) => (gg.commissionId || COMMISSION_INDEPENDENT) === cid);
      result.push({
        type: "joint",
        commissionId: cid,
        groupIndices: allInComm.map(({ ii }) => ii),
        groups: allInComm.map(({ gg }) => gg),
      });
    }
  });
  return result;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  activeFeat, dailyLog, localLog, onEdit, drawnFeatures, popupEditDate,
  isAdmin = false, canEdit = false, canToggleArrival = false, onToggleArrivalGroup,
  onGroupFieldChange, onGeneralFieldChange, onSaveStats, saveSuccess,
  novedades = [], onAddNovedad, onDeleteNovedad, onUpdateNovedad, containedNovedades = [], onNavigateToFeature,
  activeDepartment = "pc",
}) => {
  const showArrivalCheckbox = isAdmin || canToggleArrival;
  const canViewDetails = isAdmin || canEdit || canToggleArrival;
  const [copied, setCopied] = useState(false);
  const [novTime, setNovTime] = useState(() => new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [novText, setNovText] = useState("");
  const [confirmDeleteNovedadId, setConfirmDeleteNovedadId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntryText, setEditingEntryText] = useState("");
  const [editingEntryTime, setEditingEntryTime] = useState("");
  const isPolygon = activeFeat.type === "polygon";
  const coords = formatCoordinates(activeFeat);

  // --- Contained points ---
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
      const log = pt.dailyLogs?.find((l) => l.date === popupEditDate) || {} as Partial<DailyLog>;
      return { point: pt, log };
    });
  }, [containedPoints, popupEditDate]);

  // --- Source of truth for polygon groups ---
  const sourceLog: Partial<DailyLog> = (isPolygon && localLog) ? localLog : (dailyLog || {});
  const polygonOwnLog = isPolygon ? sourceLog : {};

  // Mixto: merge groups from ALL departments for display
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

  // --- Point groups (uses localLog so grouping changes are reactive) ---
  const pointGroups = useMemo(() => {
    if (isPolygon) return [];
    const src = mergedLogForDisplay || localLog || dailyLog || {};
    return getNormalizedGroupList(src);
  }, [isPolygon, localLog, dailyLog, mergedLogForDisplay]);

  // --- Aggregated totals ---
  const aggregatedLog = useMemo(() => {
    if (!isPolygon) return dailyLog || {};
    return aggregatePolygonLog(polygonOwnLog, polygonGroups, containedWithLogs);
  }, [isPolygon, dailyLog, containedWithLogs, polygonOwnLog, polygonGroups]);

  const log = isPolygon ? aggregatedLog : (localLog || dailyLog || {});

  // Unified groups for the active feature type
  const activeGroups = isPolygon ? polygonGroups : pointGroups;

  // --- Mixto index mapping: translate merged display index → localLog/dailyLog index ---
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
    onGroupFieldChange?.(translateGroupIdx(displayIdx), field, value);
  }, [onGroupFieldChange, editGroups, activeGroups]);

  const onToggleArrival = useCallback((displayIdx: number, hasArrived: boolean) => {
    onToggleArrivalGroup?.((translateGroupIdx(displayIdx) + 1) as 1 | 2 | 3 | 4, hasArrived);
  }, [onToggleArrivalGroup, editGroups, activeGroups]);

  // --- Grouping logic (works for both points and polygons) ---
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

  const handleStartEditEntry = (entryId: string, text: string, time: string) => {
    setEditingEntryId(entryId);
    setEditingEntryText(text);
    setEditingEntryTime(time && time !== "—" ? time : "");
  };

  const handleSaveEditEntry = async (entryId: string) => {
    if (!editingEntryText.trim()) return;
    if (onUpdateNovedad) {
      await onUpdateNovedad(entryId, editingEntryText.trim(), editingEntryTime || undefined);
    }
    setEditingEntryId(null);
    setEditingEntryText("");
    setEditingEntryTime("");
  };

  const handleCancelEditEntry = () => {
    setEditingEntryId(null);
    setEditingEntryText("");
    setEditingEntryTime("");
  };

  // --- Points: check if any metric has data ---
  const pointHasMetrics = METRIC_FIELDS.some((m) => {
    const v = getMetricValue(log, m.field);
    return v && v !== "0";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Badge de Edificio Colapsado */}
      {!isPolygon && activeFeat.isCollapsed && canViewDetails && (
        <div style={{ background: "rgba(239, 68, 68, 0.14)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#f87171", fontSize: "0.72rem", fontWeight: 700 }}>
          <span>Estructura Colapsada</span>
          <span style={{ background: "#ef4444", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
            Cantidad: {activeFeat.collapsedCount || "1"}
          </span>
        </div>
      )}

      {/* Coordenadas */}
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

      {/* ===== SECCION DE POLIGONO ===== */}
      {isPolygon && (
        <>
          {/* 1. Estadisticas generales */}
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

          {/* 2. Equipos de Trabajo */}
          {polygonGroups.length > 0 && (
            <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={10} /> Equipos de Trabajo
                {canEdit && (
                  <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", userSelect: "none", fontSize: "0.58rem", fontWeight: 700, color: groupingMode ? "#38bdf8" : "var(--text-muted)", transition: "color 0.15s" }} title="Activar modo para agrupar equipos que trabajaron juntos">
                    <input type="checkbox" checked={groupingMode} onChange={(e) => { setGroupingMode(e.target.checked); if (!e.target.checked) exitGroupingMode(); }} style={{ cursor: "pointer", width: "11px", height: "11px" }} />
                    Agrupar
                  </label>
                )}
                {canEdit && groupingMode && selectedIndices.size >= 2 && (
                  <button type="button" onClick={handleGroupSelected} style={{ background: "rgba(56, 189, 248, 0.18)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "5px", color: "#38bdf8", fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Link2 size={9} /> Agrupar {selectedIndices.size}
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {displayItems.map((item) => {
                  if (item.type === "independent") {
                    const { groupIdx, group } = item;
                    const color = getGroupColor(groupIdx);
                    const isSelected = selectedIndices.has(groupIdx);
                    return (
                      <div key={`ind-${groupIdx}`} style={{ background: isSelected ? "rgba(56, 189, 248, 0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "rgba(56, 189, 248, 0.4)" : "rgba(255,255,255,0.05)"}`, borderRadius: "6px", padding: "5px 7px", transition: "all 0.15s ease" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                          {canEdit && groupingMode && (
                            <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(groupIdx)} style={{ cursor: "pointer", width: "12px", height: "12px", flexShrink: 0, accentColor: "#38bdf8" }} title="Seleccionar para agrupar" />
                          )}
                          <span style={{ fontSize: "0.63rem", fontWeight: 700, color }}>{group.groupName || `Equipo ${groupIdx + 1}`}</span>
                          {canEdit && onGroupFieldChange && (
                            <label style={{ fontSize: "0.5rem", fontWeight: 700, color: group.isVolunteer ? "#c084fc" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px", cursor: "pointer", background: group.isVolunteer ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${group.isVolunteer ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "3px", padding: "1px 4px", flexShrink: 0 }}>
                              <input type="checkbox" checked={!!group.isVolunteer} onChange={(e) => onGroupEdit(groupIdx, "isVolunteer", e.target.checked)} style={{ cursor: "pointer", width: "10px", height: "10px", margin: 0 }} />
                              VOL
                            </label>
                          )}
                          {!canEdit && group.isVolunteer && (
                            <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.48rem", fontWeight: 800, textTransform: "uppercase" }}>VOL</span>
                          )}
                          <span style={{ marginLeft: "auto", fontSize: "0.55rem", color: "var(--text-muted)" }}>{group.officersCount ? `${group.officersCount} func.` : ""}</span>
                        </div>
                        {canViewDetails && (
                          <>
                            {canEdit && onGroupFieldChange ? (
                              <MetricInputs group={group} groupIdx={groupIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} />
                            ) : (
                              <MetricBadges group={group} />
                            )}
                            {showArrivalCheckbox ? (
                              <label style={{ fontSize: "0.58rem", fontWeight: 700, color: group.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "5px", marginTop: "4px", cursor: "pointer" }}>
                                <input type="checkbox" checked={!!group.hasArrived} onChange={(e) => { onToggleArrival?.(groupIdx, e.target.checked); }} style={{ cursor: "pointer", width: "12px", height: "12px" }} />
                                <span>{group.hasArrived ? "Llegó del sitio" : "¿Ya llegó del sitio?"}</span>
                              </label>
                            ) : (
                              group.hasArrived && <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px", marginTop: "3px" }}><Check size={9} /> Llegó del sitio</span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }

                  // Joint group card
                  const { commissionId, groupIndices, groups } = item;
                  const primaryIdx = groupIndices[0];
                  const primaryGroup = groups[0];
                  return (
                    <div key={`joint-${commissionId}`} style={{ background: "rgba(56, 189, 248, 0.05)", border: "2px dashed rgba(56, 189, 248, 0.35)", borderRadius: "8px", padding: "6px 8px", position: "relative" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                        <Link2 size={10} style={{ color: "#38bdf8", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#38bdf8" }}>
                          {groups.map((g, i) => (
                            <span key={i}>
                              {i > 0 && <span style={{ color: "var(--text-muted)" }}> + </span>}
                              {g.groupName || `Equipo ${groupIndices[i] + 1}`}
                            </span>
                          ))}
                        </span>
                        {canEdit && (
                          <button type="button" onClick={() => handleUngroup(commissionId)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} title="Desagrupar estos equipos">
                            <Unlink size={8} /> Desagrupar
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                        Equipos trabajando juntos \u2014 estadisticas compartidas
                      </div>
                      {canViewDetails && (
                        <>
                          {canEdit && onGroupFieldChange ? (
                            <MetricInputs group={primaryGroup} groupIdx={primaryIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} />
                          ) : (
                            <MetricBadges group={primaryGroup} />
                          )}
                          {showArrivalCheckbox && groupIndices.map((gIdx) => {
                            const g = groups[groupIndices.indexOf(gIdx)];
                            if (!g) return null;
                            return (
                              <label key={`arr-${gIdx}`} style={{ fontSize: "0.56rem", fontWeight: 700, color: g.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "5px", marginTop: "3px", cursor: "pointer" }}>
                                <input type="checkbox" checked={!!g.hasArrived} onChange={(e) => { onToggleArrival?.(gIdx, e.target.checked); }} style={{ cursor: "pointer", width: "11px", height: "11px" }} />
                                <span>{g.groupName || `Equipo ${gIdx + 1}`}: {g.hasArrived ? "Llegó" : "¿Llegó?"}</span>
                              </label>
                            );
                          })}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Puntos contenidos con estadisticas */}
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

          {/* 4. Total de la zona */}
          <div style={sectionBox}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={10} /> Total del Sector
            </div>
            <MetricDisplayGrid source={aggregatedLog} />
          </div>
          {canEdit && onSaveStats && (
            <button type="button" onClick={onSaveStats} style={{ width: "100%", background: saveSuccess ? "rgba(34, 197, 94, 0.18)" : "rgba(56, 189, 248, 0.12)", border: `1px solid ${saveSuccess ? "rgba(34, 197, 94, 0.5)" : "rgba(56, 189, 248, 0.35)"}`, borderRadius: "7px", color: saveSuccess ? "#22c55e" : "#38bdf8", fontSize: "0.72rem", fontWeight: 700, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s ease" }}>
              {saveSuccess ? <Check size={13} /> : <Save size={13} />}
              {saveSuccess ? "\u00a1Estadisticas Guardadas!" : "Guardar Estadisticas"}
            </button>
          )}

          {polygonGroups.length === 0 && !hasGeneralStats && containedWithLogs.length === 0 && (
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
              No hay grupos ni datos cargados en esta zona
            </div>
          )}
        </>
      )}

      {/* Punto: sin datos (solo para usuarios que no pueden editar) */}
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

      {/* ===== EQUIPOS DE TRABAJO — PUNTOS (con agrupación) ===== */}
      {!isPolygon && pointGroups.length > 0 && (
        <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Users size={10} /> Equipos de Trabajo
            {canEdit && (
              <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", userSelect: "none", fontSize: "0.58rem", fontWeight: 700, color: groupingMode ? "#38bdf8" : "var(--text-muted)", transition: "color 0.15s" }} title="Activar modo para agrupar equipos que trabajaron juntos">
                <input type="checkbox" checked={groupingMode} onChange={(e) => { setGroupingMode(e.target.checked); if (!e.target.checked) exitGroupingMode(); }} style={{ cursor: "pointer", width: "11px", height: "11px" }} />
                Agrupar
              </label>
            )}
            {canEdit && groupingMode && selectedIndices.size >= 2 && (
              <button type="button" onClick={handleGroupSelected} style={{ background: "rgba(56, 189, 248, 0.18)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: "5px", color: "#38bdf8", fontSize: "0.58rem", fontWeight: 700, padding: "2px 7px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                <Link2 size={9} /> Agrupar {selectedIndices.size}
              </button>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {displayItems.map((item) => {
              if (item.type === "independent") {
                const { groupIdx, group } = item;
                const color = getGroupColor(groupIdx);
                const isSelected = selectedIndices.has(groupIdx);
                return (
                  <div key={`ind-${groupIdx}`} style={{ background: isSelected ? "rgba(56, 189, 248, 0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "rgba(56, 189, 248, 0.4)" : "rgba(255,255,255,0.05)"}`, borderRadius: "6px", padding: "5px 7px", transition: "all 0.15s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      {canEdit && groupingMode && (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(groupIdx)} style={{ cursor: "pointer", width: "12px", height: "12px", flexShrink: 0, accentColor: "#38bdf8" }} title="Seleccionar para agrupar" />
                      )}
                      <span style={{ fontSize: "0.63rem", fontWeight: 700, color }}>{group.groupName || `Equipo ${groupIdx + 1}`}</span>
                      {canEdit && onGroupFieldChange && (
                        <label style={{ fontSize: "0.5rem", fontWeight: 700, color: group.isVolunteer ? "#c084fc" : "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px", cursor: "pointer", background: group.isVolunteer ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${group.isVolunteer ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: "3px", padding: "1px 4px", flexShrink: 0 }}>
                          <input type="checkbox" checked={!!group.isVolunteer} onChange={(e) => onGroupEdit(groupIdx, "isVolunteer", e.target.checked)} style={{ cursor: "pointer", width: "10px", height: "10px", margin: 0 }} />
                          VOL
                        </label>
                      )}
                      {!canEdit && group.isVolunteer && (
                        <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.48rem", fontWeight: 800, textTransform: "uppercase" }}>VOL</span>
                      )}
                      <span style={{ marginLeft: "auto", fontSize: "0.55rem", color: "var(--text-muted)" }}>{group.officersCount ? `${group.officersCount} func.` : ""}</span>
                    </div>
                    {canViewDetails && (
                      <>
                        <ReadRow label="Unidad" value={group.unitOut} />
                        <ReadRow label="Encargado" value={group.managerName} />
                        <ReadRow label="Teléfono" value={group.managerPhone} />
                        {canEdit && onGroupFieldChange ? (
                          <MetricInputs group={group} groupIdx={groupIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} />
                        ) : (
                          <MetricBadges group={group} />
                        )}
                        {showArrivalCheckbox ? (
                      <label style={{ fontSize: "0.58rem", fontWeight: 700, color: group.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "5px", marginTop: "4px", cursor: "pointer" }}>
                        <input type="checkbox" checked={!!group.hasArrived} onChange={(e) => { onToggleArrival?.(groupIdx, e.target.checked); }} style={{ cursor: "pointer", width: "12px", height: "12px" }} />
                        <span>{group.hasArrived ? "Llegó del sitio" : "¿Ya llegó del sitio?"}</span>
                      </label>
                    ) : (
                      group.hasArrived && <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px", marginTop: "3px" }}><Check size={9} /> Llegó del sitio</span>
                    )}
                      </>
                    )}
                  </div>
                );
              }

              // Joint group card
              const { commissionId, groupIndices, groups } = item;
              const primaryIdx = groupIndices[0];
              const primaryGroup = groups[0];
              return (
                <div key={`joint-${commissionId}`} style={{ background: "rgba(56, 189, 248, 0.05)", border: "2px dashed rgba(56, 189, 248, 0.35)", borderRadius: "8px", padding: "6px 8px", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "2px" }}>
                    <Link2 size={10} style={{ color: "#38bdf8", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#38bdf8" }}>
                      {groups.map((g, i) => (
                        <span key={i}>
                          {i > 0 && <span style={{ color: "var(--text-muted)" }}> + </span>}
                          {g.groupName || `Equipo ${groupIndices[i] + 1}`}
                        </span>
                      ))}
                    </span>
                    {canEdit && (
                      <button type="button" onClick={() => handleUngroup(commissionId)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} title="Desagrupar estos equipos">
                        <Unlink size={8} /> Desagrupar
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-muted)", marginBottom: "3px" }}>
                    Equipos trabajando juntos \u2014 estad\u00edsticas compartidas
                  </div>
                  {canViewDetails && (
                    <>
                      {groups.map((g, i) => (
                        <div key={i} style={{ padding: "2px 0", borderBottom: i < groups.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                          <ReadRow label="Unidad" value={g.unitOut} />
                          <ReadRow label="Encargado" value={g.managerName} />
                        </div>
                      ))}
                      {canEdit && onGroupFieldChange ? (
                        <MetricInputs group={primaryGroup} groupIdx={primaryIdx} onGroupFieldChange={(idx: number, field: string, value: string) => onGroupEdit(idx, field, value)} />
                      ) : (
                        <MetricBadges group={primaryGroup} />
                      )}
                      {showArrivalCheckbox && groupIndices.map((gIdx) => {
                        const g = groups[groupIndices.indexOf(gIdx)];
                        if (!g) return null;
                        return (
                          <label key={`arr-${gIdx}`} style={{ fontSize: "0.56rem", fontWeight: 700, color: g.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "5px", marginTop: "3px", cursor: "pointer" }}>
                            <input type="checkbox" checked={!!g.hasArrived} onChange={(e) => { onToggleArrival?.(gIdx, e.target.checked); }} style={{ cursor: "pointer", width: "11px", height: "11px" }} />
                            <span>{g.groupName || `Equipo ${gIdx + 1}`}: {g.hasArrived ? "Llegó" : "¿Llegó?"}</span>
                          </label>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reportes de Hoy - solo para puntos con datos, sin grupos y con permisos */}
      {!isPolygon && pointHasMetrics && pointGroups.length === 0 && canViewDetails && (
        <div style={sectionBox}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={10} /> Reportes de Hoy
          </div>
          <MetricDisplayGrid source={log} />
        </div>
      )}

      {/* Novedades unificadas */}
      {canEdit && onAddNovedad && (() => {
        // Build unified list: polygon novedades + contained points novedades
        type UnifiedEntry = { key: string; entryId: string; time: string; text: string; timestamp: string; origin: "zona" | "punto"; originLabel?: string; originFeatId?: number; isOwn: boolean };
        const ownEntries: UnifiedEntry[] = novedades.map((n) => ({ key: `zone-${n.id}`, entryId: n.id, time: n.time, text: n.text, timestamp: n.timestamp, origin: "zona" as const, isOwn: true }));
        const foreignEntries: UnifiedEntry[] = [];
        for (const group of containedNovedades) {
          for (const n of group.novedades) {
            foreignEntries.push({ key: `pt-${group.originFeatId}-${n.id}`, entryId: n.id, time: n.time, text: n.text, timestamp: n.timestamp, origin: "punto" as const, originLabel: group.origin, originFeatId: group.originFeatId, isOwn: false });
          }
        }
        const allEntries = [...ownEntries, ...foreignEntries].sort((a, b) => a.time.localeCompare(b.time));
        const totalOwn = ownEntries.length;
        const totalForeign = foreignEntries.length;

        return (
          <div style={sectionBox}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
              <FileText size={10} /> Novedades
              <span style={{ marginLeft: "auto", fontSize: "0.52rem", fontWeight: 400, color: "var(--text-muted)" }}>
                {totalOwn > 0 && `${totalOwn} zona`}
                {totalOwn > 0 && totalForeign > 0 && " · "}
                {totalForeign > 0 && `${totalForeign} punto${totalForeign > 1 ? "s" : ""}`}
              </span>
            </div>

            {allEntries.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                {allEntries.map((entry) => {
                  const isForeign = entry.origin === "punto";
                  const borderColor = isForeign ? "rgba(167,139,250,0.15)" : "rgba(56,189,248,0.12)";
                  const bgColor = isForeign ? "rgba(167,139,250,0.04)" : "rgba(56,189,248,0.04)";
                  const timeColor = isForeign ? "#a78bfa" : "var(--color-info)";
                  const canNavigate = isForeign && onNavigateToFeature && entry.originFeatId;

                  return (
                    <div
                      key={entry.key}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "6px",
                        padding: "5px 8px", borderRadius: "6px",
                        border: `1px solid ${borderColor}`, background: bgColor,
                        cursor: canNavigate ? "pointer" : "default",
                        transition: "background 0.15s ease",
                      }}
                      onClick={canNavigate ? () => {
                        const feat = drawnFeatures.find((f) => f.id === entry.originFeatId);
                        if (feat) onNavigateToFeature(feat);
                      } : undefined}
                      onMouseEnter={canNavigate ? (e) => (e.currentTarget.style.background = isForeign ? "rgba(167,139,250,0.1)" : bgColor) : undefined}
                      onMouseLeave={canNavigate ? (e) => (e.currentTarget.style.background = bgColor) : undefined}
                    >
                      <span style={{ fontSize: "0.6rem", fontWeight: 700, color: timeColor, fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: "36px" }}>{entry.time}</span>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1px" }}>
                        {editingEntryId === entry.entryId ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <input
                              type="time"
                              value={editingEntryTime}
                              onChange={(e) => setEditingEntryTime(e.target.value)}
                              style={{ width: "80px", fontSize: "0.58rem", padding: "3px 4px", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(17,24,39,0.7)", color: "var(--text-main)", fontFamily: "inherit", outline: "none" }}
                            />
                            <textarea
                              value={editingEntryText}
                              onChange={(e) => setEditingEntryText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEditEntry(entry.entryId); } }}
                              autoFocus
                              rows={2}
                              style={{ fontSize: "0.58rem", padding: "3px 5px", borderRadius: "3px", border: "1px solid rgba(56,189,248,0.25)", background: "rgba(17,24,39,0.7)", color: "var(--text-main)", fontFamily: "inherit", resize: "vertical", outline: "none" }}
                            />
                            <div style={{ display: "flex", gap: "3px" }}>
                              <button onClick={() => handleSaveEditEntry(entry.entryId)} disabled={!editingEntryText.trim()} style={{ fontSize: "0.5rem", padding: "1px 6px", borderRadius: "3px", border: "1px solid rgba(34,197,94,0.3)", background: editingEntryText.trim() ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)", color: editingEntryText.trim() ? "var(--color-green)" : "var(--text-muted)", cursor: editingEntryText.trim() ? "pointer" : "default" }}>
                                Guardar
                              </button>
                              <button onClick={handleCancelEditEntry} style={{ fontSize: "0.5rem", padding: "1px 6px", borderRadius: "3px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "var(--text-muted)", cursor: "pointer" }}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.6rem", color: "var(--text-main)", lineHeight: 1.3 }}>{entry.text}</span>
                        )}
                      </div>
                      {!isForeign && (onDeleteNovedad || onUpdateNovedad) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", flexShrink: 0 }}>
                          {onUpdateNovedad && (
                            <button onClick={(e) => { e.stopPropagation(); handleStartEditEntry(entry.entryId, entry.text, entry.time); }} title="Editar" style={{ padding: "1px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-info)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                              <Pencil size={10} />
                            </button>
                          )}
                          {onDeleteNovedad && (
                            <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteNovedadId(entry.entryId); }} title="Eliminar" style={{ padding: "1px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-high)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                              <X size={10} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", padding: "4px 0 8px", fontStyle: "italic" }}>Sin novedades registradas.</div>
            )}

            {/* Add form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <textarea
                value={novText}
                onChange={(e) => setNovText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && novText.trim()) { e.preventDefault(); onAddNovedad(novTime, novText.trim()).then(() => setNovText("")); } }}
                placeholder="Ecribir novedad o reporte..."
                rows={3}
                className="rr-editor-input"
                style={{ fontSize: "0.72rem", padding: "6px 9px", resize: "vertical", lineHeight: 1.4 }}
              />
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="time"
                  value={novTime}
                  onChange={(e) => setNovTime(e.target.value)}
                  className="rr-editor-input"
                  style={{ width: "95px", fontSize: "0.74rem", padding: "4px 8px" }}
                />
                <button
                  onClick={() => { if (novText.trim()) { onAddNovedad(novTime, novText.trim()).then(() => setNovText("")); } }}
                  disabled={!novText.trim()}
                  style={{ padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(34,197,94,0.3)", background: novText.trim() ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.02)", color: novText.trim() ? "var(--color-green)" : "var(--text-muted)", cursor: novText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", fontSize: "0.6rem", fontWeight: 700, flexShrink: 0 }}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Botón Guardar Estadísticas — puntos */}
      {canEdit && !isPolygon && onSaveStats && (
        <button type="button" onClick={onSaveStats} style={{ width: "100%", background: saveSuccess ? "rgba(34, 197, 94, 0.18)" : "rgba(56, 189, 248, 0.12)", border: `1px solid ${saveSuccess ? "rgba(34, 197, 94, 0.5)" : "rgba(56, 189, 248, 0.35)"}`, borderRadius: "7px", color: saveSuccess ? "#22c55e" : "#38bdf8", fontSize: "0.72rem", fontWeight: 700, padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s ease" }}>
          {saveSuccess ? <Check size={13} /> : <Save size={13} />}
          {saveSuccess ? "\u00a1Estad\u00edsticas Guardadas!" : "Guardar Estad\u00edsticas"}
        </button>
      )}

      {/* Boton Editar - solo administradores en puntos */}
      {isAdmin && !isPolygon && (
        <button type="button" onClick={onEdit} style={{ width: "100%", background: "var(--color-info)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s ease", boxShadow: "0 0 10px rgba(56, 189, 248, 0.2)", marginTop: "4px" }}>
          <Edit3 size={12} /> Editar Registro
        </button>
      )}

      {/* Confirm modal for novedad delete */}
      <ConfirmModal
        isOpen={confirmDeleteNovedadId !== null}
        title="Eliminar Novedad"
        message="¿Está seguro de que desea eliminar esta novedad?"
        onConfirm={() => { if (confirmDeleteNovedadId && onDeleteNovedad) { onDeleteNovedad(confirmDeleteNovedadId); setConfirmDeleteNovedadId(null); } }}
        onCancel={() => setConfirmDeleteNovedadId(null)}
      />
    </div>
  );
};
