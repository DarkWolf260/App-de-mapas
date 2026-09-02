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
import { isSectorFeature, isStandardSector } from "../../utils/logUtils";

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

import type { PeriodStats } from "../../utils/statsCalculator";

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
    <div className="rr-list rr-stats-list">
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



      {/* Per-site statistics */}
      {periodStats.featureStats.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {periodStats.featureStats.some((fs) => isSectorFeature(fs) && isStandardSector(fs.featureTitle)) && (
            <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <Layers size={10} /> Sectores (A - F)
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
                    {periodStats.featureStats
                      .filter((fs) => isSectorFeature(fs) && isStandardSector(fs.featureTitle))
                      .sort((a, b) => a.featureTitle.localeCompare(b.featureTitle, "es", { sensitivity: "base" }))
                      .map((fs, idx) => {
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
