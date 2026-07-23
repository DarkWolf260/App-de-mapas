import React from "react";
import { Save, Plus, Trash2, Calendar } from "lucide-react";
import type { DailyLog } from "../../types";
import { inputStyle, sectionBox, sectionHeader, saveBtnStyle } from "./popupStyles";
import { GroupFields } from "../GroupFields";

interface OperationTabProps {
  localLog: Partial<DailyLog>;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  showSecondGroup: boolean;
  setShowSecondGroup: (show: boolean) => void;
  onFieldChange: (field: string, val: unknown) => void;
  onSave: () => void;
  saveSuccess: boolean;
}

export const OperationTab: React.FC<OperationTabProps> = ({
  localLog,
  popupEditDate,
  setPopupEditDate,
  showSecondGroup,
  setShowSecondGroup,
  onFieldChange,
  onSave,
  saveSuccess,
}) => {
  const clearGroup2 = () => {
    setShowSecondGroup(false);
    for (const key of ["groupName2", "unitOut2", "managerName2", "managerPhone2", "officersCount2", "departureTime2", "arrivalTime2", "hasArrivedG2"]) {
      onFieldChange(key, key === "hasArrivedG2" ? false : "");
    }
  };

  const groupHeaderStyle = (color: string): React.CSSProperties => ({
    fontSize: "0.62rem",
    fontWeight: 700,
    color,
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    paddingBottom: "2px",
    marginBottom: "2px",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Header & Date Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Calendar size={12} /> Registro Diario
        </span>
        <input
          type="date"
          value={popupEditDate}
          onChange={(e) => setPopupEditDate(e.target.value)}
          style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--text-main)", fontSize: "0.62rem", padding: "2px 4px", cursor: "pointer", outline: "none" }}
        />
      </div>

      {/* Group 1 */}
      <div style={sectionBox}>
        <GroupFields
          groupIndex={1}
          log={localLog}
          onFieldChange={onFieldChange as (field: string, value: string | boolean) => void}
          colorVar="var(--color-info)"
          headerStyle={groupHeaderStyle("var(--color-info)")}
        />
      </div>

      {/* Group 2 */}
      {!showSecondGroup ? (
        <button
          type="button"
          onClick={() => setShowSecondGroup(true)}
          style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "0.62rem", padding: "4px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
        >
          <Plus size={10} /> Añadir Segundo Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-purple)" }}>Grupo Secundario</span>
            <button type="button" onClick={clearGroup2} style={{ background: "transparent", border: "none", color: "var(--color-high)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title="Quitar segundo grupo">
              <Trash2 size={10} />
            </button>
          </div>
          <GroupFields
            groupIndex={2}
            log={localLog}
            onFieldChange={onFieldChange as (field: string, value: string | boolean) => void}
            colorVar="var(--color-purple)"
            headerStyle={{ display: "none" }}
          />
        </div>
      )}

      {/* Counts / Métricas Operativas */}
      <div style={sectionBox}>
        <div style={sectionHeader("var(--color-green)")}>Reportes y Resultados de Hoy</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Rescatados</span>
            <input type="number" min="0" placeholder="0" value={localLog.rescuedCount || ""} onChange={(e) => onFieldChange("rescuedCount", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Recuperados</span>
            <input type="number" min="0" placeholder="0" value={localLog.recoveredCount || ""} onChange={(e) => onFieldChange("recoveredCount", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Mascotas</span>
            <input type="number" min="0" placeholder="0" value={localLog.rescuedPetsCount || ""} onChange={(e) => onFieldChange("rescuedPetsCount", e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", marginTop: "4px" }}>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Atenciones Prehosp.</span>
            <input type="number" min="0" placeholder="0" value={localLog.prehospitalCareCount || ""} onChange={(e) => onFieldChange("prehospitalCareCount", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Traslados Realizados</span>
            <input type="number" min="0" placeholder="0" value={localLog.transfersCount || ""} onChange={(e) => onFieldChange("transfersCount", e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: "4px" }}>
          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Observación del Día</span>
          <textarea
            value={localLog.observations || ""}
            onChange={(e) => onFieldChange("observations", e.target.value)}
            style={{ ...inputStyle, resize: "none", height: "36px" }}
            placeholder="Notas u observaciones de hoy..."
          />
        </div>
      </div>

      <button type="button" onClick={onSave} style={saveBtnStyle(saveSuccess)}>
        <Save size={12} /> {saveSuccess ? "¡Registro Guardado!" : "Guardar Registro"}
      </button>
    </div>
  );
};
