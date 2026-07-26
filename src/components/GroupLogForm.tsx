import React, { useState, useCallback } from "react";
import type { DailyLog, DepartmentView, WorkGroup } from "../types";
import { Save, Check, Shield, Flame, BookUser, Users, FileText, Plus, Trash2 } from "lucide-react";
import { GroupFields } from "./GroupFields";
import { inputStyle, labelStyle, sectionBox, saveBtnStyle } from "./popup/popupStyles";

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
  const [showGroup2, setShowGroup2] = useState<boolean>(
    !!(draft.groupName2 || draft.unitOut2 || draft.managerName2 || draft.officersCount2)
  );
  const [showGroup3, setShowGroup3] = useState<boolean>(
    !!(draft.groupName3 || draft.unitOut3 || draft.managerName3 || draft.officersCount3)
  );
  const [showGroup4, setShowGroup4] = useState<boolean>(
    !!(draft.groupName4 || draft.unitOut4 || draft.managerName4 || draft.officersCount4)
  );

  const handleToggleGroup2 = useCallback(() => {
    if (showGroup2) {
      for (const key of ["groupName2", "managerName2", "managerPhone2", "unitOut2", "officersCount2", "rescuedCount2", "recoveredCount2", "hasArrivedG2"]) {
        onChange(key as keyof DailyLog, key === "hasArrivedG2" ? false : "");
      }
    }
    setShowGroup2(!showGroup2);
  }, [showGroup2, onChange]);

  const handleToggleGroup3 = useCallback(() => {
    if (showGroup3) {
      for (const key of ["groupName3", "managerName3", "managerPhone3", "unitOut3", "officersCount3", "rescuedCount3", "recoveredCount3", "hasArrivedG3"]) {
        onChange(key as keyof DailyLog, key === "hasArrivedG3" ? false : "");
      }
    }
    setShowGroup3(!showGroup3);
  }, [showGroup3, onChange]);

  const handleToggleGroup4 = useCallback(() => {
    if (showGroup4) {
      for (const key of ["groupName4", "managerName4", "managerPhone4", "unitOut4", "officersCount4", "rescuedCount4", "recoveredCount4", "hasArrivedG4"]) {
        onChange(key as keyof DailyLog, key === "hasArrivedG4" ? false : "");
      }
    }
    setShowGroup4(!showGroup4);
  }, [showGroup4, onChange]);

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

  const GROUP_COLORS = ["#22c55e", "var(--color-info)", "var(--color-purple)", "#c084fc", "#fb923c"];
  const getGroupColor = (idx: number) => GROUP_COLORS[(idx - 1) % GROUP_COLORS.length];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "6px" : "8px" }}>
      {workGroups.length > 0 && (
        <div style={{ ...sectionBox, background: "rgba(56,189,248,0.04)", borderColor: "rgba(56,189,248,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
            <BookUser size={10} style={{ color: "var(--color-info)", flexShrink: 0 }} />
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
        </div>
      )}

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
      <div style={{ ...sectionBox, background: "rgba(34, 197, 94, 0.04)", borderColor: "rgba(34, 197, 94, 0.2)" }}>
        <div style={{ fontSize: "0.62rem", fontWeight: 700, color: getGroupColor(1), paddingBottom: "2px", marginBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Users size={10} /> Grupo Primario
        </div>
        <GroupFields
          groupIndex={1}
          log={draft}
          onFieldChange={onChange as (field: string, value: string | boolean) => void}
          colorVar={getGroupColor(1)}
          workGroups={workGroups}
        />
      </div>

      {/* TOGGLE GRUPO 2 */}
      {!showGroup2 ? (
        <button
          type="button"
          onClick={handleToggleGroup2}
          style={{ background: "transparent", border: `1px dashed ${getGroupColor(2)}80`, borderRadius: "6px", color: getGroupColor(2), fontSize: "0.62rem", padding: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
        >
          <Plus size={10} /> Registrar Segundo Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, background: "rgba(56, 189, 248, 0.04)", borderColor: "rgba(56, 189, 248, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "2px", marginBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: getGroupColor(2), display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={9} /> Grupo 2 (Opcional)
            </span>
            <button type="button" onClick={handleToggleGroup2} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
              <Trash2 size={8} /> Remover
            </button>
          </div>
          <GroupFields
            groupIndex={2}
            log={draft}
            onFieldChange={onChange as (field: string, value: string | boolean) => void}
            colorVar={getGroupColor(2)}
            hideHeader
            workGroups={workGroups}
          />
        </div>
      )}

      {/* TOGGLE GRUPO 3 */}
      {showGroup2 && (!showGroup3 ? (
        <button
          type="button"
          onClick={handleToggleGroup3}
          style={{ background: "transparent", border: `1px dashed ${getGroupColor(3)}80`, borderRadius: "6px", color: getGroupColor(3), fontSize: "0.62rem", padding: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
        >
          <Plus size={10} /> Registrar Tercer Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, background: "rgba(168, 85, 247, 0.04)", borderColor: "rgba(168, 85, 247, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "2px", marginBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: getGroupColor(3), display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={9} /> Grupo 3 (Opcional)
            </span>
            <button type="button" onClick={handleToggleGroup3} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
              <Trash2 size={8} /> Remover
            </button>
          </div>
          <GroupFields
            groupIndex={3}
            log={draft}
            onFieldChange={onChange as (field: string, value: string | boolean) => void}
            colorVar={getGroupColor(3)}
            hideHeader
            workGroups={workGroups}
          />
        </div>
      ))}

      {/* TOGGLE GRUPO 4 */}
      {showGroup2 && showGroup3 && (!showGroup4 ? (
        <button
          type="button"
          onClick={handleToggleGroup4}
          style={{ background: "transparent", border: `1px dashed ${getGroupColor(4)}80`, borderRadius: "6px", color: getGroupColor(4), fontSize: "0.62rem", padding: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s ease" }}
        >
          <Plus size={10} /> Registrar Cuarto Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, background: "rgba(251, 146, 60, 0.04)", borderColor: "rgba(251, 146, 60, 0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "2px", marginBottom: "2px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: getGroupColor(4), display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={9} /> Grupo 4 (Opcional)
            </span>
            <button type="button" onClick={handleToggleGroup4} style={{ marginLeft: "auto", background: "transparent", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "4px", color: "#f87171", fontSize: "0.52rem", fontWeight: 700, padding: "1px 5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}>
              <Trash2 size={8} /> Remover
            </button>
          </div>
          <GroupFields
            groupIndex={4}
            log={draft}
            onFieldChange={onChange as (field: string, value: string | boolean) => void}
            colorVar={getGroupColor(4)}
            hideHeader
            workGroups={workGroups}
          />
        </div>
      ))}

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
          {saved && <span style={{ fontSize: "0.62rem", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px", marginBottom: "4px" }}><Check size={11} /> Guardado</span>}
          <button type="button" onClick={onSave} disabled={saving} style={{ ...saveBtnStyle(saved), width: "100%", padding: "8px", fontSize: "0.72rem", fontWeight: 700 }}>
            <Save size={12} />
            {saving ? "Guardando…" : "Guardar registro"}
          </button>
        </div>
      )}
    </div>
  );
};

export { inputStyle as INPUT_STYLE_CONST, labelStyle as LABEL_STYLE_CONST } from "./popup/popupStyles";
