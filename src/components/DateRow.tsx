import React from "react";
import type { DrawnFeature, DailyLog, DepartmentView } from "../types";
import { ChevronDown, ChevronUp, Calendar, Users, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { GroupLogForm } from "./GroupLogForm";
import { useLogEditor } from "../hooks/useLogEditor";
import { emptyLog, logHasAnyData, getGroupData, formatDateFriendly } from "../utils/logUtils";

interface DateRowProps {
  dateStr: string;
  log: DailyLog | undefined;
  feat: DrawnFeature;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  activeDepartment?: DepartmentView;
}

export const DateRow: React.FC<DateRowProps> = ({ dateStr, log, feat, onSaveDailyLog, activeDepartment }) => {
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

  const friendlyDate = formatDateFriendly(dateStr);

  return (
    <div
      className={`rr-date-card ${hasData ? "has-data" : ""} ${expanded ? "expanded" : ""}`}
    >
      <div
        className="rr-date-card-header"
        onClick={toggleExpand}
      >
        <div className="rr-date-card-left">
          <div className="rr-date-badge">
            <Calendar size={13} style={{ color: hasData ? "var(--color-green)" : "var(--color-info)" }} />
            <span>{friendlyDate}</span>
          </div>

          <span className={`rr-status-pill ${hasData ? "arrived" : "pending"}`} style={{ fontSize: "0.62rem" }}>
            {hasData ? (
              <><CheckCircle2 size={10} /> Con Registros</>
            ) : (
              <><ShieldAlert size={10} /> Sin Datos</>
            )}
          </span>
        </div>

        <div className="rr-date-card-right">
          <button className="rr-edit-btn" onClick={(e) => { e.stopPropagation(); toggleExpand(); }}>
            {expanded ? "Cerrar Editor" : hasData ? "Editar Registro" : "+ Añadir Datos"}
          </button>
          {expanded ? <ChevronUp size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />}
        </div>
      </div>

      {!expanded && hasData && (
        <div className="rr-date-card-preview">
          {g1.groupName && (
            <div className="rr-preview-group">
              <span className="rr-group-label" style={{ color: "#38bdf8" }}>G1</span>
              <strong style={{ color: "var(--text-main)" }}>{g1.groupName}</strong>
              {g1.unitOut && <span className="rr-meta-chip">{g1.unitOut}</span>}
              {g1.managerName && <span style={{ color: "var(--text-muted)" }}>· {g1.managerName}</span>}
              {g1.officersCount && (
                <span className="rr-meta-chip" style={{ background: "rgba(56,189,248,0.1)", color: "#38bdf8" }}>
                  <Users size={10} /> {g1.officersCount}
                </span>
              )}
            </div>
          )}
          {hasG2 && g2.groupName && (
            <div className="rr-preview-group">
              <span className="rr-group-label" style={{ color: "#a855f7" }}>G2</span>
              <strong style={{ color: "var(--text-main)" }}>{g2.groupName}</strong>
              {g2.unitOut && <span className="rr-meta-chip">{g2.unitOut}</span>}
              {g2.managerName && <span style={{ color: "var(--text-muted)" }}>· {g2.managerName}</span>}
              {g2.officersCount && (
                <span className="rr-meta-chip" style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7" }}>
                  <Users size={10} /> {g2.officersCount}
                </span>
              )}
            </div>
          )}
          {effectiveLog.observations && (
            <div className="rr-preview-obs">
              <FileText size={10} style={{ color: "var(--color-info)", flexShrink: 0 }} />
              <span>{effectiveLog.observations}</span>
            </div>
          )}
        </div>
      )}

      {expanded && (
        <div className="rr-date-card-body">
          <GroupLogForm
            draft={draft}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
            saved={saved}
            activeDepartment={activeDepartment}
          />
        </div>
      )}
    </div>
  );
};

