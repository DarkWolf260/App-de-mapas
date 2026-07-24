import React from "react";
import { Save, Plus, Trash2, Calendar, Shield, Flame } from "lucide-react";
import type { DailyLog, DepartmentView, Department } from "../../types";
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
  activeDepartment?: DepartmentView;
  selectedDept?: Department;
  onDepartmentSelect?: (dept: Department) => void;
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
  activeDepartment,
  selectedDept = "pc",
  onDepartmentSelect,
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
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%" }}>
      {/* Header & Date Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Calendar size={13} /> Registro Diario
        </span>
        <input
          type="date"
          value={popupEditDate}
          onChange={(e) => setPopupEditDate(e.target.value)}
          style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--text-main)", fontSize: "0.68rem", padding: "3px 6px", cursor: "pointer", outline: "none" }}
        />
      </div>

      {/* Department Selector for Mixto Mode */}
      {activeDepartment === "mixto" && onDepartmentSelect && (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", background: "rgba(0, 0, 0, 0.25)", padding: "5px 7px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Departamento para Estadísticas y Grupos:
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => onDepartmentSelect("pc")}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                border: selectedDept === "pc" ? "1px solid rgba(56, 189, 248, 0.6)" : "1px solid transparent",
                background: selectedDept === "pc" ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 255, 255, 0.03)",
                color: selectedDept === "pc" ? "var(--color-info)" : "var(--text-muted)",
                fontSize: "0.64rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <Shield size={11} /> Protección Civil
            </button>
            <button
              type="button"
              onClick={() => onDepartmentSelect("bomberos")}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
                border: selectedDept === "bomberos" ? "1px solid rgba(239, 68, 68, 0.6)" : "1px solid transparent",
                background: selectedDept === "bomberos" ? "rgba(239, 68, 68, 0.18)" : "rgba(255, 255, 255, 0.03)",
                color: selectedDept === "bomberos" ? "#ef4444" : "var(--text-muted)",
                fontSize: "0.64rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <Flame size={11} /> Bomberos
            </button>
          </div>
        </div>
      )}

      {/* Grupos en disposición vertical (uno abajo del otro) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
            style={{ background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "6px", color: "var(--text-muted)", fontSize: "0.62rem", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
          >
            <Plus size={10} /> Añadir Segundo Grupo (Secundario)
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
      </div>

      {/* Counts / Métricas Operativas en fila horizontal de 5 columnas */}
      <div style={sectionBox}>
        <div style={sectionHeader("var(--color-green)")}>Resultados Operativos de Hoy</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
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
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Atenc. Prehosp.</span>
            <input type="number" min="0" placeholder="0" value={localLog.prehospitalCareCount || ""} onChange={(e) => onFieldChange("prehospitalCareCount", e.target.value)} style={inputStyle} />
          </div>
          <div>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Traslados</span>
            <input type="number" min="0" placeholder="0" value={localLog.transfersCount || ""} onChange={(e) => onFieldChange("transfersCount", e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", display: "block", marginBottom: "2px", fontWeight: 700, textTransform: "uppercase" }}>Observación del Día</span>
        <textarea
          value={localLog.observations || ""}
          onChange={(e) => onFieldChange("observations", e.target.value)}
          style={{ ...inputStyle, resize: "vertical", height: "60px", minHeight: "45px" }}
          placeholder="Notas u observaciones de hoy..."
        />
      </div>

      {/* Botón Guardar en la parte inferior del Sidebar */}
      <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <button type="button" onClick={onSave} style={{ ...saveBtnStyle(saveSuccess), width: "100%", padding: "10px", fontSize: "0.78rem", fontWeight: 700 }}>
          <Save size={14} /> {saveSuccess ? "¡Registro Guardado!" : "Guardar Registro"}
        </button>
      </div>
    </div>
  );
};
