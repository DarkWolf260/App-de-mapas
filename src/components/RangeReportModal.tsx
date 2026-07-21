import React, { useState } from "react";
import type { DrawnFeature, DailyLog } from "../types";
import { X, Calendar, ShieldAlert, Users } from "lucide-react";
import { DateRow } from "./DateRow";
import { InlineRowEditor } from "./InlineRowEditor";
import { GroupDisplay } from "./GroupDisplay";
import { formatDateFriendly, getDatesRange, getGroupData, logMatchesArrivalFilter, logHasPersonnel, REPORT_START_DATE } from "../utils/logUtils";

interface RangeReportModalProps {
  feat: DrawnFeature | "all" | null;
  allFeatures?: DrawnFeature[];
  onClose: () => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
}

const RangeReportModal: React.FC<RangeReportModalProps> = ({
  feat,
  allFeatures = [],
  onClose,
  onSaveDailyLog,
}) => {
  const [activeDateIndex, setActiveDateIndex] = useState(0);
  const [activeEditFeatureId, setActiveEditFeatureId] = useState<number | null>(null);
  const [arrivalFilter, setArrivalFilter] = useState<"all" | "arrived" | "not_arrived">("all");

  if (!feat) return null;

  const dates = getDatesRange(REPORT_START_DATE);
  const isAllMode = feat === "all";
  const activeDate = dates[activeDateIndex];

  const activePoints = allFeatures.filter((pt) => {
    if (activeEditFeatureId === pt.id) return true;
    const log = pt.dailyLogs?.find((l) => l.date === activeDate);
    if (!log || !logHasPersonnel(log)) return false;
    return logMatchesArrivalFilter(log, arrivalFilter);
  });

  const inactivePoints = allFeatures.filter((pt) => {
    const log = pt.dailyLogs?.find((l) => l.date === activeDate);
    return !log || !logHasPersonnel(log);
  });

  const filteredDates = dates.filter((dateStr) => {
    if (isAllMode) return true;
    const log = feat.dailyLogs?.find((l) => l.date === dateStr);
    return logMatchesArrivalFilter(log, arrivalFilter);
  });

  const daysWithData = dates.reduce((acc, dateStr) => {
    if (isAllMode) {
      return acc + (allFeatures.some((f) => f.dailyLogs?.some((l) => l.date === dateStr && logHasPersonnel(l))) ? 1 : 0);
    }
    return acc + (feat.dailyLogs?.some((l) => l.date === dateStr && logHasPersonnel(l)) ? 1 : 0);
  }, 0);

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

  return (
    <div className="rr-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="rr-modal">
        {/* Header */}
        <div className="rr-header" style={isAllMode ? { background: "linear-gradient(to right, rgba(56, 189, 248, 0.07), transparent)" } : undefined}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar style={{ color: isAllMode ? "var(--color-info)" : "var(--color-green)", flexShrink: 0 }} size={20} />
            <div>
              <h3 className="rr-title">
                {isAllMode ? "Bitácora General — Sitios de Trabajo" : "Bitácora de Rango — 24 Jun a Hoy"}
              </h3>
              <p className="rr-subtitle">
                {isAllMode ? (
                  <span>
                    Mostrando <strong style={{ color: "var(--text-main)" }}>todos los puntos</strong> por día · Excluyendo puntos sin personal
                  </span>
                ) : (
                  <span>
                    Punto: <strong style={{ color: "var(--text-main)" }}>{feat.title}</strong>
                    {" · "}
                    <span style={{ color: "var(--color-info)" }}>Clic en cada día para editar</span>
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
            Con datos registrados
          </div>
          <div className="rr-legend-item">
            <div className="rr-legend-dot" />
            Sin registros
          </div>
          <div className="rr-legend-stat">
            <Users size={11} />
            {daysWithData} / {dates.length} días con ops.
          </div>
        </div>

        {/* Filter bar */}
        <div className="rr-filter-bar">
          <span className="rr-filter-label">Filtrar grupos:</span>
          <div className="rr-filter-buttons">
            {(["all", "arrived", "not_arrived"] as const).map((key) => (
              <button
                key={key}
                className={`rr-filter-btn ${arrivalFilter === key ? "active" : ""}`}
                onClick={() => setArrivalFilter(key)}
              >
                {key === "all" ? "Todos" : key === "arrived" ? "Ya llegaron" : "No han llegado"}
              </button>
            ))}
          </div>
        </div>

        {/* Pagination (all-mode) */}
        {isAllMode && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", flexShrink: 0 }}>
            <button onClick={handlePrevDay} disabled={activeDateIndex === dates.length - 1} className="sim-btn" style={{ padding: "5px 12px", fontSize: "0.72rem", opacity: activeDateIndex === dates.length - 1 ? 0.4 : 1, cursor: activeDateIndex === dates.length - 1 ? "not-allowed" : "pointer" }}>
              ← Día Anterior
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Día Seleccionado:</span>
              <select
                value={activeDateIndex}
                onChange={(e) => { setActiveDateIndex(parseInt(e.target.value, 10)); setActiveEditFeatureId(null); }}
                style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)", borderRadius: "6px", color: "var(--text-main)", fontSize: "0.75rem", padding: "4px 10px", outline: "none", cursor: "pointer", fontFamily: "inherit" }}
              >
                {dates.map((dateStr, idx) => {
                  const dayHasData = allFeatures.some((f) => f.dailyLogs?.some((l) => l.date === dateStr && logHasPersonnel(l)));
                  return (
                    <option key={dateStr} value={idx} style={{ background: "#0f172a", color: "#f8fafc" }}>
                      {formatDateFriendly(dateStr)} {dateStr.split("-")[0]} {dayHasData ? "•" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <button onClick={handleNextDay} disabled={activeDateIndex === 0} className="sim-btn" style={{ padding: "5px 12px", fontSize: "0.72rem", opacity: activeDateIndex === 0 ? 0.4 : 1, cursor: activeDateIndex === 0 ? "not-allowed" : "pointer" }}>
              Día Siguiente →
            </button>
          </div>
        )}

        {/* Scrollable list */}
        <div className="rr-list">
          {isAllMode ? (
            <>
              {activePoints.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", gap: "10px" }}>
                  <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                  <div>
                    {arrivalFilter === "all"
                      ? "No hay personal reportado en ningún Sitio de Trabajo para este día."
                      : arrivalFilter === "arrived"
                        ? "No hay grupos que hayan llegado para este día."
                        : "Todos los grupos de este día ya han llegado o no hay personal reportado."}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activePoints.map((pt) => {
                    const log = pt.dailyLogs?.find((l) => l.date === activeDate);
                    const isEditingThis = activeEditFeatureId === pt.id;
                    const hasG2 = !!(log?.groupName2 || log?.unitOut2);

                    return (
                      <div
                        key={pt.id}
                        className="rr-row rr-row--data"
                        style={{
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          background: isEditingThis ? "rgba(255, 255, 255, 0.02)" : "rgba(34, 197, 94, 0.02)",
                          border: isEditingThis ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(34, 197, 94, 0.2)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: pt.color || "var(--color-green)", boxShadow: `0 0 8px ${pt.color || "var(--color-green)"}80` }} />
                            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>{pt.title}</span>
                          </div>
                          <button
                            onClick={() => setActiveEditFeatureId(isEditingThis ? null : pt.id)}
                            className="sim-btn"
                            style={{ fontSize: "0.65rem", padding: "2px 8px", background: isEditingThis ? "rgba(255, 255, 255, 0.08)" : "rgba(56, 189, 248, 0.08)", border: isEditingThis ? "1px solid var(--border-subtle)" : "1px solid rgba(56, 189, 248, 0.2)", color: isEditingThis ? "var(--text-main)" : "var(--color-info)" }}
                          >
                            {isEditingThis ? "Cerrar" : "Editar"}
                          </button>
                        </div>

                        {!isEditingThis && log && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingLeft: "16px" }}>
                            <GroupDisplay group={getGroupData(log, 1)} label="GRUPO 1" accentColor="var(--color-green)" showBorder={!!hasG2} />
                            {hasG2 && <GroupDisplay group={getGroupData(log, 2)} label="GRUPO 2" accentColor="var(--color-info)" showBorder={false} />}
                          </div>
                        )}

                        {log?.observations && !isEditingThis && (
                          <div style={{ marginTop: "4px", padding: "4px 8px", background: "rgba(56, 189, 248, 0.04)", borderLeft: "2px solid var(--color-info)", borderRadius: "0 4px 4px 0", fontSize: "0.72rem" }}>
                            <strong style={{ color: "var(--color-info)" }}>📝 Observación:</strong> {log.observations}
                          </div>
                        )}

                        {isEditingThis && (
                          <div style={{ marginTop: "4px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
                            <InlineRowEditor dateStr={activeDate} log={log} feat={pt} onSaveDailyLog={onSaveDailyLog} onCloseEditor={() => setActiveEditFeatureId(null)} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {inactivePoints.length > 0 && (
                <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255, 255, 255, 0.01)", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                    ➕ REGISTRAR PERSONAL EN OTRO SITIO DE TRABAJO
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      defaultValue=""
                      onChange={(e) => { const val = e.target.value; if (val) { setActiveEditFeatureId(parseInt(val, 10)); e.target.value = ""; } }}
                      style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "5px", color: "var(--text-main)", fontSize: "0.7rem", padding: "5px 10px", outline: "none", flex: 1, cursor: "pointer" }}
                    >
                      <option value="" disabled style={{ background: "#1e293b" }}>-- Seleccionar Sitio de Trabajo --</option>
                      {inactivePoints.map((pt) => (
                        <option key={pt.id} value={pt.id} style={{ background: "#1e293b" }}>{pt.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          ) : (
            filteredDates.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", gap: "10px" }}>
                <ShieldAlert size={28} style={{ opacity: 0.5, color: "var(--color-info)" }} />
                <div>No hay registros que coincidan con el filtro en este rango de fechas.</div>
              </div>
            ) : (
              filteredDates.map((dateStr) => {
                const log = feat.dailyLogs?.find((l) => l.date === dateStr);
                return <DateRow key={dateStr} dateStr={dateStr} log={log} feat={feat} onSaveDailyLog={onSaveDailyLog} />;
              })
            )
          )}
        </div>

        {/* Footer */}
        <div className="rr-footer">
          <button onClick={onClose} className="sim-btn" style={{ padding: "6px 20px", fontSize: "0.75rem" }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export { RangeReportModal };
