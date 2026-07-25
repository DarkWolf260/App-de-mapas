import React, { useState, useMemo } from "react";
import type { DrawnFeature, DepartmentView } from "../types";
import { ChevronUp, ChevronDown } from "lucide-react";

interface GlobalStatsWidgetProps {
  drawnFeatures: DrawnFeature[];
  selectedDate?: string;
  activeDepartment?: DepartmentView;
  showSidebar?: boolean;
}

export const GlobalStatsWidget: React.FC<GlobalStatsWidgetProps> = ({
  drawnFeatures,
  selectedDate,
  activeDepartment = "pc",
  showSidebar = false,
}) => {
  const todayStr = useMemo(() => selectedDate || new Date().toLocaleDateString('en-CA'), [selectedDate]);

  // Compute auto values from map features (ONLY today's logs, filtered by department)
  const stats = useMemo(() => {
    let rescuedPeople = 0;
    let recoveredBodies = 0;
    let rescuedPets = 0;
    let prehospitalCare = 0;
    let transfers = 0;

    drawnFeatures.forEach((feat) => {
      const todayLogs = feat.dailyLogs?.filter((l) =>
        l.date === todayStr && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
      ) || [];
      for (const todayLog of todayLogs) {
        rescuedPeople += (todayLog.rescuedCount ? Number(todayLog.rescuedCount) : 0) + (todayLog.rescuedCount2 ? Number(todayLog.rescuedCount2) : 0);
        recoveredBodies += (todayLog.recoveredCount ? Number(todayLog.recoveredCount) : 0) + (todayLog.recoveredCount2 ? Number(todayLog.recoveredCount2) : 0);
        rescuedPets += todayLog.rescuedPetsCount ? Number(todayLog.rescuedPetsCount) : 0;
        prehospitalCare += (todayLog.prehospitalCareCount ? Number(todayLog.prehospitalCareCount) : 0) + (todayLog.prehospitalCareCount2 ? Number(todayLog.prehospitalCareCount2) : 0);
        transfers += (todayLog.transfersCount ? Number(todayLog.transfersCount) : 0) + (todayLog.transfersCount2 ? Number(todayLog.transfersCount2) : 0);
      }
    });

    return { rescuedPeople, recoveredBodies, rescuedPets, prehospitalCare, transfers };
  }, [drawnFeatures, todayStr, activeDepartment]);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("pc_stats_widget_collapsed") === "true";
  });

  return (
    <div
      style={{
        position: "absolute",
        top: isCollapsed ? "-52px" : "18px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(10, 15, 28, 0.9)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "14px",
        padding: "6px 20px",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "16px",
        fontFamily: "var(--font-sans)",
        transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1), left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Stats Display */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--color-info)", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>Rescatados</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.rescuedPeople}</span>
        </div>
        <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>Cadáveres</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.recoveredBodies}</span>
        </div>
        <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--color-green)", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>Mascotas</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.rescuedPets}</span>
        </div>
        <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>Atenciones</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.prehospitalCare}</span>
        </div>
        <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--color-purple)", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>Traslados</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.transfers}</span>
        </div>
      </div>

      {/* Slide Toggle Tab */}
      <button
        onClick={() => {
          const next = !isCollapsed;
          setIsCollapsed(next);
          localStorage.setItem("pc_stats_widget_collapsed", String(next));
        }}
        style={{
          position: "absolute",
          bottom: "-18px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10, 15, 29, 0.97)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          width: "36px",
          height: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(56, 189, 248, 0.8)",
          cursor: "pointer",
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
          outline: "none",
          transition: "all 0.2s ease",
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(10, 15, 29, 0.95)";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(10, 15, 29, 0.9)";
          e.currentTarget.style.color = "rgba(56, 189, 248, 0.8)";
        }}
        title={isCollapsed ? "Mostrar estadísticas" : "Ocultar estadísticas"}
      >
        {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
    </div>
  );
};
