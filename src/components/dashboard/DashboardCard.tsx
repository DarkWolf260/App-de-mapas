import React from "react";

interface DashboardCardProps {
  title: string;
  icon?: React.ReactNode;
  pcValue: number | string;
  bomberosValue: number | string;
  totalValue: number | string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}

const BLUE = "#002060";
const BLUE_LIGHT = "#e0e7f5";
const ORANGE = "#ff6800";
const ORANGE_LIGHT = "#fff2e6";
const GREEN = "#16a34a";
const SLATE_800 = "#1e293b";
const SLATE_500 = "#64748b";
const PC_COLOR = "var(--color-info)";
const BOMBEROS_COLOR = "#ef4444";

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  icon,
  pcValue,
  bomberosValue,
  totalValue,
  children,
  style,
  dark = false,
}) => {
  if (dark) {
    return (
      <div
        style={{
          background: "rgba(10, 15, 28, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "12px",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          fontFamily: "var(--font-sans)",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          ...style,
        }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
            padding: "10px 12px", fontSize: "0.75rem", fontWeight: 800,
            letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center",
            color: "var(--color-info)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {icon}
          <span>{title}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ padding: "6px 8px", fontSize: "0.7rem", fontWeight: 700, textAlign: "center", letterSpacing: "0.06em", color: PC_COLOR, borderRight: "1px solid rgba(255, 255, 255, 0.08)" }}>PC</div>
          <div style={{ padding: "6px 8px", fontSize: "0.7rem", fontWeight: 700, textAlign: "center", letterSpacing: "0.06em", color: BOMBEROS_COLOR }}>BOMBEROS</div>
          <div style={{ padding: "10px 8px 12px", fontSize: "1.85rem", fontWeight: 800, textAlign: "center", color: "#f8fafc", borderRight: "1px solid rgba(255, 255, 255, 0.08)", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>{pcValue}</div>
          <div style={{ padding: "10px 8px 12px", fontSize: "1.85rem", fontWeight: 800, textAlign: "center", color: "#f8fafc", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>{bomberosValue}</div>
        </div>
        {children}
        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ padding: "8px 10px 4px", fontSize: "0.72rem", fontWeight: 800, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>Total</div>
          <div style={{ margin: "0 14px", borderBottom: "1px solid rgba(255, 255, 255, 0.12)" }} />
          <div style={{ padding: "8px 10px 16px", fontSize: "2.8rem", fontWeight: 800, textAlign: "center", color: "var(--color-green)", lineHeight: 1 }}>{totalValue}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderTop: "3px solid #ff6800",
        borderRadius: "12px",
        boxShadow: "0 2px 16px rgba(0, 0, 0, 0.07)",
        fontFamily: "var(--font-sans)",
        color: SLATE_800,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          padding: "12px 14px", fontSize: "0.78rem", fontWeight: 800,
          letterSpacing: "0.04em", textTransform: "uppercase", textAlign: "center",
          color: "#ffffff",
          background: "#002060",
        }}
      >
        {icon}
        <span>{title}</span>
      </div>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "8px 10px", fontSize: "0.75rem", fontWeight: 800, textAlign: "center", letterSpacing: "0.06em", color: BLUE, background: BLUE_LIGHT, borderRight: "1px solid rgba(0, 32, 96, 0.15)", borderBottom: "1px solid rgba(0, 32, 96, 0.15)" }}>PC</div>
          <div style={{ padding: "8px 10px", fontSize: "0.75rem", fontWeight: 800, textAlign: "center", letterSpacing: "0.06em", color: ORANGE, background: ORANGE_LIGHT, borderBottom: "1px solid rgba(255, 104, 0, 0.15)" }}>BOMBEROS</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <div style={{ padding: "14px 10px 16px", fontSize: "2rem", fontWeight: 800, textAlign: "center", color: BLUE, background: BLUE_LIGHT, borderRight: "1px solid rgba(0, 32, 96, 0.15)" }}>{pcValue}</div>
          <div style={{ padding: "14px 10px 16px", fontSize: "2rem", fontWeight: 800, textAlign: "center", color: ORANGE, background: ORANGE_LIGHT }}>{bomberosValue}</div>
        </div>
      </div>
      {children}
      <div style={{ marginTop: "auto", background: "#f8fafc", borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}>
        <div style={{ padding: "10px 14px 4px", fontSize: "0.75rem", fontWeight: 800, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.08em", color: SLATE_500 }}>Total</div>
        <div style={{ margin: "0 20px", borderBottom: "2px solid rgba(0, 0, 0, 0.06)" }} />
        <div style={{ padding: "8px 10px 16px", fontSize: "3rem", fontWeight: 800, textAlign: "center", color: "#ff6800", lineHeight: 1 }}>{totalValue}</div>
      </div>
    </div>
  );
};
