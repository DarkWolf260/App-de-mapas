import React from "react";
import type { GroupLogEntry } from "../types";

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
  _colorVar,
  hideHeader = false,
  style,
  inputStyle: _inputStyleProp,
  headerStyle: _headerStyleProp,
}) => {
  const gf = (field: string, value: string | boolean) => onGroupFieldChange(groupIndex, field, value);

  const headerLabel = `Grupo ${groupIndex + 1}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", ...style }}>
      {!hideHeader && <div style={_headerStyleProp || { fontSize: "0.68rem", fontWeight: 800, color: _colorVar, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "4px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{headerLabel}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "6px" }}>
        <div>
          <span className="rr-editor-label">Nombre del Grupo</span>
          <input type="text" className="rr-editor-input" placeholder={groupIndex === 0 ? "Nombre Grupo" : `Nombre Grupo ${groupIndex + 1}`} value={group.groupName || ""} onChange={(e) => gf("groupName", e.target.value)} />
        </div>
        <div>
          <span className="rr-editor-label">Unidad / Vehiculo</span>
          <input type="text" className="rr-editor-input" placeholder={groupIndex === 0 ? "Unidad (Vehiculo)" : `Unidad ${groupIndex + 1} (Vehiculo)`} value={group.unitOut || ""} onChange={(e) => gf("unitOut", e.target.value)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "6px" }}>
        <div>
          <span className="rr-editor-label">Encargado / Responsable</span>
          <input type="text" className="rr-editor-input" placeholder={groupIndex === 0 ? "Encargado" : `Encargado ${groupIndex + 1}`} value={group.managerName || ""} onChange={(e) => gf("managerName", e.target.value)} />
        </div>
        <div>
          <span className="rr-editor-label">Funcionarios</span>
          <input type="number" min="0" className="rr-editor-input" placeholder="Cant. Funcs." value={group.officersCount || ""} onChange={(e) => gf("officersCount", e.target.value)} />
        </div>
      </div>
      <div>
        <span className="rr-editor-label">Telefono de Contacto</span>
        <input type="text" className="rr-editor-input" placeholder={groupIndex === 0 ? "Telefono Encargado" : `Telefono Encargado ${groupIndex + 1}`} value={group.managerPhone || ""} onChange={(e) => gf("managerPhone", e.target.value)} />
      </div>
    </div>
  );
};
