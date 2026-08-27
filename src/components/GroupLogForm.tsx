import React, { useState, useCallback } from "react";
import type { DailyLog, DepartmentView, GroupLogEntry } from "../types";
import { Save, Check, Shield, Flame, Users, FileText, Plus, Trash2 } from "lucide-react";
import { GroupFields } from "./GroupFields";
import { inputStyle, sectionBox, saveBtnStyle } from "./popup/popupStyles";
import { getGroupColor } from "./popup/metricFields";

import { CustomActivitiesSection } from "./popup/CustomActivitiesSection";

interface GroupLogFormProps {
  draft: DailyLog;
  onChange: (field: keyof DailyLog, value: any) => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
  saved?: boolean;
  compact?: boolean;
  activeDepartment?: DepartmentView;
}

export const GroupLogForm: React.FC<GroupLogFormProps> = ({
  draft,
  onChange,
  onSave,
  saving = false,
  saved = false,
  compact = false,
  activeDepartment,
}) => {
  const groupsArray = draft.groups || [];
  const [showGroup2, setShowGroup2] = useState<boolean>(groupsArray.length > 1);
  const [showGroup3, setShowGroup3] = useState<boolean>(groupsArray.length > 2);
  const [showGroup4, setShowGroup4] = useState<boolean>(groupsArray.length > 3);

  const handleToggleGroup2 = useCallback(() => {
    if (showGroup2) {
      const updated = (draft.groups || []).filter((_, i) => i !== 1);
      onChange("groups" as keyof DailyLog, updated as unknown as string | boolean);
    }
    setShowGroup2(!showGroup2);
  }, [showGroup2, onChange, draft.groups]);

  const handleToggleGroup3 = useCallback(() => {
    if (showGroup3) {
      const updated = (draft.groups || []).filter((_, i) => i !== 2);
      onChange("groups" as keyof DailyLog, updated as unknown as string | boolean);
    }
    setShowGroup3(!showGroup3);
  }, [showGroup3, onChange, draft.groups]);

  const handleToggleGroup4 = useCallback(() => {
    if (showGroup4) {
      const updated = (draft.groups || []).filter((_, i) => i !== 3);
      onChange("groups" as keyof DailyLog, updated as unknown as string | boolean);
    }
    setShowGroup4(!showGroup4);
  }, [showGroup4, onChange, draft.groups]);

  const currentDept = draft.department || "pc";

  const handleGroupFieldChange = (groupIdx: number, field: string, value: string | boolean) => {
    const groups = [...(draft.groups || [])];
    while (groups.length <= groupIdx) groups.push({ id: crypto.randomUUID(), groupName: "" });
    groups[groupIdx] = { ...groups[groupIdx], [field]: value };
    onChange("groups" as keyof DailyLog, groups as unknown as string | boolean);
  };

  const groupAt = (idx: number): GroupLogEntry => {
    const groups = draft.groups || [];
    return groups[idx] || { id: crypto.randomUUID(), groupName: "" };
  };

  const headerStyle = (color: string): React.CSSProperties => ({
    fontSize: "0.63rem",
    fontWeight: 700,
    color,
    paddingBottom: "2px",
    marginBottom: "4px",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "6px" : "8px" }}>
      {activeDepartment === "mixto" && (
        <div style={{ ...sectionBox, background: "rgba(255, 255, 255, 0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
            <Shield size={10} /> Departamento
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              type="button"
              onClick={() => onChange("department", "pc")}
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
              onClick={() => onChange("department", "bomberos")}
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

      {/* GRUPO 1 */}
      <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.03)", borderColor: "rgba(56, 189, 248, 0.15)" }}>
        <div style={headerStyle(getGroupColor(0))}>
          <Users size={9} /> Grupo 1
        </div>
        <GroupFields
          groupIndex={0}
          group={groupAt(0)}
          onGroupFieldChange={handleGroupFieldChange}
          colorVar={getGroupColor(0)}
          hideHeader
        />
      </div>

      {/* TOGGLE GRUPO 2 */}
      {!showGroup2 ? (
        <button
          type="button"
          onClick={handleToggleGroup2}
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
          }}
        >
          <Plus size={11} /> Registrar Segundo Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.15)" }}>
          <div style={headerStyle(getGroupColor(1))}>
            <Users size={9} /> Grupo 2
            <button
              type="button"
              onClick={handleToggleGroup2}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "4px",
                color: "#f87171",
                fontSize: "0.52rem",
                fontWeight: 700,
                padding: "1px 5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Quitar Grupo 2"
            >
              <Trash2 size={8} /> Quitar
            </button>
          </div>
          <GroupFields
            groupIndex={1}
            group={groupAt(1)}
            onGroupFieldChange={handleGroupFieldChange}
            colorVar={getGroupColor(1)}
            hideHeader
          />
        </div>
      )}

      {/* TOGGLE GRUPO 3 */}
      {showGroup2 && (!showGroup3 ? (
        <button
          type="button"
          onClick={handleToggleGroup3}
          style={{
            background: "rgba(251, 146, 60, 0.12)",
            border: "1px solid rgba(251, 146, 60, 0.4)",
            borderRadius: "6px",
            color: "#fb923c",
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
          }}
        >
          <Plus size={11} /> Registrar Tercer Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, background: "rgba(251, 146, 60, 0.03)", borderColor: "rgba(251, 146, 60, 0.15)" }}>
          <div style={headerStyle(getGroupColor(2))}>
            <Users size={9} /> Grupo 3
            <button
              type="button"
              onClick={handleToggleGroup3}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "4px",
                color: "#f87171",
                fontSize: "0.52rem",
                fontWeight: 700,
                padding: "1px 5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Quitar Grupo 3"
            >
              <Trash2 size={8} /> Quitar
            </button>
          </div>
          <GroupFields
            groupIndex={2}
            group={groupAt(2)}
            onGroupFieldChange={handleGroupFieldChange}
            colorVar={getGroupColor(2)}
            hideHeader
          />
        </div>
      ))}

      {/* TOGGLE GRUPO 4 */}
      {showGroup2 && showGroup3 && (!showGroup4 ? (
        <button
          type="button"
          onClick={handleToggleGroup4}
          style={{
            background: "rgba(52, 211, 153, 0.12)",
            border: "1px solid rgba(52, 211, 153, 0.4)",
            borderRadius: "6px",
            color: "#34d399",
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
          }}
        >
          <Plus size={11} /> Registrar Cuarto Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, background: "rgba(52, 211, 153, 0.03)", borderColor: "rgba(52, 211, 153, 0.15)" }}>
          <div style={headerStyle(getGroupColor(3))}>
            <Users size={9} /> Grupo 4
            <button
              type="button"
              onClick={handleToggleGroup4}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "4px",
                color: "#f87171",
                fontSize: "0.52rem",
                fontWeight: 700,
                padding: "1px 5px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
              title="Quitar Grupo 4"
            >
              <Trash2 size={8} /> Quitar
            </button>
          </div>
          <GroupFields
            groupIndex={3}
            group={groupAt(3)}
            onGroupFieldChange={handleGroupFieldChange}
            colorVar={getGroupColor(3)}
            hideHeader
          />
        </div>
      ))}

      {/* Actividades Personalizadas */}
      <CustomActivitiesSection
        customActivities={draft.customActivities || []}
        onChange={(acts) => onChange("customActivities", acts)}
        canEdit={true}
        title="Actividades Personalizadas"
      />

      {/* Observaciones */}
      <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.03)", borderColor: "rgba(168, 85, 247, 0.12)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "#a855f7", paddingBottom: "2px", marginBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "4px" }}>
          <FileText size={10} /> Observación / Notas del Día
        </div>
        <textarea
          style={{ ...inputStyle, resize: "none", height: compact ? "32px" : "42px" }}
          placeholder="Notas u observaciones de las actividades de este día..."
          value={draft.observations || ""}
          onChange={(e) => onChange("observations", e.target.value)}
        />
      </div>

      {/* Save button */}
      {onSave && (
        <div style={{ marginTop: "4px" }}>
          {saved && (
            <span style={{ fontSize: "0.62rem", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px", marginBottom: "4px" }}>
              <Check size={11} /> Guardado
            </span>
          )}
          <button type="button" onClick={onSave} disabled={saving} style={{ ...saveBtnStyle(saved), width: "100%", padding: "8px", fontSize: "0.72rem", fontWeight: 700 }}>
            <Save size={12} />
            {saving ? "Guardando…" : "Guardar registro"}
          </button>
        </div>
      )}
    </div>
  );
};
