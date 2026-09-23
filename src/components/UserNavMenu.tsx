import React, { useState, useEffect } from "react";
import { LogOut, FileSpreadsheet, User, ChevronDown, Shield, MapPin, Cloud } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToQueue, type SyncQueueItem } from "../services/syncQueueService";
import { OfflineQueueModal } from "./OfflineQueueModal";

export interface UserNavMenuProps {
  currentPage?: "mapa" | "consolidado" | "admin";
}

export const UserNavMenu: React.FC<UserNavMenuProps> = ({ currentPage = "mapa" }) => {
  const { isAuthenticated, user, isAdmin, isOperador, permissions, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToQueue((items) => {
      setQueueItems(items);
    });
    return unsub;
  }, []);

  const pendingCount = queueItems.filter(
    (i) => i.status === "pending" || i.status === "failed" || i.status === "syncing"
  ).length;

  const canEdit = isAuthenticated && (isAdmin || isOperador || !!permissions?.edit_map);

  if (!isAuthenticated) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          onClick={() => (window.location.href = "/login")}
          title="Iniciar sesion"
          style={{
            height: "34px",
            padding: "0 14px",
            borderRadius: "10px",
            border: "1px solid rgba(249, 115, 22, 0.4)",
            background: "rgba(10, 15, 28, 0.9)",
            color: "#f97316",
            fontSize: "0.76rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
          }}
        >
          <LogOut size={14} style={{ transform: "rotate(180deg)" }} />
          <span>Iniciar Sesion</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "relative" }}>
        <button
          className="user-nav-btn"
          onClick={() => setOpen(!open)}
          title="Menú de Módulos y Usuario"
          style={{
            height: "34px",
            padding: "0 12px",
            borderRadius: "10px",
            border: open ? "1px solid var(--accent-orange)" : "1px solid rgba(255, 255, 255, 0.18)",
            background: "rgba(10, 15, 28, 0.95)",
            color: "#f8fafc",
            fontSize: "0.74rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <User size={14} style={{ color: "var(--accent-orange)" }} />
          <span className="user-nav-label" style={{ maxWidth: "110px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email?.split("@")[0]}
          </span>
          {pendingCount > 0 && (
            <span
              style={{
                background: "#f97316",
                color: "#ffffff",
                borderRadius: "10px",
                padding: "1px 6px",
                fontSize: "0.62rem",
                fontWeight: 800,
              }}
            >
              {pendingCount}
            </span>
          )}
          <ChevronDown className="user-nav-chevron" size={14} style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>

        {open && (
          <>
            <div
              style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 129 }}
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                position: "absolute",
                top: "42px",
                right: 0,
                width: "240px",
                background: "rgba(10, 15, 29, 0.96)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "6px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                zIndex: 135,
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "4px" }}>
                <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Módulos Disponibles</div>
                <div style={{ fontSize: "0.72rem", color: "var(--accent-orange)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user?.email}
                </div>
              </div>

              {currentPage !== "mapa" && (
                <button
                  onClick={() => {
                    window.location.href = '/';
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
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(56, 189, 248, 0.12)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "6px", borderRadius: "6px" }}>
                    <MapPin size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#38bdf8" }}>Mapa Interactivo</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Mapa principal de operaciones</div>
                  </div>
                </button>
              )}

              {currentPage !== "consolidado" && (
                <button
                  onClick={() => {
                    window.location.href = '/consolidado';
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
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(56, 189, 248, 0.12)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "6px", borderRadius: "6px" }}>
                    <FileSpreadsheet size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#38bdf8" }}>Módulo de Información</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Pizarra Operacional y Equipos</div>
                  </div>
                </button>
              )}

              {isAdmin && currentPage !== "admin" && (
                <button
                  onClick={() => {
                    window.location.href = '/admin';
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
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    fontFamily: "var(--font-sans)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(249, 115, 22, 0.12)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)", color: "var(--accent-orange)", padding: "6px", borderRadius: "6px" }}>
                    <Shield size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--accent-orange)" }}>Panel de Administración</div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>Módulo de Gestión Central</div>
                  </div>
                </button>
              )}

              {/* Botón Cola Local de Envíos */}
              <button
                onClick={() => {
                  setOpen(false);
                  setQueueModalOpen(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  borderRadius: "8px",
                  color: "#f8fafc",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(249, 115, 22, 0.12)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      background: pendingCount > 0 ? "rgba(249, 115, 22, 0.2)" : "rgba(255, 255, 255, 0.08)",
                      border: pendingCount > 0 ? "1px solid rgba(249, 115, 22, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                      color: pendingCount > 0 ? "#f97316" : "#94a3b8",
                      padding: "6px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Cloud size={15} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: pendingCount > 0 ? "#fb923c" : "#f8fafc" }}>
                      Cola Local de Envíos
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>
                      {pendingCount > 0 ? `${pendingCount} pendiente(s) de subir` : "Todo sincronizado"}
                    </div>
                  </div>
                </div>

                {pendingCount > 0 && (
                  <span
                    style={{
                      background: "rgba(249, 115, 22, 0.25)",
                      color: "#fb923c",
                      border: "1px solid rgba(249, 115, 22, 0.4)",
                      borderRadius: "10px",
                      padding: "2px 7px",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
              </button>

              <div style={{ height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "4px 0" }} />

              <button
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
                  color: "#ef4444",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: "var(--font-sans)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", padding: "6px", borderRadius: "6px" }}>
                  <LogOut size={14} />
                </div>
                <span style={{ fontWeight: 700 }}>Cerrar Sesión</span>
              </button>
            </div>
          </>
        )}
      </div>

      <OfflineQueueModal
        isOpen={queueModalOpen}
        onClose={() => setQueueModalOpen(false)}
        canEdit={canEdit}
      />
    </>
  );
};
