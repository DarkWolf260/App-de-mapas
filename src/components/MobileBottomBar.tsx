import React from "react";
import { Users, FileText, Settings, Search, Layers } from "lucide-react";

export interface MobileBottomBarProps {
  onOpenPersonal: () => void;
  onOpenBitacora: () => void;
  onOpenLayers?: () => void;
  onOpenSettings: () => void;
  onOpenSearch?: () => void;
}

const BAR_HEIGHT = "56px";

const tabStyle = (): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  cursor: "pointer",
  padding: "6px 10px",
  borderRadius: "8px",
  minWidth: "55px",
  transition: "all 0.15s ease",
  fontFamily: "var(--font-sans)",
});

const labelStyle: React.CSSProperties = {
  fontSize: "9px",
  fontWeight: 600,
  letterSpacing: "0.03em",
  textTransform: "uppercase",
};

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenPersonal,
  onOpenBitacora,
  onOpenLayers,
  onOpenSettings,
  onOpenSearch,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: BAR_HEIGHT,
        background: "rgba(10, 15, 28, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 4px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        zIndex: 130,
        color: "#f8fafc",
        fontFamily: "var(--font-sans)",
      }}
    >
      <button style={tabStyle()} onClick={onOpenPersonal}>
        <Users size={18} />
        <span style={labelStyle}>Personal</span>
      </button>

      {onOpenLayers && (
        <button style={tabStyle()} onClick={onOpenLayers}>
          <Layers size={18} />
          <span style={labelStyle}>Capas</span>
        </button>
      )}

      <button style={tabStyle()} onClick={onOpenBitacora}>
        <FileText size={18} />
        <span style={labelStyle}>Bitácora</span>
      </button>

      <button style={tabStyle()} onClick={onOpenSettings}>
        <Settings size={18} />
        <span style={labelStyle}>Ajustes</span>
      </button>

      {onOpenSearch && (
        <button style={tabStyle()} onClick={onOpenSearch}>
          <Search size={18} />
          <span style={labelStyle}>Buscar</span>
        </button>
      )}
    </div>
  );
};
