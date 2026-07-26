import React from "react";
import { Save, Plus, Trash2, Calendar, Shield, Flame, Users, FileText } from "lucide-react";
import type { DailyLog, DepartmentView, Department, WorkGroup } from "../../types";
import { inputStyle, labelStyle, sectionBox, saveBtnStyle } from "./popupStyles";
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
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", height: "100%" }}>
      {/* Sección: Registro Diario */}
      <div style={{ ...sectionBox, background: "rgba(34, 197, 94, 0.04)", borderColor: "rgba(34, 197, 94, 0.2)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#22c55e", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Calendar size={10} /> Registro Diario
        </div>
        <input
          type="date"
          value={popupEditDate}
          onChange={(e) => setPopupEditDate(e.target.value)}
          style={{ background: "rgba(0, 0, 0, 0.3)", border: "1px solid var(--border-subtle)", borderRadius: "5px", color: "var(--text-main)", fontSize: "0.68rem", padding: "4px 8px", cursor: "pointer", outline: "none", width: "100%" }}
        />
      </div>

      {/* Sección: Departamento (solo mixto) */}
      {activeDepartment === "mixto" && onDepartmentSelect && (
        <div style={{ ...sectionBox, background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Shield size={10} /> Departamento
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => onDepartmentSelect("pc")}
              style={{
                flex: 1,
                padding: "5px 6px",
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
                padding: "5px 6px",
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

      {/* Sección: Grupos de Trabajo */}
      <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={10} /> Equipos de Trabajo
          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>{activeGroupCount} activo{activeGroupCount > 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: activeGroupCount }).map((_, i) => {
            const groupIdx = i + 1;
            const color = getGroupColor(groupIdx);
            return (
              <div key={groupIdx} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "5px 7px", transition: "all 0.15s ease" }}>
                {groupIdx > 1 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", paddingBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ fontSize: "0.63rem", fontWeight: 700, color }}>
                      Grupo #{groupIdx}
                    </span>
                    <button type="button" onClick={() => clearGroupSlot(groupIdx)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} title={`Quitar Grupo ${groupIdx}`}>
                      <Trash2 size={8} /> Quitar
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: "0.63rem", fontWeight: 700, color, paddingBottom: "2px", marginBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={9} /> Grupo Primario
                  </div>
                )}
                <GroupFields
                  groupIndex={groupIdx}
                  log={localLog}
                  onFieldChange={onFieldChange as (field: string, value: string | boolean) => void}
                  colorVar={color}
                  hideHeader={groupIdx > 1}
                  workGroups={workGroups}
                />
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveGroupCount((c) => c + 1)}
            style={{ background: "transparent", border: `1px dashed ${getGroupColor(activeGroupCount + 1)}80`, borderRadius: "6px", color: getGroupColor(activeGroupCount + 1), fontSize: "0.62rem", padding: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
          >
            <Plus size={10} /> Añadir Grupo #{activeGroupCount + 1}
          </button>
        </div>
      </div>

      {/* Nota */}
      <div style={{ fontSize: "0.56rem", color: "var(--text-muted)", textAlign: "center", padding: "2px 0", fontStyle: "italic" }}>
        Edita las estadísticas de cada equipo en la pestaña "Información"
      </div>

      {/* Sección: Observaciones */}
      <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a855f7", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <FileText size={10} /> Observación del Día
        </div>
        <textarea
          value={localLog.observations || ""}
          onChange={(e) => onFieldChange("observations", e.target.value)}
          style={{ ...inputStyle, resize: "vertical", height: "50px", minHeight: "40px", flex: 1 }}
          placeholder="Notas u observaciones de hoy..."
        />
      </div>

      {/* Botón Guardar */}
      <div style={{ marginTop: "auto" }}>
        <button type="button" onClick={onSave} style={{ ...saveBtnStyle(saveSuccess), width: "100%", padding: "8px", fontSize: "0.75rem", fontWeight: 700 }}>
          <Save size={13} /> {saveSuccess ? "¡Registro Guardado!" : "Guardar Registro"}
        </button>
      </div>
    </div>
  );
};
