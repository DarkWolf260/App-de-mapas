import React from "react";
import { Plus } from "lucide-react";
import { sectionBox } from "../popup/popupStyles";

interface NovedadesAddFormProps {
  novText: string;
  setNovText: (val: string) => void;
  novTime: string;
  setNovTime: (val: string) => void;
  handleAddNovedad: () => Promise<void>;
}

export const NovedadesAddForm: React.FC<NovedadesAddFormProps> = ({ novText, setNovText, novTime, setNovTime, handleAddNovedad }) => (
  <div style={{ ...sectionBox, background: "rgba(34, 197, 94, 0.03)", borderColor: "rgba(34, 197, 94, 0.15)" }}>
    <div
      style={{
        fontSize: "0.62rem",
        fontWeight: 700,
        color: "var(--color-green)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        paddingBottom: "6px",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <Plus size={10} /> Nueva Entrada
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Novedad</span>
        <textarea
          value={novText}
          onChange={(e) => setNovText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddNovedad();
            }
          }}
          placeholder="Escribir novedad..."
          rows={4}
          style={{
            resize: "vertical",
            fontSize: "0.65rem",
            padding: "8px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(17, 24, 39, 0.5)",
            color: "var(--text-main)",
            fontFamily: "inherit",
            outline: "none",
            lineHeight: 1.5,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", fontWeight: 600 }}>Hora</span>
          <input
            type="time"
            value={novTime}
            onChange={(e) => setNovTime(e.target.value)}
            style={{
              width: "90px",
              fontSize: "0.65rem",
              padding: "6px 8px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(17, 24, 39, 0.6)",
              color: "var(--text-main)",
              fontVariantNumeric: "tabular-nums",
              outline: "none",
            }}
          />
        </div>
        <button
          onClick={handleAddNovedad}
          disabled={!novText.trim()}
          title="Agregar"
          style={{
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid rgba(34,197,94,0.3)",
            background: novText.trim() ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.02)",
            color: novText.trim() ? "var(--color-green)" : "var(--text-muted)",
            cursor: novText.trim() ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.65rem",
            fontWeight: 700,
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={12} /> Agregar
        </button>
      </div>
    </div>
  </div>
);
