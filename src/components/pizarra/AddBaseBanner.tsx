import React from "react";

interface AddBaseBannerProps {
  value: string;
  onChange: (value: string) => void;
  onCreate: () => void;
}

export const AddBaseBanner: React.FC<AddBaseBannerProps> = ({ value, onChange, onCreate }) => (
  <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)", padding: "8px 24px", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
    <span style={{ fontSize: "0.72rem", color: "var(--text-main)", fontWeight: 600 }}>Nombre de la Nueva Base:</span>
    <input
      type="text"
      placeholder="Ej: Base Caruao..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid var(--border-color)",
        borderRadius: "6px",
        color: "#fff",
        fontSize: "0.72rem",
        padding: "4px 8px",
        width: "220px",
        outline: "none",
        fontFamily: "var(--sans-font)",
      }}
    />
    <button
      onClick={onCreate}
      style={{
        background: "var(--accent-blue)",
        border: "none",
        borderRadius: "6px",
        color: "#fff",
        fontSize: "0.7rem",
        fontWeight: 600,
        padding: "4px 10px",
        cursor: "pointer",
        fontFamily: "var(--sans-font)",
      }}
    >
      Crear
    </button>
  </div>
);
