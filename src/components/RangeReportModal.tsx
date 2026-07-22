import React, { useState, useMemo } from "react";
import type { DrawnFeature, DailyLog, DepartmentView } from "../types";
import { X, Calendar, ShieldAlert, Users, Search, Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { DateRow } from "./DateRow";
import { InlineRowEditor } from "./InlineRowEditor";
import { GroupDisplay } from "./GroupDisplay";
import {
  formatDateFriendly,
  getDatesRange,
  getGroupData,
  logMatchesArrivalFilter,
  logHasPersonnel,
  getDayStats,
  featureMatchesSearch,
  REPORT_START_DATE,
} from "../utils/logUtils";

interface RangeReportModalProps {
  feat: DrawnFeature | "all" | null;
  allFeatures?: DrawnFeature[];
  onClose: () => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  activeDepartment?: DepartmentView;
}

const RangeReportModal: React.FC<RangeReportModalProps> = ({
  feat,
  allFeatures = [],
  onClose,
  onSaveDailyLog,
  activeDepartment = "pc",
}) => {
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [activeEditFeatureId, setActiveEditFeatureId] = useState<number | null>(null);
  const [arrivalFilter, setArrivalFilter] = useState<"all" | "arrived" | "not_arrived">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dates = getDatesRange(REPORT_START_DATE);
  const isAllMode = feat === "all";
  const activeDate = dates[activeDateIndex];

  const dayStats = useMemo(
    () => (feat ? (isAllMode ? getDayStats(allFeatures, activeDate, activeDepartment) : getDayStats([feat], activeDate, activeDepartment)) : null),
    [isAllMode, allFeatures, feat, activeDate, activeDepartment],
  );

  const activePoints = useMemo(() => {
    if (!feat) return [];
    const pts = isAllMode ? allFeatures : [feat];
    return pts.filter((pt) => {
      if (activeEditFeatureId === pt.id) return true;
      if (!featureMatchesSearch(pt, searchQuery, activeDate)) return false;
      const logs = pt.dailyLogs?.filter((l) =>
        l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      if (!log || !logHasPersonnel(log)) return false;
      return logMatchesArrivalFilter(log, arrivalFilter);
    });
  }, [isAllMode, allFeatures, feat, activeEditFeatureId, searchQuery, activeDate, arrivalFilter, activeDepartment]);

  const inactivePoints = useMemo(() => {
    if (!feat) return [];
    const pts = isAllMode ? allFeatures : [feat];
    return pts.filter((pt) => {
      if (!featureMatchesSearch(pt, searchQuery, activeDate)) return false;
      const logs = pt.dailyLogs?.filter((l) =>
        l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      return !log || !logHasPersonnel(log);
    });
  }, [isAllMode, allFeatures, feat, searchQuery, activeDate, activeDepartment]);

  const filteredDates = useMemo(() => {
    if (!feat) return [];
    return dates.filter((dateStr) => {
      if (isAllMode) return true;
      const logs = feat.dailyLogs?.filter((l) =>
        l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      const log = logs[0];
      return logMatchesArrivalFilter(log, arrivalFilter);
    });
  }, [dates, isAllMode, feat, arrivalFilter, activeDepartment]);

  const daysWithData = useMemo(() => {
    if (!feat) return 0;
    return dates.reduce((acc, dateStr) => {
      if (isAllMode) {
        return acc + (allFeatures.some((f) => f.dailyLogs?.some((l) =>
          l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasPersonnel(l)
        )) ? 1 : 0);
      }
      const logs = feat.dailyLogs?.filter((l) =>
        l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      return acc + (logs.some((l) => logHasPersonnel(l)) ? 1 : 0);
    }, 0);
  }, [dates, isAllMode, allFeatures, feat, activeDepartment]);

  if (!feat) return null;

  const handlePrevDay = () => {
    if (activeDateIndex < dates.length - 1) {
      setActiveDateIndex(activeDateIndex + 1);
      setActiveEditFeatureId(null);
    }
  };

  const handleNextDay = () => {
    if (activeDateIndex > 0) {
      setActiveDateIndex(activeDateIndex - 1);
      setActiveEditFeatureId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rr-modal">
        {/* Header */}
        <div className="rr-header" style={isAllMode ? { background: "linear-gradient(to right, rgba(56, 189, 248, 0.07), transparent)" } : undefined}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar style={{ color: isAllMode ? "var(--color-info)" : "var(--color-green)", flexShrink: 0 }} size={20} />
            <div>
              <h3 className="rr-title">
                {isAllMode ? "Bitácora General" : "Bitácora de Rango"}
              </h3>
              <p className="rr-subtitle">
                {isAllMode ? (
                  <span>
                    <strong style={{ color: "var(--text-main)" }}>Todos los sitios</strong> · {daysWithData} días con operaciones
                  </span>
                ) : (
                  <span>
                    <strong style={{ color: "var(--text-main)" }}>{feat.title}</strong> · 24 Jun a Hoy
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="rr-close-btn" onClick={onClose} title="Cerrar">
            <X size={15} />
          </button>
        </div>

        {/* Legend */}
        <div className="rr-legend">
          <div className="rr-legend-item">
            <div className="rr-legend-dot rr-legend-dot--data" />
            Con datos
          </div>
          <div className="rr-legend-item">
            <div className="rr-legend-dot" />
            Sin registros
          </div>
          <div className="rr-legend-stat">
            <Users size={11} />
            {daysWithData} / {dates.length} días
          </div>
        </div>

        {/* Filter bar */}
        <div className="rr-filter-bar">
          <span className="rr-filter-label">Grupos:</span>
          <div className="rr-filter-buttons">
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

        {/* Search bar (all-mode only) */}
        {isAllMode && (
          <div className="rr-search-bar">
            <div className="rr-search-wrapper">
              <Search size={13} className="rr-search-icon" />
              <input
                type="text"
                className="rr-search-input"
                placeholder="Buscar por nombre, grupo, encargado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "28px" }}
              />
              {searchQuery && (
                <button className="rr-search-clear" onClick={() => setSearchQuery("")} title="Limpiar">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pagination (all-mode) */}
        {isAllMode && (
          <div className="rr-pagination">
            <button onClick={handlePrevDay} disabled={activeDateIndex === dates.length - 1} className="sim-btn rr-nav-btn" style={{ opacity: activeDateIndex === dates.length - 1 ? 0.4 : 1, cursor: activeDateIndex === dates.length - 1 ? "not-allowed" : "pointer" }}>
              <ChevronLeft size={12} /> Anterior
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="rr-day-label">Día:</span>
              <select
                value={activeDateIndex}
                onChange={(e) => { setActiveDateIndex(parseInt(e.target.value, 10)); setActiveEditFeatureId(null); }}
              >
                {dates.map((dateStr, idx) => {
                  const dayHasData = allFeatures.some((f) => f.dailyLogs?.some((l) => l.date === dateStr && logHasPersonnel(l)));
                  return (
                    <option key={dateStr} value={idx} style={{ background: "#0f172a", color: "#f8fafc" }}>
                      {formatDateFriendly(dateStr)} {dayHasData ? "•" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <button onClick={handleNextDay} disabled={activeDateIndex === 0} className="sim-btn rr-nav-btn" style={{ opacity: activeDateIndex === 0 ? 0.4 : 1, cursor: activeDateIndex === 0 ? "not-allowed" : "pointer" }}>
              Siguiente <ChevronRight size={12} />
            </button>
          </div>
        )}

        {/* Day stats bar (all-mode) */}
        {isAllMode && dayStats && dayStats.activePoints > 0 && (
          <div className="rr-stats-bar">
            <div className="rr-stat-chip rr-stat-chip--personnel">
              <Users size={11} />
              <span className="stat-val">{dayStats.totalPersonnel}</span>
              Personal
            </div>
            <div className="rr-stats-sep" />
            <div className="rr-stat-chip rr-stat-chip--rescued">
              <span className="stat-val">{dayStats.totalRescued}</span>
              Resc.
            </div>
            <div className="rr-stats-sep" />
            <div className="rr-stat-chip rr-stat-chip--recovered">
              <span className="stat-val">{dayStats.totalRecovered}</span>
              Recup.
            </div>
            {dayStats.totalPets > 0 && (
              <>
                <div className="rr-stats-sep" />
                <div className="rr-stat-chip rr-stat-chip--pets">
                  <span className="stat-val">{dayStats.totalPets}</span>
                  Masc.
                </div>
              </>
            )}
            <div className="rr-stats-sep" />
            <div className="rr-stat-chip rr-stat-chip--points">
              <span className="stat-val">{dayStats.activePoints}</span>
              Sitios
            </div>
          </div>
        )}

        {/* Scrollable list */}
        <div className="rr-list">
          {isAllMode ? (
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
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {activePoints.map((pt) => {
                    const logs = pt.dailyLogs?.filter((l) =>
                      l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
                    ) || [];
                    const log = logs[0];
                    const isEditingThis = activeEditFeatureId === pt.id;
                    const hasG2 = !!(log?.groupName2 || log?.unitOut2);

                    return (
                      <div
                        key={pt.id}
                        className={`rr-point-card ${isEditingThis ? "rr-point-card--editing" : "rr-point-card--data"}`}
                      >
                        <div className="rr-point-header">
                          <div className="rr-point-name">
                            <span
                              className="rr-point-dot"
                              style={{
                                backgroundColor: pt.color || "var(--color-green)",
                                boxShadow: `0 0 6px ${pt.color || "var(--color-green)"}80`,
                              }}
                            />
                            <span className="rr-point-title">{pt.title}</span>
                          </div>
                          <button
                            onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)}
                            className="sim-btn"
                            style={{
                              fontSize: "0.62rem",
                              padding: "2px 7px",
                              background: isEditingThis ? "rgba(255, 255, 255, 0.06)" : "rgba(56, 189, 248, 0.06)",
                              border: isEditingThis ? "1px solid var(--border-subtle)" : "1px solid rgba(56, 189, 248, 0.18)",
                              color: isEditingThis ? "var(--text-main)" : "var(--color-info)",
                            }}
                          >
                            {isEditingThis ? "Cerrar" : "Editar"}
                          </button>
                        </div>

                        {!isEditingThis && log && (
                          <div className="rr-point-groups">
                            <GroupDisplay group={getGroupData(log, 1)} label="G1" accentColor="var(--color-green)" showBorder={!!hasG2} />
                            {hasG2 && <GroupDisplay group={getGroupData(log, 2)} label="G2" accentColor="var(--color-info)" showBorder={false} />}
                          </div>
                        )}

                        {log?.observations && !isEditingThis && (
                          <div className="rr-point-obs">
                            <strong style={{ color: "var(--color-info)" }}>Nota:</strong> {log.observations}
                          </div>
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
              )}

              {inactivePoints.length > 0 && (
                <div style={{ marginTop: "10px", padding: "8px 10px", background: "rgba(255, 255, 255, 0.01)", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    + REGISTRAR EN OTRO SITIO
                  </div>
                  <select
                    defaultValue=""
                    onChange={(e) => { const val = e.target.value; if (val) { setActiveEditFeatureId(parseInt(val, 10)); e.target.value = ""; } }}
                    style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "5px", color: "var(--text-main)", fontSize: "0.68rem", padding: "4px 8px", outline: "none", width: "100%", cursor: "pointer" }}
                  >
                    <option value="" disabled style={{ background: "#1e293b" }}>-- Seleccionar Sitio --</option>
                    {inactivePoints.map((pt) => (
                      <option key={pt.id} value={pt.id} style={{ background: "#1e293b" }}>{pt.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            filteredDates.length === 0 ? (
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
                return <DateRow key={dateStr} dateStr={dateStr} log={log} feat={feat} onSaveDailyLog={onSaveDailyLog} />;
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="rr-footer">
          <div className="rr-footer-left">
            <button onClick={handlePrint} className="rr-print-btn">
              <Printer size={12} />
              Imprimir
            </button>
          </div>
          <button onClick={onClose} className="sim-btn" style={{ padding: "5px 18px", fontSize: "0.72rem" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export { RangeReportModal };
