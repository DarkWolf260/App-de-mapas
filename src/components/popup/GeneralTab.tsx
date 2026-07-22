import React from "react";
import { Save, Lock } from "lucide-react";
import type { DrawnFeature } from "../../types";
import { inputStyle, labelStyle, saveBtnStyle, PRESET_COLORS } from "./popupStyles";

interface GeneralTabProps {
  activeFeat: DrawnFeature;
  localTitle: string;
  localDescription: string;
  localColor: string;
  generalSaveSuccess: boolean;
  onRename: (title: string) => void;
  onDescription: (desc: string) => void;
  onColor: (color: string) => void;
  onSave: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  activeFeat,
  localTitle,
  localDescription,
  localColor,
  generalSaveSuccess,
  onRename,
  onDescription,
  onColor,
  onSave,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>Nombre del elemento</label>
      <input
        type="text"
        value={localTitle}
        onChange={(e) => onRename(e.target.value)}
        style={inputStyle}
        placeholder="Ej. Punto de Control A"
      />
    </div>

    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>Descripción o notas</label>
      <textarea
        value={localDescription}
        onChange={(e) => onDescription(e.target.value)}
        rows={3}
        style={{ ...inputStyle, resize: "none" }}
        placeholder="Detalles sobre el punto, sector o incidente..."
      />
    </div>

    <div style={{ display: "flex", flexDirection: "column" }}>
      <label style={labelStyle}>Color en el mapa</label>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "2px" }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColor(c)}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: c,
              border: localColor === c ? "2px solid #fff" : "1px solid rgba(0,0,0,0.4)",
              cursor: "pointer",
              boxShadow: localColor === c ? `0 0 8px ${c}` : "none",
              transform: localColor === c ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.15s ease",
            }}
          />
        ))}
      </div>
    </div>

    {activeFeat.locked && (
      <div
        style={{
          fontSize: "0.62rem",
          color: "var(--color-high)",
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          borderRadius: "4px",
          padding: "4px 6px",
          marginTop: "2px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Lock size={10} /> Ubicación bloqueada. Para mover este punto, haz clic en el candado arriba.</span>
      </div>
    )}

    <button type="button" onClick={onSave} style={saveBtnStyle(generalSaveSuccess)}>
      <Save size={12} /> {generalSaveSuccess ? "¡Guardado con éxito!" : "Guardar Cambios"}
    </button>
  </div>
);
