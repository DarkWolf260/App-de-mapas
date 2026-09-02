import React, { useState, useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { fetchFeatures } from "../services/featureService";
import { fetchLogs } from "../services/logService";
import {
  fetchManagedUsers,
  updateUserRole,
  updateUserPermissions,
  suspendUser,
  unsuspendUser,
  deleteUser,
  ManagedUser,
  UserPermissions,
} from "../services/adminUsersService";
import { AdminHeader, AdminSection } from "./admin/AdminHeader";
import { MetricCards } from "./admin/MetricCards";
import { UsersTable } from "./admin/UsersTable";
import { LayersSection } from "./admin/LayersSection";
import { DeleteUserModal } from "./admin/DeleteUserModal";
import { EditUserModal } from "./admin/EditUserModal";

export const AdminPanelPage: React.FC = () => {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();

  const [activeSection, setActiveSection] = useState<AdminSection>("usuarios");
  const [featuresCount, setFeaturesCount] = useState(0);
  const [logsCount, setLogsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [usersBusy, setUsersBusy] = useState(false);
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<ManagedUser | null>(null);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [supabaseOk, setSupabaseOk] = useState(true);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);

  const loadAdminData = async () => {
    setRefreshing(true);
    try {
      // Live ping to Supabase
      const pingStart = performance.now();
      let liveOk = false;
      let liveLatency = 0;
      try {
        const { error } = await supabase.from("user_roles").select("id", { count: "exact", head: true });
        liveLatency = Math.round(performance.now() - pingStart);
        liveOk = !error || error.code === "PGRST116" || error.code === "42501";
      } catch {
        liveOk = false;
      }
      setSupabaseOk(liveOk);
      setLatencyMs(liveLatency);

      const [fetchedFeats, fetchedLogsMap] = await Promise.all([
        fetchFeatures(),
        fetchLogs(),
      ]);

      if (fetchedFeats) setFeaturesCount(fetchedFeats.length);

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
      setSupabaseOk(false);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const flash = (msg: string) => {
    setUserActionMsg(msg);
    setTimeout(() => setUserActionMsg(null), 3000);
  };

  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
  };

  const handleSaveUser = async (role: "admin" | "operador", permissions: UserPermissions) => {
    if (!editingUser) return;
    const roleChanged = role !== editingUser.role;
    const permKeys = Object.keys(editingUser.permissions) as (keyof UserPermissions)[];
    const permsChanged = permKeys.some((k) => permissions[k] !== editingUser.permissions[k]);
    if (editingUser.id === user?.id && roleChanged) {
      flash("No puedes cambiar tu propio rol.");
      return;
    }
    setUsersBusy(true);
    try {
      if (roleChanged) await updateUserRole(editingUser.id, role);
      if (permsChanged) await updateUserPermissions(editingUser.id, permissions);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, role, permissions: { ...u.permissions, ...permissions } }
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
        flash(`Usuario ${u.full_name || u.email} activado correctamente.`);
      } else {
        await suspendUser(u.id);
        flash(`Usuario ${u.full_name || u.email} suspendido.`);
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
      flash("No puedes eliminar tu propia cuenta.");
      setConfirmDeleteUser(null);
      return;
    }
    setUsersBusy(true);
    try {
      await deleteUser(confirmDeleteUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== confirmDeleteUser.id));
      flash(`Usuario ${confirmDeleteUser.email} eliminado correctamente.`);
    } catch (err: any) {
      flash(err?.message || "Error al eliminar el usuario.");
    } finally {
      setUsersBusy(false);
      setConfirmDeleteUser(null);
    }
  };

  if (loading) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", color: "var(--text-muted)" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.08)", borderTopColor: "var(--accent-orange)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

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

  const pendingCount = users.filter((u) => u.is_suspended).length;

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
      <AdminHeader
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        pendingCount={pendingCount}
        refreshing={refreshing}
        onRefresh={loadAdminData}
      />

      <main className="admin-main">
        <MetricCards
          usersCount={users.length}
          logsCount={logsCount}
          supabaseOk={supabaseOk}
          latencyMs={latencyMs}
        />

        {activeSection === "usuarios" && (
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
            <UsersTable
              users={users}
              currentUserId={user?.id}
              busy={usersBusy}
              actionMsg={userActionMsg}
              onEdit={openEdit}
              onDelete={setConfirmDeleteUser}
              onToggleSuspend={handleSuspendToggle}
            />
          </div>
        )}

        {activeSection === "capas" && <LayersSection featuresCount={featuresCount} logsCount={logsCount} />}
      </main>

      <DeleteUserModal
        user={confirmDeleteUser}
        busy={usersBusy}
        onCancel={() => setConfirmDeleteUser(null)}
        onConfirm={handleDeleteUser}
      />

      <EditUserModal
        key={editingUser?.id ?? "none"}
        user={editingUser}
        currentUserId={user?.id}
        busy={usersBusy}
        onClose={() => setEditingUser(null)}
        onSave={handleSaveUser}
        onToggleSuspend={handleSuspendToggle}
      />
    </div>
  );
};
