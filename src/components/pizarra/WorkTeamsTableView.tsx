import React from "react";
import { Truck, Clock, MapPin, Phone, ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import type { WorkTeam } from "./types";
import { teamIsBomberos } from "./teamDept";
import type { SortField, SortDirection } from "./workTeamsSort";

interface WorkTeamsTableViewProps {
  teams: WorkTeam[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  searchQuery: string;
  onEditTeam?: (team: WorkTeam) => void;
  onDeleteTeam?: (team: WorkTeam) => void;
}

interface SortableHeaderProps {
  label: string;
  alignCenter?: boolean;
  field: SortField;
  activeSortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, alignCenter, field, activeSortField, sortDirection, onSort }) => {
  const isActive = field === activeSortField;
  return (
    <th
      onClick={() => onSort(field)}
      style={{
        padding: "10px 14px",
        textAlign: alignCenter ? "center" : "left",
        borderBottom: "1px solid var(--border-color)",
        background: "#131924",
        position: "sticky",
        top: 0,
        zIndex: 1,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: alignCenter ? "center" : "flex-start", gap: "4px", width: alignCenter ? "100%" : undefined }}>
        <span>{label}</span>
        {isActive && (sortDirection === "asc" ? <ChevronUp size={12} style={{ color: "var(--accent-orange)" }} /> : <ChevronDown size={12} style={{ color: "var(--accent-orange)" }} />)}
      </div>
    </th>
  );
};

export const WorkTeamsTableView: React.FC<WorkTeamsTableViewProps> = ({ teams, sortField, sortDirection, onSort, searchQuery, onEditTeam, onDeleteTeam }) => (
  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "auto", flex: 1, minHeight: 0 }}>
    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
      <thead>
        <tr style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
          <SortableHeader label="Equipo de Trabajo" field="groupName" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Ubicación / Punto" field="pointTitle" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Unidad / Vehículo" field="unitOut" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Hora Salida" alignCenter field="departureTime" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Hora Llegada" alignCenter field="arrivalTime" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Encargado" field="managerName" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Efectivos" alignCenter field="officersCount" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          <SortableHeader label="Estado" alignCenter field="hasArrived" activeSortField={sortField} sortDirection={sortDirection} onSort={onSort} />
          {onEditTeam && <th style={{ padding: "10px 14px", textAlign: "center", borderBottom: "1px solid var(--border-color)", background: "#131924", position: "sticky", top: 0, zIndex: 1, userSelect: "none" }}>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {teams.length === 0 ? (
          <tr>
            <td colSpan={onEditTeam ? 9 : 8} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
              {searchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
            </td>
          </tr>
        ) : (
          teams.map((team) => {
            const isBomberos = teamIsBomberos(team.department);
            return (
              <tr key={team.id} className="team-table-row" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "0.5rem",
                        fontWeight: 850,
                        padding: "1px 4px",
                        borderRadius: "3px",
                        textTransform: "uppercase",
                        background: isBomberos ? "rgba(239, 68, 68, 0.15)" : "rgba(249, 115, 22, 0.15)",
                        color: isBomberos ? "#ef4444" : "var(--accent-orange)",
                      }}
                    >
                      {isBomberos ? "Bomberos" : "PC"}
                    </span>
                    <span>{team.groupName}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
                    <span>{team.pointTitle}</span>
                  </div>
                </td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                  {team.unitOut ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Truck size={13} style={{ color: "#38bdf8" }} />
                      <span>{team.unitOut}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-main)", fontFamily: "var(--sans-font)", fontWeight: 600 }}>
                  {team.departureTime ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <Clock size={12} style={{ color: "var(--accent-orange)" }} />
                      <span>{team.departureTime}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--text-main)", fontFamily: "var(--sans-font)", fontWeight: 600 }}>
                  {team.arrivalTime ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                      <Clock size={12} style={{ color: "#4ade80" }} />
                      <span>{team.arrivalTime}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={{ padding: "10px 14px", color: "var(--text-secondary)" }}>
                  {team.managerName ? (
                    <div>
                      <div style={{ fontWeight: 600, color: "#f8fafc" }}>{team.managerName}</div>
                      {team.managerPhone && <div style={{ fontSize: "0.62rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "3px" }}><Phone size={10} /> {team.managerPhone}</div>}
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
                  {team.officersCount}
                </td>
                <td style={{ padding: "10px 14px", textAlign: "center" }}>
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
                </td>
                {onEditTeam && (
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => onEditTeam(team)}
                        className="table-edit-btn"
                        style={{
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "6px",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: "5px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = isBomberos ? "rgba(239, 68, 68, 0.2)" : "rgba(249, 115, 22, 0.2)";
                          e.currentTarget.style.borderColor = isBomberos ? "rgba(239, 68, 68, 0.4)" : "rgba(249, 115, 22, 0.4)";
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }}
                        title="Editar equipo"
                      >
                        <Pencil size={11} />
                      </button>
                      {onDeleteTeam && (
                        <button
                          type="button"
                          onClick={() => onDeleteTeam(team)}
                          className="table-edit-btn"
                          style={{
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "6px",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            padding: "5px",
                            display: "inline-flex",
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
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);
