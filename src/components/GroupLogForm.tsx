import React, { useState, useCallback } from "react";
import type { DailyLog } from "../types";
import { Save } from "lucide-react";
import { GroupFields } from "./GroupFields";

const INPUT_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "5px",
  color: "var(--text-main)",
  fontSize: "0.68rem",
  padding: "4px 7px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.56rem",
  color: "var(--text-muted)",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  marginBottom: "3px",
  display: "block",
};

interface GroupLogFormProps {
  draft: DailyLog;
  onChange: (field: keyof DailyLog, value: string | boolean) => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
  saved?: boolean;
  compact?: boolean;
}

export const GroupLogForm: React.FC<GroupLogFormProps> = ({
  draft,
  onChange,
  onSave,
  saving = false,
  saved = false,
  compact = false,
}) => {
  const [showGroup2, setShowGroup2] = useState(
    !!(draft.groupName2 || draft.unitOut2 || draft.managerName2 || draft.officersCount2)
  );

  const handleToggleGroup2 = useCallback(() => {
    if (showGroup2) {
      onChange("groupName2", "");
      onChange("managerName2", "");
      onChange("managerPhone2", "");
      onChange("unitOut2", "");
      onChange("departureTime2", "");
      onChange("arrivalTime2", "");
      onChange("officersCount2", "");
      onChange("rescuedCount2", "");
      onChange("recoveredCount2", "");
    }
    setShowGroup2(!showGroup2);
  }, [showGroup2, onChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "6px" : "8px" }}>
      {/* GRUPO 1 */}
      <GroupFields
        groupIndex={1}
        log={draft}
        onFieldChange={onChange as (field: string, value: string | boolean) => void}
        colorVar="var(--color-green)"
      />

      {/* TOGGLE GRUPO 2 */}
      {!showGroup2 ? (
        <button
          type="button"
          className="sim-btn"
          onClick={handleToggleGroup2}
          style={{ marginTop: "4px", justifyContent: "center", padding: "6px", fontSize: "0.68rem", width: "100%", background: "rgba(56, 189, 248, 0.06)", border: "1px dashed rgba(56, 189, 248, 0.2)", color: "var(--color-info)" }}
        >
          + Registrar Segundo Grupo
        </button>
      ) : (
        <div style={{ marginTop: "8px", borderTop: "1px dashed rgba(255, 255, 255, 0.08)", paddingTop: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span>GRUPO 2 (OPCIONAL)</span>
            <button
              type="button"
              onClick={handleToggleGroup2}
              style={{ background: "transparent", border: "none", color: "var(--color-high)", fontSize: "0.62rem", cursor: "pointer", padding: 0 }}
            >
              Remover Grupo 2
            </button>
          </div>
          <GroupFields
            groupIndex={2}
            log={draft}
            onFieldChange={onChange as (field: string, value: string | boolean) => void}
            colorVar="var(--color-info)"
          />
        </div>
      )}

      {/* Observaciones */}
      <div>
        <label style={LABEL_STYLE}>Observación / Notas del Día</label>
        <textarea
          style={{ ...INPUT_STYLE, resize: "none", height: compact ? "32px" : "42px" }}
          placeholder="Notas u observaciones de las actividades de este día..."
          value={draft.observations || ""}
          onChange={(e) => onChange("observations", e.target.value)}
        />
      </div>

      {/* Save button */}
      {onSave && (
        <div className="rr-editor-footer" style={{ marginTop: "4px" }}>
          {saved && <span className="rr-saved-msg">✓ Guardado</span>}
          <button className="rr-save-btn" onClick={onSave} disabled={saving}>
            <Save size={12} />
            {saving ? "Guardando…" : "Guardar registro"}
          </button>
        </div>
      )}
    </div>
  );
};

export const INPUT_STYLE_CONST = INPUT_STYLE;
export const LABEL_STYLE_CONST = LABEL_STYLE;
