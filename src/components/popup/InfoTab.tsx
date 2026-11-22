import React, { useMemo, useCallback } from "react";
import { Pencil, Calendar, Shield, Flame } from "lucide-react";
import type { DrawnFeature, DailyLog, DepartmentView, Department } from "../../types";
import { buildFeatureInfoModel, getPointReportSummary } from "./featureInfoModel";
import { PointInfoView } from "./PointInfoView";
import { SectorInfoView } from "./SectorInfoView";

export { getPointReportSummary };

export interface InfoTabProps {
  activeFeat: DrawnFeature;
  dailyLog: Partial<DailyLog> | undefined;
  mergedLog?: Partial<DailyLog>;
  drawnFeatures?: DrawnFeature[];
  popupEditDate: string;
  activeDepartment?: DepartmentView;
  selectedDept?: Department;
  isAdmin?: boolean;
  canEdit?: boolean;
  canToggleArrival?: boolean;
  onEdit?: () => void;
  onToggleArrivalGroup?: (
    groupIndex: 1 | 2 | 3 | 4,
    hasArrived: boolean,
    dept?: "pc" | "bomberos",
    groupId?: string
  ) => Promise<void>;
}

function formatDateLabel(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return isoDate;
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("es-VE", { day: "numeric", month: "short", year: "numeric" });
}

export const InfoTab: React.FC<InfoTabProps> = ({
  activeFeat,
  dailyLog,
  mergedLog,
  drawnFeatures = [],
  popupEditDate,
  activeDepartment = "pc",
  selectedDept = "pc",
  isAdmin = false,
  canEdit = false,
  canToggleArrival = false,
  onEdit,
  onToggleArrivalGroup,
}) => {
  const showArrivalCheckbox = isAdmin || canToggleArrival;
  const canViewDetails = isAdmin || canEdit || canToggleArrival;

  const model = useMemo(
    () =>
      buildFeatureInfoModel({
        activeFeat,
        dailyLog,
        mergedLog,
        drawnFeatures,
        popupEditDate,
        activeDepartment,
        selectedDept,
      }),
    [activeFeat, dailyLog, mergedLog, drawnFeatures, popupEditDate, activeDepartment, selectedDept]
  );

  const onToggleArrival = useCallback(
    (displayIdx: number, hasArrived: boolean) => {
      const displayGroup = model.activeGroups[displayIdx];
      const dept = (displayGroup?.department ||
        (activeDepartment === "bomberos" ? "bomberos" : "pc")) as "pc" | "bomberos";
      onToggleArrivalGroup?.((displayIdx + 1) as 1 | 2 | 3 | 4, hasArrived, dept, displayGroup?.id);
    },
    [onToggleArrivalGroup, model.activeGroups, activeDepartment]
  );

  const deptLabel =
    activeDepartment === "mixto"
      ? "Mando Mixto"
      : activeDepartment === "bomberos"
      ? "Bomberos"
      : "Protección Civil";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Contexto del reporte diario (fecha + departamento) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          padding: "6px 10px",
          background: "rgba(255, 255, 255, 0.025)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: "7px",
          fontSize: "0.7rem",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#e2e8f0", fontWeight: 700 }}>
          <Calendar size={12} style={{ color: "#94a3b8" }} aria-hidden="true" />
          {formatDateLabel(popupEditDate)}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.62rem",
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: "999px",
            background: activeDepartment === "bomberos" ? "rgba(239, 68, 68, 0.14)" : "rgba(249, 115, 22, 0.14)",
            color: activeDepartment === "bomberos" ? "#fca5a5" : "#fdba74",
            border: `1px solid ${activeDepartment === "bomberos" ? "rgba(239, 68, 68, 0.3)" : "rgba(249, 115, 22, 0.3)"}`,
          }}
        >
          {activeDepartment === "bomberos" ? <Flame size={10} /> : <Shield size={10} />}
          {deptLabel}
        </span>
      </div>

      {model.isPolygon ? (
        <SectorInfoView
          model={model}
          activeDepartment={activeDepartment}
          canViewDetails={canViewDetails}
          showArrivalCheckbox={showArrivalCheckbox}
          onToggleArrival={onToggleArrival}
        />
      ) : (
        <PointInfoView
          activeFeat={activeFeat}
          model={model}
          activeDepartment={activeDepartment}
          canViewDetails={canViewDetails}
          showArrivalCheckbox={showArrivalCheckbox}
          onToggleArrival={onToggleArrival}
        />
      )}

      {canEdit && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            marginTop: "4px",
            marginBottom: "24px",
            width: "100%",
            background: "rgba(249, 115, 22, 0.14)",
            border: "1px solid rgba(249, 115, 22, 0.45)",
            borderRadius: "8px",
            color: "#fdba74",
            fontSize: "0.74rem",
            fontWeight: 700,
            padding: "9px 12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all 0.18s ease",
            fontFamily: "inherit",
          }}
        >
          <Pencil size={13} aria-hidden="true" />
          Editar reporte del día
        </button>
      )}
    </div>
  );
};
