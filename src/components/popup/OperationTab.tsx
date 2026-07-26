import React from "react";
import { Save, Plus, Trash2, Calendar, Shield, Flame } from "lucide-react";
import type { DailyLog, DepartmentView, Department, WorkGroup } from "../../types";
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
  workGroups?: WorkGroup[];
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
  workGroups = [],
}) => {
  const getActiveGroupCount = (): number => {
    let maxIdx = 1;
    let idx = 2;
    while (idx <= 50) {
      const idxS = String(idx);
      const hasVal = !!(
        (localLog as any)[`groupName${idxS}`] ||
        (localLog as any)[`unitOut${idxS}`] ||
        (localLog as any)[`managerName${idxS}`] ||
        (localLog as any)[`officersCount${idxS}`]
      );
      if (hasVal) maxIdx = idx;
      idx++;
    }
    return maxIdx;
  };

  const [activeGroupCount, setActiveGroupCount] = React.useState<number>(() => Math.max(1, getActiveGroupCount()));

  const clearGroupSlot = (idx: number) => {
    const idxS = idx > 1 ? String(idx) : "";
    for (const prefix of ["groupName", "unitOut", "managerName", "managerPhone", "officersCount", "departureTime", "arrivalTime", "rescuedCount", "recoveredCount", "rescuedPetsCount", "prehospitalCareCount", "transfersCount", "commissionId", "isVolunteer"]) {
      onFieldChange(`${prefix}${idxS}`, "");
    }
    onFieldChange(`hasArrivedG${idx}`, false);
    if (idx === activeGroupCount && activeGroupCount > 1) {
      setActiveGroupCount((c) => c - 1);
    }
  };

  const GROUP_COLORS = ["var(--color-info)", "var(--color-purple)", "#c084fc", "#fb923c", "#38bdf8", "#4ade80", "#f43f5e", "#a855f7"];
  const getGroupColor = (idx: number) => GROUP_COLORS[(idx - 1) % GROUP_COLORS.length];

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

      {/* Grupos de Trabajo en disposición vertical (soporta N grupos) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {Array.from({ length: activeGroupCount }).map((_, i) => {
          const groupIdx = i + 1;
          return (
            <div key={groupIdx} style={{ ...sectionBox, position: "relative" }}>
              {groupIdx > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: getGroupColor(groupIdx) }}>
                    Grupo #{groupIdx}
                  </span>
                  <button type="button" onClick={() => clearGroupSlot(groupIdx)} style={{ background: "transparent", border: "none", color: "var(--color-high)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title={`Quitar Grupo ${groupIdx}`}>
                    <Trash2 size={10} />
                  </button>
                </div>
              )}
              <GroupFields
                groupIndex={groupIdx}
                log={localLog}
                onFieldChange={onFieldChange as (field: string, value: string | boolean) => void}
                colorVar={getGroupColor(groupIdx)}
                hideHeader={groupIdx > 1}
                workGroups={workGroups}
              />
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveGroupCount((c) => c + 1)}
          style={{ background: "transparent", border: `1px dashed ${getGroupColor(activeGroupCount + 1)}80`, borderRadius: "6px", color: getGroupColor(activeGroupCount + 1), fontSize: "0.62rem", padding: "6px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
        >
          <Plus size={10} /> Añadir Otro Grupo (Grupo #{activeGroupCount + 1})
        </button>
      </div>

      {/* Nota: Las estadísticas por grupo se editan en el Panel de Información */}
      <div style={{ fontSize: "0.58rem", color: "var(--text-muted)", textAlign: "center", padding: "4px 0", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "4px" }}>
        Edita las estadísticas de cada equipo en la pestaña "Información"
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
