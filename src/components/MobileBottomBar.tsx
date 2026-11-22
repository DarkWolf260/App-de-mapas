import React from "react";
import { Users, BarChart2, Settings, Search, Layers } from "lucide-react";

export type MobilePanelType = "personal" | "settings" | "layers" | null;

export interface MobileBottomBarProps {
  activePanel?: MobilePanelType;
  bitacoraOpen?: boolean;
  onOpenPersonal: () => void;
  onOpenBitacora: () => void;
  onOpenLayers?: () => void;
  onOpenSettings: () => void;
  onOpenSearch?: () => void;
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  position: "relative",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  background: active ? "rgba(249, 115, 22, 0.12)" : "transparent",
  border: active ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid transparent",
  color: active ? "#fdba74" : "#94a3b8",
  cursor: "pointer",
  padding: "6px 4px",
  borderRadius: "10px",
  minHeight: "44px",
  transition: "all 0.15s ease",
  fontFamily: "var(--font-sans)",
});

const labelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.02em",
  lineHeight: 1,
};

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activePanel = null,
  bitacoraOpen = false,
  onOpenPersonal,
  onOpenBitacora,
  onOpenLayers,
  onOpenSettings,
  onOpenSearch,
}) => {
  return (
    <nav
      aria-label="Navegación inferior"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(10, 15, 29, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "4px",
        padding: "6px 8px calc(6px + env(safe-area-inset-bottom, 0px))",
        zIndex: 130,
        color: "#f8fafc",
        fontFamily: "var(--font-sans)",
        boxShadow: "0 -6px 20px rgba(0, 0, 0, 0.45)",
      }}
    >
      <button
        type="button"
        style={tabStyle(activePanel === "personal")}
        onClick={onOpenPersonal}
        aria-pressed={activePanel === "personal"}
      >
        <Users size={18} aria-hidden="true" />
        <span style={labelStyle}>Personal</span>
      </button>

      {onOpenLayers && (
        <button
          type="button"
          style={tabStyle(activePanel === "layers")}
          onClick={onOpenLayers}
          aria-pressed={activePanel === "layers"}
        >
          <Layers size={18} aria-hidden="true" />
          <span style={labelStyle}>Capas</span>
        </button>
      )}

      <button
        type="button"
        style={tabStyle(bitacoraOpen)}
        onClick={onOpenBitacora}
        aria-pressed={bitacoraOpen}
      >
        <BarChart2 size={18} aria-hidden="true" />
        <span style={labelStyle}>Estadísticas</span>
      </button>

      <button
        type="button"
        style={tabStyle(activePanel === "settings")}
        onClick={onOpenSettings}
        aria-pressed={activePanel === "settings"}
      >
        <Settings size={18} aria-hidden="true" />
        <span style={labelStyle}>Ajustes</span>
      </button>

      {onOpenSearch && (
        <button type="button" style={tabStyle(false)} onClick={onOpenSearch}>
          <Search size={18} aria-hidden="true" />
          <span style={labelStyle}>Buscar</span>
        </button>
      )}
    </nav>
  );
};
