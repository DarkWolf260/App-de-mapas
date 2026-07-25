import React from "react";
import type { DailyLog } from "../../types";
import { getNormalizedGroupList } from "../../utils/logUtils";
import { Calendar, HeartHandshake, ShieldAlert, HeartPulse, Ambulance, Dog, Users, FileText } from "lucide-react";

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
        {[...logs].reverse().map((log, idx) => {
          const groupList = getNormalizedGroupList(log);
          const rescued = groupList.reduce((acc, g) => acc + (parseInt(g.rescuedCount || "0", 10) || 0), 0);
          const recovered = groupList.reduce((acc, g) => acc + (parseInt(g.recoveredCount || "0", 10) || 0), 0);
          const prehospital = groupList.reduce((acc, g) => acc + (parseInt(g.prehospitalCareCount || "0", 10) || 0), 0);
          const transfers = groupList.reduce((acc, g) => acc + (parseInt(g.transfersCount || "0", 10) || 0), 0);
          const pets = parseInt(log.rescuedPetsCount || "0", 10) || 0;

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
                gap: "3px",
              }}
            >
              <div style={{ fontWeight: 800, color: "var(--text-main)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={11} /> {log.date}</span>
                <span style={{ color: "var(--color-green)", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem" }}>
                  {rescued > 0 && <span title="Rescatados" style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "var(--color-green)" }}><HeartHandshake size={11} /> {rescued}</span>}
                  {recovered > 0 && <span title="Recuperados" style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "var(--color-info)" }}><ShieldAlert size={11} /> {recovered}</span>}
                  {prehospital > 0 && <span title="Atenciones" style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#38bdf8" }}><HeartPulse size={11} /> {prehospital}</span>}
                  {transfers > 0 && <span title="Traslados" style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "var(--color-purple)" }}><Ambulance size={11} /> {transfers}</span>}
                  {pets > 0 && <span title="Mascotas" style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "#fbbf24" }}><Dog size={11} /> {pets}</span>}
                </span>
              </div>

              {groupList.map((g, gIdx) => (
                <div key={g.id || gIdx} style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                  <strong style={{ color: gIdx === 0 ? "var(--color-info)" : gIdx === 1 ? "var(--color-purple)" : gIdx === 2 ? "#c084fc" : "#fb923c" }}>
                    G{gIdx + 1}:
                  </strong>{" "}
                  <span>{g.groupName || "Sin nombre"}</span>
                  {g.unitOut && <span style={{ opacity: 0.8 }}>({g.unitOut})</span>}
                  {g.managerName && <span style={{ opacity: 0.8 }}>- Enc: {g.managerName}</span>}
                  {g.officersCount && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", color: "var(--text-main)" }}>
                      [<Users size={10} /> {g.officersCount}]
                    </span>
                  )}
                  {g.isVolunteer && (
                    <span style={{ background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: "3px", padding: "0 3px", fontSize: "0.5rem", fontWeight: 800 }}>
                      VOLUNTARIO
                    </span>
                  )}
                </div>
              ))}

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
