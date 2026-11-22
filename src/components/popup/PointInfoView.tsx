import React, { useState } from "react";
import { Copy, Check, Activity, FileText, AlertTriangle, Tent, HeartPulse, Tag } from "lucide-react";
import type { DrawnFeature, DepartmentView } from "../../types";
import type { FeatureInfoModel } from "./featureInfoModel";
import { labelStyle, sectionBox, sectionTitleStyle } from "./popupStyles";
import { MetricDisplayGrid } from "./MetricGrid";
import { WorkTeamsSection } from "./WorkTeamsSection";
import { CustomActivitiesSection } from "./CustomActivitiesSection";

interface PointInfoViewProps {
  activeFeat: DrawnFeature;
  model: FeatureInfoModel;
  activeDepartment?: DepartmentView;
  canViewDetails: boolean;
  showArrivalCheckbox: boolean;
  onToggleArrival: (displayIdx: number, hasArrived: boolean) => void;
}

export const PointInfoView: React.FC<PointInfoViewProps> = ({
  activeFeat,
  model,
  activeDepartment = "pc",
  canViewDetails,
  showArrivalCheckbox,
  onToggleArrival,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(model.coords);
    } catch {
      // ignore clipboard errors on restricted contexts
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasStatusBadges =
    canViewDetails &&
    (activeFeat.isCollapsed || activeFeat.isCampement || activeFeat.isHealthCenter || activeFeat.otherCategoryName);

  return (
    <>
      {hasStatusBadges && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {activeFeat.isCollapsed && (
            <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fca5a5", fontSize: "0.74rem", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, color: "#ef4444" }} />
                <span>Estructura Colapsada</span>
              </div>
              <span style={{ background: "#dc2626", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                Cantidad: {activeFeat.collapsedCount || "1"}
              </span>
            </div>
          )}
          {activeFeat.isCampement && (
            <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fcd34d", fontSize: "0.74rem", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Tent size={14} style={{ flexShrink: 0, color: "#f59e0b" }} />
                <span>Campamento / Refugio</span>
              </div>
              {activeFeat.campementCount && (
                <span style={{ background: "#d97706", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                  Personas: {activeFeat.campementCount}
                </span>
              )}
            </div>
          )}
          {activeFeat.isHealthCenter && (
            <div style={{ background: "rgba(56, 189, 248, 0.12)", border: "1px solid rgba(56, 189, 248, 0.35)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#7dd3fc", fontSize: "0.74rem", fontWeight: 700 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <HeartPulse size={14} style={{ flexShrink: 0, color: "#38bdf8" }} />
                <span>Centro Asistencial / Salud</span>
              </div>
              {activeFeat.healthCenterType && (
                <span style={{ background: "#0284c7", color: "#ffffff", padding: "2px 8px", borderRadius: "10px", fontSize: "0.68rem", fontWeight: 800 }}>
                  {activeFeat.healthCenterType}
                </span>
              )}
            </div>
          )}
          {activeFeat.otherCategoryName && (
            <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "6px", padding: "6px 10px", display: "flex", alignItems: "center", gap: "6px", color: "#cbd5e1", fontSize: "0.74rem", fontWeight: 700 }}>
              <Tag size={14} style={{ flexShrink: 0, color: "#94a3b8" }} />
              <span>Clasificación:</span>
              <span style={{ fontWeight: 800, color: "#ffffff" }}>{activeFeat.otherCategoryName}</span>
            </div>
          )}
        </div>
      )}

      {/* Coordenadas */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <label style={labelStyle}>{model.coordLabel}</label>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.72rem", color: "#e2e8f0", fontFamily: "var(--font-mono, monospace)", background: "rgba(15, 23, 42, 0.85)", padding: "5px 8px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.12)", flex: 1 }}>
            {model.coords}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            style={{ background: copied ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.06)", border: "1px solid " + (copied ? "rgba(34, 197, 94, 0.5)" : "rgba(255, 255, 255, 0.12)"), borderRadius: "6px", padding: "6px 8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: copied ? "#4ade80" : "#e2e8f0", transition: "all 0.18s ease" }}
            title={copied ? "¡Copiado!" : "Copiar coordenadas"}
            aria-label={copied ? "Coordenadas copiadas" : "Copiar coordenadas"}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      {/* Estado vacío */}
      {!model.hasAnyData && (
        <div style={{ fontSize: "0.72rem", color: "#64748b", textAlign: "center", padding: "14px 10px", fontStyle: "italic", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px dashed rgba(255,255,255,0.08)" }}>
          Sin datos registrados para esta fecha
        </div>
      )}

      {/* Equipos desplegados (muestra todos los campos de Operación en lectura + llegada rápida) */}
      {model.activeGroups.length > 0 && (
        <WorkTeamsSection
          variant="point"
          displayItems={model.displayItems}
          activeDepartment={activeDepartment}
          canEdit={false}
          canViewDetails={canViewDetails}
          showArrivalCheckbox={showArrivalCheckbox}
          onToggleArrival={onToggleArrival}
        />
      )}

      {/* Indicadores generales del área */}
      {model.hasPointMetrics && canViewDetails && (
        <div style={sectionBox}>
          <div style={sectionTitleStyle}>
            <Activity size={11} style={{ color: "#94a3b8" }} /> Indicadores del Día
          </div>
          <MetricDisplayGrid source={model.displayLog} />
        </div>
      )}

      {/* Actividades registradas (solo lectura) */}
      {model.activities.length > 0 && (
        <CustomActivitiesSection
          customActivities={model.activities}
          onChange={() => {}}
          canEdit={false}
          title="Actividades del Punto"
          subtitle=""
        />
      )}

      {/* Observaciones del día (solo lectura) */}
      {model.observations && (
        <div style={sectionBox}>
          <div style={sectionTitleStyle}>
            <FileText size={11} style={{ color: "#94a3b8" }} /> Observaciones del Día
          </div>
          <div style={{ fontSize: "0.73rem", color: "#e2e8f0", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
            {model.observations}
          </div>
        </div>
      )}
    </>
  );
};
