import React, { useState, useCallback } from "react";
import type { DailyLog, DepartmentView, WorkGroup } from "../types";
import { Save, Check, Shield, Flame, BookUser } from "lucide-react";
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
  activeDepartment?: DepartmentView;
  workGroups?: WorkGroup[];
}

export const GroupLogForm: React.FC<GroupLogFormProps> = ({
  draft,
  onChange,
  onSave,
  saving = false,
  saved = false,
  compact = false,
  activeDepartment,
  workGroups = [],
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

  const currentDept = draft.department || "pc";

  const handleAutofill = (groupId: string) => {
    const wg = workGroups.find((g) => g.id === groupId);
    if (!wg) return;
    onChange("groupName", wg.name);
    onChange("managerName", wg.leaderName);
    onChange("managerPhone", wg.leaderPhone);
    onChange("unitOut", wg.unitVehicle || "");
    if (wg.department) onChange("department", wg.department);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "6px" : "8px" }}>
      {workGroups.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(56,189,248,0.05)", border: "1px dashed rgba(56,189,248,0.2)", borderRadius: "6px", padding: "5px 8px" }}>
          <BookUser size={11} style={{ color: "var(--color-info)", flexShrink: 0 }} />
          <select
            defaultValue=""
            onChange={(e) => { if (e.target.value) { handleAutofill(e.target.value); e.target.value = ""; } }}
            style={{ background: "transparent", border: "none", color: "var(--color-info)", fontSize: "0.65rem", outline: "none", cursor: "pointer", flex: 1, fontFamily: "inherit" }}
          >
            <option value="" disabled style={{ background: "#1e293b" }}>Autocompletar desde grupo guardado…</option>
            {[...workGroups].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })).map((wg) => (
              <option key={wg.id} value={wg.id} style={{ background: "#1e293b", color: "#e2e8f0" }}>
                {wg.name} {wg.leaderName ? `— Enc: ${wg.leaderName}` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      {activeDepartment === "mixto" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", background: "rgba(0, 0, 0, 0.25)", padding: "4px 6px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <span style={{ fontSize: "0.56rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Departamento:
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => onChange("department", "pc")}
              style={{
                flex: 1,
                padding: "3px 6px",
                borderRadius: "5px",
                border: currentDept === "pc" ? "1px solid rgba(56, 189, 248, 0.6)" : "1px solid transparent",
                background: currentDept === "pc" ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.03)",
                color: currentDept === "pc" ? "var(--color-info)" : "var(--text-muted)",
                fontSize: "0.62rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
              }}
            >
              <Shield size={10} /> Protección Civil
            </button>
            <button
              type="button"
              onClick={() => onChange("department", "bomberos")}
              style={{
                flex: 1,
                padding: "3px 6px",
                borderRadius: "5px",
                border: currentDept === "bomberos" ? "1px solid rgba(239, 68, 68, 0.6)" : "1px solid transparent",
                background: currentDept === "bomberos" ? "rgba(239, 68, 68, 0.18)" : "rgba(255, 255, 255, 0.03)",
                color: currentDept === "bomberos" ? "#ef4444" : "var(--text-muted)",
                fontSize: "0.62rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px",
              }}
            >
              <Flame size={10} /> Bomberos
            </button>
          </div>
        </div>
      )}
      {/* GRUPO 1 */}
      <GroupFields
        groupIndex={1}
        log={draft}
        onFieldChange={onChange as (field: string, value: string | boolean) => void}
        colorVar="var(--color-green)"
        workGroups={workGroups}
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
            colorVar="var(--color-purple)"
            workGroups={workGroups}
          />
        </div>
      )}

      {/* Resultados y Métricas Operativas */}
      <div style={{ marginTop: "4px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "6px", padding: "6px" }}>
        <label style={LABEL_STYLE}>Métricas Operativas de Hoy</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", marginBottom: "4px" }}>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>Rescatados</span>
            <input type="number" min="0" placeholder="0" value={draft.rescuedCount || ""} onChange={(e) => onChange("rescuedCount", e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>Recuperados</span>
            <input type="number" min="0" placeholder="0" value={draft.recoveredCount || ""} onChange={(e) => onChange("recoveredCount", e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>Mascotas</span>
            <input type="number" min="0" placeholder="0" value={draft.rescuedPetsCount || ""} onChange={(e) => onChange("rescuedPetsCount", e.target.value)} style={INPUT_STYLE} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>Atenciones Prehosp.</span>
            <input type="number" min="0" placeholder="0" value={draft.prehospitalCareCount || ""} onChange={(e) => onChange("prehospitalCareCount", e.target.value)} style={INPUT_STYLE} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block" }}>Traslados Realizados</span>
            <input type="number" min="0" placeholder="0" value={draft.transfersCount || ""} onChange={(e) => onChange("transfersCount", e.target.value)} style={INPUT_STYLE} />
          </div>
        </div>
      </div>

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
          {saved && <span className="rr-saved-msg" style={{ display: "flex", alignItems: "center", gap: "3px" }}><Check size={11} /> Guardado</span>}
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
