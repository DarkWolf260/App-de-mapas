import React, { useEffect, useMemo, useState } from "react";
import type { DrawnFeature } from "../../types";
import type { DailyActivity } from "../../services/activityService";
import { getDashboardStats } from "../../utils/dashboardStats";
import { DashboardCard } from "./DashboardCard";
import { VenezuelaFlag } from "./VenezuelaFlag";
import { X, Save, Check, Maximize2, Sun, Moon } from "lucide-react";

interface DashboardViewProps {
  drawnFeatures: DrawnFeature[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onClose: () => void;
  canEdit: boolean;
  dailyActivity: DailyActivity;
  onFetchDailyActivity: (date: string) => Promise<void>;
  onSaveDailyActivity: (date: string, activities: string, description: string) => Promise<void>;
  map: React.ReactNode;
}

const MONTHS_UPPER = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
const SLATE_500 = "#64748b";
const BLUE = "#002060";
const BLUE_LIGHT = "#e0e7f5";
const ORANGE = "#ff6800";
const ORANGE_LIGHT = "#fff2e6";
const BOMBEROS_COLOR = "#ef4444";
const PC_COLOR = "var(--color-info)";

function formatDashboardDate(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const monthIndex = parseInt(parts[1], 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return dateStr;
  return `${parts[2]} ${MONTHS_UPPER[monthIndex]} ${parts[0]}`;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  drawnFeatures,
  selectedDate,
  onSelectedDateChange,
  onClose,
  canEdit,
  dailyActivity,
  onFetchDailyActivity,
  onSaveDailyActivity,
  map,
}) => {
  const stats = useMemo(() => getDashboardStats(drawnFeatures, selectedDate), [drawnFeatures, selectedDate]);

  const [activitiesDraft, setActivitiesDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    (localStorage.getItem("dashboard_theme") as "dark" | "light") || "light"
  );

  useEffect(() => {
    onFetchDailyActivity(selectedDate);
  }, [selectedDate, onFetchDailyActivity]);

  useEffect(() => {
    if (dailyActivity.date === selectedDate) {
      setActivitiesDraft(dailyActivity.activities);
      setDescriptionDraft(dailyActivity.description);
    } else {
      setActivitiesDraft("");
      setDescriptionDraft("");
    }
    setSaved(false);
  }, [dailyActivity, selectedDate]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("dashboard_theme", next);
      return next;
    });
  };

  const handleSaveActivities = async () => {
    setSaving(true);
    await onSaveDailyActivity(selectedDate, activitiesDraft, descriptionDraft);
    setSaving(false);
    setSaved(true);
  };

  const isDark = theme === "dark";

  const sectionLabel: React.CSSProperties = {
    fontSize: "0.62rem",
    fontWeight: 700,
    color: isDark ? "var(--text-muted)" : SLATE_500,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "4px 0 2px",
  };

  const badgeStyleDark = (color: string) => ({
    fontSize: "0.62rem",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "4px",
    background: `rgba(${color === "var(--color-info)" ? "56,189,248" : "239,68,68"}, 0.1)`,
    border: `1px solid rgba(${color === "var(--color-info)" ? "56,189,248" : "239,68,68"}, 0.3)`,
    color,
  });

  const badgeStyleLight = (color: string) => ({
    fontSize: "0.64rem",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: "5px",
    background: color === BLUE ? BLUE_LIGHT : ORANGE_LIGHT,
    border: `1px solid rgba(${color === BLUE ? "0,32,96" : "255,104,0"}, 0.25)`,
    color: color === BLUE ? "#0b1f52" : "#dc2626",
  });

  // Deployed Teams Badge List
  const teamBadges = (
    <div style={{ padding: "4px 14px 6px", display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto" }}>
      <div style={sectionLabel}>Equipos Desplegados</div>
      {stats.pc.teams.length === 0 && stats.bomberos.teams.length === 0 ? (
        <span style={{ fontSize: "0.64rem", color: isDark ? "var(--text-muted)" : SLATE_500, fontStyle: "italic" }}>
          Sin equipos registrados hoy
        </span>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {stats.pc.teams.map((t) => (
            <span key={`pc-${t.name}`} style={isDark ? badgeStyleDark(PC_COLOR) : badgeStyleLight(BLUE)}>
              {t.name}{t.count > 1 ? ` x${t.count}` : ""}
            </span>
          ))}
          {stats.bomberos.teams.map((t) => (
            <span key={`bom-${t.name}`} style={isDark ? badgeStyleDark(BOMBEROS_COLOR) : badgeStyleLight(ORANGE)}>
              {t.name}{t.count > 1 ? ` x${t.count}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const areaRowDark = (color: string) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.66rem",
    padding: "3px 6px",
    background: "rgba(255,255,255,0.02)",
    borderRadius: "4px",
    borderLeft: `2px solid ${color}`,
  } as React.CSSProperties);

  const areaRowLight = (color: string) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.68rem",
    padding: "4px 7px",
    borderRadius: "5px",
    borderLeft: `3px solid ${color}`,
    background: color === BLUE ? BLUE_LIGHT : ORANGE_LIGHT,
  } as React.CSSProperties);

  // Recovery Point Extraction List
  const recoveryAreasList = (
    <div style={{ padding: "4px 14px 6px", display: "flex", flexDirection: "column", gap: "3px", flex: 1, overflowY: "auto" }}>
      <div style={sectionLabel}>Puntos de Extracción / Recuperación</div>
      {stats.pc.recoveryAreas.length === 0 && stats.bomberos.recoveryAreas.length === 0 ? (
        <span style={{ fontSize: "0.64rem", color: isDark ? "var(--text-muted)" : SLATE_500, fontStyle: "italic" }}>
          Sin recuperaciones registradas hoy
        </span>
      ) : (
        <>
          {stats.pc.recoveryAreas.map((a) => (
            <div key={`pc-${a.featureId}`} style={isDark ? areaRowDark("var(--color-info)") : areaRowLight(BLUE)}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
              <span style={{ fontWeight: 800, color: isDark ? "var(--color-info)" : "#0b1f52", marginLeft: "8px" }}>{a.count}</span>
            </div>
          ))}
          {stats.bomberos.recoveryAreas.map((a) => (
            <div key={`bom-${a.featureId}`} style={isDark ? areaRowDark("#ef4444") : areaRowLight(ORANGE)}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
              <span style={{ fontWeight: 800, color: isDark ? "#ef4444" : "#dc2626", marginLeft: "8px" }}>{a.count}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: isDark ? "rgba(10, 15, 29, 0.98)" : "#f1f5f9",
        display: "flex",
        flexDirection: "column",
        color: isDark ? "#f8fafc" : "#0f172a",
        fontFamily: "var(--font-sans)",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Header Banner - National Government */}
      <div
        style={{
          background: isDark ? "linear-gradient(135deg, #070e20, #0b1f52)" : "linear-gradient(135deg, #0b1945, #081338)",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#ffffff",
          borderBottom: "2.5px solid #ea580c",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          flexShrink: 0,
        }}
      >
        {/* Left Side: Venezuelan Flag (8 Stars Arch) & Ministry Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
          <VenezuelaFlag width={46} height={31} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "0.62rem", fontWeight: 700, opacity: 0.9, lineHeight: 1.1, color: "#cbd5e1" }}>
              Ministerio del Poder Popular para
            </span>
            <span style={{ fontSize: "0.74rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.02em", lineHeight: 1.1, color: "#ffffff" }}>
              Relaciones Interiores, JUSTICIA Y PAZ
            </span>
          </div>
        </div>

        {/* Center: Main Banner Title */}
        <div style={{ textAlign: "center", flex: 2, padding: "0 10px" }}>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              margin: 0,
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              lineHeight: 1.2,
            }}
          >
            REPORTE DIARIO DEL SISTEMA NACIONAL DE GESTIÓN DE RIESGOS
          </h1>
        </div>

        {/* Right Side: PC Badge & Action Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", flex: 1 }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              border: "2px solid #ea580c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "0.78rem",
              boxShadow: "0 0 12px rgba(234, 88, 12, 0.4)",
              flexShrink: 0,
            }}
            title="Protección Civil Venezuela"
          >
            PC
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={toggleTheme}
              title={isDark ? "Modo Claro" : "Modo Oscuro"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectedDateChange(e.target.value)}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "6px",
                color: "#ffffff",
                fontSize: "0.72rem",
                fontFamily: "var(--font-sans)",
                padding: "4px 8px",
                outline: "none",
                colorScheme: "dark",
                cursor: "pointer",
              }}
            />

            <button
              onClick={onClose}
              title="Cerrar Reporte"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.1)",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Date Sub-header */}
      <div style={{ textAlign: "center", padding: "6px 0 2px", background: isDark ? "transparent" : "#f1f5f9", flexShrink: 0 }}>
        <span
          style={{
            fontSize: "0.98rem",
            fontWeight: 900,
            color: "#ea580c",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {formatDashboardDate(selectedDate)}
        </span>
      </div>

      {/* Full-Screen Main Content Grid Layout */}
      <div
        style={{
          flex: 1,
          padding: "6px 20px 14px",
          display: "grid",
          gridTemplateColumns: "1fr 1.8fr 1fr",
          gap: "16px",
          width: "100%",
          height: "calc(100vh - 90px)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
          <DashboardCard
            dark={isDark}
            title="Equipos de Trabajo Desplegados"
            pcValue={stats.pc.teamsCount}
            bomberosValue={stats.bomberos.teamsCount}
            totalValue={stats.totalTeams}
          >
            {teamBadges}
          </DashboardCard>

          <DashboardCard
            dark={isDark}
            title="Personal Desplegado Operando"
            singleValue
            totalValue={stats.totalPersonnel}
          />
        </div>

        {/* CENTER COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%" }}>
          {/* Map Preview Frame */}
          <div
            style={{
              position: "relative",
              flex: 1,
              minHeight: "320px",
              borderRadius: "14px",
              overflow: "hidden",
              border: "2px solid #a855f7",
              boxShadow: "0 0 24px rgba(168, 85, 247, 0.4)",
              background: "#0f172a",
            }}
          >
            {map}

            <button
              onClick={onClose}
              title="Ampliar vista del mapa"
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                background: "rgba(15, 23, 42, 0.9)",
                color: "#c084fc",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.72rem",
                fontWeight: 700,
                fontFamily: "var(--font-sans)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                zIndex: 10,
              }}
            >
              <Maximize2 size={14} />
              Ampliar mapa
            </button>
          </div>

          {/* Actividades Especiales Card */}
          <div
            style={{
              background: isDark ? "rgba(15, 23, 42, 0.94)" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1.5px solid #cbd5e1",
              borderRadius: "14px",
              boxShadow: isDark ? "0 12px 30px rgba(0,0,0,0.6)" : "0 4px 16px rgba(0,0,0,0.06)",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 800,
                textAlign: "center",
                color: isDark ? "var(--color-info)" : "#0b1f52",
              }}
            >
              Actividades Especiales
            </div>
            <div style={{ borderBottom: "1.5px solid #cbd5e1", width: "70%", margin: "0 auto 2px" }} />

            <textarea
              value={activitiesDraft}
              onChange={(e) => setActivitiesDraft(e.target.value)}
              placeholder="Escribir actividades especiales del día..."
              rows={3}
              readOnly={!canEdit}
              style={{
                width: "100%",
                background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #cbd5e1",
                borderRadius: "8px",
                color: isDark ? "#f8fafc" : "#0f172a",
                fontSize: "0.76rem",
                fontFamily: "var(--font-sans)",
                padding: "8px 12px",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.4,
                boxSizing: "border-box",
              }}
            />

            {canEdit && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                {saved && (
                  <span style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Check size={13} /> Guardado correctamente
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveActivities}
                  disabled={saving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "7px",
                    border: "1px solid #16a34a",
                    background: "linear-gradient(135deg, #15803d, #166534)",
                    color: "#ffffff",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  <Save size={13} />
                  <span>{saving ? "Guardando..." : "Guardar Actividades"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" }}>
          <DashboardCard
            dark={isDark}
            title="Cuerpos Recuperados"
            pcValue={stats.pc.recovered}
            bomberosValue={stats.bomberos.recovered}
            totalValue={stats.totalRecovered}
          >
            {recoveryAreasList}
          </DashboardCard>

          <DashboardCard
            dark={isDark}
            title="Edificios Inspeccionados"
            pcValue={stats.pc.edan}
            bomberosValue={stats.bomberos.edan}
            totalValue={stats.totalEdan}
          />
        </div>
      </div>
    </div>
  );
};
