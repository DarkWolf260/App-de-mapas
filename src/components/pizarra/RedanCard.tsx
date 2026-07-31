import React from "react";
import { Map as MapIcon } from "lucide-react";
import { REDAN_REGIONS } from "../../data/redanStructure";

export interface RedanCardProps {
  getRegionTotalFromCamps: (states: string[]) => number;
  redanGrandTotal: number;
}

export const RedanCard: React.FC<RedanCardProps> = ({
  getRegionTotalFromCamps,
}) => {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.8)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <MapIcon size={16} style={{ color: "#38bdf8" }} />
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Despliegue por Regiones REDAN
        </span>
      </div>

      {/* REJILLA HORIZONTAL COMPACTA DE REGIONES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "8px",
        }}
      >
        {REDAN_REGIONS.map((r) => {
          const regTotal = getRegionTotalFromCamps(r.states);
          return (
            <div
              key={r.name}
              style={{
                background: "rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "8px",
                padding: "6px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span style={{ fontSize: "0.66rem", color: "var(--text-secondary)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.name.replace("REDAN ", "")}
              </span>
              <span
                style={{
                  fontSize: "0.74rem",
                  fontFamily: "var(--sans-font)",
                  fontWeight: 800,
                  color: regTotal > 0 ? "#38bdf8" : "var(--text-muted)",
                }}
              >
                {regTotal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
