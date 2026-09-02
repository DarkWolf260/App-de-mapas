import React from "react";
import type { CampamentoEntry } from "../../services/baseService";

interface CampsSectionProps {
  camps: CampamentoEntry[];
}

export const CampsSection: React.FC<CampsSectionProps> = ({ camps }) => (
  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
    <div style={{ padding: "12px 16px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>
        Bases Operacionales y Campamentos Registrados ({camps.length})
      </h3>
    </div>
    <div className="admin-table-container">
      <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.74rem" }}>
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
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#f8fafc" }}>{camp.campName}</td>
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
  </div>
);
