import React from "react";
import { BookUser } from "lucide-react";
import type { DailyLog, WorkGroup } from "../types";

type DailyLogKey = keyof DailyLog;

interface GroupFieldDef {
  key: DailyLogKey;
  placeholder: string;
  type?: string;
  min?: string;
}

const GROUP1_FIELDS_ROW1: [GroupFieldDef, GroupFieldDef] = [
  { key: "groupName", placeholder: "Nombre Grupo" },
  { key: "unitOut", placeholder: "Unidad (Vehículo)" },
];

const GROUP1_FIELDS_ROW2: [GroupFieldDef, GroupFieldDef] = [
  { key: "managerName", placeholder: "Encargado" },
  { key: "officersCount", placeholder: "Cant. Funcs.", type: "number", min: "0" },
];

const GROUP2_FIELDS_ROW1: [GroupFieldDef, GroupFieldDef] = [
  { key: "groupName2", placeholder: "Nombre Grupo 2" },
  { key: "unitOut2", placeholder: "Unidad 2 (Vehículo)" },
];

const GROUP2_FIELDS_ROW2: [GroupFieldDef, GroupFieldDef] = [
  { key: "managerName2", placeholder: "Encargado 2" },
  { key: "officersCount2", placeholder: "Cant. Funcs.", type: "number", min: "0" },
];

const GROUP3_FIELDS_ROW1: [GroupFieldDef, GroupFieldDef] = [
  { key: "groupName3", placeholder: "Nombre Grupo 3" },
  { key: "unitOut3", placeholder: "Unidad 3 (Vehículo)" },
];

const GROUP3_FIELDS_ROW2: [GroupFieldDef, GroupFieldDef] = [
  { key: "managerName3", placeholder: "Encargado 3" },
  { key: "officersCount3", placeholder: "Cant. Funcs.", type: "number", min: "0" },
];

const GROUP4_FIELDS_ROW1: [GroupFieldDef, GroupFieldDef] = [
  { key: "groupName4", placeholder: "Nombre Grupo 4" },
  { key: "unitOut4", placeholder: "Unidad 4 (Vehículo)" },
];

const GROUP4_FIELDS_ROW2: [GroupFieldDef, GroupFieldDef] = [
  { key: "managerName4", placeholder: "Encargado 4" },
  { key: "officersCount4", placeholder: "Cant. Funcs.", type: "number", min: "0" },
];

interface GroupFieldsProps {
  groupIndex: 1 | 2 | 3 | 4;
  log: Partial<DailyLog>;
  onFieldChange: (field: string, value: string | boolean) => void;
  colorVar: string;
  workGroups?: WorkGroup[];
  hideHeader?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
}

function GridRow({ fields, log, onFieldChange, inputStyle }: {
  fields: [GroupFieldDef, GroupFieldDef];
  log: Partial<DailyLog>;
  onFieldChange: (field: string, value: string | boolean) => void;
  inputStyle: React.CSSProperties;
}) {
  const [left, right] = fields;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4px" }}>
      <input
        type={left.type || "text"}
        min={left.min}
        placeholder={left.placeholder}
        value={(log[left.key] as string) || ""}
        onChange={(e) => onFieldChange(left.key, e.target.value)}
        style={inputStyle}
      />
      <input
        type={right.type || "text"}
        min={right.min}
        placeholder={right.placeholder}
        value={(log[right.key] as string) || ""}
        onChange={(e) => onFieldChange(right.key, e.target.value)}
        style={inputStyle}
      />
    </div>
  );
}

export const GroupFields: React.FC<GroupFieldsProps> = ({
  groupIndex,
  log,
  onFieldChange,
  colorVar,
  workGroups = [],
  hideHeader = false,
  style,
  inputStyle: inputStyleProp,
  headerStyle: headerStyleProp,
}) => {
  const idxStr = groupIndex > 1 ? String(groupIndex) : "";
  const fieldsRow1 =
    groupIndex === 4
      ? GROUP4_FIELDS_ROW1
      : groupIndex === 3
      ? GROUP3_FIELDS_ROW1
      : groupIndex === 2
      ? GROUP2_FIELDS_ROW1
      : GROUP1_FIELDS_ROW1;

  const fieldsRow2 =
    groupIndex === 4
      ? GROUP4_FIELDS_ROW2
      : groupIndex === 3
      ? GROUP3_FIELDS_ROW2
      : groupIndex === 2
      ? GROUP2_FIELDS_ROW2
      : GROUP1_FIELDS_ROW2;

  const arrivedKey = (`hasArrivedG${groupIndex}`) as keyof DailyLog;
  const phoneKey = (`managerPhone${idxStr}`) as keyof DailyLog;
  const departureKey = (`departureTime${idxStr}`) as keyof DailyLog;
  const arrivalKey = (`arrivalTime${idxStr}`) as keyof DailyLog;
  const nameKey = (`groupName${idxStr}`) as keyof DailyLog;
  const mgrKey = (`managerName${idxStr}`) as keyof DailyLog;

  const headerLabel =
    groupIndex === 1
      ? "Grupo Primario"
      : groupIndex === 2
      ? "Grupo Secundario"
      : groupIndex === 3
      ? "Tercer Grupo"
      : "Cuarto Grupo";

  const defaultInputStyle: React.CSSProperties = {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "4px",
    color: "var(--text-main)",
    fontSize: "0.62rem",
    padding: "3px 5px",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };
  const inputSt = inputStyleProp || defaultInputStyle;

  const defaultHeaderStyle: React.CSSProperties = {
    fontSize: "0.68rem",
    fontWeight: 800,
    color: colorVar,
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    paddingBottom: "4px",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const rescuedKey = (`rescuedCount${idxStr}`) as keyof DailyLog;
  const recoveredKey = (`recoveredCount${idxStr}`) as keyof DailyLog;
  const prehospitalKey = (`prehospitalCareCount${idxStr}`) as keyof DailyLog;
  const transfersKey = (`transfersCount${idxStr}`) as keyof DailyLog;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {!hideHeader && <div style={headerStyleProp || defaultHeaderStyle}>{headerLabel}</div>}
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
          placeholder={`Teléfono Encargado${suffix}`}
          value={(log[phoneKey] as string) || ""}
          onChange={(e) => onFieldChange(phoneKey, e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "2px" }}>
        <div>
          <span className="rr-editor-label">Hora Salida</span>
          <input
            type="time"
            className="rr-editor-input"
            value={(log[departureKey] as string) || ""}
            onChange={(e) => onFieldChange(departureKey, e.target.value)}
          />
        </div>
        <div>
          <span className="rr-editor-label">Hora Llegada</span>
          <input
            type="time"
            className="rr-editor-input"
            value={(log[arrivalKey] as string) || ""}
            onChange={(e) => onFieldChange(arrivalKey, e.target.value)}
          />
        </div>
      </div>

      <label className="rr-editor-checkbox-label">
        <input
          type="checkbox"
          checked={!!log[arrivedKey]}
          onChange={(e) => onFieldChange(arrivedKey, e.target.checked)}
          style={{ margin: 0, cursor: "pointer", width: "13px", height: "13px" }}
        />
        <span>¿Ya llegó el Grupo{suffix ? " Secundario" : " Primario"}?</span>
      </label>
    </div>
  );
};
