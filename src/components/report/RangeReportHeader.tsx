import React from "react";
import { Calendar, BarChart2, FileText, X } from "lucide-react";
import type { DrawnFeature } from "../../types";

interface RangeReportHeaderProps {
  isAllMode: boolean;
  feat: DrawnFeature | "all";
  daysWithData: number;
  totalDatesCount: number;
  activeTab: "registro" | "estadisticas" | "novedades";
  onTabChange: (tab: "registro" | "estadisticas" | "novedades") => void;
  onClose: () => void;
}

export const RangeReportHeader: React.FC<RangeReportHeaderProps> = ({
  isAllMode,
  feat,
  daysWithData,
  totalDatesCount,
  activeTab,
  onTabChange,
  onClose,
}) => {
  return (
    <>
      <div className="rr-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Calendar
            style={{ color: isAllMode ? "var(--color-info)" : "var(--color-green)", flexShrink: 0 }}
            size={18}
          />
          <div>
            <h3 className="rr-title">
              {isAllMode ? "Bitácora General" : "Bitácora de Rango"}
            </h3>
            <p className="rr-subtitle">
              {isAllMode ? (
                <span>
                  <strong style={{ color: "var(--text-main)" }}>Todos los sitios</strong> · {daysWithData} de {totalDatesCount} días con registros
                </span>
              ) : (
                <span>
                  <strong style={{ color: "var(--text-main)" }}>{typeof feat === "object" ? feat.title : ""}</strong> · {daysWithData} de {totalDatesCount} días con registros
                </span>
              )}
            </p>
          </div>
        </div>
        <button className="rr-close-btn" onClick={onClose} title="Cerrar">
          <X size={15} />
        </button>
      </div>

      <div className="rr-tabs">
        <button
          className={`rr-tab ${activeTab === "registro" ? "active" : ""}`}
          onClick={() => onTabChange("registro")}
        >
          <Calendar size={13} /> Registro
        </button>
        <button
          className={`rr-tab ${activeTab === "estadisticas" ? "active" : ""}`}
          onClick={() => onTabChange("estadisticas")}
        >
          <BarChart2 size={13} /> Estadísticas
        </button>
        <button
          className={`rr-tab ${activeTab === "novedades" ? "active" : ""}`}
          onClick={() => onTabChange("novedades")}
        >
          <FileText size={13} /> Novedades
        </button>
      </div>
    </>
  );
};
