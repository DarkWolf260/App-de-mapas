import React from "react";
import { BarChart2, X } from "lucide-react";
import type { DrawnFeature } from "../../types";

interface RangeReportHeaderProps {
  isAllMode: boolean;
  feat: DrawnFeature | "all";
  daysWithData: number;
  totalDatesCount: number;
  onClose: () => void;
}

export const RangeReportHeader: React.FC<RangeReportHeaderProps> = ({
  isAllMode,
  feat,
  daysWithData,
  totalDatesCount,
  onClose,
}) => {
  return (
    <div className="rr-header">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <BarChart2
          style={{ color: "var(--color-info)", flexShrink: 0 }}
          size={20}
        />
        <div>
          <h3 className="rr-title">
            Panel de Estadísticas
          </h3>
          <p className="rr-subtitle">
            {isAllMode ? (
              <span>
                <strong style={{ color: "var(--text-main)" }}>Consolidado General</strong> · {daysWithData} de {totalDatesCount} días con registros
              </span>
            ) : (
              <span>
                <strong style={{ color: "var(--text-main)" }}>{typeof feat === "object" ? feat.title : ""}</strong> · {daysWithData} de {totalDatesCount} días con registros
              </span>
            )}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button className="rr-close-btn" onClick={onClose} title="Cerrar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

