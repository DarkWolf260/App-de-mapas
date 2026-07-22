import React from "react";
import type { DrawnFeature, DailyLog } from "../types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { GroupLogForm } from "./GroupLogForm";
import { useLogEditor } from "../hooks/useLogEditor";
import { emptyLog, logHasAnyData, getGroupData } from "../utils/logUtils";

interface DateRowProps {
  dateStr: string;
  log: DailyLog | undefined;
  feat: DrawnFeature;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
}

export const DateRow: React.FC<DateRowProps> = ({ dateStr, log, feat, onSaveDailyLog }) => {
  const [expanded, setExpanded] = React.useState(false);
  const effectiveLog = log ?? emptyLog(dateStr);

  const { draft, saving, saved, handleChange, handleSave, resetDraft } = useLogEditor(
    effectiveLog,
    async (d) => { if (onSaveDailyLog) await onSaveDailyLog(feat.id, d); },
  );

  const hasData = logHasAnyData(effectiveLog);
  const g1 = getGroupData(effectiveLog, 1);
  const g2 = getGroupData(effectiveLog, 2);
  const hasG2 = !!(effectiveLog.groupName2 || effectiveLog.unitOut2);

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) resetDraft(effectiveLog);
  };

  return (
    <div
      className="rr-row rr-row--data"
      style={{
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        background: "rgba(34, 197, 94, 0.02)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={toggleExpand}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)" }}>
            📅 {dateStr}
          </span>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: hasData ? "var(--color-green)" : "var(--text-muted)",
              boxShadow: hasData ? "0 0 6px rgba(34, 197, 94, 0.5)" : "none",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
            {expanded ? "Cerrar" : "Expandir"}
          </span>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {!expanded && hasData && (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", paddingLeft: "16px", fontSize: "0.68rem" }}>
          {g1.groupName && (
            <div style={{ color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--color-info)" }}>G1:</strong> {g1.groupName}
              {g1.unitOut ? ` (${g1.unitOut})` : ""}
              {g1.managerName ? ` - ${g1.managerName}` : ""}
              {g1.officersCount ? ` [👮 ${g1.officersCount}]` : ""}
            </div>
          )}
          {hasG2 && g2.groupName && (
            <div style={{ color: "var(--text-muted)" }}>
              <strong style={{ color: "var(--color-purple)" }}>G2:</strong> {g2.groupName}
              {g2.unitOut ? ` (${g2.unitOut})` : ""}
              {g2.managerName ? ` - ${g2.managerName}` : ""}
              {g2.officersCount ? ` [👮 ${g2.officersCount}]` : ""}
            </div>
          )}
          {effectiveLog.observations && (
            <div style={{ color: "var(--color-info)", fontSize: "0.62rem", marginTop: "2px", fontStyle: "italic" }}>
              📝 {effectiveLog.observations}
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div style={{ marginTop: "4px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
          <GroupLogForm
            draft={draft}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
        </div>
      )}
    </div>
  );
};
