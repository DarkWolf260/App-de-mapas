import type React from "react";

export const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(56, 189, 248, 0.25)",
  borderRadius: "6px",
  padding: "5px 9px",
  color: "#f8fafc",
  fontFamily: "var(--font-sans)",
  fontSize: "0.76rem",
  outline: "none",
  transition: "all 0.2s ease",
  colorScheme: "dark",
  boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontSize: "0.62rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  marginBottom: "3px",
  display: "block",
};

export const saveBtnStyle = (success: boolean): React.CSSProperties => ({
  width: "100%",
  background: success ? "linear-gradient(135deg, #15803d, #166534)" : "linear-gradient(135deg, #0284c7, #0369a1)",
  color: "#fff",
  border: `1px solid ${success ? "#22c55e" : "#38bdf8"}`,
  borderRadius: "7px",
  padding: "7px 14px",
  fontSize: "0.74rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  transition: "all 0.2s ease",
  boxShadow: success
    ? "0 4px 12px rgba(34, 197, 94, 0.25)"
    : "0 4px 12px rgba(56, 189, 248, 0.25)",
  marginTop: "8px",
});

export const sectionBox: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.4)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px",
  padding: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

export const sectionHeader = (color: string): React.CSSProperties => ({
  fontSize: "0.66rem",
  fontWeight: 800,
  color,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  paddingBottom: "4px",
  marginBottom: "4px",
});

export const TAB_BTN_BASE: React.CSSProperties = {
  flex: 1,
  border: "none",
  fontSize: "0.68rem",
  fontWeight: 700,
  padding: "5px 8px",
  borderRadius: "5px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  transition: "all 0.15s ease",
};

export const metricInputStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  borderRadius: "6px",
  color: "#f8fafc",
  fontSize: "0.74rem",
  fontWeight: 700,
  padding: "3px 6px",
  width: "100%",
  outline: "none",
  fontFamily: "var(--font-mono, monospace)",
  textAlign: "center",
  colorScheme: "dark",
  boxSizing: "border-box",
  transition: "all 0.15s ease",
};

export const readRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "3px 0",
  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
};

export const readLabelStyle: React.CSSProperties = {
  fontSize: "0.64rem",
  color: "var(--text-muted)",
};

export const readValueStyle: React.CSSProperties = {
  fontSize: "0.68rem",
  color: "#f8fafc",
  fontWeight: 600,
  textAlign: "right",
};
