import React, { useState } from "react";
import { Search, Truck, Clock, Phone } from "lucide-react";
import { WorkTeam } from "./types";

export interface WorkTeamsTabProps {
  workTeams: WorkTeam[];
}

export const WorkTeamsTab: React.FC<WorkTeamsTabProps> = ({ workTeams }) => {
  const [teamSearchQuery, setTeamSearchQuery] = useState("");

  const filteredTeams = workTeams.filter((t) =>
    t.groupName.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    t.pointTitle.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    (t.unitOut || "").toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    (t.managerName || "").toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  return (
    <main style={{ padding: "16px 24px", flex: 1, width: "100%", boxSizing: "border-box", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
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
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
          <thead>
            <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.62rem", letterSpacing: "0.05em" }}>
              <th style={{ padding: "10px 14px", fontWeight: 700 }}>Equipo de Trabajo</th>
              <th style={{ padding: "10px 14px", fontWeight: 700 }}>Ubicación / Punto</th>
              <th style={{ padding: "10px 14px", fontWeight: 700 }}>Unidad / Vehículo</th>
              <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Hora Salida</th>
              <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Hora Llegada</th>
              <th style={{ padding: "10px 14px", fontWeight: 700 }}>Encargado</th>
              <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Efectivos</th>
              <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "center" }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>
                  {teamSearchQuery ? "No se encontraron equipos que coincidan con la búsqueda." : "No hay equipos de trabajo registrados para la fecha seleccionada."}
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => (
                <tr key={team.id} style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background 0.15s" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>
                    {team.groupName}
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--text-main)" }}>
                    📍 {team.pointTitle}
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
