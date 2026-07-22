import React, { useState, useMemo } from "react";
import type { DrawnFeature } from "../types";
import { ChevronUp, ChevronDown } from "lucide-react";

interface GlobalStatsWidgetProps {
  drawnFeatures: DrawnFeature[];
  selectedDate?: string;
}

export const GlobalStatsWidget: React.FC<GlobalStatsWidgetProps> = ({ drawnFeatures, selectedDate }) => {
  const todayStr = useMemo(() => selectedDate || new Date().toLocaleDateString('en-CA'), [selectedDate]);

  // Compute auto values from map features (ONLY today's logs)
  const stats = useMemo(() => {
    let rescuedPeople = 0;
    let recoveredBodies = 0;
    let rescuedPets = 0;

    drawnFeatures.forEach((feat) => {
      const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
      if (todayLog) {
        rescuedPeople += todayLog.rescuedCount ? Number(todayLog.rescuedCount) : 0;
        recoveredBodies += todayLog.recoveredCount ? Number(todayLog.recoveredCount) : 0;
        rescuedPets += todayLog.rescuedPetsCount ? Number(todayLog.rescuedPetsCount) : 0;
      }
    });

    return { rescuedPeople, recoveredBodies, rescuedPets };
  }, [drawnFeatures, todayStr]);

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("pc_stats_widget_collapsed") === "true";
  });

  return (
    <div
      style={{
        position: "absolute",
        top: isCollapsed ? "-55px" : "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(10, 15, 29, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(56, 189, 248, 0.25)",
        borderRadius: "20px",
        padding: "8px 24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: "20px",
        fontFamily: "var(--font-sans)",
        transition: "top 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Stats Display */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(56, 189, 248, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Personas Rescatadas</span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", textShadow: "0 0 10px rgba(56, 189, 248, 0.3)" }}>{stats.rescuedPeople}</span>
        </div>
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(239, 68, 68, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Cadaveres Recuperados</span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", textShadow: "0 0 10px rgba(239, 68, 68, 0.3)" }}>{stats.recoveredBodies}</span>
        </div>
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "8px", fontWeight: 700, color: "rgba(34, 197, 94, 0.7)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>Mascotas Rescatadas</span>
          <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", textShadow: "0 0 10px rgba(34, 197, 94, 0.3)" }}>{stats.rescuedPets}</span>
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
          background: "rgba(10, 15, 29, 0.9)",
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
