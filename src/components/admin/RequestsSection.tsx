import React from "react";
import { Users, Clock, Check, XCircle } from "lucide-react";
import Select from "../ui/Select";
import type { UserRegistrationRequest } from "../../services/userService";

interface RequestsSectionProps {
  requests: UserRegistrationRequest[];
  roleSelectionMap: Record<string, "operador" | "admin">;
  onRoleChange: (id: string, role: "operador" | "admin") => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ROLE_OPTIONS = [
  { value: "operador", label: "Operador (Carga de datos y reportes)" },
  { value: "admin", label: "Administrador (Control total)" },
];

const statusStyle = (status: string): React.CSSProperties => {
  const color = status === "Aprobado" ? "#4ade80" : status === "Rechazado" ? "#ef4444" : "var(--accent-orange)";
  const bg = status === "Aprobado" ? "rgba(34, 197, 94, 0.12)" : status === "Rechazado" ? "rgba(239, 68, 68, 0.12)" : "rgba(249, 115, 22, 0.12)";
  const border = status === "Aprobado" ? "rgba(34, 197, 94, 0.3)" : status === "Rechazado" ? "rgba(239, 68, 68, 0.3)" : "rgba(249, 115, 22, 0.3)";
  return {
    fontSize: "0.64rem",
    fontWeight: 800,
    padding: "3px 8px",
    borderRadius: "4px",
    color,
    background: bg,
    border: `1px solid ${border}`,
  };
};

export const RequestsSection: React.FC<RequestsSectionProps> = ({ requests, roleSelectionMap, onRoleChange, onApprove, onReject }) => {
  const pendingCount = requests.filter((r) => r.status === "Pendiente").length;

  return (
    <>
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
                    <Select
                      options={ROLE_OPTIONS}
                      value={roleSelectionMap[req.id] || req.requestedRole || "operador"}
                      onChange={(v) => onRoleChange(req.id, v as "operador" | "admin")}
                    />
                  ) : (
                    <span style={{ fontWeight: 700, color: req.assignedRole === "admin" ? "#c084fc" : "#38bdf8" }}>
                      {req.assignedRole?.toUpperCase() || req.requestedRole.toUpperCase()}
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  <span style={statusStyle(req.status)}>{req.status.toUpperCase()}</span>
                </td>
                <td style={{ padding: "12px 14px", textAlign: "center" }}>
                  {req.status === "Pendiente" ? (
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                      <button
                        onClick={() => onApprove(req.id)}
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
                        onClick={() => onReject(req.id)}
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
    </>
  );
};

export const RequestsSectionTitle: React.FC = () => (
  <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
    <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
      <Users size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
      Gestión de Usuarios — Solicitudes, Roles y Permisos
    </h3>
    <p style={{ margin: "2px 0 0 0", fontSize: "0.65rem", color: "var(--text-muted)" }}>
      Aprueba solicitudes de registro, asigna roles, configura permisos, suspende o elimina cuentas.
    </p>
  </div>
);
