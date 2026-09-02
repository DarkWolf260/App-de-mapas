import React, { useState } from "react";
import type { DailyLog, Department, DepartmentView, GroupLogEntry } from "../../types";
import { Save, Check, Shield, Flame, Users, Calendar, Trash2, Plus } from "lucide-react";
import { GroupFields } from "../GroupFields";
import { inputStyle, sectionBox, saveBtnStyle } from "./popupStyles";
import { GROUP_COLORS, getGroupColor } from "./metricFields";
import { generateUUID } from "../../utils/uuidUtils";

import { CustomActivitiesSection } from "./CustomActivitiesSection";

interface OperationTabProps {
  localLog: DailyLog;
  popupEditDate: string;
  setPopupEditDate: (d: string) => void;
  onFieldChange: (field: keyof DailyLog, value: any) => void;
  onSave: () => Promise<void>;
  saveSuccess: boolean;
  activeDepartment?: DepartmentView;
  selectedDept?: Department;
  onDepartmentSelect?: (dept: Department) => void;
}

export const OperationTab: React.FC<OperationTabProps> = ({
  localLog,
  popupEditDate,
  setPopupEditDate,
  onFieldChange,
  onSave,
  saveSuccess,
  activeDepartment,
  selectedDept = "pc",
  onDepartmentSelect,
}) => {
  const groupsArray = localLog.groups || [];
  const [activeGroupCount, setActiveGroupCount] = useState<number>(() => Math.max(1, groupsArray.length || 1));

  const handleGroupFieldChange = (groupIdx: number, field: string, value: string | boolean) => {
    const groups = [...(localLog.groups || [])];
    while (groups.length <= groupIdx) groups.push({ id: generateUUID(), groupName: "" });
    groups[groupIdx] = { ...groups[groupIdx], [field]: value };
    onFieldChange("groups", groups as unknown as string | boolean);
  };

  const groupAt = (idx: number): GroupLogEntry => {
    const groups = localLog.groups || [];
    return groups[idx] || { id: generateUUID(), groupName: "" };
  };

  const clearGroupSlot = (groupNum: number) => {
    const idx = groupNum - 1;
    const groups = [...(localLog.groups || [])];
    if (idx < groups.length) {
      groups.splice(idx, 1);
      onFieldChange("groups", groups as unknown as string | boolean);
    }
    setActiveGroupCount((c) => Math.max(1, c - 1));
  };

  const currentDept = localLog.department || selectedDept || "pc";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Selector de Departamento */}
      {activeDepartment === "mixto" && (
        <div style={{ ...sectionBox, background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Shield size={10} /> Departamento del Registro
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => {
                onFieldChange("department", "pc");
                onDepartmentSelect?.("pc");
              }}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
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
              onClick={() => {
                onFieldChange("department", "bomberos");
                onDepartmentSelect?.("bomberos");
              }}
              style={{
                flex: 1,
                padding: "4px 6px",
                borderRadius: "6px",
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

      {/* Fecha */}
      <div style={{ ...sectionBox, background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Calendar size={10} /> Fecha de Operación
        </div>
        <input
          type="date"
          value={popupEditDate}
          onChange={(e) => e.target.value && setPopupEditDate(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        />
      </div>

      {/* Sección: Grupos de Trabajo */}
      <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={10} /> Equipos de Trabajo
          <span style={{ fontSize: "0.5rem", color: "var(--text-muted)", fontWeight: 400, marginLeft: "auto" }}>{activeGroupCount} activo{activeGroupCount > 1 ? "s" : ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: activeGroupCount }).map((_, i) => {
            const color = getGroupColor(i);
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", padding: "5px 7px", transition: "all 0.15s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px", paddingBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ fontSize: "0.63rem", fontWeight: 700, color, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Users size={9} /> Grupo {i + 1}
                  </span>
                  {i > 0 && (
                    <button type="button" onClick={() => clearGroupSlot(i + 1)} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }} title={`Quitar Grupo ${i + 1}`}>
                      <Trash2 size={8} /> Quitar
                    </button>
                  )}
                </div>
                <GroupFields
                  groupIndex={i}
                  group={groupAt(i)}
                  onGroupFieldChange={handleGroupFieldChange}
                  colorVar={color}
                  hideHeader
                />
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => setActiveGroupCount((c) => c + 1)}
            style={{
              background: "rgba(168, 85, 247, 0.12)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "6px",
              color: "#c084fc",
              fontSize: "0.65rem",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              letterSpacing: "0.02em",
              padding: "5px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              transition: "all 0.2s ease",
              marginTop: "4px",
            }}
          >
            <Plus size={11} /> Añadir Grupo #{activeGroupCount + 1}
          </button>
        </div>
      </div>

      {/* Nota */}
      <div style={{ fontSize: "0.56rem", color: "var(--text-muted)", textAlign: "center", padding: "2px 0", fontStyle: "italic" }}>
        Edita las estadísticas de cada equipo en la pestaña "Información"
      </div>

      {/* Sección: Actividades Personalizadas */}
      <CustomActivitiesSection
        customActivities={localLog.customActivities || []}
        onChange={(acts) => onFieldChange("customActivities", acts as any)}
        canEdit={true}
        title="Actividades Personalizadas"
      />

      {/* Botón Guardar */}
      {saveSuccess && (
        <span style={{ fontSize: "0.62rem", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
          <Check size={11} /> Guardado correctamente
        </span>
      )}
      <button type="button" onClick={onSave} style={saveBtnStyle(saveSuccess)}>
        <Save size={13} />
        {saveSuccess ? "Guardado" : "Guardar Registro"}
      </button>
    </div>
  );
};
