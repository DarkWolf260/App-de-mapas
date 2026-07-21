import React from "react";
import type { GroupData } from "../utils/logUtils";

interface GroupDisplayProps {
  group: GroupData;
  label: string;
  accentColor: string;
  showBorder?: boolean;
}

export const GroupDisplay: React.FC<GroupDisplayProps> = ({
  group,
  label,
  accentColor,
  showBorder = true,
}) => {
  const hasData = !!(group.groupName || group.managerName || group.unitOut || group.officersCount);
  if (!hasData) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "6px",
        fontSize: "0.72rem",
        color: "var(--text-muted)",
        borderBottom: showBorder ? "1px dashed rgba(255, 255, 255, 0.05)" : "none",
        paddingBottom: showBorder ? "6px" : "0",
      }}
    >
      <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: accentColor, fontSize: "0.68rem" }}>{label}</span>
        <span
          style={{
            fontSize: "0.62rem",
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: "4px",
            backgroundColor: group.arrivalTime ? "rgba(52, 211, 153, 0.12)" : "rgba(251, 146, 60, 0.12)",
            color: group.arrivalTime ? "var(--color-green)" : "var(--color-medium)",
            border: group.arrivalTime ? "1px solid rgba(52, 211, 153, 0.25)" : "1px solid rgba(251, 146, 60, 0.25)",
          }}
        >
          {group.arrivalTime ? `Llegó a las ${group.arrivalTime}` : "Desplegados"}
        </span>
      </div>
      <div>
        <strong style={{ color: "var(--text-main)" }}>👥 Grupo:</strong> {group.groupName || "–"}
      </div>
      <div>
        <strong style={{ color: "var(--text-main)" }}>👤 Encargado:</strong> {group.managerName || "–"}{group.managerPhone ? ` (${group.managerPhone})` : ""}
      </div>
      <div>
        <strong style={{ color: "var(--text-main)" }}>🚒 Unidad:</strong> {group.unitOut || "–"}
      </div>
      <div>
        <strong style={{ color: "var(--text-main)" }}>👮 Personal:</strong>{" "}
        <span style={{ color: accentColor, fontWeight: 700 }}>{group.officersCount || "0"}</span>
        <span style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}>
          {" "}(🛟 {group.rescuedCount || "0"} | 🩹 {group.recoveredCount || "0"})
        </span>
      </div>
      {(group.departureTime || group.arrivalTime) && (
        <div style={{ gridColumn: "1 / -1" }}>
          <strong style={{ color: "var(--text-main)" }}>🕒 Horas:</strong> Salida: {group.departureTime || "–"} | Llegada: {group.arrivalTime || "–"}
        </div>
      )}
    </div>
  );
};
