import React from "react";
import { MapPin, Clock, Navigation } from "lucide-react";
import type { DrawnFeature, DailyLog, Department, DepartmentView } from "../../types";
import { getNormalizedGroupList } from "../../utils/logUtils";
import { getGeometryHandler } from "../../utils/geometryHandlers";

interface ContainedTabProps {
  features: DrawnFeature[];
  popupEditDate: string;
  activeDepartment?: DepartmentView;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
}

const TYPE_COLORS: Record<string, string> = {
  point: "var(--color-green)",
  polygon: "var(--color-info)",
  polyline: "var(--color-purple)",
};

function getRelevantLog(feat: DrawnFeature, dateStr: string, activeDept?: DepartmentView): DailyLog | undefined {
  if (!feat.dailyLogs) return undefined;
  const deptToUse: Department = activeDept === "mixto" ? undefined : (activeDept as Department);
  return feat.dailyLogs.find((l) =>
    l.date === dateStr && (activeDept === "mixto" ? true : (deptToUse ? (l.department === deptToUse || !l.department) : true))
  );
}

export const ContainedTab: React.FC<ContainedTabProps> = ({ features, popupEditDate, activeDepartment, onNavigateToFeature }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {/* Section header */}
    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "4px", display: "flex", alignItems: "center", gap: "5px" }}>
      <MapPin size={12} /> Elementos Contenidos ({features.length})
    </div>

    {features.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "400px", overflowY: "auto" }}>
        {features.map((feat) => {
          const log = getRelevantLog(feat, popupEditDate, activeDepartment);
          const groups = log ? getNormalizedGroupList(log) : [];
          const novedades = log?.novedades || [];
          const observations = log?.observations?.trim() || "";
          const hasAnyInfo = novedades.length > 0 || observations || groups.length > 0;
          const color = feat.color || TYPE_COLORS[feat.type] || "var(--color-green)";

          return (
            <div
              key={feat.id}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: hasAnyInfo ? "5px" : "0",
              }}
            >
              {/* Feature name — clickable */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span
                  onClick={() => onNavigateToFeature?.(feat)}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    cursor: onNavigateToFeature ? "pointer" : "default",
                    textDecoration: onNavigateToFeature ? "underline" : "none",
                    textUnderlineOffset: "2px",
                    flex: 1,
                  }}
                  title={onNavigateToFeature ? "Ir a este punto" : undefined}
                >
                  {feat.title || `${getGeometryHandler(feat.type).typeLabel} ${feat.id}`}
                </span>
                {onNavigateToFeature && (
                  <button
                    onClick={() => onNavigateToFeature(feat)}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", display: "flex" }}
                    title="Ir a este punto"
                  >
                    <Navigation size={11} />
                  </button>
                )}
              </div>

              {/* Observations */}
              {observations && (
                <div style={{ fontSize: "0.64rem", color: "#94a3b8", paddingLeft: "12px", lineHeight: 1.35 }}>
                  <span style={{ color: "#60a5fa", fontWeight: 600, marginRight: "3px" }}>OBS:</span> {observations}
                </div>
              )}

              {/* Groups summary */}
              {groups.map((g, i) => (
                <div key={i} style={{ fontSize: "0.64rem", color: "#94a3b8", paddingLeft: "12px", lineHeight: 1.35, display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  <span style={{ color: "#a78bfa", fontWeight: 700 }}>{g.groupName}</span>
                  {g.officersCount ? <span style={{ color: "#64748b" }}>({g.officersCount}p)</span> : null}
                  {g.unitOut ? <span style={{ color: "#64748b" }}>— {g.unitOut}</span> : null}
                </div>
              ))}

              {/* Novedades */}
              {novedades.length > 0 && novedades.map((n) => (
                <div key={n.id} style={{ fontSize: "0.62rem", color: "#94a3b8", paddingLeft: "12px", display: "flex", gap: "5px", alignItems: "flex-start", lineHeight: 1.35 }}>
                  <Clock size={9} style={{ marginTop: "2px", color: "#fb923c", flexShrink: 0 }} />
                  <span style={{ color: "#fb923c", fontWeight: 700, flexShrink: 0 }}>{n.time}</span>
                  <span style={{ color: "#cbd5e1" }}>{n.text}</span>
                </div>
              ))}

              {!hasAnyInfo && (
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontStyle: "italic", paddingLeft: "12px" }}>
                  Sin información para esta fecha
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
        No se detectaron puntos o líneas dentro de este área.
      </div>
    )}
  </div>
);
