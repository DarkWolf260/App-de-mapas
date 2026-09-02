import React, { useState, useMemo } from "react";
import type { DrawnFeature, DepartmentView, InspeccionRecord } from "../types";
import { getPeriodStats } from "../utils/logUtils";
import { ChevronUp, ChevronDown, Clock, Calendar, Building2 } from "lucide-react";

interface GlobalStatsWidgetProps {
  drawnFeatures: DrawnFeature[];
  selectedDate?: string;
  activeDepartment?: DepartmentView;
  showSidebar?: boolean;
  showAccumulated?: boolean;
  onToggleAccumulated?: () => void;
  compact?: boolean;

  // Inspecciones props
  isInspeccionesMode?: boolean;
  inspeccionesRecords?: InspeccionRecord[];
  selectedColorFilter?: "all" | "rojo" | "amarillo" | "verde";
  setSelectedColorFilter?: (color: "all" | "rojo" | "amarillo" | "verde") => void;
}

export const GlobalStatsWidget: React.FC<GlobalStatsWidgetProps> = ({
  drawnFeatures,
  selectedDate,
  activeDepartment = "pc",
  showSidebar: _showSidebar = false,
  showAccumulated = false,
  onToggleAccumulated,
  compact = false,
  isInspeccionesMode = false,
  inspeccionesRecords = [],
  selectedColorFilter = "all",
  setSelectedColorFilter,
}) => {
  const todayStr = useMemo(() => selectedDate || new Date().toLocaleDateString('en-CA'), [selectedDate]);

  // --- MODO INSPECCIONES ---
  const inspeccionesByDate = useMemo(() => {
    if (!inspeccionesRecords) return [];
    if (showAccumulated || !todayStr) return inspeccionesRecords;
    return inspeccionesRecords.filter((r) => r.fecha && r.fecha.startsWith(todayStr));
  }, [inspeccionesRecords, showAccumulated, todayStr]);

  const inspeccionCounts = useMemo(() => {
    let red = 0;
    let yellow = 0;
    let green = 0;

    inspeccionesByDate.forEach((r) => {
      const tag = String(r.riesgo_color || "").toLowerCase();
      if (tag.includes("rojo") || tag.includes("roja") || tag.includes("alto") || tag.includes("insegur")) {
        red++;
      } else if (tag.includes("amarillo") || tag.includes("amarilla") || tag.includes("medio") || tag.includes("precau")) {
        yellow++;
      } else {
        green++;
      }
    });

    return { total: inspeccionesByDate.length, red, yellow, green };
  }, [inspeccionesByDate]);

  // --- MODO OPERATIVO DE SIEMPRE ---
  const dailyFeatures = useMemo(() => {
    return drawnFeatures.map((f) => ({
      ...f,
      dailyLogs: f.dailyLogs?.filter((l) =>
        l.date === todayStr &&
        (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
      ) || [],
    }));
  }, [drawnFeatures, todayStr, activeDepartment]);

  const dailyStats = useMemo(() => {
    const period = getPeriodStats(dailyFeatures, activeDepartment);
    return {
      rescuedPeople: period.totalRescued,
      recoveredBodies: period.totalRecovered,
      rescuedPets: period.totalPets,
      prehospitalCare: period.totalPrehospitalCare,
      transfers: period.totalTransfers,
    };
  }, [dailyFeatures, activeDepartment]);

  const periodStats = useMemo(() => {
    const period = getPeriodStats(drawnFeatures, activeDepartment);
    return {
      rescuedPeople: period.totalRescued,
      recoveredBodies: period.totalRecovered,
      rescuedPets: period.totalPets,
      prehospitalCare: period.totalPrehospitalCare,
      transfers: period.totalTransfers,
    };
  }, [drawnFeatures, activeDepartment]);

  const stats = showAccumulated ? periodStats : dailyStats;

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("pc_stats_widget_collapsed") === "true";
  });

  if (compact) {
    return (
      <div
        style={{
          position: "fixed",
          top: "58px",
          left: 0,
          right: 0,
          height: "42px",
          background: "rgba(10, 15, 28, 0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          zIndex: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          fontFamily: "var(--font-sans)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
        }}
      >
        {isInspeccionesMode ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, justifyContent: "center", overflow: "hidden" }}>
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ef4444" }}>{inspeccionCounts.red} Alto</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#f59e0b" }}>{inspeccionCounts.yellow} Prec.</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#22c55e" }}>{inspeccionCounts.green} Bajo</span>
            <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
            <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#818cf8" }}>{inspeccionCounts.total} Total</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "center", overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{stats.rescuedPeople}</span>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.02em" }}>Rescatados</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.9rem" }}>|</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{stats.recoveredBodies}</span>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.02em" }}>Cadáveres</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.9rem" }}>|</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{stats.rescuedPets}</span>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.02em" }}>Mascotas</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.9rem" }}>|</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{stats.prehospitalCare}</span>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.02em" }}>Atenciones</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.9rem" }}>|</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc", lineHeight: 1 }}>{stats.transfers}</span>
              <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#c084fc", textTransform: "uppercase", opacity: 0.9, letterSpacing: "0.02em" }}>Traslados</span>
            </div>
          </div>
        )}

        {onToggleAccumulated && (
          <button
            onClick={onToggleAccumulated}
            style={{
              padding: "4px 9px",
              borderRadius: "6px",
              border: `1px solid ${showAccumulated ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.12)"}`,
              background: showAccumulated ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
              color: showAccumulated ? "#38bdf8" : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.62rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
              flexShrink: 0,
              fontFamily: "var(--font-sans)",
            }}
          >
            {showAccumulated ? "Acum." : "Hoy"}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: isCollapsed ? "-44px" : "18px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(10, 15, 28, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${isInspeccionesMode ? "rgba(129, 140, 248, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
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
      {/* SI ES MODO INSPECCIONES */}
      {isInspeccionesMode ? (
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Alto Riesgo */}
          <div
            onClick={() => setSelectedColorFilter?.(selectedColorFilter === "rojo" ? "all" : "rojo")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "6px",
              background: selectedColorFilter === "rojo" ? "rgba(239, 68, 68, 0.25)" : "transparent",
              border: `1px solid ${selectedColorFilter === "rojo" ? "rgba(239, 68, 68, 0.6)" : "transparent"}`,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Alto Riesgo
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ef4444" }}>
              {inspeccionCounts.red}
            </span>
          </div>

          <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />

          {/* Precaución */}
          <div
            onClick={() => setSelectedColorFilter?.(selectedColorFilter === "amarillo" ? "all" : "amarillo")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "6px",
              background: selectedColorFilter === "amarillo" ? "rgba(245, 158, 11, 0.25)" : "transparent",
              border: `1px solid ${selectedColorFilter === "amarillo" ? "rgba(245, 158, 11, 0.6)" : "transparent"}`,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Riesgo Medio
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b" }}>
              {inspeccionCounts.yellow}
            </span>
          </div>

          <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />

          {/* Bajo Riesgo */}
          <div
            onClick={() => setSelectedColorFilter?.(selectedColorFilter === "verde" ? "all" : "verde")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "6px",
              background: selectedColorFilter === "verde" ? "rgba(34, 197, 94, 0.25)" : "transparent",
              border: `1px solid ${selectedColorFilter === "verde" ? "rgba(34, 197, 94, 0.6)" : "transparent"}`,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#22c55e", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Bajo Riesgo
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#22c55e" }}>
              {inspeccionCounts.green}
            </span>
          </div>

          <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />

          {/* Total Edificios */}
          <div
            onClick={() => setSelectedColorFilter?.("all")}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "6px",
              background: selectedColorFilter === "all" ? "rgba(129, 140, 248, 0.2)" : "transparent",
              border: `1px solid ${selectedColorFilter === "all" ? "rgba(129, 140, 248, 0.5)" : "transparent"}`,
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Total Edificaciones
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>
              {inspeccionCounts.total}
            </span>
          </div>
        </div>
      ) : (
        /* MODO OPERATIVO DE SIEMPRE */
        <div style={{ display: "flex", alignItems: "center", gap: compact ? "6px" : "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: compact ? "0.45rem" : "0.55rem", fontWeight: 700, color: "var(--color-info)", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>{compact ? "R." : "Rescatados"}</span>
            <span style={{ fontSize: compact ? "0.85rem" : "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.rescuedPeople}</span>
          </div>
          <div style={{ width: "1px", height: compact ? "14px" : "20px", background: "rgba(255, 255, 255, 0.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: compact ? "0.45rem" : "0.55rem", fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>{compact ? "C." : "Cadáveres"}</span>
            <span style={{ fontSize: compact ? "0.85rem" : "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.recoveredBodies}</span>
          </div>
          <div style={{ width: "1px", height: compact ? "14px" : "20px", background: "rgba(255, 255, 255, 0.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: compact ? "0.45rem" : "0.55rem", fontWeight: 700, color: "var(--color-green)", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>{compact ? "M." : "Mascotas"}</span>
            <span style={{ fontSize: compact ? "0.85rem" : "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.rescuedPets}</span>
          </div>
          {!compact && <div style={{ width: "1px", height: "20px", background: "rgba(255, 255, 255, 0.08)" }} />}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: compact ? "0.45rem" : "0.55rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>{compact ? "At." : "Atenciones"}</span>
            <span style={{ fontSize: compact ? "0.85rem" : "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.prehospitalCare}</span>
          </div>
          <div style={{ width: "1px", height: compact ? "14px" : "20px", background: "rgba(255, 255, 255, 0.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: compact ? "0.45rem" : "0.55rem", fontWeight: 700, color: "var(--color-purple)", textTransform: "uppercase", letterSpacing: "0.04em", opacity: 0.85 }}>{compact ? "T." : "Traslados"}</span>
            <span style={{ fontSize: compact ? "0.85rem" : "1.1rem", fontWeight: 800, color: "#f8fafc" }}>{stats.transfers}</span>
          </div>
        </div>
      )}

      {/* Mode toggle */}
      {onToggleAccumulated && (
        <button
          onClick={onToggleAccumulated}
          title={showAccumulated ? "Cambiar a modo diario" : "Cambiar a modo acumulado"}
          style={{
            padding: "2px 8px",
            borderRadius: "6px",
            border: `1px solid ${showAccumulated ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.12)"}`,
            background: showAccumulated ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
            color: showAccumulated ? (isInspeccionesMode ? "#818cf8" : "#38bdf8") : "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.58rem",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "3px",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {showAccumulated ? <Calendar size={10} /> : <Clock size={10} />}
          {showAccumulated ? "Acumulado" : "Hoy"}
        </button>
      )}

      {/* Slide Toggle Tab Handle */}
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
          border: `1px solid ${isInspeccionesMode ? "rgba(129, 140, 248, 0.3)" : "rgba(56, 189, 248, 0.25)"}`,
          borderTop: "none",
          borderRadius: "0 0 10px 10px",
          width: "36px",
          height: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isInspeccionesMode ? "#818cf8" : "rgba(56, 189, 248, 0.8)",
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
          e.currentTarget.style.color = isInspeccionesMode ? "#818cf8" : "rgba(56, 189, 248, 0.8)";
        }}
        title={isCollapsed ? "Mostrar estadísticas" : "Ocultar estadísticas"}
      >
        {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>
    </div>
  );
};
