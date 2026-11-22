import type React from "react";

export const PRESET_COLORS = [
  "#991b1b",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#111827",
];

export const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(15, 23, 42, 0.85)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: "6px",
  padding: "6px 9px",
  color: "#f8fafc",
  fontFamily: "var(--font-sans)",
  fontSize: "0.76rem",
  transition: "border-color 0.15s ease, background 0.15s ease",
  colorScheme: "dark",
  boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontSize: "0.64rem",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "4px",
  display: "block",
};

export const saveBtnStyle = (success: boolean): React.CSSProperties => ({
  width: "100%",
  background: success ? "rgba(22, 163, 74, 0.22)" : "rgba(249, 115, 22, 0.18)",
  color: success ? "#86efac" : "#fdba74",
  border: `1px solid ${success ? "rgba(34, 197, 94, 0.55)" : "rgba(249, 115, 22, 0.55)"}`,
  borderRadius: "8px",
  padding: "8px 14px",
  fontSize: "0.76rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  transition: "all 0.18s ease",
  marginTop: "6px",
  fontFamily: "var(--font-sans)",
});

export const sectionBox: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.025)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "8px",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

export const sectionTitleStyle: React.CSSProperties = {
  fontSize: "0.66rem",
  fontWeight: 700,
  color: "#cbd5e1",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
  paddingBottom: "5px",
  marginBottom: "2px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

export const flatSectionHeaderStyle: React.CSSProperties = {
  fontSize: "0.66rem",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  padding: "2px 2px 5px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

export const sectionHeader = (color: string): React.CSSProperties => ({
  fontSize: "0.72rem",
  fontWeight: 800,
  color,
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  paddingBottom: "4px",
  marginBottom: "4px",
});

export const TAB_BTN_BASE: React.CSSProperties = {
  flex: 1,
  border: "1px solid transparent",
  fontSize: "0.7rem",
  fontWeight: 700,
  padding: "6px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  transition: "all 0.15s ease",
  whiteSpace: "nowrap",
};

export const metricInputStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid rgba(255, 255, 255, 0.14)",
  borderRadius: "6px",
  color: "#f8fafc",
  fontSize: "0.76rem",
  fontWeight: 700,
  padding: "4px 6px",
  width: "100%",
  fontFamily: "var(--font-mono, monospace)",
  fontVariantNumeric: "tabular-nums",
  textAlign: "center",
  colorScheme: "dark",
  boxSizing: "border-box",
  transition: "border-color 0.15s ease",
};

export const readRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  padding: "3px 0",
  borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
};

export const readLabelStyle: React.CSSProperties = {
  fontSize: "0.66rem",
  color: "#94a3b8",
  flexShrink: 0,
};

export const readValueStyle: React.CSSProperties = {
  fontSize: "0.71rem",
  color: "#f8fafc",
  fontWeight: 600,
  textAlign: "right",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
