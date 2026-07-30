import React from "react";
import type { GroupData } from "../utils/logUtils";
import { Users, User, CheckCircle2, AlertCircle, HeartHandshake, ShieldAlert, HeartPulse, Ambulance } from "lucide-react";

interface GroupDisplayProps {
  group: GroupData;
  label: string;
  accentColor: string;
  onToggleArrival?: (hasArrived: boolean) => void;
}

export const GroupDisplay: React.FC<GroupDisplayProps> = ({
  group,
  label,
  accentColor,
  onToggleArrival,
}) => {
  const hasData = !!(group.groupName || group.managerName || group.unitOut || group.officersCount);
  if (!hasData) return null;

  const isArrived = !!group.hasArrived;
  const personnel = group.officersCount || "0";
  const rescued = group.rescuedCount && group.rescuedCount !== "0" ? group.rescuedCount : null;
  const recovered = group.recoveredCount && group.recoveredCount !== "0" ? group.recoveredCount : null;
  const prehospitalCare = group.prehospitalCareCount && group.prehospitalCareCount !== "0" ? group.prehospitalCareCount : null;
  const transfers = group.transfersCount && group.transfersCount !== "0" ? group.transfersCount : null;

  return (
    <div className="rr-group-box" style={{ borderColor: `${accentColor}30` }}>
      {/* Group Header Row */}
      <div className="rr-group-header">
        <div className="rr-group-title">
          <span
            className="rr-group-badge"
            style={{
              backgroundColor: group.isVolunteer ? "rgba(168, 85, 247, 0.2)" : `${accentColor}20`,
              color: group.isVolunteer ? "#c084fc" : accentColor,
              borderColor: group.isVolunteer ? "rgba(168, 85, 247, 0.4)" : `${accentColor}40`,
            }}
          >
            {group.isVolunteer ? "VOLUNTARIO" : label}
          </span>
          <span className="rr-group-name">{group.groupName || "Sin Nombre"}</span>
          {group.unitOut && <span className="rr-unit-tag">{group.unitOut}</span>}
          {group.commissionId && group.commissionId !== "independiente" && (
            <span style={{ background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "4px", padding: "1px 5px", fontSize: "0.55rem", fontWeight: 700 }}>
              Comisión Conjunta
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleArrival?.(!isArrived);
          }}
          className={`rr-status-pill ${isArrived ? "arrived" : "pending"}`}
          title={isArrived ? "Clic para cambiar a En Camino" : "Clic para cambiar a En Sitio de Trabajo"}
          style={{ cursor: onToggleArrival ? "pointer" : "default" }}
        >
          {isArrived ? (
            <>
              <CheckCircle2 size={11} />
              <span>En Sitio</span>
            </>
          ) : (
            <>
              <AlertCircle size={11} />
              <span>En Camino</span>
            </>
          )}
        </button>
      </div>

      {/* Group Details Grid */}
      <div className="rr-group-details">
        <div className="rr-detail-item">
          <Users size={12} className="rr-detail-icon" style={{ color: accentColor }} />
          <span><strong>{personnel}</strong> funcionarios</span>
        </div>

        {group.managerName && (
          <div className="rr-detail-item">
            <User size={12} className="rr-detail-icon" />
            <span>Enc: <strong>{group.managerName}</strong> {group.managerPhone ? `(${group.managerPhone})` : ""}</span>
          </div>
        )}
      </div>

      {/* Operational Results Badges */}
      {(rescued || recovered || prehospitalCare || transfers) && (
        <div className="rr-group-results">
          {rescued && (
            <span className="rr-result-badge rescued">
              <HeartHandshake size={11} /> {rescued} Rescatados
            </span>
          )}
          {recovered && (
            <span className="rr-result-badge recovered">
              <ShieldAlert size={11} /> {recovered} Recuperados
            </span>
          )}
          {prehospitalCare && (
            <span className="rr-result-badge prehospital">
              <HeartPulse size={11} /> {prehospitalCare} Atenciones
            </span>
          )}
          {transfers && (
            <span className="rr-result-badge transfers">
              <Ambulance size={11} /> {transfers} Traslados
            </span>
          )}
        </div>
      )}
    </div>
  );
};
