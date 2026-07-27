import React from "react";
import { BookUser } from "lucide-react";
import type { DailyLog, WorkGroup } from "../types";

interface GroupFieldsProps {
  groupIndex: number;
  log: Partial<DailyLog>;
  onFieldChange: (field: string, value: string | boolean) => void;
  colorVar: string;
  workGroups?: WorkGroup[];
  hideHeader?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
}

export const GroupFields: React.FC<GroupFieldsProps> = ({
  groupIndex,
  log,
  onFieldChange,
  _colorVar,
  workGroups = [],
  hideHeader = false,
  style,
  inputStyle: _inputStyleProp,
  headerStyle: _headerStyleProp,
}) => {
  const idxStr = groupIndex > 1 ? String(groupIndex) : "";

  const phoneKey = (`managerPhone${idxStr}`) as keyof DailyLog;
  const nameKey = (`groupName${idxStr}`) as keyof DailyLog;
  const mgrKey = (`managerName${idxStr}`) as keyof DailyLog;

  const fieldsRow1 = [
    { key: (`groupName${idxStr}`) as keyof DailyLog, placeholder: groupIndex === 1 ? "Nombre Grupo" : `Nombre Grupo ${groupIndex}` },
    { key: (`unitOut${idxStr}`) as keyof DailyLog, placeholder: groupIndex === 1 ? "Unidad (Vehículo)" : `Unidad ${groupIndex} (Vehículo)` },
  ] as const;

  const fieldsRow2 = [
    { key: (`managerName${idxStr}`) as keyof DailyLog, placeholder: groupIndex === 1 ? "Encargado" : `Encargado ${groupIndex}` },
    { key: (`officersCount${idxStr}`) as keyof DailyLog, placeholder: "Cant. Funcs.", type: "number", min: "0" },
  ] as const;

  const headerLabel = `Grupo ${groupIndex}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {!hideHeader && <div style={_headerStyleProp || { fontSize: "0.68rem", fontWeight: 800, color: _colorVar, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{headerLabel}</div>}
      {workGroups && workGroups.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: "5px", padding: "4px 8px", marginBottom: "2px" }}>
          <BookUser size={12} style={{ color: "#38bdf8", flexShrink: 0 }} />
          <select
            defaultValue=""
            onChange={(e) => {
              const wg = workGroups.find((g) => g.id === e.target.value);
              if (wg) {
                onFieldChange(nameKey, wg.name);
                if (wg.leaderName) onFieldChange(mgrKey, wg.leaderName);
                if (wg.leaderPhone) onFieldChange(phoneKey, wg.leaderPhone);
              }
              e.target.value = "";
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#38bdf8",
              fontSize: "0.66rem",
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
              flex: 1,
              fontFamily: "inherit"
            }}
          >
            <option value="" disabled style={{ background: "#0f172a", color: "#94a3b8" }}>
              Autocompletar desde Grupo de Trabajo…
            </option>
            {[...workGroups]
              .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
              .map((wg) => (
                <option key={wg.id} value={wg.id} style={{ background: "#0f172a", color: "#e2e8f0" }}>
                  {wg.name} {wg.leaderName ? `— Enc: ${wg.leaderName}` : ""}
                </option>
              ))}
          </select>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "6px" }}>
        <div>
          <span className="rr-editor-label">Nombre del Grupo</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder={fieldsRow1[0].placeholder}
            value={(log[fieldsRow1[0].key] as string) || ""}
            onChange={(e) => onFieldChange(fieldsRow1[0].key, e.target.value)}
          />
        </div>
        <div>
          <span className="rr-editor-label">Unidad / Vehículo</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder={fieldsRow1[1].placeholder}
            value={(log[fieldsRow1[1].key] as string) || ""}
            onChange={(e) => onFieldChange(fieldsRow1[1].key, e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "6px" }}>
        <div>
          <span className="rr-editor-label">Encargado / Responsable</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder={fieldsRow2[0].placeholder}
            value={(log[fieldsRow2[0].key] as string) || ""}
            onChange={(e) => onFieldChange(fieldsRow2[0].key, e.target.value)}
          />
        </div>
        <div>
          <span className="rr-editor-label">Funcionarios</span>
          <input
            type="number"
            min="0"
            className="rr-editor-input"
            placeholder={fieldsRow2[1].placeholder}
            value={(log[fieldsRow2[1].key] as string) || ""}
            onChange={(e) => onFieldChange(fieldsRow2[1].key, e.target.value)}
          />
        </div>
      </div>

      <div>
        <span className="rr-editor-label">Teléfono de Contacto</span>
        <input
          type="text"
          className="rr-editor-input"
          placeholder={groupIndex === 1 ? "Teléfono Encargado" : `Teléfono Encargado ${groupIndex}`}
          value={(log[phoneKey] as string) || ""}
          onChange={(e) => onFieldChange(phoneKey, e.target.value)}
        />
      </div>

    </div>
  );
};
