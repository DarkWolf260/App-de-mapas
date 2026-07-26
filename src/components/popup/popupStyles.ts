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
  background: "rgba(0, 0, 0, 0.3)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "6px",
  padding: "5px 8px",
  color: "var(--text-main)",
  fontFamily: "var(--font-sans)",
  fontSize: "0.72rem",
  outline: "none",
  transition: "border-color 0.2s ease",
};

export const labelStyle: React.CSSProperties = {
  fontSize: "0.62rem",
  fontWeight: 700,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  marginBottom: "2px",
};

export const saveBtnStyle = (success: boolean): React.CSSProperties => ({
  width: "100%",
  background: success ? "#22c55e" : "var(--color-info)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "6px 12px",
  fontSize: "0.7rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  transition: "all 0.2s ease",
  boxShadow: success
    ? "0 0 10px rgba(34, 197, 94, 0.3)"
    : "0 0 10px rgba(56, 189, 248, 0.2)",
  marginTop: "8px",
});

export const sectionBox: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.04)",
  borderRadius: "8px",
  padding: "6px 8px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

export const sectionHeader = (color: string): React.CSSProperties => ({
  fontSize: "0.62rem",
  fontWeight: 700,
  color,
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  paddingBottom: "2px",
  marginBottom: "2px",
});

export const TAB_BTN_BASE: React.CSSProperties = {
  flex: 1,
  border: "none",
  fontSize: "0.65rem",
  fontWeight: 700,
  padding: "4px 6px",
  borderRadius: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
};

export const metricInputStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "4px",
  color: "var(--text-main)",
  fontSize: "0.62rem",
  padding: "3px 6px",
  width: "100%",
  outline: "none",
  fontFamily: "inherit",
};

export const readRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "2px 0",
};

export const readLabelStyle: React.CSSProperties = {
  fontSize: "0.6rem",
  color: "var(--text-muted)",
};

export const readValueStyle: React.CSSProperties = {
  fontSize: "0.65rem",
  color: "var(--text-main)",
  fontWeight: 600,
  textAlign: "right",
};
