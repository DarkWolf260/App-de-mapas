import React from "react";

interface DashboardCardProps {
  title: string;
  pcValue?: number | string;
  bomberosValue?: number | string;
  totalValue: number | string;
  singleValue?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}

function pad2(val: number | string): string {
  const num = typeof val === "number" ? val : parseInt(String(val), 10);
  if (isNaN(num)) return String(val);
  return num < 10 ? `0${num}` : `${num}`;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  pcValue = 0,
  bomberosValue = 0,
  totalValue,
  singleValue = false,
  children,
  style,
  dark = false,
}) => {
  if (dark) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.94)",
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
            padding: "10px 14px 8px",
            fontSize: "0.78rem",
            fontWeight: 800,
            textTransform: "none",
            textAlign: "center",
            color: "var(--color-info)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          {title}
        </div>

        {!singleValue ? (
          <>
            <div style={{ padding: "8px 12px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", paddingBottom: "4px" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, textAlign: "center", color: "#38bdf8" }}>PC</div>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, textAlign: "center", color: "#ef4444" }}>BOMBEROS</div>
              </div>
              <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "8px 0" }}>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, textAlign: "center", color: "#f8fafc" }}>{pad2(pcValue)}</div>
                <div style={{ fontSize: "1.9rem", fontWeight: 800, textAlign: "center", color: "#f8fafc" }}>{pad2(bomberosValue)}</div>
              </div>
            </div>

            {children}

            <div style={{ marginTop: "6px", padding: "4px 14px 10px" }}>
              <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "6px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em" }}>TOTAL</span>
                <span style={{ fontSize: "2.1rem", fontWeight: 800, color: "#f97316", lineHeight: 1 }}>{pad2(totalValue)}</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "100%", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", marginBottom: "10px" }} />
            <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "#f97316", lineHeight: 1 }}>{totalValue}</span>
          </div>
        )}
      </div>
    );
  }

  // Light Theme (Exact match with reference image, compact content fit)
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1.5px solid #cbd5e1",
        borderRadius: "14px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
        fontFamily: "var(--font-sans)",
        color: "#0f172a",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Title */}
      <div
        style={{
          padding: "10px 14px 6px",
          fontSize: "0.82rem",
          fontWeight: 800,
          textAlign: "center",
          color: "#0b1f52",
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>

      {!singleValue ? (
        <>
          <div style={{ padding: "0 14px" }}>
            <div style={{ borderBottom: "1.5px solid #cbd5e1", margin: "2px 0 6px" }} />
            {/* Department Sub-headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", paddingBottom: "2px" }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 800, textAlign: "center", color: "#1e293b", letterSpacing: "0.02em" }}>PC</div>
              <div style={{ fontSize: "0.74rem", fontWeight: 800, textAlign: "center", color: "#dc2626", letterSpacing: "0.02em" }}>BOMBEROS</div>
            </div>

            {/* Department Values */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "4px 0 6px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", color: "#1e293b", fontFamily: "var(--font-sans)" }}>{pad2(pcValue)}</div>
              <div style={{ fontSize: "2rem", fontWeight: 800, textAlign: "center", color: "#1e293b", fontFamily: "var(--font-sans)" }}>{pad2(bomberosValue)}</div>
            </div>
          </div>

          {children}

          {/* Total Footer Row */}
          <div style={{ marginTop: "6px", padding: "0 14px 10px" }}>
            <div style={{ borderBottom: "1.5px solid #cbd5e1", marginBottom: "6px" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 800, textTransform: "uppercase", color: "#334155", letterSpacing: "0.05em" }}>TOTAL</span>
              <span style={{ fontSize: "2.3rem", fontWeight: 800, color: "#ff6800", lineHeight: 1 }}>{pad2(totalValue)}</span>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "100%", borderBottom: "1.5px solid #cbd5e1", margin: "2px 0 10px" }} />
          <span style={{ fontSize: "2.8rem", fontWeight: 800, color: "#ff6800", lineHeight: 1 }}>{totalValue}</span>
        </div>
      )}
    </div>
  );
};
