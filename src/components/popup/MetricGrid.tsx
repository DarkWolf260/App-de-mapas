import React from "react";
import type { GroupLogEntry, DailyLog } from "../../types";
import { METRIC_FIELDS, getMetricValue } from "./metricFields";
import { metricInputStyle } from "./popupStyles";

interface MetricInputsProps {
  group: GroupLogEntry;
  groupIdx: number;
  onGroupFieldChange: (idx: number, field: string, value: string) => void;
}

export function MetricInputs({ group, groupIdx, onGroupFieldChange }: MetricInputsProps) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", marginTop: "4px" }}>
        {METRIC_FIELDS.map(({ label, field, color }) => (
          <div key={field} style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block", marginBottom: "2px" }}>{label}</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={getMetricValue(group, field) || ""}
              onChange={(e) => onGroupFieldChange(groupIdx, field, e.target.value)}
              style={{ ...metricInputStyle, textAlign: "center", padding: "2px 2px", fontSize: "0.68rem", color }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
        <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Inspecciones EDAN</span>
        <input
          type="number"
          min="0"
          placeholder="0"
          value={group.edanCount || ""}
          onChange={(e) => onGroupFieldChange(groupIdx, "edanCount", e.target.value)}
          style={{ ...metricInputStyle, textAlign: "center", padding: "2px 2px", fontSize: "0.68rem", color: "#fb923c", width: "60px", flexShrink: 0 }}
        />
      </div>
    </>
  );
}

interface MetricBadgesProps {
  group: GroupLogEntry;
}

export function MetricBadges({ group }: MetricBadgesProps) {
  const has = METRIC_FIELDS.some((m) => {
    const v = getMetricValue(group, m.field);
    return v && v !== "0";
  });
  if (!has) return null;

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
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "2px" }}>
      {METRIC_FIELDS.map(({ label, field, color }) => {
        const val = getMetricValue(source, field) || "0";
        if (!showZero && val === "0") return null;
        return (
          <div key={field} style={{ textAlign: "center" }}>
            <span style={{ fontSize: "0.48rem", color: "var(--text-muted)", display: "block" }}>{label}</span>
            <span style={{ fontSize, fontWeight: 800, color }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}
