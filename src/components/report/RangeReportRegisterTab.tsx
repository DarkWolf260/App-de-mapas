import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Search,
  X,
  Users,
  ShieldAlert,
  Layers,
  MapPin,
} from "lucide-react";
import type { DrawnFeature, DailyLog, DepartmentView } from "../../types";
import { BitacoraCalendar } from "../BitacoraCalendar";
import { GroupDisplay } from "../GroupDisplay";
import { InlineRowEditor } from "../InlineRowEditor";
import { DateRow } from "../DateRow";
import {
  formatDateFriendly,
  isSectorFeature,
  getGroupData,
  getNormalizedGroupList,
  logHasAnyData,
} from "../../utils/logUtils";

interface DayStats {
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  totalPets: number;
  activePoints: number;
}

interface RangeReportRegisterTabProps {
  isAllMode: boolean;
  activeDateIndex: number;
  dates: string[];
  activeDate: string;
  handlePrevDay: () => void;
  handleNextDay: () => void;
  showCalendarPopover: boolean;
  setShowCalendarPopover: React.Dispatch<React.SetStateAction<boolean>>;
  syncDateChange: (newIndex: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  arrivalFilter: "all" | "arrived" | "not_arrived";
  setArrivalFilter: (filter: "all" | "arrived" | "not_arrived") => void;
  dayStats: DayStats | null;
  activePoints: DrawnFeature[];
  inactivePoints: DrawnFeature[];
  filteredDates: string[];
  feat: DrawnFeature | "all";
  allFeatures: DrawnFeature[];
  parentsMap: Record<number | string, number | string>;
  activeEditFeatureId: number | null;
  setActiveEditFeatureId: (id: number | null) => void;
  activeDepartment: DepartmentView;
  canEdit: boolean;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  handleToggleArrivalQuick: (pt: DrawnFeature, groupIndex: 1 | 2 | 3 | 4, newArrived: boolean) => Promise<void>;
}

export const RangeReportRegisterTab: React.FC<RangeReportRegisterTabProps> = ({
  isAllMode,
  activeDateIndex,
  dates,
  activeDate,
  handlePrevDay,
  handleNextDay,
  showCalendarPopover,
  setShowCalendarPopover,
  syncDateChange,
  searchQuery,
  setSearchQuery,
  arrivalFilter,
  setArrivalFilter,
  dayStats,
  activePoints,
  inactivePoints,
  filteredDates,
  feat,
  allFeatures,
  parentsMap,
  activeEditFeatureId,
  setActiveEditFeatureId,
  activeDepartment,
  canEdit,
  onSaveDailyLog,
  handleToggleArrivalQuick,
}) => {
  return (
    <>
      {/* Integrated Sober Toolbar */}
      <div className="rr-toolbar">
        {isAllMode && (
          <div className="rr-toolbar-date">
            <button
              onClick={handlePrevDay}
              disabled={activeDateIndex === dates.length - 1}
              className="rr-icon-btn"
              title="Día anterior"
            >
              <ChevronLeft size={14} />
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="rr-date-trigger-btn"
                onClick={() => setShowCalendarPopover((v) => !v)}
                title="Abrir calendario para seleccionar fecha"
              >
                <Calendar size={13} style={{ color: "var(--color-info)" }} />
                <span>{formatDateFriendly(activeDate)}</span>
                <ChevronDown
                  size={12}
                  style={{
                    color: "var(--text-muted)",
                    transition: "transform 0.2s ease",
                    transform: showCalendarPopover ? "rotate(180deg)" : "none",
                  }}
                />
              </button>

              {showCalendarPopover && (
                <div className="rr-calendar-popover" onClick={(e) => e.stopPropagation()}>
                  <BitacoraCalendar
                    selectedDate={activeDate}
                    onSelectDate={(dStr) => {
                      const idx = dates.indexOf(dStr);
                      if (idx !== -1) {
                        syncDateChange(idx);
                      }
                      setShowCalendarPopover(false);
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleNextDay}
              disabled={activeDateIndex === 0}
              className="rr-icon-btn"
              title="Día siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {isAllMode && (
          <div className="rr-toolbar-search">
            <Search size={13} className="rr-search-icon" />
            <input
              type="text"
              className="rr-search-input"
              placeholder="Buscar por nombre, grupo, encargado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="rr-search-clear" onClick={() => setSearchQuery("")} title="Limpiar">
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <div className="rr-toolbar-filter">
          {(["all", "arrived", "not_arrived"] as const).map((key) => (
            <button
              key={key}
              className={`rr-filter-btn ${arrivalFilter === key ? "active" : ""}`}
              onClick={() => setArrivalFilter(key)}
            >
              {key === "all" ? "Todos" : key === "arrived" ? "Llegaron" : "Pendientes"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Bar */}
      {isAllMode && dayStats && dayStats.activePoints > 0 && (
        <div className="rr-stats-summary">
          <div className="rr-stat-item">
            <Users size={12} style={{ color: "var(--color-info)" }} />
            <span>Personal: <strong>{dayStats.totalPersonnel}</strong></span>
          </div>
          <span className="rr-stat-divider">•</span>
          <div className="rr-stat-item">
            <span>Rescatados: <strong style={{ color: "var(--color-green)" }}>{dayStats.totalRescued}</strong></span>
          </div>
          <span className="rr-stat-divider">•</span>
          <div className="rr-stat-item">
            <span>Recuperados: <strong style={{ color: "#ef4444" }}>{dayStats.totalRecovered}</strong></span>
          </div>
          {dayStats.totalPrehospitalCare > 0 && (
            <>
              <span className="rr-stat-divider">•</span>
              <div className="rr-stat-item">
                <span>Atenciones: <strong style={{ color: "#38bdf8" }}>{dayStats.totalPrehospitalCare}</strong></span>
              </div>
            </>
          )}
          {dayStats.totalTransfers > 0 && (
            <>
              <span className="rr-stat-divider">•</span>
              <div className="rr-stat-item">
                <span>Traslados: <strong style={{ color: "var(--color-purple)" }}>{dayStats.totalTransfers}</strong></span>
              </div>
            </>
          )}
          {dayStats.totalPets > 0 && (
            <>
              <span className="rr-stat-divider">•</span>
              <div className="rr-stat-item">
                <span>Mascotas: <strong>{dayStats.totalPets}</strong></span>
              </div>
            </>
          )}
          <span className="rr-stat-divider">•</span>
          <div className="rr-stat-item">
            <span>Sitios Activos: <strong>{dayStats.activePoints}</strong></span>
          </div>
        </div>
      )}

      {/* Scrollable list */}
      <div className="rr-list">
        {feat === "all" ? (
          <>
            {activePoints.length === 0 ? (
              <div className="rr-empty-state">
                <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                <div>
                  {searchQuery
                    ? `No se encontraron resultados para "${searchQuery}"`
                    : arrivalFilter === "all"
                    ? "No hay personal reportado en ningún Sitio de Trabajo para este día."
                    : arrivalFilter === "arrived"
                    ? "No hay grupos que hayan llegado para este día."
                    : "Todos los grupos de este día ya han llegado o no hay personal reportado."}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {activePoints.some((pt) => isSectorFeature(pt)) && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 800, color: "var(--color-info)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                      <Layers size={12} /> Sectores ({activePoints.filter((pt) => isSectorFeature(pt)).length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {activePoints.filter((pt) => isSectorFeature(pt)).map((pt) => {
                        const logs = pt.dailyLogs?.filter((l) =>
                          l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                        ) || [];
                        const log = logs[0];
                        const isEditingThis = activeEditFeatureId === pt.id;
                        const groupsForCheck = getNormalizedGroupList(log);
                        const hasG2 = groupsForCheck.length > 1;
                        const containedPoints = (allFeatures || []).filter((c) => String(parentsMap[c.id]) === String(pt.id));

                        return (
                          <div key={pt.id} className="rr-point-card" style={{ borderColor: "rgba(56, 189, 248, 0.25)" }}>
                            <div className="rr-card-header">
                              <div className="rr-card-title-group">
                                <span className="rr-card-dot" style={{ backgroundColor: pt.color || "var(--color-info)", color: pt.color || "var(--color-info)" }} />
                                <Layers size={12} style={{ color: "var(--color-info)" }} />
                                <span className="rr-card-title">{pt.title}</span>
                                <span className="rr-meta-chip" style={{ background: "rgba(56, 189, 248, 0.12)", color: "var(--color-info)", fontSize: "0.58rem" }}>
                                  SECTOR
                                </span>
                              </div>
                              {canEdit && (
                                <button onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)} className="rr-edit-btn">
                                  {isEditingThis ? "Cerrar Editor" : "Editar Sitio"}
                                </button>
                              )}
                            </div>

                            {!isEditingThis && log && (
                              <div className="rr-card-body">
                                <GroupDisplay group={getGroupData(log, 1)} label="G1" accentColor="#38bdf8" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 1, newArrived)} />
                                {hasG2 && <GroupDisplay group={getGroupData(log, 2)} label="G2" accentColor="#a855f7" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 2, newArrived)} />}
                              </div>
                            )}

                            {containedPoints.some((cp) => cp.dailyLogs?.some((l) => l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasAnyData(l))) && (
                              <div style={{ marginTop: "6px", padding: "6px 10px", background: "rgba(56, 189, 248, 0.05)", borderRadius: "8px", border: "1px dashed rgba(56, 189, 248, 0.25)", display: "flex", flexDirection: "column", gap: "4px" }}>
                                <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  <MapPin size={10} /> PUNTOS CONTENIDOS EN ESTE SECTOR ({activeDate}):
                                </div>
                                {containedPoints.map((cp) => {
                                  const cpLog = cp.dailyLogs?.find((l) => l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasAnyData(l));
                                  if (!cpLog) return null;
                                  const cpGroups = getNormalizedGroupList(cpLog);
                                  let r = 0, rc = 0, ph = 0, tr = 0, off = 0;
                                  for (const g of cpGroups) {
                                    r += parseInt(g.rescuedCount || "0", 10) || 0;
                                    rc += parseInt(g.recoveredCount || "0", 10) || 0;
                                    ph += parseInt(g.prehospitalCareCount || "0", 10) || 0;
                                    tr += parseInt(g.transfersCount || "0", 10) || 0;
                                    off += parseInt(g.officersCount || "0", 10) || 0;
                                  }
                                  if (cpGroups.length === 0) {
                                    r = parseInt(cpLog.rescuedCount || "0", 10) || 0;
                                    rc = parseInt(cpLog.recoveredCount || "0", 10) || 0;
                                    ph = parseInt(cpLog.prehospitalCareCount || "0", 10) || 0;
                                    tr = parseInt(cpLog.transfersCount || "0", 10) || 0;
                                  }
                                  const firstGroupName = cpGroups[0]?.groupName;
                                  return (
                                    <div key={cp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.63rem", color: "var(--text-main)", padding: "2px 4px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px" }}>
                                      <span style={{ fontWeight: 600 }}>📍 {cp.title} {firstGroupName ? `(${firstGroupName})` : ""}</span>
                                      <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem" }}>
                                        {off > 0 && <span style={{ color: "#94a3b8" }}>👥 {off}</span>}
                                        {r > 0 && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>↑{r}</span>}
                                        {rc > 0 && <span style={{ color: "var(--color-high)", fontWeight: 700 }}>✝{rc}</span>}
                                        {ph > 0 && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>⚕{ph}</span>}
                                        {tr > 0 && <span style={{ color: "var(--color-purple)", fontWeight: 700 }}>⇒{tr}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {log?.observations && !isEditingThis && (
                              <div className="rr-card-obs"><span className="rr-obs-label">Nota:</span> {log.observations}</div>
                            )}

                            {isEditingThis && (
                              <div className="rr-point-edit-zone">
                                <InlineRowEditor dateStr={activeDate} log={log} feat={pt} onSaveDailyLog={onSaveDailyLog} onCloseEditor={() => setActiveEditFeatureId(null)} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activePoints.some((pt) => !isSectorFeature(pt)) && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.68rem", fontWeight: 800, color: "var(--accent-orange)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
                      <MapPin size={12} /> Sitios de Trabajo ({activePoints.filter((pt) => !isSectorFeature(pt)).length})
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {activePoints.filter((pt) => !isSectorFeature(pt)).map((pt) => {
                        const logs = pt.dailyLogs?.filter((l) =>
                          l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                        ) || [];
                        const log = logs[0];
                        const isEditingThis = activeEditFeatureId === pt.id;

                        return (
                          <div key={pt.id} className="rr-point-card">
                            <div className="rr-card-header">
                              <div className="rr-card-title-group">
                                <span className="rr-card-dot" style={{ backgroundColor: pt.color || "var(--color-green)", color: pt.color || "var(--color-green)" }} />
                                <MapPin size={12} style={{ color: "var(--accent-orange)" }} />
                                <span className="rr-card-title">{pt.title}</span>
                                <span className="rr-meta-chip" style={{ background: "rgba(249, 115, 22, 0.12)", color: "#fb923c", fontSize: "0.58rem" }}>SITIO</span>
                              </div>
                              {canEdit && (
                                <button onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)} className="rr-edit-btn">
                                  {isEditingThis ? "Cerrar Editor" : "Editar Sitio"}
                                </button>
                              )}
                            </div>

                            {!isEditingThis && log && (
                              <div className="rr-card-body">
                                <GroupDisplay group={getGroupData(log, 1)} label="G1" accentColor="#38bdf8" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 1, newArrived)} />
                                {getNormalizedGroupList(log).length > 1 && <GroupDisplay group={getGroupData(log, 2)} label="G2" accentColor="#a855f7" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 2, newArrived)} />}
                                {getNormalizedGroupList(log).length > 2 && <GroupDisplay group={getGroupData(log, 3)} label="G3" accentColor="#c084fc" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 3, newArrived)} />}
                                {getNormalizedGroupList(log).length > 3 && <GroupDisplay group={getGroupData(log, 4)} label="G4" accentColor="#fb923c" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 4, newArrived)} />}
                              </div>
                            )}

                            {log?.observations && !isEditingThis && (
                              <div className="rr-card-obs"><span className="rr-obs-label">Nota:</span> {log.observations}</div>
                            )}

                            {isEditingThis && (
                              <div className="rr-point-edit-zone">
                                <InlineRowEditor dateStr={activeDate} log={log} feat={pt} onSaveDailyLog={onSaveDailyLog} onCloseEditor={() => setActiveEditFeatureId(null)} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {inactivePoints.length > 0 && (
              <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(255, 255, 255, 0.01)", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                  + REGISTRAR EN OTRO SITIO O SECTOR
                </div>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) {
                      setActiveEditFeatureId(parseInt(val, 10));
                      e.target.value = "";
                    }
                  }}
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "5px",
                    color: "var(--text-main)",
                    fontSize: "0.68rem",
                    padding: "4px 8px",
                    outline: "none",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled style={{ background: "#1e293b" }}>-- Seleccionar Sitio o Sector --</option>
                  {inactivePoints.some((pt) => isSectorFeature(pt)) && (
                    <optgroup label="🗺️ Sectores" style={{ background: "#1e293b", color: "#38bdf8" }}>
                      {inactivePoints.filter((pt) => isSectorFeature(pt)).map((pt) => (
                        <option key={pt.id} value={pt.id} style={{ background: "#1e293b", color: "#e2e8f0" }}>{pt.title}</option>
                      ))}
                    </optgroup>
                  )}
                  {inactivePoints.some((pt) => !isSectorFeature(pt)) && (
                    <optgroup label="📍 Sitios de Trabajo" style={{ background: "#1e293b", color: "#fb923c" }}>
                      {inactivePoints.filter((pt) => !isSectorFeature(pt)).map((pt) => (
                        <option key={pt.id} value={pt.id} style={{ background: "#1e293b", color: "#e2e8f0" }}>{pt.title}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredDates.length === 0 && !isSectorFeature(feat) ? (
              <div className="rr-empty-state">
                <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                <div>No hay registros que coincidan con el filtro en este rango de fechas.</div>
              </div>
            ) : (
              filteredDates.map((dateStr) => {
                const logs = feat.dailyLogs?.filter((l) =>
                  l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                ) || [];
                const log = logs[0];
                return (
                  <DateRow
                    key={dateStr}
                    dateStr={dateStr}
                    log={log}
                    feat={feat}
                    onSaveDailyLog={onSaveDailyLog}
                    activeDepartment={activeDepartment}
                    canEdit={canEdit}
                  />
                );
              })
            )}

            {(() => {
              const singleFeatContainedPts = !isSectorFeature(feat)
                ? []
                : allFeatures.filter((c) => String(parentsMap[c.id]) === String(feat.id));

              if (singleFeatContainedPts.length === 0) return null;

              return (
                <div style={{ marginTop: "8px", padding: "8px 10px", background: "rgba(56, 189, 248, 0.04)", borderRadius: "8px", border: "1px dashed rgba(56, 189, 248, 0.2)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <MapPin size={10} /> PUNTOS CONTENIDOS ({singleFeatContainedPts.length})
                  </div>
                  {singleFeatContainedPts.map((cp) => {
                    const cpLogs = cp.dailyLogs?.filter((l) =>
                      l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                    ) || [];
                    const cpLog = cpLogs[0];
                    if (!cpLog) return null;
                    const hasData = logHasAnyData(cpLog);
                    const cpGroups = getNormalizedGroupList(cpLog);
                    const firstCpName = cpGroups[0]?.groupName;
                    let rescuedSum = 0, recoveredSum = 0, prehospitalSum = 0;
                    for (const g of cpGroups) {
                      rescuedSum += parseInt(g.rescuedCount || "0", 10) || 0;
                      recoveredSum += parseInt(g.recoveredCount || "0", 10) || 0;
                      prehospitalSum += parseInt(g.prehospitalCareCount || "0", 10) || 0;
                    }
                    if (cpGroups.length === 0) {
                      rescuedSum = parseInt(cpLog.rescuedCount || "0", 10) || 0;
                      recoveredSum = parseInt(cpLog.recoveredCount || "0", 10) || 0;
                      prehospitalSum = parseInt(cpLog.prehospitalCareCount || "0", 10) || 0;
                    }
                    return (
                      <div key={cp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.63rem", color: "var(--text-main)", padding: "3px 6px", background: hasData ? "rgba(167, 139, 250, 0.06)" : "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${hasData ? "#a78bfa" : "transparent"}` }}>
                        <span style={{ fontWeight: 600 }}>{cp.title} {firstCpName ? `(${firstCpName})` : ""}</span>
                        <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem" }}>
                          {hasData ? (
                            <>
                              {rescuedSum > 0 && <span style={{ color: "var(--color-green)", fontWeight: 700 }}>{rescuedSum}</span>}
                              {recoveredSum > 0 && <span style={{ color: "var(--color-high)", fontWeight: 700 }}>{recoveredSum}</span>}
                              {prehospitalSum > 0 && <span style={{ color: "var(--color-info)", fontWeight: 700 }}>{prehospitalSum}</span>}
                            </>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "0.58rem" }}>Sin datos</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </>
  );
};
