import React, { useState, useEffect, useCallback } from "react";
import type { DailyLog, Department, DepartmentView, GroupLogEntry } from "../../types";
import { Save, Check, Shield, Flame, Users, Calendar, Trash2, Plus, Activity, FileText, Link2, Unlink } from "lucide-react";
import { GroupFields } from "../GroupFields";
import { inputStyle, sectionBox, sectionTitleStyle, flatSectionHeaderStyle, saveBtnStyle } from "./popupStyles";
import { COMMISSION_INDEPENDENT, getGroupColor, getMetricValue, METRIC_FIELDS } from "./metricFields";
import { MetricInputs } from "./MetricGrid";
import { useGrouping } from "./useGrouping";
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
  isPolygon?: boolean;
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
  isPolygon = false,
}) => {
  const groupsArray = localLog.groups || [];
  const [activeGroupCount, setActiveGroupCount] = useState<number>(() => Math.max(1, groupsArray.length || 1));

  useEffect(() => {
    setActiveGroupCount(Math.max(1, (localLog.groups || []).length || 1));
  }, [popupEditDate, selectedDept, localLog.groups?.length]);

  const currentDept = localLog.department || selectedDept || "pc";

  const handleGroupFieldChange = useCallback(
    (groupIdx: number, field: string, value: string | boolean) => {
      const groups = [...(localLog.groups || [])];
      while (groups.length <= groupIdx) {
        groups.push({ id: generateUUID(), groupName: "", department: currentDept });
      }
      groups[groupIdx] = {
        ...groups[groupIdx],
        department: groups[groupIdx]?.department || currentDept,
        [field]: value,
      };
      onFieldChange("groups", groups);
    },
    [localLog.groups, currentDept, onFieldChange]
  );

  const handleGroupingFieldChange = useCallback(
    (idx: number, field: string, value: string) => {
      handleGroupFieldChange(idx, field, value);
    },
    [handleGroupFieldChange]
  );

  const {
    groupingMode,
    setGroupingMode,
    selectedIndices,
    handleGroupSelected,
    handleUngroup,
    toggleSelect,
    exitGroupingMode,
  } = useGrouping({
    polygonGroups: groupsArray,
    onGroupFieldChange: handleGroupingFieldChange,
  });

  const groupAt = (idx: number): GroupLogEntry => {
    return groupsArray[idx] || { id: generateUUID(), groupName: "", department: currentDept };
  };

  const clearGroupSlot = (groupNum: number) => {
    const idx = groupNum - 1;
    const groups = [...groupsArray];
    if (idx < groups.length) {
      groups.splice(idx, 1);
      onFieldChange("groups", groups);
    }
    setActiveGroupCount((c) => Math.max(1, c - 1));
  };

  const canGroupTeams = groupsArray.length >= 2;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "32px" }}>
      {/* Selector de Departamento */}
      {activeDepartment === "mixto" && (
        <div style={sectionBox}>
          <div style={sectionTitleStyle}>
            <Shield size={11} style={{ color: "#94a3b8" }} /> Departamento del Registro
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => {
                onFieldChange("department", "pc");
                onDepartmentSelect?.("pc");
              }}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "6px",
                border: currentDept === "pc" ? "1px solid rgba(249, 115, 22, 0.55)" : "1px solid rgba(255, 255, 255, 0.08)",
                background: currentDept === "pc" ? "rgba(249, 115, 22, 0.16)" : "rgba(255, 255, 255, 0.03)",
                color: currentDept === "pc" ? "#fdba74" : "#94a3b8",
                fontSize: "0.68rem",
                fontWeight: 700,
                cursor: "pointer",
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
              onClick={() => {
                onFieldChange("department", "bomberos");
                onDepartmentSelect?.("bomberos");
              }}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: "6px",
                border: currentDept === "bomberos" ? "1px solid rgba(239, 68, 68, 0.55)" : "1px solid rgba(255, 255, 255, 0.08)",
                background: currentDept === "bomberos" ? "rgba(239, 68, 68, 0.16)" : "rgba(255, 255, 255, 0.03)",
                color: currentDept === "bomberos" ? "#fca5a5" : "#94a3b8",
                fontSize: "0.68rem",
                fontWeight: 700,
                cursor: "pointer",
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

      {/* Fecha */}
      <div style={sectionBox}>
        <div style={sectionTitleStyle}>
          <Calendar size={11} style={{ color: "#94a3b8" }} /> Fecha de Operación
        </div>
        <input
          type="date"
          value={popupEditDate}
          onChange={(e) => e.target.value && setPopupEditDate(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer" }}
        />
      </div>

      {/* Sección plana: Equipos de Trabajo (sin tarjeta dentro de tarjeta) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={flatSectionHeaderStyle}>
          <Users size={11} style={{ color: "#94a3b8" }} />
          <span>Equipos de Trabajo</span>
          <span style={{ fontSize: "0.58rem", color: "#64748b", fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>
            ({activeGroupCount} activo{activeGroupCount > 1 ? "s" : ""})
          </span>
          {canGroupTeams && (
            <label
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer",
                userSelect: "none",
                fontSize: "0.6rem",
                fontWeight: 700,
                textTransform: "none",
                letterSpacing: 0,
                color: groupingMode ? "#fdba74" : "#94a3b8",
              }}
              title="Agrupar equipos en comisión conjunta"
            >
              <input
                type="checkbox"
                checked={groupingMode}
                onChange={(e) => {
                  setGroupingMode(e.target.checked);
                  if (!e.target.checked) exitGroupingMode();
                }}
                style={{ cursor: "pointer", width: "11px", height: "11px", accentColor: "#f97316" }}
              />
              Agrupar
            </label>
          )}
          {canGroupTeams && groupingMode && selectedIndices.size >= 2 && (
            <button
              type="button"
              onClick={handleGroupSelected}
              style={{
                background: "rgba(249, 115, 22, 0.16)",
                border: "1px solid rgba(249, 115, 22, 0.45)",
                borderRadius: "5px",
                color: "#fdba74",
                fontSize: "0.6rem",
                fontWeight: 700,
                padding: "2px 7px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <Link2 size={9} /> Unir ({selectedIndices.size})
            </button>
          )}
        </div>

        {Array.from({ length: activeGroupCount }).map((_, i) => {
          const color = getGroupColor(i);
          const grp = groupAt(i);
          const isJoint = !!grp.commissionId && grp.commissionId !== COMMISSION_INDEPENDENT;
          const isSelected = selectedIndices.has(i);

          return (
            <div
              key={grp.id || i}
              style={{
                background: isSelected ? "rgba(249, 115, 22, 0.06)" : "rgba(255, 255, 255, 0.025)",
                border: `1px solid ${isSelected ? "rgba(249, 115, 22, 0.45)" : isJoint ? "rgba(249, 115, 22, 0.3)" : "rgba(255, 255, 255, 0.09)"}`,
                borderRadius: "8px",
                padding: "10px 12px",
                transition: "border-color 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", paddingBottom: "5px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {groupingMode && i < groupsArray.length && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(i)}
                    style={{ cursor: "pointer", width: "12px", height: "12px", accentColor: "#f97316" }}
                    title="Seleccionar para comisión conjunta"
                  />
                )}
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color, display: "flex", alignItems: "center", gap: "5px" }}>
                  <Users size={11} /> Grupo {i + 1}
                </span>

                <label
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: grp.isVolunteer ? "#fdba74" : "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                    cursor: "pointer",
                    background: grp.isVolunteer ? "rgba(249, 115, 22, 0.14)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${grp.isVolunteer ? "rgba(249, 115, 22, 0.4)" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: "4px",
                    padding: "2px 6px",
                  }}
                  title="Marcar equipo como voluntario"
                >
                  <input
                    type="checkbox"
                    checked={!!grp.isVolunteer}
                    onChange={(e) => handleGroupFieldChange(i, "isVolunteer", e.target.checked)}
                    style={{ cursor: "pointer", width: "10px", height: "10px", margin: 0, accentColor: "#f97316" }}
                  />
                  VOL
                </label>

                {isJoint && grp.commissionId && (
                  <button
                    type="button"
                    onClick={() => handleUngroup(grp.commissionId!)}
                    style={{
                      background: "rgba(249, 115, 22, 0.12)",
                      border: "1px solid rgba(249, 115, 22, 0.35)",
                      borderRadius: "4px",
                      color: "#fdba74",
                      fontSize: "0.56rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                    title="Desagrupar comisión conjunta"
                  >
                    <Unlink size={9} /> Conjunta
                  </button>
                )}

                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => clearGroupSlot(i + 1)}
                    style={{
                      marginLeft: "auto",
                      background: "transparent",
                      border: "1px solid rgba(239,68,68,0.3)",
                      borderRadius: "4px",
                      color: "#f87171",
                      fontSize: "0.58rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                    title={`Quitar Grupo ${i + 1}`}
                  >
                    <Trash2 size={9} /> Quitar
                  </button>
                )}
              </div>

              <GroupFields
                groupIndex={i}
                group={grp}
                onGroupFieldChange={handleGroupFieldChange}
                colorVar={color}
                hideHeader
              />

              {/* Estadísticas operativas del grupo */}
              <MetricInputs
                group={grp}
                groupIdx={i}
                onGroupFieldChange={(idx, field, val) => handleGroupFieldChange(idx, field, val)}
                onDepartmentSelect={onDepartmentSelect}
              />
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => setActiveGroupCount((c) => c + 1)}
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px dashed rgba(255, 255, 255, 0.18)",
            borderRadius: "7px",
            color: "#cbd5e1",
            fontSize: "0.68rem",
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            padding: "7px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            transition: "all 0.15s ease",
          }}
        >
          <Plus size={12} /> Añadir Grupo #{activeGroupCount + 1}
        </button>
      </div>

      {/* Estadísticas generales del área o sector (independientes de grupos) */}
      <div style={sectionBox}>
        <div style={sectionTitleStyle}>
          <Activity size={11} style={{ color: "#94a3b8" }} />
          <span>{isPolygon ? "Estadísticas del Sector" : "Estadísticas del Área"}</span>
          <span style={{ fontSize: "0.56rem", color: "#64748b", fontWeight: 500, marginLeft: "auto", textTransform: "none", letterSpacing: 0 }}>
            Independiente de grupos
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "5px" }}>
          {METRIC_FIELDS.map(({ label, field, color }) => (
            <div key={field} style={{ textAlign: "center" }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 700, color, display: "block", marginBottom: "3px", textTransform: "uppercase" }}>
                {label}
              </span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={getMetricValue(localLog, field) || ""}
                onChange={(e) => onFieldChange(field as keyof DailyLog, e.target.value)}
                style={{
                  textAlign: "center",
                  padding: "4px 2px",
                  fontSize: "0.76rem",
                  color: "#f8fafc",
                  background: "rgba(15, 23, 42, 0.85)",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "5px",
                  width: "100%",
                  fontFamily: "var(--font-mono, monospace)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sección: Actividades (catálogo controlado) */}
      <CustomActivitiesSection
        customActivities={localLog.customActivities || []}
        onChange={(acts) => onFieldChange("customActivities", acts)}
        canEdit={true}
        title={isPolygon ? "Actividades del Sector" : "Actividades del Punto"}
      />

      {/* Observaciones del día */}
      <div style={sectionBox}>
        <div style={sectionTitleStyle}>
          <FileText size={11} style={{ color: "#94a3b8" }} /> Observaciones / Notas del Día
        </div>
        <textarea
          style={{ ...inputStyle, minHeight: "56px", resize: "vertical", fontSize: "0.74rem" }}
          placeholder="Notas u observaciones del día..."
          value={localLog.observations || ""}
          onChange={(e) => onFieldChange("observations", e.target.value)}
        />
      </div>

      {/* Único botón Guardar del DailyLog */}
      {saveSuccess && (
        <span style={{ fontSize: "0.66rem", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
          <Check size={12} /> Registro guardado correctamente
        </span>
      )}
      <button type="button" onClick={onSave} style={saveBtnStyle(saveSuccess)}>
        <Save size={13} />
        {saveSuccess ? "Guardado" : "Guardar Registro"}
      </button>
    </div>
  );
};
