import React from "react";
import type { DailyLog } from "../../types";
import { Calendar, Heart, Cross, PawPrint, Users, Clock, FileText } from "lucide-react";

interface HistoryTabProps {
  logs: DailyLog[] | undefined;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ logs }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--color-info)", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "3px" }}>
      Historial de Registros ({logs?.length || 0})
    </div>

    {logs && logs.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "260px", overflowY: "auto", paddingRight: "2px" }}>
        {logs.map((log, idx) => {
          const hasG2 = !!log.groupName2 || !!log.unitOut2;
          return (
            <div
              key={idx}
              style={{
                fontSize: "0.65rem",
                borderBottom: idx !== (logs.length ?? 0) - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                paddingBottom: "6px",
                marginBottom: "2px",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div style={{ fontWeight: 800, color: "var(--text-main)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={11} /> {log.date}</span>
                <span style={{ color: "var(--color-green)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Heart size={11} /> {log.rescuedCount || "0"} | <Cross size={11} /> {log.recoveredCount || "0"} | <PawPrint size={11} /> {log.rescuedPetsCount || "0"}
                </span>
              </div>

              <div style={{ color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--color-info)" }}>G1: </strong> {log.groupName || "-"}
                {log.unitOut ? ` (${log.unitOut})` : ""}
                {log.managerName ? ` - Enc: ${log.managerName}` : ""}
                {log.officersCount ? <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>[<Users size={10} /> {log.officersCount}]</span> : ""}
              </div>

              {hasG2 && (
                <div style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--color-purple)" }}>G2: </strong> {log.groupName2 || "-"}
                  {log.unitOut2 ? ` (${log.unitOut2})` : ""}
                  {log.managerName2 ? ` - Enc: ${log.managerName2}` : ""}
                  {log.officersCount2 ? <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>[<Users size={10} /> {log.officersCount2}]</span> : ""}
                </div>
              )}

              {(log.departureTime || log.arrivalTime) && (
                <div style={{ fontSize: "0.58rem", color: "var(--color-info)", display: "flex", gap: "6px", marginTop: "1px", alignItems: "center" }}>
                  <Clock size={10} /> Horario: {log.departureTime || "--:--"} - {log.arrivalTime || "--:--"}
                </div>
              )}
              {log.observations && (
                <div style={{ fontSize: "0.58rem", color: "var(--color-info)", marginTop: "1px", background: "rgba(56, 189, 248, 0.04)", borderLeft: "2px solid var(--color-info)", padding: "2px 4px", borderRadius: "0 3px 3px 0" }}>
                  <strong style={{ display: "flex", alignItems: "center", gap: "3px" }}><FileText size={10} /> Obs:</strong> {log.observations}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontStyle: "italic", padding: "10px 0", textAlign: "center" }}>
        No hay registros anteriores guardados en este punto.
      </div>
    )}
  </div>
);
