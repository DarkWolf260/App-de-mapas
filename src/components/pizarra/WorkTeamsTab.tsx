import React, { useState } from "react";
import { Search, Truck, Clock, Phone, MapPin, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { WorkTeam } from "./types";

type SortField = "groupName" | "pointTitle" | "unitOut" | "departureTime" | "arrivalTime" | "managerName" | "officersCount" | "hasArrived";

export interface WorkTeamsTabProps {
  workTeams: WorkTeam[];
}

export const WorkTeamsTab: React.FC<WorkTeamsTabProps> = ({ workTeams }) => {
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("groupName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredTeams = workTeams.filter((t) =>
    t.groupName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    t.pointTitle.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    (t.unitOut || "").toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    (t.managerName || "").toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (aVal === undefined || aVal === null) aVal = "";
    if (bVal === undefined || bVal === null) bVal = "";

    if (typeof aVal === "boolean") {
      return sortDirection === "asc"
        ? (aVal === bVal ? 0 : aVal ? -1 : 1)
        : (aVal === bVal ? 0 : aVal ? 1 : -1);
    }

    if (typeof aVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const renderHeader = (label: string, field: SortField, textAlign: "left" | "center" = "left") => {
    const isActive = sortField === field;
    return (
      <th
        onClick={() => handleSort(field)}
        style={{
          position: "sticky",
          top: 0,
          background: "#131924",
          zIndex: 1,
          padding: "10px 14px",
          fontWeight: 700,
          borderBottom: "1px solid var(--border-color)",
          cursor: "pointer",
          userSelect: "none",
          textAlign: textAlign,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: textAlign === "center" ? "center" : "flex-start",
            gap: "6px",
            width: textAlign === "center" ? "100%" : "auto",
          }}
        >
          <span>{label}</span>
          {isActive ? (
            sortDirection === "asc" ? (
              <ChevronUp size={12} style={{ color: "#38bdf8" }} />
            ) : (
              <ChevronDown size={12} style={{ color: "#38bdf8" }} />
            )
          ) : (
            <ArrowUpDown size={11} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
          )}
        </div>
      </th>
    );
  };

  return (
    <main style={{ padding: "16px 24px 80px 24px", flex: 1, minHeight: 0, width: "100%", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* BARRA DE BÚSQUEDA Y METRICAS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "360px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar equipo, punto, unidad o encargado..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            style={{
              width: "100%",
              background: "rgba(0, 0, 0, 0.3)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "0.76rem",
              padding: "6px 10px 6px 32px",
              outline: "none",
              fontFamily: "var(--sans-font)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Equipos Registrados</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "#c084fc", fontFamily: "var(--sans-font)" }}>{workTeams.length}</span>
          </div>

          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "6px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Efectivos Totales</span>
            <span style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--accent-orange)", fontFamily: "var(--sans-font)" }}>
              {workTeams.reduce((sum, t) => sum + t.officersCount, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* TABLA COMPLETA DE EQUIPOS DE TRABAJO CON HORAS Y ENCARGADOS */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "auto", flex: 1, minHeight: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
          <thead>
            <tr style={{ color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
              {renderHeader("Equipo de Trabajo", "groupName")}
              {renderHeader("Ubicación / Punto", "pointTitle")}
              {renderHeader("Unidad / Vehículo", "unitOut")}
              {renderHeader("Hora Salida", "departureTime", "center")}
              {renderHeader("Hora Llegada", "arrivalTime", "center")}
              {renderHeader("Encargado", "managerName")}
              {renderHeader("Efectivos", "officersCount", "center")}
              {renderHeader("Estado", "hasArrived", "center")}
            </tr>
          </thead>
          <tbody>
            {sortedTeams.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                  {teamSearchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
                </td>
              </tr>
            ) : (
              sortedTeams.map((team) => (
                <tr key={team.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>
                    {team.groupName}
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
                        background: team.hasArrived ? "rgba(34, 197, 94, 0.12)" : "rgba(249, 115, 22, 0.12)",
                        border: `1px solid ${team.hasArrived ? "rgba(34, 197, 94, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
                        borderRadius: "4px",
                        padding: "2px 8px",
                        display: "inline-block",
                      }}
                    >
                      {team.hasArrived ? "En Sitio" : "Desplegado"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
};
