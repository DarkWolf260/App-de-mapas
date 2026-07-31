import React from "react";
import { Users, ShieldCheck } from "lucide-react";

export interface TotalGeneralCardProps {
  redanGrandTotal: number;
}

export const TotalGeneralCard: React.FC<TotalGeneralCardProps> = ({ redanGrandTotal }) => {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "10px",
            background: "rgba(249, 115, 22, 0.15)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-orange)",
            flexShrink: 0,
          }}
        >
          <Users size={22} />
        </div>
        <div>
          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--accent-orange)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Total General
          </div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc", marginTop: "2px" }}>
            Personal Operativo Desplegado
          </div>
        </div>
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#ffffff", fontFamily: "var(--sans-font)", lineHeight: 1 }}>
          {redanGrandTotal}
        </div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
          <ShieldCheck size={12} style={{ color: "#4ade80" }} />
          <span>Efectivos en Línea</span>
        </div>
      </div>
    </div>
  );
};
