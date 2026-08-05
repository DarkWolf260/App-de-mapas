import React, { useState } from "react";
import { Pencil, ShieldCheck, UserCheck, Ban, CheckSquare, Square } from "lucide-react";
import Select from "../ui/Select";
import type { ManagedUser, UserPermissions } from "../../services/adminUsersService";
import { DEFAULT_OPERATOR_PERMISSIONS } from "../../services/adminUsersService";
import { PERM_DEFS } from "./permissions";

interface EditUserModalProps {
  user: ManagedUser | null;
  currentUserId?: string;
  busy: boolean;
  onClose: () => void;
  onSave: (role: "admin" | "operador", permissions: UserPermissions) => void;
  onToggleSuspend: (user: ManagedUser) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ user, currentUserId, busy, onClose, onSave, onToggleSuspend }) => {
  const [draftRole, setDraftRole] = useState<"operador" | "admin">(user?.role ?? "operador");
  const [draftPermissions, setDraftPermissions] = useState<UserPermissions>(
    user?.permissions ? { ...user.permissions } : { ...DEFAULT_OPERATOR_PERMISSIONS }
  );

  if (!user) return null;
  const isSelf = user.id === currentUserId;

  return (
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
      onClick={() => { if (!busy) onClose(); }}
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
          {user.full_name || user.email || "Sin nombre"} — {user.email}
          {isSelf && <span style={{ marginLeft: "6px", color: "var(--accent-orange)", fontSize: "0.62rem", fontWeight: 800 }}>USTED</span>}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>
              Rol del usuario
            </label>
            <Select
              options={[
                { value: "operador", label: "Operador — carga de datos y reportes", color: "#38bdf8" },
                { value: "admin", label: "Administrador — control total", color: "#c084fc" },
              ]}
              value={draftRole}
              disabled={isSelf || busy}
              onChange={(v) => setDraftRole(v as "admin" | "operador")}
              style={{ width: "100%" }}
            />
            {isSelf && (
              <p style={{ margin: "4px 0 0 0", fontSize: "0.62rem", color: "var(--text-muted)" }}>No puedes cambiar tu propio rol.</p>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>Estado de la cuenta</div>
              {user.is_suspended ? (
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
              onClick={() => onToggleSuspend(user)}
              disabled={isSelf || busy}
              style={{
                background: user.is_suspended ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.12)",
                border: `1px solid ${user.is_suspended ? "rgba(34, 197, 94, 0.4)" : "rgba(234, 179, 8, 0.3)"}`,
                borderRadius: "6px",
                color: user.is_suspended ? "#4ade80" : "#eab308",
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "6px 12px",
                cursor: isSelf || busy ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontFamily: "var(--sans-font)",
              }}
            >
              {user.is_suspended ? <><UserCheck size={14} /> Reactivar usuario</> : <><Ban size={14} /> Suspender usuario</>}
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
                    <label key={p.key} style={{ display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(0, 0, 0, 0.2)", border: `1px solid ${checked ? "rgba(249, 115, 22, 0.35)" : "var(--border-subtle)"}`, borderRadius: "6px", padding: "9px 12px", cursor: busy ? "not-allowed" : "pointer" }}>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setDraftPermissions((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: checked ? "var(--accent-orange)" : "var(--text-muted)",
                          cursor: busy ? "not-allowed" : "pointer",
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
            onClick={onClose}
            disabled={busy}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              fontSize: "0.74rem",
              fontWeight: 700,
              padding: "7px 14px",
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "var(--sans-font)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(draftRole, draftPermissions)}
            disabled={busy}
            style={{
              background: "var(--accent-orange)",
              border: "none",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.74rem",
              fontWeight: 700,
              padding: "7px 14px",
              cursor: busy ? "not-allowed" : "pointer",
              fontFamily: "var(--sans-font)",
            }}
          >
            {busy ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};
