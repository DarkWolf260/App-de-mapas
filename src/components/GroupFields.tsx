import React from "react";
import type { GroupLogEntry } from "../types";
import { Time24Input } from "./Time24Input";
import { formatPhone } from "../utils/phoneFormatter";

interface GroupFieldsProps {
  groupIndex: number;
  group: GroupLogEntry;
  onGroupFieldChange: (groupIdx: number, field: string, value: string | boolean) => void;
  colorVar: string;
  hideHeader?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
}

export const GroupFields: React.FC<GroupFieldsProps> = ({
  groupIndex,
  group,
  onGroupFieldChange,
  colorVar: _colorVar,
  hideHeader = false,
  style,
  headerStyle: _headerStyleProp,
}) => {
  const gf = (field: string, value: string | boolean) => onGroupFieldChange(groupIndex, field, value);

  const headerLabel = `Grupo ${groupIndex + 1}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", ...style }}>
      {!hideHeader && (
        <div
          style={
            _headerStyleProp || {
              fontSize: "0.68rem",
              fontWeight: 800,
              color: _colorVar,
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "4px",
              marginBottom: "2px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }
          }
        >
          {headerLabel}
        </div>
      )}

      {/* Row 1: Nombre & Unidad */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px" }}>
        <div>
          <span className="rr-editor-label">Nombre del Grupo</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder={groupIndex === 0 ? "Nombre Grupo" : `Nombre Grupo ${groupIndex + 1}`}
            value={group.groupName || ""}
            onChange={(e) => gf("groupName", e.target.value)}
          />
        </div>
        <div>
          <span className="rr-editor-label">Unidad / Vehículo</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder="Unidad (Vehículo)"
            value={group.unitOut || ""}
            onChange={(e) => gf("unitOut", e.target.value)}
          />
        </div>
      </div>

      {/* Row 2: Encargado, Teléfono, Funcionarios */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1.1fr 0.6fr", gap: "8px" }}>
        <div>
          <span className="rr-editor-label">Encargado / Responsable</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder="Nombre Encargado"
            value={group.managerName || ""}
            onChange={(e) => gf("managerName", e.target.value)}
          />
        </div>
        <div>
          <span className="rr-editor-label">Teléfono</span>
          <input
            type="text"
            className="rr-editor-input"
            placeholder="Ej: 0414-1234567"
            maxLength={12}
            value={group.managerPhone || ""}
            onChange={(e) => gf("managerPhone", formatPhone(e.target.value))}
          />
        </div>
        <div>
          <span className="rr-editor-label">Funcs.</span>
          <input
            type="number"
            min="0"
            className="rr-editor-input"
            placeholder="Cant."
            value={group.officersCount || ""}
            onChange={(e) => gf("officersCount", e.target.value)}
            style={{ textAlign: "center" }}
          />
        </div>
      </div>

      {/* Row 3: Horas en Formato 24 Horas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <div>
          <span className="rr-editor-label">Hora Salida (24h)</span>
          <Time24Input
            value={group.departureTime || ""}
            onChange={(val) => gf("departureTime", val)}
            placeholder="08:00"
          />
        </div>
        <div>
          <span className="rr-editor-label">Hora Llegada (24h)</span>
          <Time24Input
            value={group.arrivalTime || ""}
            onChange={(val) => {
              gf("arrivalTime", val);
              // Al registrar hora de llegada, marcar automáticamente como llegado
              if (val && val.trim()) {
                gf("hasArrived", true);
              }
            }}
            placeholder="17:30"
          />
        </div>
      </div>
    </div>
  );
};
