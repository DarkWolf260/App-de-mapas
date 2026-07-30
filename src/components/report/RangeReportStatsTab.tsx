import React from "react";
import {
  HeartHandshake,
  ShieldAlert,
  HeartPulse,
  Ambulance,
  TrendingUp,
  Users,
  Search,
  X,
  Layers,
  MapPin,
  BarChart2,
} from "lucide-react";
import type { DrawnFeature } from "../../types";
import { sectionBox } from "../popup/popupStyles";
import { isSectorFeature } from "../../utils/logUtils";

interface GroupStat {
  groupName: string;
  department?: string;
  isVolunteer?: boolean;
  daysActive: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  totalPets: number;
}

interface JointCommissionStat {
  commissionId: string;
  commissionLabel: string;
  participatingGroups: { groupName: string; department?: string; isVolunteer?: boolean }[];
  daysActive: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  totalPets: number;
}

interface PeriodStats {
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  totalPets: number;
  totalDaysWithData: number;
  groupStats: GroupStat[];
  independentGroupStats?: GroupStat[];
  jointCommissionStats?: JointCommissionStat[];
  featureStats: {
    featureId: number;
    featureTitle: string;
    featureType?: string;
    featureColor?: string;
    daysActive: number;
    totalRescued: number;
    totalRecovered: number;
    totalPrehospitalCare: number;
    totalTransfers: number;
  }[];
}

type StatsSortKey =
  | "nombre"
  | "daysActive"
  | "totalRescued"
  | "totalRecovered"
  | "totalPrehospitalCare"
  | "totalTransfers"
  | "totalPets";

interface RangeReportStatsTabProps {
  periodStats: PeriodStats;
  allFeatures: DrawnFeature[];
  parentsMap: Record<number | string, number | string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statsSortKey: StatsSortKey;
  statsSortDir: "asc" | "desc";
  handleSortToggle: (key: StatsSortKey) => void;
  sortedGroupStats: GroupStat[];
  sortedJointCommissions: JointCommissionStat[];
  sortedIndependentGroups: GroupStat[];
}

export const RangeReportStatsTab: React.FC<RangeReportStatsTabProps> = ({
  periodStats,
  allFeatures,
  parentsMap,
  searchQuery,
  setSearchQuery,
  statsSortKey,
  statsSortDir,
  handleSortToggle,
  sortedGroupStats,
  sortedJointCommissions,
  sortedIndependentGroups,
}) => {
  return (
    <div className="rr-list" style={{ gap: "14px" }}>
      {/* Global period totals */}
      <div className="rr-stats-cards-grid">
        <div className="rr-scard" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
          <HeartHandshake size={14} style={{ color: "var(--color-green)" }} />
          <div className="rr-scard-val" style={{ color: "var(--color-green)" }}>
            {periodStats.totalRescued}
          </div>
          <div className="rr-scard-label">Rescatados</div>
        </div>
        <div className="rr-scard" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
          <ShieldAlert size={14} style={{ color: "var(--color-high)" }} />
          <div className="rr-scard-val" style={{ color: "var(--color-high)" }}>
            {periodStats.totalRecovered}
          </div>
          <div className="rr-scard-label">Recuperados</div>
        </div>
        <div className="rr-scard" style={{ borderColor: "rgba(56,189,248,0.2)" }}>
          <HeartPulse size={14} style={{ color: "#38bdf8" }} />
          <div className="rr-scard-val">{periodStats.totalPrehospitalCare}</div>
          <div className="rr-scard-label">Atenciones Prehosp.</div>
        </div>
        <div className="rr-scard" style={{ borderColor: "rgba(168,85,247,0.3)" }}>
          <Ambulance size={14} style={{ color: "var(--color-purple)" }} />
          <div className="rr-scard-val" style={{ color: "var(--color-purple)" }}>
            {periodStats.totalTransfers}
          </div>
          <div className="rr-scard-label">Traslados</div>
        </div>
        <div className="rr-scard" style={{ borderColor: "rgba(251,191,36,0.3)" }}>
          <span style={{ fontSize: "14px" }}>🐾</span>
          <div className="rr-scard-val" style={{ color: "#fbbf24" }}>
            {periodStats.totalPets}
          </div>
          <div className="rr-scard-label">Animales Rescatados</div>
        </div>
        <div className="rr-scard">
          <TrendingUp size={14} style={{ color: "var(--text-muted)" }} />
          <div className="rr-scard-val">{periodStats.totalDaysWithData}</div>
          <div className="rr-scard-label">Días con Actividad</div>
        </div>
      </div>

      {/* Sección: Desglose por Grupos y Comisiones */}
      {((periodStats.jointCommissionStats && periodStats.jointCommissionStats.length > 0) ||
        (periodStats.independentGroupStats && periodStats.independentGroupStats.length > 0) ||
        sortedGroupStats.length > 0) && (
        <div
          style={{
            ...sectionBox,
            background: "rgba(56, 189, 248, 0.03)",
            borderColor: "rgba(56, 189, 248, 0.15)",
          }}
        >
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 700,
              color: "var(--color-info)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              paddingBottom: "2px",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Users size={10} /> Desglose por Grupos y Comisiones
            <span
              style={{
                fontSize: "0.5rem",
                color: "var(--text-muted)",
                fontWeight: 400,
                marginLeft: "auto",
                fontStyle: "italic",
              }}
            >
              * Comisión Conjunta = borde punteado
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={13}
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Filtrar por nombre de grupo, comisión o sitio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "5px 8px 5px 26px",
                  fontSize: "0.66rem",
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "6px",
                  color: "var(--text-main)",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "6px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="rr-stats-table-wrap">
            <table className="rr-stats-table">
              <thead>
                <tr>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("nombre")}>
                    Grupo / Agrupación {statsSortKey === "nombre" ? (statsSortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("daysActive")}>
                    Días {statsSortKey === "daysActive" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("totalRescued")} style={{ color: "var(--color-green)" }}>
                    Rescatados {statsSortKey === "totalRescued" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("totalRecovered")} style={{ color: "var(--color-high)" }}>
                    Recuperados {statsSortKey === "totalRecovered" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("totalPrehospitalCare")}>
                    Atenciones {statsSortKey === "totalPrehospitalCare" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("totalTransfers")} style={{ color: "var(--color-purple)" }}>
                    Traslados {statsSortKey === "totalTransfers" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                  <th className="rr-th-sort" onClick={() => handleSortToggle("totalPets")} style={{ color: "#fbbf24" }}>
                    Animales {statsSortKey === "totalPets" ? (statsSortDir === "desc" ? "↓" : "↑") : ""}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedIndependentGroups.map((gs, i) => (
                  <tr key={"indiv_" + gs.groupName + i} className={i % 2 === 0 ? "rr-tr-even" : ""}>
                    <td style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                      <div className="rr-td-group" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="rr-td-dept" style={{ color: gs.isVolunteer ? "#c084fc" : gs.department === "pc" ? "var(--color-info)" : "#ef4444" }}>
                          {gs.isVolunteer ? "VOL" : gs.department === "pc" ? "PC" : "B"}
                        </span>
                        <span style={{ fontWeight: 700 }}>{gs.groupName}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.daysActive}</td>
                    <td style={{ textAlign: "center", color: gs.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalRescued}</td>
                    <td style={{ textAlign: "center", color: gs.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalRecovered}</td>
                    <td style={{ textAlign: "center", color: gs.totalPrehospitalCare > 0 ? "var(--color-info)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalPrehospitalCare}</td>
                    <td style={{ textAlign: "center", color: gs.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalTransfers}</td>
                    <td style={{ textAlign: "center", color: gs.totalPets > 0 ? "#fbbf24" : "var(--text-muted)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>{gs.totalPets || 0}</td>
                  </tr>
                ))}

                {sortedJointCommissions.map((jc) => {
                  const rowCount = jc.participatingGroups.length;
                  return jc.participatingGroups.map((gItem, gIdx) => {
                    const isFirst = gIdx === 0;
                    const isLast = gIdx === rowCount - 1;

                    return (
                      <tr key={`jc_${jc.commissionId}_${gItem.groupName}_${gIdx}`}>
                        <td
                          style={{
                            padding: "6px 8px",
                            borderTop: isFirst ? "1.5px solid rgba(56, 189, 248, 0.5)" : "none",
                            borderBottom: isLast ? "1.5px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                            borderLeft: "1.5px solid rgba(56, 189, 248, 0.5)",
                            background: "rgba(56, 189, 248, 0.02)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="rr-td-dept" style={{ color: gItem.department === "pc" ? "var(--color-info)" : "#ef4444" }}>
                              {gItem.department === "pc" ? "PC" : "B"}
                            </span>
                            <span style={{ fontWeight: 700 }}>{gItem.groupName}</span>
                            {gItem.isVolunteer && (
                              <span style={{ background: "rgba(168, 85, 247, 0.25)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "3px", padding: "0 3px", fontSize: "0.5rem", fontWeight: 800 }}>
                                VOLUNTARIO
                              </span>
                            )}
                          </div>
                        </td>

                        {isFirst && (
                          <>
                            <td
                              rowSpan={rowCount}
                              style={{
                                textAlign: "center",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                background: "rgba(56, 189, 248, 0.04)",
                                borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                              }}
                            >
                              {jc.daysActive}
                            </td>
                            <td
                              rowSpan={rowCount}
                              style={{
                                textAlign: "center",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                background: "rgba(56, 189, 248, 0.04)",
                                borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                color: jc.totalRescued > 0 ? "var(--color-green)" : "var(--text-muted)",
                              }}
                            >
                              {jc.totalRescued}
                            </td>
                            <td
                              rowSpan={rowCount}
                              style={{
                                textAlign: "center",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                background: "rgba(56, 189, 248, 0.04)",
                                borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                color: jc.totalRecovered > 0 ? "var(--color-high)" : "var(--text-muted)",
                              }}
                            >
                              {jc.totalRecovered}
                            </td>
                            <td
                              rowSpan={rowCount}
                              style={{
                                textAlign: "center",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                background: "rgba(56, 189, 248, 0.04)",
                                borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                color: jc.totalPrehospitalCare > 0 ? "#38bdf8" : "var(--text-muted)",
                              }}
                            >
                              {jc.totalPrehospitalCare}
                            </td>
                            <td
                              rowSpan={rowCount}
                              style={{
                                textAlign: "center",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                background: "rgba(56, 189, 248, 0.04)",
                                borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                color: jc.totalTransfers > 0 ? "var(--color-purple)" : "var(--text-muted)",
                              }}
                            >
                              {jc.totalTransfers}
                            </td>
                            <td
                              rowSpan={rowCount}
                              style={{
                                textAlign: "center",
                                fontWeight: 800,
                                verticalAlign: "middle",
                                background: "rgba(56, 189, 248, 0.04)",
                                borderTop: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderBottom: "1.5px solid rgba(56, 189, 248, 0.5)",
                                borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
                                borderRight: "1.5px solid rgba(56, 189, 248, 0.5)",
                                color: jc.totalPets > 0 ? "#fbbf24" : "var(--text-muted)",
                              }}
                            >
                              {jc.totalPets}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  });
                })}

                <tr style={{ background: "rgba(15, 23, 42, 0.95)", borderTop: "2px solid #38bdf8", fontWeight: 800 }}>
                  <td style={{ color: "var(--text-main)", fontSize: "0.68rem" }}>
                    SUMA GENERAL DE LA BITÁCORA
                  </td>
                  <td style={{ textAlign: "center", color: "#38bdf8" }}>{periodStats.totalDaysWithData}d</td>
                  <td style={{ textAlign: "center", color: "var(--color-green)", fontSize: "0.72rem" }}>{periodStats.totalRescued}</td>
                  <td style={{ textAlign: "center", color: "var(--color-high)", fontSize: "0.72rem" }}>{periodStats.totalRecovered}</td>
                  <td style={{ textAlign: "center", color: "#38bdf8", fontSize: "0.72rem" }}>{periodStats.totalPrehospitalCare}</td>
                  <td style={{ textAlign: "center", color: "var(--color-purple)", fontSize: "0.72rem" }}>{periodStats.totalTransfers}</td>
                  <td style={{ textAlign: "center", color: "#fbbf24", fontSize: "0.72rem" }}>{periodStats.totalPets}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Per-site statistics */}
      {periodStats.featureStats.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {periodStats.featureStats.some((fs) => isSectorFeature(fs)) && (
            <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Layers size={10} /> Sectores
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

          {periodStats.featureStats.some((fs) => !isSectorFeature(fs)) && (
            <div style={{ ...sectionBox, background: "rgba(251, 146, 60, 0.03)", borderColor: "rgba(251, 146, 60, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#fb923c", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <MapPin size={10} /> Sitios de Trabajo
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
  );
};
