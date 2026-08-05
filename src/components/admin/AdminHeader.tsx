import React from "react";
import { Shield, Users, Database, Layers, RefreshCw } from "lucide-react";
import { UserNavMenu } from "../UserNavMenu";

export type AdminSection = "usuarios" | "bases" | "capas";

interface AdminHeaderProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
  pendingCount: number;
  refreshing: boolean;
  onRefresh: () => void;
}

const TAB_BUTTON_STYLE = (active: boolean): React.CSSProperties => ({
  background: active ? "var(--accent-orange)" : "transparent",
  color: active ? "#fff" : "var(--text-muted)",
  border: "none",
  borderRadius: "6px",
  padding: "5px 12px",
  fontSize: "0.72rem",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.15s ease",
  fontFamily: "var(--sans-font)",
});

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeSection,
  onSectionChange,
  pendingCount,
  refreshing,
  onRefresh,
}) => {
  return (
    <header
      style={{
        minHeight: "56px",
        backgroundColor: "var(--bg-primary)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: "12px",
        padding: "8px 24px",
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        boxSizing: "border-box",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", justifySelf: "start", minWidth: 0 }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, var(--accent-orange), #ea580c)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            boxShadow: "0 2px 10px rgba(249, 115, 22, 0.3)",
            flexShrink: 0,
          }}
        >
          <Shield size={17} />
        </div>
        <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em", fontFamily: "var(--sans-font)", whiteSpace: "nowrap" }}>
          COE La Guaira <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.78rem" }}>— Panel de Administración</span>
        </span>
      </div>

      <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", flexWrap: "wrap", gap: "2px", justifySelf: "center" }}>
        <button onClick={() => onSectionChange("usuarios")} style={TAB_BUTTON_STYLE(activeSection === "usuarios")}>
          <Users size={13} /> Usuarios, Roles y Solicitudes
          {pendingCount > 0 && (
            <span style={{ background: "#ef4444", color: "#fff", borderRadius: "10px", padding: "0 6px", fontSize: "0.6rem", fontWeight: 800 }}>
              {pendingCount}
            </span>
          )}
        </button>
        <button onClick={() => onSectionChange("bases")} style={TAB_BUTTON_STYLE(activeSection === "bases")}>
          <Database size={13} /> Bases
        </button>
        <button onClick={() => onSectionChange("capas")} style={TAB_BUTTON_STYLE(activeSection === "capas")}>
          <Layers size={13} /> Capas & Registros
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", justifySelf: "end" }}>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          title="Actualizar Datos"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "6px",
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "5px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "var(--sans-font)",
          }}
        >
          <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          <span>Actualizar</span>
        </button>
        <UserNavMenu currentPage="admin" />
      </div>
    </header>
  );
};
