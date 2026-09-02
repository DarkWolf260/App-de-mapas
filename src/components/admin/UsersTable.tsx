import React from "react";
import { UserCog, Pencil, Trash2, CheckCircle2, Ban } from "lucide-react";
import type { ManagedUser } from "../../services/adminUsersService";
import { PERM_DEFS } from "./permissions";

interface UsersTableProps {
  users: ManagedUser[];
  currentUserId?: string;
  busy: boolean;
  actionMsg: string | null;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onToggleSuspend: (user: ManagedUser) => void;
}

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <span
    style={{
      background: role === "admin" ? "rgba(168, 85, 247, 0.15)" : "rgba(56, 189, 248, 0.15)",
      border: `1px solid ${role === "admin" ? "rgba(168, 85, 247, 0.3)" : "rgba(56, 189, 248, 0.3)"}`,
      color: role === "admin" ? "#c084fc" : "#38bdf8",
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "0.65rem",
      fontWeight: 800,
    }}
  >
    {role === "admin" ? "ADMINISTRADOR" : "OPERADOR"}
  </span>
);

const StatusBadge: React.FC<{ suspended: boolean }> = ({ suspended }) => (
  <span
    style={{
      background: suspended ? "rgba(249, 115, 22, 0.15)" : "rgba(34, 197, 94, 0.12)",
      border: `1px solid ${suspended ? "rgba(249, 115, 22, 0.4)" : "rgba(34, 197, 94, 0.3)"}`,
      color: suspended ? "var(--accent-orange)" : "#4ade80",
      borderRadius: "4px",
      padding: "2px 8px",
      fontSize: "0.65rem",
      fontWeight: 800,
    }}
  >
    {suspended ? "Pendiente / Suspendido" : "Activo"}
  </span>
);

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  currentUserId,
  busy,
  actionMsg,
  onEdit,
  onDelete,
  onToggleSuspend,
}) => {
  return (
    <>
      <div
        style={{
          padding: "10px 16px",
          background: "rgba(56, 189, 248, 0.08)",
          borderTop: "1px solid var(--border-color)",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: "0.7rem",
            fontWeight: 800,
            color: "#38bdf8",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          <UserCog size={13} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          Usuarios del Sistema ({users.length})
        </h4>
        {actionMsg && (
          <span
            style={{
              background: "rgba(56, 189, 248, 0.12)",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              color: "#38bdf8",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "0.68rem",
              fontWeight: 700,
            }}
          >
            {actionMsg}
          </span>
        )}
      </div>

      {users.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.76rem" }}>
          No hay usuarios registrados en el sistema.
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
            <thead>
              <tr
                style={{
                  background: "var(--bg-tertiary)",
                  borderBottom: "1px solid var(--border-color)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontSize: "0.62rem",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Usuario</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Rol</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Estado</th>
                <th style={{ padding: "10px 14px", fontWeight: 700 }}>Permisos del Operador</th>
                <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const enabledPerms = PERM_DEFS.filter((p) => u.role !== "admin" && !!u.permissions[p.key]);
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)", background: u.is_suspended ? "rgba(249, 115, 22, 0.04)" : "transparent" }}>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ fontWeight: 700, color: "#f8fafc" }}>
                        {u.full_name || u.email || "Sin nombre"}
                        {isSelf && <span style={{ marginLeft: "6px", color: "var(--accent-orange)", fontSize: "0.62rem", fontWeight: 800 }}>— USTED</span>}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "var(--text-muted)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusBadge suspended={u.is_suspended} />
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      {u.role === "admin" ? (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>Acceso total (Administrador)</span>
                      ) : enabledPerms.length === 0 ? (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.66rem" }}>Sin permisos de edición</span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {enabledPerms.map((p) => (
                            <span
                              key={p.key}
                              style={{
                                background: "rgba(56, 189, 248, 0.1)",
                                border: "1px solid rgba(56, 189, 248, 0.25)",
                                color: "#7dd3fc",
                                borderRadius: "4px",
                                padding: "2px 7px",
                                fontSize: "0.62rem",
                                fontWeight: 700,
                              }}
                            >
                              {p.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center" }}>
                        {u.is_suspended && !isSelf && (
                          <button
                            onClick={() => onToggleSuspend(u)}
                            disabled={busy}
                            title="Activar cuenta de usuario"
                            style={{
                              background: "rgba(34, 197, 94, 0.15)",
                              border: "1px solid rgba(34, 197, 94, 0.4)",
                              borderRadius: "6px",
                              color: "#4ade80",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "4px 10px",
                              cursor: busy ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontFamily: "var(--sans-font)",
                            }}
                          >
                            <CheckCircle2 size={13} /> Activar
                          </button>
                        )}
                        {!u.is_suspended && !isSelf && (
                          <button
                            onClick={() => onToggleSuspend(u)}
                            disabled={busy}
                            title="Suspender cuenta de usuario"
                            style={{
                              background: "rgba(239, 68, 68, 0.12)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "6px",
                              color: "#ef4444",
                              fontSize: "0.66rem",
                              fontWeight: 700,
                              padding: "4px 8px",
                              cursor: busy ? "not-allowed" : "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontFamily: "var(--sans-font)",
                            }}
                          >
                            <Ban size={12} /> Suspender
                          </button>
                        )}
                        <button
                          className="user-action-icon edit"
                          onClick={() => onEdit(u)}
                          disabled={busy}
                          title="Editar rol y permisos de usuario"
                          style={{ cursor: busy ? "not-allowed" : "pointer" }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className="user-action-icon delete"
                          onClick={() => onDelete(u)}
                          disabled={isSelf || busy}
                          title={isSelf ? "No puedes eliminarte a ti mismo" : "Eliminar usuario definitivamente"}
                          style={{ cursor: isSelf || busy ? "not-allowed" : "pointer" }}
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
    </>
  );
};
