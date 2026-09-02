import React from "react";
import { MessageSquare } from "lucide-react";
import type { GroupLogEntry, DailyLog } from "../../types";
import { METRIC_FIELDS, getMetricValue } from "./metricFields";
import { metricInputStyle } from "./popupStyles";

interface MetricInputsProps {
  group: GroupLogEntry;
  groupIdx: number;
  onGroupFieldChange: (idx: number, field: string, value: string) => void;
  onDepartmentSelect?: (dept: any) => void;
}

export function MetricInputs({ group, groupIdx, onGroupFieldChange, onDepartmentSelect }: MetricInputsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px", marginTop: "6px" }}>
      {METRIC_FIELDS.map(({ label, field, color }) => (
        <div key={field} style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 800,
              color,
              display: "block",
              marginBottom: "3px",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </span>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={getMetricValue(group, field) || ""}
            onChange={(e) => onGroupFieldChange(groupIdx, field, e.target.value)}
            onFocus={() => {
              if (group.department && onDepartmentSelect) {
                onDepartmentSelect(group.department);
              }
            }}
            style={{
              ...metricInputStyle,
              color,
              borderColor: color.startsWith("var") ? "rgba(56, 189, 248, 0.35)" : `${color}50`,
              fontSize: "0.76rem",
              fontWeight: 700,
              padding: "4px 4px",
              textAlign: "center",
              background: "rgba(0, 0, 0, 0.25)",
            }}
          />
        </div>
      ))}
    </div>
  );
}

interface MetricBadgesProps {
  group: GroupLogEntry;
}

export function MetricBadges({ group }: MetricBadgesProps) {
  const hasStandard = METRIC_FIELDS.some((m) => {
    const v = getMetricValue(group, m.field);
    return v && v !== "0";
  });
  const customActs = group.customActivities || [];
  if (!hasStandard && customActs.length === 0) return null;

  const badges: { label: string; color: string; value: string }[] = [];
  for (const m of METRIC_FIELDS) {
    const v = getMetricValue(group, m.field);
    if (v && v !== "0") {
      badges.push({ label: m.label, color: m.color, value: v });
    }
  }

  return (
    <div style={{ display: "flex", gap: "6px", fontSize: "0.6rem", flexWrap: "wrap", marginTop: "4px", padding: "3px 6px", background: "rgba(255,255,255,0.03)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.06)" }}>
      {badges.map(({ label, color, value }) => (
        <span key={label} style={{ color, fontWeight: 700 }}>{value} {label}</span>
      ))}
      {customActs.map((act) => (
        <span key={act.id} style={{ color: "#c084fc", fontWeight: 700 }}>
          {act.value} {act.name}
          {act.description && <span style={{ opacity: 0.85, fontWeight: 500, fontStyle: "italic", marginLeft: "3px" }}>({act.description})</span>}
        </span>
      ))}
    </div>
  );
}

interface MetricDisplayGridProps {
  source: Partial<DailyLog>;
  showZero?: boolean;
  smallFont?: boolean;
}

export function MetricDisplayGrid({ source, showZero = true, smallFont = false }: MetricDisplayGridProps) {
  const fontSize = smallFont ? "0.75rem" : "0.8rem";
  const customActs = source.customActivities || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "2px" }}>
        {METRIC_FIELDS.map(({ label, field, color }) => {
          const val = getMetricValue(source, field) || "0";
          if (!showZero && val === "0") return null;
          return (
            <div key={field} style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.5rem", fontWeight: 700, color, display: "block" }}>{label}</span>
              <span style={{ fontSize, fontWeight: 800, color }}>{val}</span>
            </div>
          );
        })}
      </div>

      {customActs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "4px" }}>
          {customActs.map((act) => (
            <div
              key={act.id || act.name}
              style={{
                fontSize: "0.62rem",
                color: "#c084fc",
                background: "rgba(168, 85, 247, 0.12)",
                border: "1px solid rgba(168, 85, 247, 0.3)",
                borderRadius: "5px",
                padding: "3px 7px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                <span>{act.name}</span>
                <span style={{ fontWeight: 800 }}>{act.value}</span>
              </div>
              {act.description && (
                <div style={{ fontSize: "0.58rem", color: "#e2e8f0", fontStyle: "italic", opacity: 0.9, display: "flex", alignItems: "center", gap: "4px" }}>
                  <MessageSquare size={10} style={{ flexShrink: 0, opacity: 0.8 }} />
                  <span>{act.description}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
