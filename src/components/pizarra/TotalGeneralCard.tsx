import React from "react";
import { Users, ShieldCheck, Flame, Shield, HelpCircle } from "lucide-react";

export interface TotalGeneralCardProps {
  redanGrandTotal: number;
  pcCount?: number;
  bomberosCount?: number;
  otrosCount?: number;
}

export const TotalGeneralCard: React.FC<TotalGeneralCardProps> = ({
  redanGrandTotal,
  pcCount = 0,
  bomberosCount = 0,
  otrosCount = 0,
}) => {
  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      {/* SECCIÓN IZQUIERDA: ICONO Y TÍTULO */}
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

      {/* SECCIÓN CENTRAL: DESGLOSE POR TIPO DE ENTE */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        {/* PILL PC */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(249, 115, 22, 0.12)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            borderRadius: "8px",
            padding: "5px 10px",
          }}
        >
          <Shield size={14} style={{ color: "#f97316" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              PC
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#f97316", fontFamily: "var(--sans-font)", lineHeight: 1 }}>
              {pcCount}
            </span>
          </div>
        </div>

        {/* PILL BOMBEROS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "5px 10px",
          }}
        >
          <Flame size={14} style={{ color: "#ef4444" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Bomberos
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ef4444", fontFamily: "var(--sans-font)", lineHeight: 1 }}>
              {bomberosCount}
            </span>
          </div>
        </div>

        {/* PILL OTROS ENTES */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "8px",
            padding: "5px 10px",
          }}
        >
          <HelpCircle size={14} style={{ color: "#38bdf8" }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.58rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
              Otros Entes
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#38bdf8", fontFamily: "var(--sans-font)", lineHeight: 1 }}>
              {otrosCount}
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: CONTEO GRAND TOTAL */}
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#ffffff", fontFamily: "var(--sans-font)", lineHeight: 1 }}>
          {redanGrandTotal}
        </div>
        <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
          <ShieldCheck size={12} style={{ color: "#4ade80" }} />
          <span>Efectivos Totales</span>
        </div>
      </div>
    </div>
  );
};
