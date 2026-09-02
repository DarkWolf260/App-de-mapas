import React from "react";
import { Shield, Users, Database, Layers, RefreshCw } from "lucide-react";
import { UserNavMenu } from "../UserNavMenu";

export type AdminSection = "usuarios" | "capas";

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
    <>
      {/* APPBAR IDÉNTICA AL CONSOLIDADO */}
      <header className="pizarra-header">
        {/* LOGO + MARCA */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
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
          <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em", fontFamily: "var(--sans-font)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            COE La Guaira <span className="pizarra-header-subtitle" style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.78rem" }}>— Panel de Administración</span>
          </span>
        </div>
        <UserNavMenu currentPage="admin" />
      </header>

      {/* BARRA DE PESTAÑAS Y ACCIONES (AFUERA DEL APPBAR) */}
      <div className="admin-toolbar">
        <div className="admin-tabs-switch">
          <button
            type="button"
            onClick={() => onSectionChange("usuarios")}
            className={`admin-tab-btn ${activeSection === "usuarios" ? "active" : ""}`}
          >
            <Users size={13} />
            <span className="admin-tab-label-full">Usuarios, Roles y Solicitudes</span>
            <span className="admin-tab-label-short">Usuarios</span>
            {pendingCount > 0 && (
              <span className="admin-tab-badge">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onSectionChange("capas")}
            className={`admin-tab-btn ${activeSection === "capas" ? "active" : ""}`}
          >
            <Layers size={13} />
            <span>Capas & Registros</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Actualizar Datos"
          className="admin-refresh-btn"
        >
          <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
          <span>Actualizar</span>
        </button>
      </div>
    </>
  );
};
