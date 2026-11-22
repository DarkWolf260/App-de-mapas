import React, { useState, useEffect } from "react";
import { LogOut, FileSpreadsheet, User, ChevronDown, Shield, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export interface UserNavMenuProps {
  currentPage?: "mapa" | "consolidado" | "admin";
}

export const UserNavMenu: React.FC<UserNavMenuProps> = ({ currentPage = "mapa" }) => {
  const { isAuthenticated, user, isAdmin, isSuspended, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          onClick={() => (window.location.href = "/login")}
          title="Iniciar sesión"
          style={{
            height: "36px",
            padding: "0 14px",
            borderRadius: "10px",
            border: "1px solid rgba(249, 115, 22, 0.45)",
            background: "rgba(10, 15, 28, 0.94)",
            color: "#fb923c",
            fontSize: "0.76rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <LogOut size={14} style={{ transform: "rotate(180deg)" }} aria-hidden="true" />
          <span>Iniciar Sesión</span>
        </button>
      </div>
    );
  }

  const showAdmin = isAdmin && !isSuspended;

  const moduleLinkStyle = (active: boolean): React.CSSProperties => ({
    height: "28px",
    padding: "0 10px",
    borderRadius: "7px",
    border: active ? "1px solid rgba(249, 115, 22, 0.55)" : "1px solid transparent",
    background: active ? "rgba(249, 115, 22, 0.18)" : "transparent",
    color: active ? "#fdba74" : "#cbd5e1",
    fontSize: "0.72rem",
    fontWeight: 700,
    cursor: active ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    fontFamily: "var(--font-sans)",
    whiteSpace: "nowrap",
    transition: "background-color 0.15s ease, color 0.15s ease",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {/* Navegación directa de módulos (visible en escritorio, sin esconderse bajo el perfil) */}
      <nav
        className="hud-module-nav"
        aria-label="Módulos del sistema"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          padding: "3px",
          borderRadius: "10px",
          background: "rgba(10, 15, 28, 0.94)",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        }}
      >
        <button
          type="button"
          onClick={() => { if (currentPage !== "mapa") window.location.href = "/"; }}
          aria-current={currentPage === "mapa" ? "page" : undefined}
          style={moduleLinkStyle(currentPage === "mapa")}
          title="Mapa Interactivo"
        >
          <MapPin size={13} aria-hidden="true" />
          <span>Mapa</span>
        </button>
        <button
          type="button"
          onClick={() => { if (currentPage !== "consolidado") window.location.href = "/consolidado"; }}
          aria-current={currentPage === "consolidado" ? "page" : undefined}
          style={moduleLinkStyle(currentPage === "consolidado")}
          title="Pizarra Operacional y Equipos"
        >
          <FileSpreadsheet size={13} aria-hidden="true" />
          <span>Pizarra</span>
        </button>
        {showAdmin && (
          <button
            type="button"
            onClick={() => { if (currentPage !== "admin") window.location.href = "/admin"; }}
            aria-current={currentPage === "admin" ? "page" : undefined}
            style={moduleLinkStyle(currentPage === "admin")}
            title="Panel de Administración"
          >
            <Shield size={13} aria-hidden="true" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          className="user-nav-btn"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={`Cuenta de ${user?.email || "usuario"}`}
          title="Cuenta y menú de módulos"
          style={{
            height: "36px",
            padding: "0 12px",
            borderRadius: "10px",
            border: open ? "1px solid var(--accent-orange)" : "1px solid rgba(255, 255, 255, 0.16)",
            background: "rgba(10, 15, 28, 0.94)",
            color: "#f8fafc",
            fontSize: "0.74rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <User size={14} style={{ color: "var(--accent-orange)" }} aria-hidden="true" />
          <span className="user-nav-label" style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email?.split("@")[0]}
          </span>
          <ChevronDown
            className="user-nav-chevron"
            size={14}
            aria-hidden="true"
            style={{ color: "#94a3b8", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </button>

        {open && (
          <>
            <div
              style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 129 }}
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              style={{
                position: "absolute",
                top: "42px",
                right: 0,
                width: "240px",
                background: "rgba(10, 15, 29, 0.97)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                borderRadius: "12px",
                padding: "6px",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.65)",
                zIndex: 135,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "4px" }}>
                <div style={{ fontSize: "0.64rem", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Sesión Activa</div>
                <div style={{ fontSize: "0.74rem", color: "#fdba74", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email}
                </div>
              </div>

              <div className="mobile-only-nav-links" style={{ flexDirection: "column", gap: "4px" }}>
                {currentPage !== "mapa" && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      window.location.href = "/";
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      background: "transparent",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249, 115, 22, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <MapPin size={15} style={{ color: "var(--accent-orange)", flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Mapa Interactivo</div>
                      <div style={{ fontSize: "0.66rem", color: "#94a3b8" }}>Vista cartográfica principal</div>
                    </div>
                  </button>
                )}

                {currentPage !== "consolidado" && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      window.location.href = "/consolidado";
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      background: "transparent",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249, 115, 22, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <FileSpreadsheet size={15} style={{ color: "var(--accent-orange)", flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Pizarra Operacional</div>
                      <div style={{ fontSize: "0.66rem", color: "#94a3b8" }}>Consolidado de equipos</div>
                    </div>
                  </button>
                )}

                {showAdmin && currentPage !== "admin" && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      window.location.href = "/admin";
                      setOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px 10px",
                      background: "transparent",
                      border: "none",
                      borderRadius: "8px",
                      color: "#f8fafc",
                      fontSize: "0.76rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                      fontFamily: "var(--font-sans)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(249, 115, 22, 0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Shield size={15} style={{ color: "var(--accent-orange)", flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <div style={{ fontWeight: 700 }}>Panel de Administración</div>
                      <div style={{ fontSize: "0.66rem", color: "#94a3b8" }}>Usuarios, roles y capas</div>
                    </div>
                  </button>
                )}

                <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  color: "#f87171",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={14} aria-hidden="true" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
