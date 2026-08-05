import React from "react";

interface LayersSectionProps {
  featuresCount: number;
  logsCount: number;
}

export const LayersSection: React.FC<LayersSectionProps> = ({ featuresCount, logsCount }) => (
  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
    <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc" }}>
      Capa de Elementos Dibujados en el Mapa
    </h3>
    <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.76rem" }}>
      Actualmente existen <strong>{featuresCount}</strong> elementos registrados en Supabase (puntos, polígonos y sectores) y <strong>{logsCount}</strong> registros de actividad histórica.
    </p>
    <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
      <button
        onClick={() => window.open("/", "_self")}
        style={{
          background: "var(--accent-orange)",
          border: "none",
          borderRadius: "6px",
          color: "#fff",
          fontSize: "0.74rem",
          fontWeight: 700,
          padding: "8px 14px",
          cursor: "pointer",
          fontFamily: "var(--sans-font)",
        }}
      >
        Ir al Editor de Capas del Mapa
      </button>
    </div>
  </div>
);
