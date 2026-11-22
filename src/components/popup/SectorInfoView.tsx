import React from "react";
import { Activity, FileText } from "lucide-react";
import type { DepartmentView } from "../../types";
import type { FeatureInfoModel } from "./featureInfoModel";
import { sectionBox, sectionTitleStyle } from "./popupStyles";
import { MetricDisplayGrid } from "./MetricGrid";
import { WorkTeamsSection } from "./WorkTeamsSection";
import { CustomActivitiesSection } from "./CustomActivitiesSection";

interface SectorInfoViewProps {
  model: FeatureInfoModel;
  activeDepartment?: DepartmentView;
  canViewDetails: boolean;
  showArrivalCheckbox: boolean;
  onToggleArrival: (displayIdx: number, hasArrived: boolean) => void;
}

export const SectorInfoView: React.FC<SectorInfoViewProps> = ({
  model,
  activeDepartment = "pc",
  canViewDetails,
  showArrivalCheckbox,
  onToggleArrival,
}) => (
  <>
    {/* Equipos asignados al sector */}
    {model.activeGroups.length > 0 && (
      <WorkTeamsSection
        variant="polygon"
        displayItems={model.displayItems}
        activeDepartment={activeDepartment}
        canEdit={false}
        canViewDetails={canViewDetails}
        showArrivalCheckbox={showArrivalCheckbox}
        onToggleArrival={onToggleArrival}
      />
    )}

    {/* Tabla de puntos con reporte dentro del sector */}
    {model.containedCount > 0 && (
      <div style={sectionBox}>
        <div style={sectionTitleStyle}>
          <span>Puntos con reporte ({model.reportedPoints.length} de {model.containedCount})</span>
        </div>
        {model.reportedPoints.length === 0 ? (
          <div style={{ fontSize: "0.68rem", color: "#64748b", fontStyle: "italic", padding: "4px 0" }}>
            No hay puntos con actividad registrada en esta fecha
          </div>
        ) : (
          <div style={{ width: "100%", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.68rem", fontVariantNumeric: "tabular-nums" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ textAlign: "left", padding: "4px 5px", color: "#94a3b8", fontWeight: 600 }}>Punto</th>
                  <th style={{ textAlign: "center", padding: "4px 5px", color: "#38bdf8", fontWeight: 700, minWidth: "30px" }}>Resc.</th>
                  <th style={{ textAlign: "center", padding: "4px 5px", color: "#ef4444", fontWeight: 700, minWidth: "30px" }}>Recup.</th>
                  <th style={{ textAlign: "center", padding: "4px 5px", color: "#22c55e", fontWeight: 700, minWidth: "30px" }}>Masc.</th>
                  <th style={{ textAlign: "center", padding: "4px 5px", color: "#fb923c", fontWeight: 700, minWidth: "30px" }}>Atenc.</th>
                  <th style={{ textAlign: "center", padding: "4px 5px", color: "#cbd5e1", fontWeight: 700, minWidth: "30px" }}>Trasl.</th>
                </tr>
              </thead>
              <tbody>
                {model.reportedPoints.map(({ point, summary }) => (
                  <tr key={point.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ textAlign: "left", padding: "5px 5px", color: "#f8fafc", fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        {summary.hasArrived && (
                          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} title="Personal en el sitio" />
                        )}
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px", display: "inline-block" }}>
                          {point.title}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalRescued > 0 ? "#38bdf8" : "#64748b", fontWeight: summary.totalRescued > 0 ? 700 : 400 }}>
                      {summary.totalRescued > 0 ? summary.totalRescued : "-"}
                    </td>
                    <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalRecovered > 0 ? "#ef4444" : "#64748b", fontWeight: summary.totalRecovered > 0 ? 700 : 400 }}>
                      {summary.totalRecovered > 0 ? summary.totalRecovered : "-"}
                    </td>
                    <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalPets > 0 ? "#22c55e" : "#64748b", fontWeight: summary.totalPets > 0 ? 700 : 400 }}>
                      {summary.totalPets > 0 ? summary.totalPets : "-"}
                    </td>
                    <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalPrehospital > 0 ? "#fb923c" : "#64748b", fontWeight: summary.totalPrehospital > 0 ? 700 : 400 }}>
                      {summary.totalPrehospital > 0 ? summary.totalPrehospital : "-"}
                    </td>
                    <td style={{ textAlign: "center", padding: "5px 5px", color: summary.totalTransfers > 0 ? "#e2e8f0" : "#64748b", fontWeight: summary.totalTransfers > 0 ? 700 : 400 }}>
                      {summary.totalTransfers > 0 ? summary.totalTransfers : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

    {/* Total consolidado del sector */}
    <div style={sectionBox}>
      <div style={sectionTitleStyle}>
        <Activity size={11} style={{ color: "#94a3b8" }} /> Total del Sector
      </div>
      <MetricDisplayGrid source={model.aggregatedLog} />
    </div>

    {/* Actividades del sector (solo lectura) */}
    {model.activities.length > 0 && (
      <CustomActivitiesSection
        customActivities={model.activities}
        onChange={() => {}}
        canEdit={false}
        title="Actividades del Sector"
        subtitle=""
      />
    )}

    {/* Observaciones del sector (solo lectura) */}
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

    {!model.hasAnyData && model.containedCount === 0 && (
      <div style={{ fontSize: "0.72rem", color: "#64748b", textAlign: "center", padding: "12px 0", fontStyle: "italic" }}>
        No hay grupos ni datos cargados en esta zona
      </div>
    )}
  </>
);
