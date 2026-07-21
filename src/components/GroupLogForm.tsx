import React, { useState, useCallback } from "react";
import type { DailyLog } from "../types";
import { Save } from "lucide-react";

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
      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-green)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "4px" }}>
        GRUPO 1
      </div>
      <div className="rr-editor-grid2">
        <div>
          <label style={LABEL_STYLE}>Grupo Desplegado</label>
          <input style={INPUT_STYLE} type="text" placeholder="Nombre del grupo" value={draft.groupName} onChange={(e) => onChange("groupName", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Encargado</label>
          <input style={INPUT_STYLE} type="text" placeholder="Nombre" value={draft.managerName} onChange={(e) => onChange("managerName", e.target.value)} />
        </div>
      </div>
      <div className="rr-editor-grid3">
        <div>
          <label style={LABEL_STYLE}>Funcionarios</label>
          <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.officersCount ?? ""} onChange={(e) => onChange("officersCount", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Rescatados</label>
          <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.rescuedCount ?? ""} onChange={(e) => onChange("rescuedCount", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Recuperados</label>
          <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.recoveredCount ?? ""} onChange={(e) => onChange("recoveredCount", e.target.value)} />
        </div>
      </div>
      <div className="rr-editor-grid2">
        <div>
          <label style={LABEL_STYLE}>Teléfono Encargado</label>
          <input style={INPUT_STYLE} type="tel" placeholder="0414-0000000" value={draft.managerPhone} onChange={(e) => onChange("managerPhone", e.target.value)} />
        </div>
        <div>
          <label style={LABEL_STYLE}>Unidad / Vehículo</label>
          <input style={INPUT_STYLE} type="text" placeholder="Ej: Unidad 03" value={draft.unitOut} onChange={(e) => onChange("unitOut", e.target.value)} />
        </div>
      </div>
      <div className="rr-editor-grid2">
        <div>
          <label style={LABEL_STYLE}>Hora de Salida</label>
          <input style={INPUT_STYLE} type="time" value={draft.departureTime ?? ""} onChange={(e) => onChange("departureTime", e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Hora de Llegada</label>
            <input style={INPUT_STYLE} type="time" value={draft.arrivalTime ?? ""} onChange={(e) => onChange("arrivalTime", e.target.value)} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={!!draft.hasArrivedG1}
                onChange={(e) => onChange("hasArrivedG1", e.target.checked)}
                style={{ margin: 0, cursor: "pointer" }}
              />
              <span>¿Ya llegó?</span>
            </label>
          </div>
        </div>
      </div>

      {/* TOGGLE GRUPO 2 */}
      {!showGroup2 ? (
        <button
          type="button"
          className="sim-btn"
          onClick={handleToggleGroup2}
          style={{
            marginTop: "4px",
            justifyContent: "center",
            padding: "6px",
            fontSize: "0.68rem",
            width: "100%",
            background: "rgba(56, 189, 248, 0.06)",
            border: "1px dashed rgba(56, 189, 248, 0.2)",
            color: "var(--color-info)",
          }}
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
              style={{
                background: "transparent",
                border: "none",
                color: "var(--color-high)",
                fontSize: "0.62rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Remover Grupo 2
            </button>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Grupo Desplegado 2</label>
              <input style={INPUT_STYLE} type="text" placeholder="Nombre del grupo 2" value={draft.groupName2 ?? ""} onChange={(e) => onChange("groupName2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Encargado 2</label>
              <input style={INPUT_STYLE} type="text" placeholder="Nombre" value={draft.managerName2 ?? ""} onChange={(e) => onChange("managerName2", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid3">
            <div>
              <label style={LABEL_STYLE}>Funcionarios 2</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.officersCount2 ?? ""} onChange={(e) => onChange("officersCount2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Rescatados 2</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.rescuedCount2 ?? ""} onChange={(e) => onChange("rescuedCount2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Recuperados 2</label>
              <input style={INPUT_STYLE} type="number" min="0" placeholder="0" value={draft.recoveredCount2 ?? ""} onChange={(e) => onChange("recoveredCount2", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Teléfono Encargado 2</label>
              <input style={INPUT_STYLE} type="tel" placeholder="0414-0000000" value={draft.managerPhone2 ?? ""} onChange={(e) => onChange("managerPhone2", e.target.value)} />
            </div>
            <div>
              <label style={LABEL_STYLE}>Unidad / Vehículo 2</label>
              <input style={INPUT_STYLE} type="text" placeholder="Ej: Unidad 03" value={draft.unitOut2 ?? ""} onChange={(e) => onChange("unitOut2", e.target.value)} />
            </div>
          </div>
          <div className="rr-editor-grid2">
            <div>
              <label style={LABEL_STYLE}>Hora de Salida 2</label>
              <input style={INPUT_STYLE} type="time" value={draft.departureTime2 ?? ""} onChange={(e) => onChange("departureTime2", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Hora de Llegada 2</label>
                <input style={INPUT_STYLE} type="time" value={draft.arrivalTime2 ?? ""} onChange={(e) => onChange("arrivalTime2", e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "6px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!draft.hasArrivedG2}
                    onChange={(e) => onChange("hasArrivedG2", e.target.checked)}
                    style={{ margin: 0, cursor: "pointer" }}
                  />
                  <span>¿Ya llegó?</span>
                </label>
              </div>
            </div>
          </div>
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
          <button
            className="rr-save-btn"
            onClick={onSave}
            disabled={saving}
          >
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
