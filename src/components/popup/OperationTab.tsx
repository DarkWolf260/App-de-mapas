import React from "react";
import { Save, Plus, Trash2, Calendar } from "lucide-react";
import type { DailyLog } from "../../types";
import { inputStyle, sectionBox, sectionHeader, saveBtnStyle } from "./popupStyles";

interface OperationTabProps {
  localLog: Partial<DailyLog>;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  showSecondGroup: boolean;
  setShowSecondGroup: (show: boolean) => void;
  onFieldChange: (field: string, val: unknown) => void;
  onSave: () => void;
  saveSuccess: boolean;
}

export const OperationTab: React.FC<OperationTabProps> = ({
  localLog,
  popupEditDate,
  setPopupEditDate,
  showSecondGroup,
  setShowSecondGroup,
  onFieldChange,
  onSave,
  saveSuccess,
}) => {
  const clearGroup2 = () => {
    setShowSecondGroup(false);
    for (const key of [
      "groupName2", "unitOut2", "managerName2", "managerPhone2",
      "officersCount2", "departureTime2", "arrivalTime2", "hasArrivedG2",
    ]) {
      onFieldChange(key, key === "hasArrivedG2" ? false : "");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {/* Header & Date Selector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
          <Calendar size={12} /> Registro Diario
        </span>
        <input
          type="date"
          value={popupEditDate}
          onChange={(e) => setPopupEditDate(e.target.value)}
          style={{
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "4px",
            color: "var(--text-main)",
            fontSize: "0.62rem",
            padding: "2px 4px",
            cursor: "pointer",
            outline: "none",
          }}
        />
      </div>

      {/* Group 1 */}
      <div style={sectionBox}>
        <div style={sectionHeader("var(--color-info)")}>Grupo Primario</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
          <input type="text" placeholder="Nombre Grupo" value={localLog.groupName} onChange={(e) => onFieldChange("groupName", e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Unidad (Vehículo)" value={localLog.unitOut} onChange={(e) => onFieldChange("unitOut", e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4px" }}>
          <input type="text" placeholder="Encargado" value={localLog.managerName} onChange={(e) => onFieldChange("managerName", e.target.value)} style={inputStyle} />
          <input type="number" min="0" placeholder="Cant. Funcs." value={localLog.officersCount || ""} onChange={(e) => onFieldChange("officersCount", e.target.value)} style={inputStyle} />
        </div>
        <input type="text" placeholder="Teléfono Encargado" value={localLog.managerPhone} onChange={(e) => onFieldChange("managerPhone", e.target.value)} style={inputStyle} />

        <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Salida</span>
            <input type="time" value={localLog.departureTime || ""} onChange={(e) => onFieldChange("departureTime", e.target.value)} style={{ ...inputStyle, padding: "2px 4px" }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Llegada</span>
            <input type="time" value={localLog.arrivalTime || ""} onChange={(e) => onFieldChange("arrivalTime", e.target.value)} style={{ ...inputStyle, padding: "2px 4px" }} />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer", marginTop: "4px" }}>
          <input type="checkbox" checked={!!localLog.hasArrivedG1} onChange={(e) => onFieldChange("hasArrivedG1", e.target.checked)} style={{ margin: 0, cursor: "pointer" }} />
          <span>¿Ya llegó el Grupo Primario?</span>
        </label>
      </div>

      {/* Group 2 */}
      {!showSecondGroup ? (
        <button
          type="button"
          onClick={() => setShowSecondGroup(true)}
          style={{
            background: "transparent",
            border: "1px dashed rgba(255,255,255,0.15)",
            borderRadius: "6px",
            color: "var(--text-muted)",
            fontSize: "0.62rem",
            padding: "4px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.2s ease",
          }}
        >
          <Plus size={10} /> Añadir Segundo Grupo
        </button>
      ) : (
        <div style={{ ...sectionBox, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "2px", marginBottom: "2px" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--color-purple)" }}>Grupo Secundario</span>
            <button type="button" onClick={clearGroup2} style={{ background: "transparent", border: "none", color: "var(--color-high)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title="Quitar segundo grupo">
              <Trash2 size={10} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            <input type="text" placeholder="Nombre Grupo 2" value={localLog.groupName2 || ""} onChange={(e) => onFieldChange("groupName2", e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Unidad 2 (Vehículo)" value={localLog.unitOut2 || ""} onChange={(e) => onFieldChange("unitOut2", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4px" }}>
            <input type="text" placeholder="Encargado 2" value={localLog.managerName2 || ""} onChange={(e) => onFieldChange("managerName2", e.target.value)} style={inputStyle} />
            <input type="number" min="0" placeholder="Cant. Funcs." value={localLog.officersCount2 || ""} onChange={(e) => onFieldChange("officersCount2", e.target.value)} style={inputStyle} />
          </div>
          <input type="text" placeholder="Teléfono Encargado 2" value={localLog.managerPhone2 || ""} onChange={(e) => onFieldChange("managerPhone2", e.target.value)} style={inputStyle} />

          <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Salida 2</span>
              <input type="time" value={localLog.departureTime2 || ""} onChange={(e) => onFieldChange("departureTime2", e.target.value)} style={{ ...inputStyle, padding: "2px 4px" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.55rem", color: "var(--text-muted)" }}>H. Llegada 2</span>
              <input type="time" value={localLog.arrivalTime2 || ""} onChange={(e) => onFieldChange("arrivalTime2", e.target.value)} style={{ ...inputStyle, padding: "2px 4px" }} />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.62rem", color: "var(--text-muted)", cursor: "pointer", marginTop: "4px" }}>
            <input type="checkbox" checked={!!localLog.hasArrivedG2} onChange={(e) => onFieldChange("hasArrivedG2", e.target.checked)} style={{ margin: 0, cursor: "pointer" }} />
            <span>¿Ya llegó el Grupo Secundario?</span>
          </label>
        </div>
      )}

      {/* Counts */}
      <div style={sectionBox}>
        <div style={sectionHeader("var(--color-green)")}>Reportes de Hoy</div>
        <div style={{ display: "flex", gap: "4px" }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Rescatados</span>
            <input type="number" min="0" placeholder="0" value={localLog.rescuedCount || ""} onChange={(e) => onFieldChange("rescuedCount", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Recuperados</span>
            <input type="number" min="0" placeholder="0" value={localLog.recoveredCount || ""} onChange={(e) => onFieldChange("recoveredCount", e.target.value)} style={inputStyle} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Mascotas</span>
            <input type="number" min="0" placeholder="0" value={localLog.rescuedPetsCount || ""} onChange={(e) => onFieldChange("rescuedPetsCount", e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ marginTop: "4px" }}>
          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", display: "block", marginBottom: "1px" }}>Observación del Día</span>
          <textarea
            value={localLog.observations || ""}
            onChange={(e) => onFieldChange("observations", e.target.value)}
            style={{ ...inputStyle, resize: "none", height: "36px" }}
            placeholder="Notas u observaciones de hoy..."
          />
        </div>
      </div>

      <button type="button" onClick={onSave} style={saveBtnStyle(saveSuccess)}>
        <Save size={12} /> {saveSuccess ? "¡Registro Guardado!" : "Guardar Registro"}
      </button>
    </div>
  );
};
