import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, Users, Layers, Database, Lock, CheckCircle, RefreshCw, KeyRound, Server, UserCheck, XCircle, Check, Clock, Ban, Trash2, ShieldCheck, Square, CheckSquare, UserCog, Pencil } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getLocalDateStr } from "../utils/dateUtils";
import { UserNavMenu } from "./UserNavMenu";
import { fetchCampamentos, CampamentoEntry } from "../services/baseService";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs } from "../services/logService";
import { fetchUserRequests, approveUserRequest, rejectUserRequest, UserRegistrationRequest } from "../services/userService";
import {
  fetchManagedUsers,
  updateUserRole,
  updateUserPermissions,
  suspendUser,
  unsuspendUser,
  deleteUser,
  ManagedUser,
  UserPermissions,
  DEFAULT_OPERATOR_PERMISSIONS,
} from "../services/adminUsersService";

const PERM_DEFS: Array<{ key: keyof UserPermissions; label: string; desc: string }> = [
  { key: "edit_logs", label: "Editar registros (hoy)", desc: "Crear, editar y eliminar conteos y novedades de la fecha actual." },
  { key: "edit_historical_logs", label: "Editar registros históricos", desc: "Editar y eliminar conteos y novedades de fechas anteriores a hoy." },
  { key: "edit_map", label: "Editar elementos del mapa", desc: "Dibujar, editar y eliminar puntos, polígonos y sectores en el mapa." },
  { key: "manage_campamentos", label: "Gestionar campamentos", desc: "Crear y editar campamentos y la pizarra operacional." },
];

export const AdminPanelPage: React.FC = () => {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();

  const [activeSection, setActiveSection] = useState<"usuarios" | "bases" | "capas">("usuarios");
  const [camps, setCamps] = useState<CampamentoEntry[]>([]);
  const [featuresCount, setFeaturesCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);
  const [requests, setRequests] = useState<UserRegistrationRequest[]>([]);
  const [roleSelectionMap, setRoleSelectionMap] = useState<Record<string, "operador" | "admin">>({});
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersBusy, setUsersBusy] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<ManagedUser | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [draftRole, setDraftRole] = useState<"operador" | "admin">("operador");
  const [draftPermissions, setDraftPermissions] = useState<UserPermissions>(DEFAULT_OPERATOR_PERMISSIONS);

  const selectedDate = getLocalDateStr();

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
        fetchedReqs.forEach((r) => {
          rMap[r.id] = r.assignedRole || r.requestedRole || "operador";
        });
        setRoleSelectionMap(rMap);
      }

      try {
        setUsers(await fetchManagedUsers());
      } catch (err) {
        console.warn("No se pudo cargar la lista de usuarios:", err);
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
    await approveUserRequest(reqId, roleToAssign);
    loadAdminData();
  };

  const handleReject = async (reqId: string) => {
    await rejectUserRequest(reqId);
    loadAdminData();
  };

  const flash = (msg: string) => {
    setUserActionMsg(msg);
    setTimeout(() => setUserActionMsg(null), 3000);
  };

  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setDraftRole(u.role);
    setDraftPermissions({ ...u.permissions });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    const roleChanged = draftRole !== editingUser.role;
    const permsChanged = JSON.stringify(draftPermissions) !== JSON.stringify(editingUser.permissions);
    if (editingUser.id === user?.id && roleChanged) {
      flash("No puedes cambiar tu propio rol.");
      return;
    }
    setUsersBusy(true);
    try {
      if (roleChanged) await updateUserRole(editingUser.id, draftRole);
      if (permsChanged) await updateUserPermissions(editingUser.id, draftPermissions);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, role: draftRole, permissions: { ...u.permissions, ...draftPermissions } }
            : u
        )
      );
      setEditingUser(null);
      flash("Cambios guardados correctamente.");
    } catch (err: any) {
      flash(err?.message || "Error al guardar los cambios.");
      setEditingUser(null);
    } finally {
      setUsersBusy(false);
    }
  };

  const handleSuspendToggle = async (u: ManagedUser) => {
    if (u.id === user?.id) {
      flash("No puedes suspender tu propia cuenta.");
      return;
    }
    setUsersBusy(true);
    try {
      if (u.is_suspended) {
        await unsuspendUser(u.id);
        flash("Usuario reactivado.");
      } else {
        await suspendUser(u.id);
        flash("Usuario suspendido.");
      }
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_suspended: !u.is_suspended } : x)));
      setEditingUser((prev) => (prev && prev.id === u.id ? { ...prev, is_suspended: !u.is_suspended } : prev));
    } catch (err: any) {
      flash(err?.message || "Error al cambiar el estado del usuario.");
    } finally {
      setUsersBusy(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    if (confirmDeleteUser.id === user?.id) {
      flash("No puedes eliminarte a ti mismo.");
      setConfirmDeleteUser(null);
      return;
    }
    setUsersBusy(true);
    try {
      await deleteUser(confirmDeleteUser.id);
      setUsers((prev) => prev.filter((x) => x.id !== confirmDeleteUser.id));
      setConfirmDeleteUser(null);
      flash("Usuario eliminado.");
    } catch (err: any) {
      flash(err?.message || "Error al eliminar el usuario.");
      setConfirmDeleteUser(null);
    } finally {
      setUsersBusy(false);
    }
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
      {/* HEADER PRINCIPAL DE ADMINISTRACIÓN CON PESTAÑAS INTEGRADAS */}
      <header
        style={{
          minHeight: "56px",
          backgroundColor: "var(--bg-primary)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          boxSizing: "border-box",
          flexShrink: 0,
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* LOGO + MARCA + PESTAÑAS DE SECCIÓN INTEGRADAS */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
            <span style={{ color: "#f8fafc", fontWeight: 800, fontSize: "0.95rem", letterSpacing: "-0.01em", fontFamily: "var(--sans-font)" }}>
              COE La Guaira <span style={{ color: "var(--text-muted)", fontWeight: 500, fontSize: "0.78rem" }}>— Panel de Administración</span>
            </span>
          </div>

          <div style={{ height: "20px", width: "1px", background: "rgba(255, 255, 255, 0.12)" }} />

          {/* PESTAÑAS INTEGRADAS DENTRO DEL HEADER */}
          <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.4)", padding: "3px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.08)", flexWrap: "wrap", gap: "2px" }}>
            <button
              onClick={() => setActiveSection("usuarios")}
              style={{
                background: activeSection === "usuarios" ? "var(--accent-orange)" : "transparent",
                color: activeSection === "usuarios" ? "#fff" : "var(--text-muted)",
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
              }}
            >
              <Users size={13} /> Usuarios, Roles y Solicitudes
              {pendingCount > 0 && (
                <span style={{ background: "#ef4444", color: "#fff", borderRadius: "10px", padding: "0 6px", fontSize: "0.6rem", fontWeight: 800 }}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection("bases")}
              style={{
                background: activeSection === "bases" ? "var(--accent-orange)" : "transparent",
                color: activeSection === "bases" ? "#fff" : "var(--text-muted)",
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
              }}
            >
              <Database size={13} /> Bases
            </button>

            <button
              onClick={() => setActiveSection("capas")}
              style={{
                background: activeSection === "capas" ? "var(--accent-orange)" : "transparent",
                color: activeSection === "capas" ? "#fff" : "var(--text-muted)",
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
              }}
            >
              <Layers size={13} /> Capas & Registros
            </button>
          </div>
        </div>

        {/* CONTROLES RÁPIDOS Y MENÚ DE USUARIO */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={loadAdminData}
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

        {/* CONTENIDO DE USUARIOS, ROLES Y SOLICITUDES DE REGISTRO */}
        {activeSection === "usuarios" && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
              <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
                <Users size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                Gestión de Usuarios — Solicitudes, Roles y Permisos
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                Aprueba solicitudes de registro, asigna roles, configura permisos, suspende o elimina cuentas.
              </p>
            </div>

            <div style={{ padding: "10px 16px", background: "rgba(56, 189, 248, 0.08)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Solicitudes de Registro ({requests.length})
              </h4>
              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>{pendingCount} por aprobar</span>
            </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Solicitante</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Fecha Solicitud</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700 }}>Rol a Asignar</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Estado</th>
                    <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
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

            <div style={{ padding: "10px 16px", background: "rgba(56, 189, 248, 0.08)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h4 style={{ margin: 0, fontSize: "0.7rem", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <UserCog size={13} style={{ verticalAlign: "middle", marginRight: "6px" }} />
                Usuarios del Sistema ({users.length})
              </h4>
              {userActionMsg && (
                <span style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.3)", color: "#38bdf8", borderRadius: "6px", padding: "4px 10px", fontSize: "0.68rem", fontWeight: 700 }}>
                  {userActionMsg}
                </span>
              )}
            </div>

              {users.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.76rem" }}>
                  No hay usuarios registrados.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem", minWidth: "900px" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Usuario</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Rol</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Estado</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700 }}>Permisos del Operador</th>
                        <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isSelf = u.id === user?.id;
                        const enabledPerms = PERM_DEFS.filter((p) => u.role !== "admin" && !!u.permissions[p.key]);
                        return (
                          <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)", opacity: u.is_suspended ? 0.55 : 1 }}>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ fontWeight: 700, color: "#f8fafc" }}>
                                {u.full_name || u.email || "Sin nombre"}
                                {isSelf && <span style={{ marginLeft: "6px", color: "var(--accent-orange)", fontSize: "0.62rem", fontWeight: 800 }}>— USTED</span>}
                              </div>
                              <div style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>{u.email}</div>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ background: u.role === "admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(56, 189, 248, 0.15)", border: `1px solid ${u.role === "admin" ? "rgba(168, 85, 247, 0.3)" : "rgba(56, 189, 248, 0.3)"}`, color: u.role === "admin" ? "#c084fc" : "#38bdf8", borderRadius: "4px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800 }}>
                                {u.role === "admin" ? "ADMINISTRADOR" : "OPERADOR"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {u.is_suspended ? (
                                <span style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "4px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800 }}>
                                  Suspendido
                                </span>
                              ) : (
                                <span style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", borderRadius: "4px", padding: "2px 8px", fontSize: "0.65rem", fontWeight: 800 }}>
                                  Activo
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              {u.role === "admin" ? (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>Acceso total (Administrador)</span>
                              ) : enabledPerms.length === 0 ? (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>Sin permisos de edición</span>
                              ) : (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                  {enabledPerms.map((p) => (
                                    <span key={p.key} style={{ background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.25)", color: "#7dd3fc", borderRadius: "4px", padding: "2px 7px", fontSize: "0.62rem", fontWeight: 700 }}>
                                      {p.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "12px 14px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                <button
                                  onClick={() => openEdit(u)}
                                  disabled={usersBusy}
                                  title="Editar usuario"
                                  style={{
                                    background: "rgba(56, 189, 248, 0.1)",
                                    border: "1px solid rgba(56, 189, 248, 0.3)",
                                    borderRadius: "6px",
                                    color: "#38bdf8",
                                    padding: "6px",
                                    cursor: usersBusy ? "not-allowed" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: "var(--sans-font)",
                                  }}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteUser(u)}
                                  disabled={isSelf || usersBusy}
                                  title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar usuario definitivamente"}
                                  style={{
                                    background: "rgba(239, 68, 68, 0.12)",
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                    borderRadius: "6px",
                                    color: "#ef4444",
                                    padding: "6px",
                                    cursor: isSelf || usersBusy ? "not-allowed" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: isSelf ? 0.4 : 1,
                                    fontFamily: "var(--sans-font)",
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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

      {confirmDeleteUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "24px", maxWidth: "420px", width: "90%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
            <h3 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", fontWeight: 800, color: "#ef4444" }}>
              <Trash2 size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
              Eliminar usuario
            </h3>
            <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-main)", lineHeight: 1.5 }}>
              ¿Estás seguro de que deseas eliminar definitivamente a{" "}
              <strong>{confirmDeleteUser.full_name || confirmDeleteUser.email || "este usuario"}</strong> ({confirmDeleteUser.email})?
              Esta acción no se puede deshacer y eliminará su cuenta y acceso.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "18px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmDeleteUser(null)}
                disabled={usersBusy}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-muted)",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "7px 14px",
                  cursor: usersBusy ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={usersBusy}
                style={{
                  background: "#ef4444",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "7px 14px",
                  cursor: usersBusy ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                {usersBusy ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {editingUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => { if (!usersBusy) setEditingUser(null); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "24px", maxWidth: "480px", width: "90%", maxHeight: "86vh", overflowY: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
          >
            <h3 style={{ margin: "0 0 2px 0", fontSize: "0.95rem", fontWeight: 800, color: "#f8fafc" }}>
              <Pencil size={16} style={{ verticalAlign: "middle", marginRight: "6px", color: "#38bdf8" }} />
              Editar usuario
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>
              {editingUser.full_name || editingUser.email || "Sin nombre"} — {editingUser.email}
              {editingUser.id === user?.id && <span style={{ marginLeft: "6px", color: "var(--accent-orange)", fontSize: "0.62rem", fontWeight: 800 }}>USTED</span>}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
                  Rol del usuario
                </label>
                <select
                  value={draftRole}
                  disabled={editingUser.id === user?.id || usersBusy}
                  onChange={(e) => setDraftRole(e.target.value as "admin" | "operador")}
                  style={{
                    background: "rgba(0, 0, 0, 0.4)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    color: draftRole === "admin" ? "#c084fc" : "#38bdf8",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    padding: "7px 10px",
                    outline: "none",
                    width: "100%",
                    cursor: editingUser.id === user?.id || usersBusy ? "not-allowed" : "pointer",
                    fontFamily: "var(--sans-font)",
                  }}
                >
                  <option value="operador">Operador — carga de datos y reportes</option>
                  <option value="admin">Administrador — control total</option>
                </select>
                {editingUser.id === user?.id && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.62rem", color: "var(--text-muted)" }}>No puedes cambiar tu propio rol.</p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Estado de la cuenta</div>
                  {editingUser.is_suspended ? (
                    <span style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", borderRadius: "4px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 800 }}>
                      Suspendido
                    </span>
                  ) : (
                    <span style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", color: "#4ade80", borderRadius: "4px", padding: "3px 10px", fontSize: "0.68rem", fontWeight: 800 }}>
                      Activo
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleSuspendToggle(editingUser)}
                  disabled={editingUser.id === user?.id || usersBusy}
                  style={{
                    background: editingUser.is_suspended ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.12)",
                    border: `1px solid ${editingUser.is_suspended ? "rgba(34, 197, 94, 0.4)" : "rgba(234, 179, 8, 0.3)"}`,
                    borderRadius: "6px",
                    color: editingUser.is_suspended ? "#4ade80" : "#eab308",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "6px 12px",
                    cursor: editingUser.id === user?.id || usersBusy ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    fontFamily: "var(--sans-font)",
                  }}
                >
                  {editingUser.is_suspended ? <><UserCheck size={14} /> Reactivar usuario</> : <><Ban size={14} /> Suspender usuario</>}
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "10px" }}>
                  Permisos del operador
                </div>
                {draftRole === "admin" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.25)", borderRadius: "6px", padding: "10px 12px" }}>
                    <ShieldCheck size={16} style={{ color: "#c084fc" }} />
                    <span style={{ color: "#c084fc", fontSize: "0.74rem", fontWeight: 700 }}>Acceso total (Administrador). Los administradores siempre tienen todos los permisos.</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {PERM_DEFS.map((p) => {
                      const checked = !!draftPermissions[p.key];
                      return (
                        <label key={p.key} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(0, 0, 0, 0.2)", border: `1px solid ${checked ? "rgba(249, 115, 22, 0.35)" : "var(--border-subtle)"}`, borderRadius: "6px", padding: "9px 12px", cursor: usersBusy ? "not-allowed" : "pointer" }}>
                          <button
                            type="button"
                            disabled={usersBusy}
                            onClick={() => setDraftPermissions((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: checked ? "var(--accent-orange)" : "var(--text-muted)",
                              cursor: usersBusy ? "not-allowed" : "pointer",
                              padding: 0,
                              marginTop: "1px",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            {checked ? <CheckSquare size={16} /> : <Square size={16} />}
                          </button>
                          <div>
                            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#f8fafc" }}>{p.label}</div>
                            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)", lineHeight: 1.4 }}>{p.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setEditingUser(null)}
                disabled={usersBusy}
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-color)",
                  borderRadius: "6px",
                  color: "var(--text-muted)",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "7px 14px",
                  cursor: usersBusy ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUser}
                disabled={usersBusy}
                style={{
                  background: "var(--accent-orange)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "7px 14px",
                  cursor: usersBusy ? "not-allowed" : "pointer",
                  fontFamily: "var(--sans-font)",
                }}
              >
                {usersBusy ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
