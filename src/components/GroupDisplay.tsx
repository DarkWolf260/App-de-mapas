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

  const isArrived = group.hasArrived || !!group.arrivalTime;
  const personnel = group.officersCount || "0";
  const rescued = group.rescuedCount && group.rescuedCount !== "0" ? group.rescuedCount : null;
  const recovered = group.recoveredCount && group.recoveredCount !== "0" ? group.recoveredCount : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        fontSize: "0.68rem",
        color: "var(--text-muted)",
        borderBottom: showBorder ? "1px dashed rgba(255, 255, 255, 0.04)" : "none",
        paddingBottom: showBorder ? "4px" : "0",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 700, color: accentColor, fontSize: "0.66rem" }}>{label}</span>
          <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{group.groupName || "–"}</span>
          {group.unitOut && <span style={{ opacity: 0.6 }}>({group.unitOut})</span>}
          <span style={{ fontWeight: 700, color: accentColor, fontSize: "0.66rem" }}>{personnel} funcionarios</span>
        </div>
        <span
          style={{
            fontSize: "0.58rem",
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: "3px",
            backgroundColor: isArrived ? "rgba(52, 211, 153, 0.1)" : "rgba(251, 146, 60, 0.1)",
            color: isArrived ? "var(--color-green)" : "var(--color-medium)",
            border: isArrived ? "1px solid rgba(52, 211, 153, 0.2)" : "1px solid rgba(251, 146, 60, 0.2)",
          }}
        >
          {isArrived ? (group.arrivalTime ? `Llegó ${group.arrivalTime}` : "Llegó") : "Despl."}
        </span>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingLeft: "16px" }}>
        {group.managerName && (
          <span style={{ color: "var(--color-info)", fontWeight: 600 }}>
            Enc: {group.managerName}{group.managerPhone ? ` ${group.managerPhone}` : ""}
          </span>
        )}
        {group.departureTime && (
          <span style={{ color: "var(--color-medium)", fontWeight: 600 }}>
            Sal: {group.departureTime}
          </span>
        )}
        {group.arrivalTime && (
          <span style={{ color: "var(--color-green)", fontWeight: 600 }}>
            Lleg: {group.arrivalTime}
          </span>
        )}
        {rescued && (
          <span style={{ color: "var(--color-green)", fontWeight: 700 }}>
            Resc: {rescued}
          </span>
        )}
        {recovered && (
          <span style={{ color: "var(--color-medium)", fontWeight: 700 }}>
            Recup: {recovered}
          </span>
        )}
      </div>
    </div>
  );
};
