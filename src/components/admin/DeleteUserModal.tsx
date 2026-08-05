import React from "react";
import { Trash2 } from "lucide-react";
import type { ManagedUser } from "../../services/adminUsersService";

interface DeleteUserModalProps {
  user: ManagedUser | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ user, busy, onCancel, onConfirm }) => {
  if (!user) return null;
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
    >
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "24px", maxWidth: "420px", width: "90%", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", fontWeight: 800, color: "#ef4444" }}>
          <Trash2 size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} />
          Eliminar usuario
        </h3>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-main)", lineHeight: 1.5 }}>
          ¿Estás seguro de que deseas eliminar definitivamente a{" "}
          <strong>{user.full_name || user.email || "este usuario"}</strong> ({user.email})?
          Esta acción no se puede deshacer y eliminará su cuenta y acceso.
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "18px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
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
            onClick={onConfirm}
            disabled={busy}
            style={{
              background: "#ef4444",
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
            {busy ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
};
