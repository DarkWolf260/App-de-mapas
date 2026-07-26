import React, { useState, useMemo } from "react";
import { Copy, Check, Edit3, Users, Activity, AlertTriangle, Link2, Unlink, Save } from "lucide-react";
import type { DrawnFeature, DailyLog, GroupLogEntry } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { getNormalizedGroupList } from "../../utils/logUtils";
import { labelStyle, sectionBox, readRowStyle, readLabelStyle, readValueStyle } from "./popupStyles";
import { COMMISSION_INDEPENDENT, getGroupColor, formatCoordinates, getCoordLabel, METRIC_FIELDS, getMetricValue } from "./metricFields";
import { MetricInputs, MetricBadges, MetricDisplayGrid } from "./MetricGrid";
import { useGrouping } from "./useGrouping";
import { aggregatePolygonLog } from "./aggregatePolygonLog";

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
}) => {
  const showArrivalCheckbox = isAdmin || canToggleArrival;
  const [copied, setCopied] = useState(false);
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

  const polygonGroups = useMemo(() => {
    if (!isPolygon) return [];
    return getNormalizedGroupList(polygonOwnLog);
  }, [isPolygon, polygonOwnLog]);

  // --- Aggregated totals ---
  const aggregatedLog = useMemo(() => {
    if (!isPolygon) return dailyLog || {};
    return aggregatePolygonLog(polygonOwnLog, polygonGroups, containedWithLogs);
  }, [isPolygon, dailyLog, containedWithLogs, polygonOwnLog, polygonGroups]);

  const log = isPolygon ? aggregatedLog : (dailyLog || {});

  // --- Grouping logic ---
  const { groupingMode, setGroupingMode, selectedIndices, handleGroupSelected, handleUngroup, toggleSelect, exitGroupingMode } = useGrouping({
    polygonGroups,
    onGroupFieldChange: onGroupFieldChange as ((idx: number, field: string, value: string) => void) | undefined,
    onSaveStats,
  });

  const hasGeneralStats = !!METRIC_FIELDS.some((m) => {
    const v = getMetricValue(polygonOwnLog, m.field);
    return v && v !== "0" && v !== "";
  });

  const displayItems = useMemo(() => buildDisplayItems(polygonGroups), [polygonGroups]);

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

  // --- Points: check if any metric has data ---
  const pointHasMetrics = METRIC_FIELDS.some((m) => {
    const v = getMetricValue(log, m.field);
    return v && v !== "0";
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Badge de Edificio Colapsado */}
      {!isPolygon && activeFeat.isCollapsed && (
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
          <div style={{ ...sectionBox, background: "rgba(16, 185, 129, 0.04)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
            <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#10b981", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <Activity size={10} /> Estadisticas Generales del Poligono
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
                          {group.isVolunteer && (
                            <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.48rem", fontWeight: 800, textTransform: "uppercase" }}>VOL</span>
                          )}
                          <span style={{ marginLeft: "auto", fontSize: "0.55rem", color: "var(--text-muted)" }}>{group.officersCount ? `${group.officersCount} func.` : ""}</span>
                        </div>
                        {canEdit && onGroupFieldChange ? (
                          <MetricInputs group={group} groupIdx={groupIdx} onGroupFieldChange={onGroupFieldChange as (idx: number, field: string, value: string) => void} />
                        ) : (
                          <MetricBadges group={group} />
                        )}
                        {showArrivalCheckbox ? (
                          <label style={{ fontSize: "0.58rem", fontWeight: 700, color: group.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "5px", marginTop: "4px", cursor: "pointer" }}>
                            <input type="checkbox" checked={!!group.hasArrived} onChange={(e) => { console.log(`[InfoTab:arrival] checkbox fired groupIdx=${groupIdx} checked=${e.target.checked} group.hasArrived=${group.hasArrived}`); onToggleArrivalGroup?.((groupIdx + 1) as 1 | 2 | 3 | 4, e.target.checked); }} style={{ cursor: "pointer", width: "12px", height: "12px" }} />
                            <span>{group.hasArrived ? "Lleg\u00f3 del sitio" : "\u00bfYa lleg\u00f3 del sitio?"}</span>
                          </label>
                        ) : (
                          group.hasArrived && <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px", marginTop: "3px" }}><Check size={9} /> Lleg\u00f3 del sitio</span>
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
                      {canEdit && onGroupFieldChange ? (
                        <MetricInputs group={primaryGroup} groupIdx={primaryIdx} onGroupFieldChange={onGroupFieldChange as (idx: number, field: string, value: string) => void} />
                      ) : (
                        <MetricBadges group={primaryGroup} />
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
              <Activity size={10} /> Total Zona (General + Grupos + Puntos)
            </div>
            <MetricDisplayGrid source={aggregatedLog} />
            {aggregatedLog.observations && (
              <div style={{ marginTop: "4px" }}>
                <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}><AlertTriangle size={9} /> Observaciones</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-main)", lineHeight: 1.3, whiteSpace: "pre-line" }}>{aggregatedLog.observations}</span>
              </div>
            )}
          </div>

          {/* Boton Guardar Estadisticas */}
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

      {/* Punto: sin datos */}
      {!isPolygon && !(log.groupName || log.unitOut || log.managerName || log.officersCount) && !pointHasMetrics && !log.observations && (
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center", padding: "8px 0", fontStyle: "italic" }}>
          Sin datos registrados para hoy
        </div>
      )}

      {/* Grupos en disposicion vertical - solo puntos */}
      {!isPolygon && getNormalizedGroupList(log).length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {getNormalizedGroupList(log).map((gItem, gIdx) => (
            <div key={gItem.id || gIdx} style={sectionBox}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: getGroupColor(gIdx), borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Users size={10} /> {gItem.groupName || `Grupo ${gIdx + 1}`}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {gItem.isVolunteer && (
                    <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.52rem", fontWeight: 800, textTransform: "uppercase" }}>
                      VOLUNTARIO
                    </span>
                  )}
                  {gItem.commissionId && gItem.commissionId !== COMMISSION_INDEPENDENT && (
                    <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "4px", padding: "1px 4px", fontSize: "0.52rem", fontWeight: 700 }}>
                      Comision Conjunta
                    </span>
                  )}
                </div>
              </div>
              <ReadRow label="Unidad" value={gItem.unitOut} />
              <ReadRow label="Encargado" value={gItem.managerName} />
              <ReadRow label="Funcionarios" value={gItem.officersCount} />
              <ReadRow label="Telefono" value={gItem.managerPhone} />
              <MetricBadges group={gItem} />
              {showArrivalCheckbox ? (
                <label style={{ fontSize: "0.65rem", fontWeight: 700, color: gItem.hasArrived ? "var(--color-green)" : "#f97316", display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", cursor: "pointer", background: gItem.hasArrived ? "rgba(34, 197, 94, 0.1)" : "rgba(249, 115, 22, 0.1)", padding: "3px 6px", borderRadius: "4px", border: `1px solid ${gItem.hasArrived ? "rgba(34, 197, 94, 0.3)" : "rgba(249, 115, 22, 0.3)"}` }}>
                  <input type="checkbox" checked={!!gItem.hasArrived} onChange={(e) => { console.log(`[InfoTab:arrival:point] checkbox fired gIdx=${gIdx} checked=${e.target.checked} gItem.hasArrived=${gItem.hasArrived}`); onToggleArrivalGroup?.((gIdx + 1) as 1 | 2 | 3 | 4, e.target.checked); }} style={{ cursor: "pointer", width: "13px", height: "13px" }} />
                  <span>{gItem.hasArrived ? "Lleg\u00f3 del sitio" : "\u00bfYa lleg\u00f3 del sitio?"}</span>
                </label>
              ) : (
                gItem.hasArrived && (
                  <span style={{ fontSize: "0.58rem", color: "var(--color-green)", fontWeight: 600, display: "flex", alignItems: "center", gap: "2px" }}><Check size={10} /> Lleg\u00f3 del sitio</span>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reportes de Hoy - solo para puntos con datos */}
      {!isPolygon && pointHasMetrics && (
        <div style={sectionBox}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Activity size={10} /> Reportes de Hoy
          </div>
          <MetricDisplayGrid source={log} />
          {log.observations && (
            <div style={{ marginTop: "4px" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}><AlertTriangle size={9} /> Observacion</span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-main)", lineHeight: 1.3, whiteSpace: "pre-line" }}>{log.observations}</span>
            </div>
          )}
        </div>
      )}

      {/* Boton Editar - solo administradores en puntos */}
      {isAdmin && !isPolygon && (
        <button type="button" onClick={onEdit} style={{ width: "100%", background: "var(--color-info)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "all 0.2s ease", boxShadow: "0 0 10px rgba(56, 189, 248, 0.2)", marginTop: "4px" }}>
          <Edit3 size={12} /> Editar Registro
        </button>
      )}
    </div>
  );
};
