import React, { useState, useMemo } from "react";
import type { DrawnFeature, DailyLog, DepartmentView } from "../types";
import { X, Calendar, ShieldAlert, Users, Search, Printer, ChevronLeft, ChevronRight, ChevronDown, BarChart2, HeartHandshake, HeartPulse, Ambulance, TrendingUp, MapPin, List, Layers } from "lucide-react";
import { DateRow } from "./DateRow";
import { InlineRowEditor } from "./InlineRowEditor";
import { GroupDisplay } from "./GroupDisplay";
import { BitacoraCalendar } from "./BitacoraCalendar";
import { buildParentsMap } from "../utils/spatialUtils";
import {
  formatDateFriendly,
  getDatesRange,
  getGroupData,
  logMatchesArrivalFilter,
  logHasPersonnel,
  logHasAnyData,
  isSectorFeature,
  getDayStats,
  featureMatchesSearch,
  REPORT_START_DATE,
  emptyLog,
  getPeriodStats,
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
  const [activeTab, setActiveTab] = useState<"registro" | "estadisticas">("registro");
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [activeEditFeatureId, setActiveEditFeatureId] = useState<number | null>(null);
  const [arrivalFilter, setArrivalFilter] = useState<"all" | "arrived" | "not_arrived">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statsSortKey, setStatsSortKey] = useState<"nombre" | "daysActive" | "totalRescued" | "totalRecovered" | "totalPrehospitalCare" | "totalTransfers" | "totalPets">("daysActive");
  const [statsSortDir, setStatsSortDir] = useState<"desc" | "asc">("asc");
  const [showCalendarPopover, setShowCalendarPopover] = useState(false);

  const dates = getDatesRange(REPORT_START_DATE);
  const isAllMode = feat === "all";
  const activeDate = dates[activeDateIndex];
  const { parentsMap } = useMemo(() => buildParentsMap(allFeatures || []), [allFeatures]);

  const dayStats = useMemo(
    () => (feat ? (isAllMode ? getDayStats(allFeatures, activeDate, activeDepartment) : getDayStats([feat], activeDate, activeDepartment)) : null),
    [isAllMode, allFeatures, feat, activeDate, activeDepartment],
  );

  const periodStats = useMemo(
    () => (feat ? getPeriodStats(isAllMode ? allFeatures : [feat as DrawnFeature], activeDepartment) : null),
    [feat, isAllMode, allFeatures, activeDepartment],
  );

  const sortedGroupStats = useMemo(() => {
    if (!periodStats) return [];
    return [...periodStats.groupStats].sort((a, b) => {
      if (statsSortKey === "nombre") {
        const diff = a.groupName.localeCompare(b.groupName, "es", { sensitivity: "base" });
        return statsSortDir === "asc" ? diff : -diff;
      }
      const diff = (b[statsSortKey] as number) - (a[statsSortKey] as number);
      return statsSortDir === "desc" ? diff : -diff;
    });
  }, [periodStats, statsSortKey, statsSortDir]);

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
      if (!log || !logHasAnyData(log)) return false;
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
      return !log || !logHasAnyData(log);
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
          l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department) && logHasAnyData(l)
        )) ? 1 : 0);
      }
      const logs = feat.dailyLogs?.filter((l) =>
        l.date === dateStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      return acc + (logs.some((l) => logHasAnyData(l)) ? 1 : 0);
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

  const handleToggleArrivalQuick = async (pt: DrawnFeature, groupIndex: 1 | 2, newArrived: boolean) => {
    if (!onSaveDailyLog) return;
    const logs = pt.dailyLogs?.filter((l) =>
      l.date === activeDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
    ) || [];
    const currentLog = logs[0] || emptyLog(activeDate);

    const nowTime = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    let updatedLog: DailyLog;
    if (groupIndex === 1) {
      updatedLog = {
        ...currentLog,
        hasArrivedG1: newArrived,
        arrivalTime: newArrived ? (currentLog.arrivalTime || nowTime) : "",
      };
    } else {
      updatedLog = {
        ...currentLog,
        hasArrivedG2: newArrived,
        arrivalTime2: newArrived ? (currentLog.arrivalTime2 || nowTime) : "",
      };
    }

    await onSaveDailyLog(pt.id, updatedLog);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSortToggle = (key: typeof statsSortKey) => {
    if (statsSortKey === key) setStatsSortDir((d) => d === "desc" ? "asc" : "desc");
    else { setStatsSortKey(key); setStatsSortDir("desc"); }
  };

  return (
    <div className="rr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rr-modal">
        {/* Header */}
        <div className="rr-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar style={{ color: isAllMode ? "var(--color-info)" : "var(--color-green)", flexShrink: 0 }} size={18} />
            <div>
              <h3 className="rr-title">
                {isAllMode ? "Bitácora General" : "Bitácora de Rango"}
              </h3>
              <p className="rr-subtitle">
                {isAllMode ? (
                  <span>
                    <strong style={{ color: "var(--text-main)" }}>Todos los sitios</strong> · {daysWithData} de {dates.length} días con registros
                  </span>
                ) : (
                  <span>
                    <strong style={{ color: "var(--text-main)" }}>{feat.title}</strong> · {daysWithData} de {dates.length} días con registros
                  </span>
                )}
              </p>
            </div>
          </div>
          <button className="rr-close-btn" onClick={onClose} title="Cerrar">
            <X size={15} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="rr-tabs">
          <button className={`rr-tab ${activeTab === "registro" ? "active" : ""}`} onClick={() => setActiveTab("registro")}>
            <Calendar size={13} /> Registro
          </button>
          <button className={`rr-tab ${activeTab === "estadisticas" ? "active" : ""}`} onClick={() => setActiveTab("estadisticas")}>
            <BarChart2 size={13} /> Estadísticas
          </button>
        </div>

        {/* ── STATISTICS TAB ── */}
        {activeTab === "estadisticas" && periodStats && (
          <div className="rr-list" style={{ gap: "14px" }}>
            {/* Global period totals — all values are log-level totals (may include manually entered data) */}
            <div className="rr-stats-cards-grid">
              <div className="rr-scard" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
                <HeartHandshake size={14} style={{ color: "var(--color-green)" }} />
                <div className="rr-scard-val" style={{ color: "var(--color-green)" }}>{periodStats.totalRescued}</div>
                <div className="rr-scard-label">Rescatados</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                <ShieldAlert size={14} style={{ color: "var(--color-high)" }} />
                <div className="rr-scard-val" style={{ color: "var(--color-high)" }}>{periodStats.totalRecovered}</div>
                <div className="rr-scard-label">Recuperados</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(56,189,248,0.2)" }}>
                <HeartPulse size={14} style={{ color: "#38bdf8" }} />
                <div className="rr-scard-val">{periodStats.totalPrehospitalCare}</div>
                <div className="rr-scard-label">Atenciones Prehosp.</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(168,85,247,0.3)" }}>
                <Ambulance size={14} style={{ color: "var(--color-purple)" }} />
                <div className="rr-scard-val" style={{ color: "var(--color-purple)" }}>{periodStats.totalTransfers}</div>
                <div className="rr-scard-label">Traslados</div>
              </div>
              <div className="rr-scard" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
                <span style={{ fontSize: "14px" }}>🐾</span>
                <div className="rr-scard-val" style={{ color: "#fbbf24" }}>{periodStats.totalPets}</div>
                <div className="rr-scard-label">Animales Rescatados</div>
              </div>
              <div className="rr-scard">
                <TrendingUp size={14} style={{ color: "var(--text-muted)" }} />
                <div className="rr-scard-val">{periodStats.totalDaysWithData}</div>
                <div className="rr-scard-label">Días con Actividad</div>
              </div>
            </div>

            {/* Per-group table */}
            {periodStats.groupStats.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Por Grupo</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", fontStyle: "italic" }}>* Los totales son por registro diario, no exclusivamente por grupo</div>
                </div>
                <div className="rr-stats-table-wrap">
                  <table className="rr-stats-table">
                    <thead>
                      <tr>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("nombre")}>Grupo {statsSortKey === "nombre" ? (statsSortDir === "asc" ? "↑" : "↓") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("daysActive")}>Días {statsSortKey === "daysActive" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalRescued")} style={{ color: "var(--color-green)" }}>Rescatados {statsSortKey === "totalRescued" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalRecovered")} style={{ color: "var(--color-high)" }}>Recuperados {statsSortKey === "totalRecovered" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalPrehospitalCare")}>Atenciones {statsSortKey === "totalPrehospitalCare" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalTransfers")} style={{ color: "var(--color-purple)" }}>Traslados {statsSortKey === "totalTransfers" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                        <th className="rr-th-sort" onClick={() => handleSortToggle("totalPets")} style={{ color: "#fbbf24" }}>Animales {statsSortKey === "totalPets" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGroupStats.map((gs, i) => (
                        <tr key={gs.groupName + i} className={i % 2 === 0 ? "rr-tr-even" : ""}>
                          <td>
                            <div className="rr-td-group">
                              <span className="rr-td-dept" style={{ color: gs.department === "pc" ? "var(--color-info)" : "#ef4444" }}>{gs.department === "pc" ? "PC" : "B"}</span>
                              {gs.groupName}
                            </div>
                          </td>
                          <td style={{ textAlign: "center", fontWeight: 700 }}>{gs.daysActive}</td>
                          <td style={{ textAlign: "center", color: gs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)" }}>{gs.totalRescued}</td>
                          <td style={{ textAlign: "center", color: gs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)" }}>{gs.totalRecovered}</td>
                          <td style={{ textAlign: "center", color: gs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)" }}>{gs.totalPrehospitalCare}</td>
                          <td style={{ textAlign: "center", color: gs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)" }}>{gs.totalTransfers}</td>
                          <td style={{ textAlign: "center", color: gs.totalPets > 0 ? "#fbbf24" : "var(--text-muted)" }}>{gs.totalPets || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Per-site statistics separated by Sectors vs Sitios de Trabajo */}
            {periodStats.featureStats.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Sectors section with dedicated Puntos Contenidos column */}
                {periodStats.featureStats.some((fs) => isSectorFeature(fs)) && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", fontWeight: 800, color: "var(--color-info)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                      <Layers size={12} /> Sectores
                    </div>
                    <div className="rr-stats-table-wrap">
                      <table className="rr-stats-table">
                        <thead>
                          <tr>
                            <th>Sector</th>
                            <th style={{ color: "#38bdf8" }}>Puntos Contenidos</th>
                            <th style={{ textAlign: "center" }}>Días</th>
                            <th style={{ textAlign: "center", color: "var(--color-green)" }}>Rescatados</th>
                            <th style={{ textAlign: "center", color: "var(--color-high)" }}>Recuperados</th>
                            <th style={{ textAlign: "center", color: "var(--color-info)" }}>Atenciones</th>
                            <th style={{ textAlign: "center", color: "var(--color-purple)" }}>Traslados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodStats.featureStats.filter((fs) => isSectorFeature(fs)).map((fs, idx) => {
                            const containedPoints = (allFeatures || []).filter((c) => String(parentsMap[c.id]) === String(fs.featureId));
                            const pointsText = containedPoints.map((c) => c.title).join(", ");

                            return (
                              <tr key={fs.featureId} className={idx % 2 === 0 ? "rr-tr-even" : ""}>
                                <td>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: fs.featureColor || "var(--color-info)", flexShrink: 0 }} />
                                    <Layers size={11} style={{ color: "var(--color-info)", flexShrink: 0 }} />
                                    <span>{fs.featureTitle}</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: "center", fontWeight: 700, color: containedPoints.length > 0 ? "#38bdf8" : "var(--text-muted)" }}>
                                  {containedPoints.length}
                                </td>
                                <td style={{ textAlign: "center", fontWeight: 700 }}>{fs.daysActive}</td>
                                <td style={{ textAlign: "center", color: fs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)" }}>{fs.totalRescued}</td>
                                <td style={{ textAlign: "center", color: fs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)" }}>{fs.totalRecovered}</td>
                                <td style={{ textAlign: "center", color: fs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)" }}>{fs.totalPrehospitalCare}</td>
                                <td style={{ textAlign: "center", color: fs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)" }}>{fs.totalTransfers}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sitios de Trabajo section */}
                {periodStats.featureStats.some((fs) => !isSectorFeature(fs)) && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-orange)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>
                      <MapPin size={12} /> Sitios de Trabajo
                    </div>
                    <div className="rr-stats-table-wrap">
                      <table className="rr-stats-table">
                        <thead>
                          <tr>
                            <th>Sitio de Trabajo</th>
                            <th style={{ textAlign: "center" }}>Días</th>
                            <th style={{ textAlign: "center", color: "var(--color-green)" }}>Rescatados</th>
                            <th style={{ textAlign: "center", color: "var(--color-high)" }}>Recuperados</th>
                            <th style={{ textAlign: "center", color: "var(--color-info)" }}>Atenciones</th>
                            <th style={{ textAlign: "center", color: "var(--color-purple)" }}>Traslados</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodStats.featureStats.filter((fs) => !isSectorFeature(fs)).map((fs, idx) => (
                            <tr key={fs.featureId} className={idx % 2 === 0 ? "rr-tr-even" : ""}>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: fs.featureColor || "var(--color-green)", flexShrink: 0 }} />
                                  <MapPin size={11} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
                                  <span>{fs.featureTitle}</span>
                                </div>
                              </td>
                              <td style={{ textAlign: "center", fontWeight: 700 }}>{fs.daysActive}</td>
                              <td style={{ textAlign: "center", color: fs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)" }}>{fs.totalRescued}</td>
                              <td style={{ textAlign: "center", color: fs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)" }}>{fs.totalRecovered}</td>
                              <td style={{ textAlign: "center", color: fs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)" }}>{fs.totalPrehospitalCare}</td>
                              <td style={{ textAlign: "center", color: fs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)" }}>{fs.totalTransfers}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {periodStats.groupStats.length === 0 && (
              <div className="rr-empty-state">
                <BarChart2 size={28} style={{ opacity: 0.4, color: "var(--color-info)" }} />
                <div>Aún no hay datos suficientes para mostrar estadísticas.</div>
              </div>
            )}
          </div>
        )}

        {/* ── REGISTRO TAB ── */}
        {activeTab === "registro" && (
        <>{/* Integrated Sober Toolbar */}
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

              {/* Botón Selector de Fecha que abre el Calendario */}
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

                {/* Popover flotante de Calendario */}
                {showCalendarPopover && (
                  <div className="rr-calendar-popover" onClick={(e) => e.stopPropagation()}>
                    <BitacoraCalendar
                      selectedDate={activeDate}
                      onSelectDate={(dStr) => {
                        const idx = dates.indexOf(dStr);
                        if (idx !== -1) {
                          setActiveDateIndex(idx);
                          setActiveEditFeatureId(null);
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
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Sectors group */}
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
                          const hasG2 = !!(log?.groupName2 || log?.unitOut2);
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
                                <button onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)} className="rr-edit-btn">
                                  {isEditingThis ? "Cerrar Editor" : "Editar Sitio"}
                                </button>
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
                                    const r = (parseInt(cpLog.rescuedCount || "0", 10) + parseInt(cpLog.rescuedCount2 || "0", 10));
                                    const rc = (parseInt(cpLog.recoveredCount || "0", 10) + parseInt(cpLog.recoveredCount2 || "0", 10));
                                    const ph = (parseInt(cpLog.prehospitalCareCount || "0", 10) + parseInt(cpLog.prehospitalCareCount2 || "0", 10));
                                    const tr = (parseInt(cpLog.transfersCount || "0", 10) + parseInt(cpLog.transfersCount2 || "0", 10));
                                    const off = (parseInt(cpLog.officersCount || "0", 10) + parseInt(cpLog.officersCount2 || "0", 10));
                                    return (
                                      <div key={cp.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.63rem", color: "var(--text-main)", padding: "2px 4px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "4px" }}>
                                        <span style={{ fontWeight: 600 }}>📍 {cp.title} {cpLog.groupName ? `(${cpLog.groupName})` : ""}</span>
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

                  {/* Sitios de Trabajo group */}
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
                          const hasG2 = !!(log?.groupName2 || log?.unitOut2);

                          return (
                            <div key={pt.id} className="rr-point-card">
                              <div className="rr-card-header">
                                <div className="rr-card-title-group">
                                  <span className="rr-card-dot" style={{ backgroundColor: pt.color || "var(--color-green)", color: pt.color || "var(--color-green)" }} />
                                  <MapPin size={12} style={{ color: "var(--accent-orange)" }} />
                                  <span className="rr-card-title">{pt.title}</span>
                                  <span className="rr-meta-chip" style={{ background: "rgba(249, 115, 22, 0.12)", color: "#fb923c", fontSize: "0.58rem" }}>SITIO</span>
                                </div>
                                <button onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)} className="rr-edit-btn">
                                  {isEditingThis ? "Cerrar Editor" : "Editar Sitio"}
                                </button>
                              </div>

                              {!isEditingThis && log && (
                                <div className="rr-card-body">
                                  <GroupDisplay group={getGroupData(log, 1)} label="G1" accentColor="#38bdf8" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 1, newArrived)} />
                                  {hasG2 && <GroupDisplay group={getGroupData(log, 2)} label="G2" accentColor="#a855f7" onToggleArrival={(newArrived) => handleToggleArrivalQuick(pt, 2, newArrived)} />}
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
                    onChange={(e) => { const val = e.target.value; if (val) { setActiveEditFeatureId(parseInt(val, 10)); e.target.value = ""; } }}
                    style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "5px", color: "var(--text-main)", fontSize: "0.68rem", padding: "4px 8px", outline: "none", width: "100%", cursor: "pointer" }}
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
                return <DateRow key={dateStr} dateStr={dateStr} log={log} feat={feat} onSaveDailyLog={onSaveDailyLog} activeDepartment={activeDepartment} />;
              })
            )
          )}
        </div>
        </> /* end registro tab */
        )}

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
