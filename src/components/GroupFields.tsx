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

  const fieldsRow1: [GroupFieldDef, GroupFieldDef] = [
    { key: (`groupName${idxStr}`) as keyof DailyLog, placeholder: groupIndex === 1 ? "Nombre Grupo" : `Nombre Grupo ${groupIndex}` },
    { key: (`unitOut${idxStr}`) as keyof DailyLog, placeholder: groupIndex === 1 ? "Unidad (Vehículo)" : `Unidad ${groupIndex} (Vehículo)` },
  ];

  const fieldsRow2: [GroupFieldDef, GroupFieldDef] = [
    { key: (`managerName${idxStr}`) as keyof DailyLog, placeholder: groupIndex === 1 ? "Encargado" : `Encargado ${groupIndex}` },
    { key: (`officersCount${idxStr}`) as keyof DailyLog, placeholder: "Cant. Funcs.", type: "number", min: "0" },
  ];

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
      : `Grupo ${groupIndex}`;

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

  const rescuedKey = (idxStr ? `rescuedCount${idxStr}` : "rescuedCount") as keyof DailyLog;
  const recoveredKey = (idxStr ? `recoveredCount${idxStr}` : "recoveredCount") as keyof DailyLog;
  const prehospitalKey = (idxStr ? `prehospitalCareCount${idxStr}` : "prehospitalCareCount") as keyof DailyLog;
  const transfersKey = (idxStr ? `transfersCount${idxStr}` : "transfersCount") as keyof DailyLog;

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
          placeholder={groupIndex === 1 ? "Teléfono Encargado" : `Teléfono Encargado ${groupIndex}`}
          value={(log[phoneKey] as string) || ""}
          onChange={(e) => onFieldChange(phoneKey, e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", background: "rgba(0, 0, 0, 0.2)", padding: "4px 6px", borderRadius: "5px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
        <div>
          <span className="rr-editor-label">Modalidad / Agrupación</span>
          <select
            value={((log[(`commissionId${idxStr}`) as keyof DailyLog] as string) || (log.groups?.[groupIndex - 1]?.commissionId) || "independiente")}
            onChange={(e) => onFieldChange((`commissionId${idxStr}`), e.target.value)}
            style={{
              width: "100%",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "4px",
              color: "var(--text-main)",
              fontSize: "0.6rem",
              padding: "3px 4px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="independiente" style={{ background: "#0f172a" }}>Trabajo Independiente</option>
            {Array.from({ length: 10 }).map((_, cIdx) => {
              const num = cIdx + 1;
              return (
                <option key={num} value={`comision_${num}`} style={{ background: "#0f172a" }}>
                  Comisión Conjunta {num}
                </option>
              );
            })}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
          <label style={{ fontSize: "0.62rem", color: "#c084fc", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={!!((log[(`isVolunteer${idxStr}`) as keyof DailyLog] as boolean) || (log.groups?.[groupIndex - 1]?.isVolunteer))}
              onChange={(e) => onFieldChange((`isVolunteer${idxStr}`), e.target.checked)}
              style={{ cursor: "pointer", width: "12px", height: "12px" }}
            />
            <span>Grupo Voluntario</span>
          </label>
        </div>
      </div>

      {/* Métricas Operativas */}
      {(() => {
        const currentComm = (log[(`commissionId${idxStr}`) as keyof DailyLog] as string) || (log.groups?.[groupIndex - 1]?.commissionId) || "independiente";
        let primaryGroupIndex = 0;
        if (currentComm !== "independiente") {
          for (let i = 1; i < groupIndex; i++) {
            const idxS = i > 1 ? String(i) : "";
            const commI = (log[(`commissionId${idxS}`) as keyof DailyLog] as string) || (log.groups?.[i - 1]?.commissionId) || "comision_1";
            if (commI === currentComm) {
              primaryGroupIndex = i;
              break;
            }
          }
        }

        const commLabel = currentComm.startsWith("comision_")
          ? `Comisión Conjunta ${currentComm.replace("comision_", "")}`
          : "Trabajo Independiente";

        if (primaryGroupIndex > 0) {
          return (
            <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px dashed rgba(56, 189, 248, 0.3)", borderRadius: "5px", padding: "6px 8px", fontSize: "0.62rem", color: "#38bdf8" }}>
              Métricas compartidas para <strong>{commLabel}</strong> (registradas en Grupo #{primaryGroupIndex})
            </div>
          );
        }

        return (
          <div style={{ background: "rgba(0, 0, 0, 0.25)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "5px", padding: "6px" }}>
            <span className="rr-editor-label" style={{ fontWeight: 700, color: "var(--color-info)", marginBottom: "4px", display: "block" }}>
              Métricas Operativas — {currentComm === "independiente" ? `Grupo #${groupIndex} (Trabajo Independiente)` : commLabel}
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", marginBottom: "4px" }}>
              <div>
                <span className="rr-editor-label">Rescatados</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rr-editor-input"
                  value={(log[rescuedKey] as string) || ""}
                  onChange={(e) => onFieldChange(rescuedKey, e.target.value)}
                />
              </div>
              <div>
                <span className="rr-editor-label">Recuperados</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rr-editor-input"
                  value={(log[recoveredKey] as string) || ""}
                  onChange={(e) => onFieldChange(recoveredKey, e.target.value)}
                />
              </div>
              <div>
                <span className="rr-editor-label">Mascotas</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rr-editor-input"
                  value={((log[(idxStr ? `rescuedPetsCount${idxStr}` : "rescuedPetsCount") as keyof DailyLog] as string) || "")}
                  onChange={(e) => onFieldChange((idxStr ? `rescuedPetsCount${idxStr}` : "rescuedPetsCount"), e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              <div>
                <span className="rr-editor-label">Atenciones Prehosp.</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rr-editor-input"
                  value={(log[prehospitalKey] as string) || ""}
                  onChange={(e) => onFieldChange(prehospitalKey, e.target.value)}
                />
              </div>
              <div>
                <span className="rr-editor-label">Traslados Realizados</span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  className="rr-editor-input"
                  value={(log[transfersKey] as string) || ""}
                  onChange={(e) => onFieldChange(transfersKey, e.target.value)}
                />
              </div>
            </div>
          </div>
        );
      })()}

      <label className="rr-editor-checkbox-label">
        <input
          type="checkbox"
          checked={!!log[arrivedKey]}
          onChange={(e) => onFieldChange(arrivedKey, e.target.checked)}
          style={{ margin: 0, cursor: "pointer", width: "13px", height: "13px" }}
        />
        <span>¿Ya llegó del sitio el {headerLabel}?</span>
      </label>
    </div>
  );
};
