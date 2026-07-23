import React from "react";
import type { DailyLog } from "../types";

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

interface GroupFieldsProps {
  groupIndex: 1 | 2;
  log: Partial<DailyLog>;
  onFieldChange: (field: string, value: string | boolean) => void;
  colorVar: string;
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
  style,
  inputStyle: inputStyleProp,
  headerStyle: headerStyleProp,
}) => {
  const isG2 = groupIndex === 2;
  const suffix = isG2 ? "2" : "";
  const fieldsRow1 = isG2 ? GROUP2_FIELDS_ROW1 : GROUP1_FIELDS_ROW1;
  const fieldsRow2 = isG2 ? GROUP2_FIELDS_ROW2 : GROUP1_FIELDS_ROW2;
  const arrivedKey = isG2 ? "hasArrivedG2" : "hasArrivedG1";
  const phoneKey = isG2 ? "managerPhone2" : "managerPhone";
  const departureKey = isG2 ? "departureTime2" : "departureTime";
  const arrivalKey = isG2 ? "arrivalTime2" : "arrivalTime";
  const headerLabel = isG2 ? "Grupo Secundario" : "Grupo Primario";

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

  const rescuedKey = isG2 ? "rescuedCount2" : "rescuedCount";
  const recoveredKey = isG2 ? "recoveredCount2" : "recoveredCount";
  const prehospitalKey = isG2 ? "prehospitalCareCount2" : "prehospitalCareCount";
  const transfersKey = isG2 ? "transfersCount2" : "transfersCount";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      <div style={headerStyleProp || defaultHeaderStyle}>{headerLabel}</div>
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
