import React from "react";
import { Truck, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import type { WorkTeam } from "./types";
import { teamIsBomberos } from "./teamDept";

interface WorkTeamCardProps {
  team: WorkTeam;
  onEditTeam?: (team: WorkTeam) => void;
  onDeleteTeam?: (team: WorkTeam) => void;
}

const hoverAccent = (isBomberos: boolean): string =>
  isBomberos ? "rgba(239, 68, 68, 0.4)" : "rgba(249, 115, 22, 0.4)";

export const WorkTeamCard: React.FC<WorkTeamCardProps> = ({ team, onEditTeam, onDeleteTeam }) => {
  const isBomberos = teamIsBomberos(team.department);

  return (
    <div
      key={team.id}
      className="team-card-container"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: "10px",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = hoverAccent(isBomberos);
        e.currentTarget.style.boxShadow = isBomberos ? "0 4px 15px rgba(239, 68, 68, 0.15)" : "0 4px 15px rgba(249, 115, 22, 0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.borderColor = "var(--border-color)";
        e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f8fafc", margin: 0, letterSpacing: "-0.01em" }}>
            {team.groupName}
          </h3>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "var(--text-muted)",
              alignSelf: "flex-start",
              letterSpacing: "0.05em",
              marginTop: "2px"
            }}
          >
            {isBomberos ? "Bomberos" : "Protección Civil"}
          </span>
        </div>
        {onEditTeam && (
          <div className="team-card-edit-btn" style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
            <button
              type="button"
              onClick={() => onEditTeam(team)}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: "5px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isBomberos ? "rgba(239, 68, 68, 0.2)" : "rgba(249, 115, 22, 0.2)";
                e.currentTarget.style.borderColor = hoverAccent(isBomberos);
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
              title="Editar equipo y estadísticas"
            >
              <Pencil size={11} />
            </button>
            {onDeleteTeam && (
              <button
                type="button"
                onClick={() => onDeleteTeam(team)}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
                title="Eliminar equipo"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", marginBottom: "4px" }}>
        <MapPin size={14} style={{ color: "#ef4444", flexShrink: 0 }} />
        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#fff" }}>
          {team.pointTitle}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.8rem", marginTop: "4px" }}>
        {team.managerName && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#94a3b8", width: "80px", flexShrink: 0 }}>Encargado:</span>
            <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {team.managerName}
              {team.managerPhone && (
                <span style={{ fontSize: "0.78rem", color: "#cbd5e1", marginLeft: "4px" }}>
                  ({team.managerPhone})
                </span>
              )}
            </span>
          </div>
        )}

        {team.unitOut && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "#94a3b8", width: "80px", flexShrink: 0 }}>Unidad:</span>
            <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Truck size={12} style={{ color: "#38bdf8", marginRight: "6px" }} />
              {team.unitOut}
            </span>
          </div>
        )}

        {(team.departureTime || team.arrivalTime) && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ color: "#94a3b8", width: "80px", flexShrink: 0, marginTop: "2px" }}>Horarios:</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {team.departureTime && (
                <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={11} style={{ color: "var(--accent-orange)" }} />
                  {team.departureTime} <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>(Salida)</span>
                </span>
              )}
              {team.arrivalTime && (
                <span style={{ color: "#f8fafc", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={11} style={{ color: "#4ade80" }} />
                  {team.arrivalTime} <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>(Llegada)</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--border-color)", margin: "8px 0", marginTop: "auto" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            color: team.hasArrived ? "#4ade80" : "#f97316",
            background: team.hasArrived ? "rgba(74, 222, 128, 0.15)" : "rgba(249, 115, 22, 0.15)",
            borderRadius: "4px",
            padding: "2px 8px",
            display: "inline-block",
          }}
        >
          {team.hasArrived ? "En base" : "Desplegado"}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600 }}>EFECTIVOS:</span>
          <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
            {team.officersCount}
          </span>
        </div>
      </div>
    </div>
  );
};
