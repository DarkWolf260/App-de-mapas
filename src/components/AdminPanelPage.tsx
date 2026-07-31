import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, Users, Layers, Database, Lock, LogOut, FileSpreadsheet, MapPin, CheckCircle, RefreshCw, KeyRound, Server, UserCheck, XCircle, Check, Clock } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { fetchCampamentos, CampamentoEntry } from "../services/baseService";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs } from "../services/logService";
import { fetchUserRequests, approveUserRequest, rejectUserRequest, UserRegistrationRequest } from "../services/userService";

export const AdminPanelPage: React.FC = () => {
  const { user, isAdmin, isOperador, isAuthenticated, logout, loading } = useAuth();

  const [activeSection, setActiveSection] = useState<"solicitudes" | "usuarios" | "bases" | "capas">("solicitudes");
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [featuresCount, setFeaturesCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);
  const [requests, setRequests] = useState<UserRegistrationRequest[]>([]);
  const [roleSelectionMap, setRoleSelectionMap] = useState<Record<string, "operador" | "admin">>({});
  const [organismoSelectionMap, setOrganismoSelectionMap] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const selectedDate = new Date().toISOString().split("T")[0];

  const loadAdminData = async () => {
    setRefreshing(true);
    try {
      const [fetchedCamps, fetchedFeats, fetchedLogsMap, fetchedReqs] = await Promise.all([
        fetchCampamentos(selectedDate),
        fetchFeatures(),
        fetchLogs(),
        fetchUserRequests(),
      ]);

      if (fetchedCamps) setCamps(fetchedCamps);
      if (fetchedFeats) setFeaturesCount(fetchedFeats.length);
      if (fetchedReqs) {
        setRequests(fetchedReqs);
        const rMap: Record<string, "operador" | "admin"> = {};
        const oMap: Record<string, string> = {};
        fetchedReqs.forEach((r) => {
          rMap[r.id] = r.assignedRole || r.requestedRole || "operador";
          oMap[r.id] = r.organismo && r.organismo !== "Por Asignar" ? r.organismo : "Protección Civil La Guaira";
        });
        setRoleSelectionMap(rMap);
        setOrganismoSelectionMap(oMap);
      }
      
      let totalLogs = 0;
      fetchedLogsMap.forEach((logs) => {
        totalLogs += logs.length;
      });
      setLogsCount(totalLogs);
    } catch (err) {
      console.error("Error al cargar datos administrativos:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApprove = async (reqId: string) => {
    const roleToAssign = roleSelectionMap[reqId] || "operador";
    const organismoToAssign = organismoSelectionMap[reqId] || "Protección Civil La Guaira";
    await approveUserRequest(reqId, roleToAssign, organismoToAssign);
    loadAdminData();
  };

  const handleReject = async (reqId: string) => {
    await rejectUserRequest(reqId);
    loadAdminData();
  };

  const pendingCount = requests.filter((r) => r.status === "Pendiente").length;

  if (loading) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-muted)" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.08)", borderTopColor: "var(--accent-orange)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Auth Guard: Require Admin permissions
  if (!isAuthenticated || !isAdmin) {
    return (
      <div
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
          minHeight: "100vh",
          width: "100vw",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--sans-font)",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "12px",
            padding: "32px",
            maxWidth: "440px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#ef4444",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: "0 0 8px 0" }}>
            Acceso Restringido
          </h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 24px 0" }}>
            Esta sección es exclusiva para el personal con rol de <strong>Administrador</strong>. Inicia sesión con tus credenciales administrativas para acceder.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => window.location.href = "/login"}
              style={{
                background: "var(--accent-orange)",
                border: "none",
                borderRadius: "8px",
                color: "#fff",
                fontSize: "0.8rem",
                fontWeight: 700,
                padding: "10px 16px",
                cursor: "pointer",
                fontFamily: "var(--sans-font)",
              }}
            >
              Iniciar Sesión como Admin
            </button>

            <button
              onClick={() => window.location.href = "/"}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                color: "var(--text-main)",
                fontSize: "0.78rem",
                fontWeight: 600,
                padding: "10px 16px",
                cursor: "pointer",
                fontFamily: "var(--sans-font)",
              }}
            >
              Regresar al Mapa Interactivo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
        minHeight: "100vh",
        width: "100vw",
        fontFamily: "var(--sans-font)",
        fontSize: "0.76rem",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      {/* HEADER PRINCIPAL DE ADMINISTRACIÓN */}
      <header
        style={{
          height: "64px",
          borderBottom: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-secondary)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid rgba(249, 115, 22, 0.3)",
              color: "var(--accent-orange)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <h1 style={{ color: "#f8fafc", fontWeight: 800, fontSize: "1.05rem", margin: 0, lineHeight: 1.2 }}>
              COE La Guaira — Panel de Administración
            </h1>
            <p style={{ color: "var(--accent-orange)", fontSize: "0.62rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              Aprobación de Solicitudes, Roles y Gestión Central
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => window.open("/", "_self")}
            style={{
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              borderRadius: "6px",
              color: "#38bdf8",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <MapPin size={14} />
            <span>Ver Mapa</span>
          </button>

          <button
            onClick={() => window.open("/consolidado", "_blank")}
            style={{
              background: "rgba(168, 85, 247, 0.15)",
              border: "1px solid rgba(168, 85, 247, 0.4)",
              borderRadius: "6px",
              color: "#c084fc",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <FileSpreadsheet size={14} />
            <span>Módulo de Información</span>
          </button>

          <button
            onClick={logout}
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              borderRadius: "6px",
              color: "#ef4444",
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "5px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL DEL PANEL */}
      <main style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* RESUMEN MÉTRICO PRINCIPAL */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(249, 115, 22, 0.15)", border: "1px solid rgba(249, 115, 22, 0.3)", color: "var(--accent-orange)", padding: "10px", borderRadius: "8px" }}>
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Solicitudes Pendientes</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: pendingCount > 0 ? "var(--accent-orange)" : "#4ade80" }}>
                {pendingCount} Por Aprobar
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", padding: "10px", borderRadius: "8px" }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Rol Actual</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4ade80" }}>Administrador</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", padding: "10px", borderRadius: "8px" }}>
              <Database size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Bases Operacionales</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f8fafc" }}>{camps.length} Registradas</div>
            </div>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(168, 85, 247, 0.15)", border: "1px solid rgba(168, 85, 247, 0.3)", color: "#c084fc", padding: "10px", borderRadius: "8px" }}>
              <Server size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Base de Datos Supabase</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#4ade80", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle size={14} /> Conectado
              </div>
            </div>
          </div>
        </div>

        {/* MENÚ DE SECCIONES ADMINISTRATIVAS */}
        <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
          <button
            onClick={() => setActiveSection("solicitudes")}
            style={{
              background: activeSection === "solicitudes" ? "var(--accent-orange)" : "rgba(255, 255, 255, 0.04)",
              color: activeSection === "solicitudes" ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <UserCheck size={14} /> Solicitudes de Registro
            {pendingCount > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: "10px", padding: "1px 6px", fontSize: "0.6rem", fontWeight: 800 }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection("usuarios")}
            style={{
              background: activeSection === "usuarios" ? "var(--accent-orange)" : "rgba(255, 255, 255, 0.04)",
              color: activeSection === "usuarios" ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Users size={14} /> Usuarios y Roles
          </button>

          <button
            onClick={() => setActiveSection("bases")}
            style={{
              background: activeSection === "bases" ? "var(--accent-orange)" : "rgba(255, 255, 255, 0.04)",
              color: activeSection === "bases" ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Database size={14} /> Bases y Campamentos
          </button>

          <button
            onClick={() => setActiveSection("capas")}
            style={{
              background: activeSection === "capas" ? "var(--accent-orange)" : "rgba(255, 255, 255, 0.04)",
              color: activeSection === "capas" ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "0.74rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <Layers size={14} /> Capas del Mapa ({featuresCount})
          </button>

          <button
            onClick={loadAdminData}
            disabled={refreshing}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              fontSize: "0.72rem",
              fontWeight: 600,
              padding: "6px 12px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--sans-font)",
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            <span>Actualizar Datos</span>
          </button>
        </div>

        {/* CONTENIDO DE LA PESTAÑA SOLICITUDES DE REGISTRO */}
        {activeSection === "solicitudes" && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                  Aprobación de Solicitudes de Registro y Asignación de Roles
                </h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  Evalúa las solicitudes de registro institucional y asigna el rol correspondiente (Operador o Administrador).
                </p>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Solicitante</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Organismo</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Fecha Solicitud</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Rol a Asignar</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Estado</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                      No hay solicitudes de registro registradas en el sistema.
                    </td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "#f8fafc" }}>{req.fullName}</div>
                        <div style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>{req.email}</div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {req.status === "Pendiente" ? (
                          <input
                            type="text"
                            value={organismoSelectionMap[req.id] ?? (req.organismo !== "Por Asignar" ? req.organismo : "Protección Civil La Guaira")}
                            onChange={(e) => setOrganismoSelectionMap((prev) => ({ ...prev, [req.id]: e.target.value }))}
                            placeholder="Ej: Protección Civil / Bomberos"
                            style={{
                              background: "rgba(0, 0, 0, 0.4)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "6px",
                              color: "#fff",
                              fontSize: "0.72rem",
                              padding: "4px 8px",
                              outline: "none",
                              fontFamily: "var(--sans-font)",
                              width: "170px",
                            }}
                          />
                        ) : (
                          <span style={{ color: "var(--text-main)", fontWeight: 500 }}>🏢 {req.organismo}</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-muted)", fontSize: "0.68rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={12} />
                          <span>{new Date(req.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {req.status === "Pendiente" ? (
                          <select
                            value={roleSelectionMap[req.id] || req.requestedRole || "operador"}
                            onChange={(e) =>
                              setRoleSelectionMap((prev) => ({
                                ...prev,
                                [req.id]: e.target.value as "operador" | "admin",
                              }))
                            }
                            style={{
                              background: "rgba(0, 0, 0, 0.4)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "6px",
                              color: "#fff",
                              fontSize: "0.72rem",
                              padding: "4px 8px",
                              outline: "none",
                              fontFamily: "var(--sans-font)",
                            }}
                          >
                            <option value="operador">Operador (Carga de datos y reportes)</option>
                            <option value="admin">Administrador (Control total)</option>
                          </select>
                        ) : (
                          <span style={{ fontWeight: 700, color: req.assignedRole === "admin" ? "#c084fc" : "#38bdf8" }}>
                            {req.assignedRole?.toUpperCase() || req.requestedRole.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span
                          style={{
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            color:
                              req.status === "Aprobado"
                                ? "#4ade80"
                                : req.status === "Rechazado"
                                ? "#ef4444"
                                : "var(--accent-orange)",
                            background:
                              req.status === "Aprobado"
                                ? "rgba(34, 197, 94, 0.12)"
                                : req.status === "Rechazado"
                                ? "rgba(239, 68, 68, 0.12)"
                                : "rgba(249, 115, 22, 0.12)",
                            border: `1px solid ${
                              req.status === "Aprobado"
                                ? "rgba(34, 197, 94, 0.3)"
                                : req.status === "Rechazado"
                                ? "rgba(239, 68, 68, 0.3)"
                                : "rgba(249, 115, 22, 0.3)"
                            }`,
                          }}
                        >
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        {req.status === "Pendiente" ? (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                            <button
                              onClick={() => handleApprove(req.id)}
                              title="Aprobar registro y asignar rol"
                              style={{
                                background: "rgba(34, 197, 94, 0.15)",
                                border: "1px solid rgba(34, 197, 94, 0.4)",
                                borderRadius: "6px",
                                color: "#4ade80",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "4px 10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontFamily: "var(--sans-font)",
                              }}
                            >
                              <Check size={13} /> Aprobar
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              title="Rechazar solicitud"
                              style={{
                                background: "rgba(239, 68, 68, 0.15)",
                                border: "1px solid rgba(239, 68, 68, 0.4)",
                                borderRadius: "6px",
                                color: "#ef4444",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "4px 10px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontFamily: "var(--sans-font)",
                              }}
                            >
                              <XCircle size={13} /> Rechazar
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>Procesado</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLA DE USUARIOS Y ROLES */}
        {activeSection === "usuarios" && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                Personal Aprobado y Control de Acceso
              </h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Correo / Usuario</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Rol Asignado</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Permisos de Edición</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#f8fafc" }}>
                    {user?.email || "admin@coelaguaira.gob.ve"}
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", borderRadius: "4px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800 }}>
                      ADMINISTRADOR
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--text-main)" }}>
                    Acceso Total (Crear, Editar, Eliminar, Guardar)
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ color: "#4ade80", fontWeight: 700 }}>Activo (Sesión Actual)</span>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#f8fafc" }}>
                    operador@coelaguaira.gob.ve
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", borderRadius: "4px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800 }}>
                      OPERADOR
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", color: "var(--text-main)" }}>
                    Edición Operativa y Carga de Conteos
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Registrado</span>
                  </td>
                </tr>
                {requests
                  .filter((r) => r.status === "Aprobado")
                  .map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px 14px", fontWeight: 700, color: "#f8fafc" }}>
                        {r.email} ({r.fullName})
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ background: r.assignedRole === "admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(56, 189, 248, 0.15)", border: `1px solid ${r.assignedRole === "admin" ? "rgba(168, 85, 247, 0.3)" : "rgba(56, 189, 248, 0.3)"}`, color: r.assignedRole === "admin" ? "#c084fc" : "#38bdf8", borderRadius: "4px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800 }}>
                          {(r.assignedRole || r.requestedRole).toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px", color: "var(--text-main)" }}>
                        {r.assignedRole === "admin" ? "Acceso Total (Crear, Editar, Eliminar)" : "Edición Operativa y Carga de Conteos"}
                      </td>
                      <td style={{ padding: "12px 14px", textAlign: "center" }}>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>Aprobado</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeSection === "bases" && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                Bases Operacionales y Campamentos Registrados ({camps.length})
              </h3>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Nombre de la Base</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Estados Asignados</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Personal Total</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {camps.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                      No hay bases operacionales registradas.
                    </td>
                  </tr>
                ) : (
                  camps.map((camp) => (
                    <tr key={camp.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>
                        {camp.campName}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>
                        {(camp.statesDetail || []).map((sd) => sd.stateName).join(", ") || "Sin estados"}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
                        {(camp.statesDetail || []).reduce((s, sd) => s + (Number(sd.officersCount) || 0), 0)}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{ color: "#4ade80", fontWeight: 700 }}>{camp.status || "Activo"}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeSection === "capas" && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc" }}>
              Capa de Elementos Dibujados en el Mapa
            </h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.76rem" }}>
              Actualmente existen <strong>{featuresCount}</strong> elementos registrados en Supabase (puntos, polígonos y sectores) y <strong>{logsCount}</strong> registros de actividad histórica.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                onClick={() => window.open("/", "_self")}
                style={{
                  background: "var(--accent-orange)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                Ir al Editor de Capas del Mapa
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
