import React, { useEffect, useMemo, useState } from "react";
import type { DrawnFeature } from "../../types";
import type { DailyActivity } from "../../services/activityService";
import { getDashboardStats } from "../../utils/dashboardStats";
import { DashboardCard } from "./DashboardCard";
import { X, Users, UserCheck, Building2, Save, Check, Skull, Maximize2, Sun, Moon } from "lucide-react";

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
const SLATE_800 = "#1e293b";
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
    padding: isDark ? "6px 10px 2px" : "8px 14px 4px",
  };

  const badgeStyleDark = (color: string) => ({ fontSize: "0.65rem", fontWeight: 700, padding: "2px 7px", borderRadius: "5px", background: `rgba(${color === "var(--color-info)" ? "56,189,248" : "239,68,68"}, 0.1)`, border: `1px solid rgba(${color === "var(--color-info)" ? "56,189,248" : "239,68,68"}, 0.3)`, color });
  const badgeStyleLight = (color: string) => ({ fontSize: "0.68rem", fontWeight: 700, padding: "3px 9px", borderRadius: "6px", background: color === BLUE ? BLUE_LIGHT : ORANGE_LIGHT, border: `1px solid rgba(${color === BLUE ? "0,32,96" : "255,104,0"}, 0.25)`, color });

  const teamBadges = (
    <div style={{ padding: isDark ? "2px 10px 8px" : "2px 12px 10px", display: "flex", flexDirection: "column", gap: "4px", maxHeight: "120px", overflowY: "auto" }}>
      <div style={sectionLabel}>Descripción</div>
      {stats.pc.teams.length === 0 && stats.bomberos.teams.length === 0 ? (
        <span style={{ fontSize: "0.65rem", color: isDark ? "var(--text-muted)" : SLATE_500, fontStyle: "italic", padding: "0 2px" }}>Sin equipos registrados</span>
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

  const areaRowDark = (color: string) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.68rem", padding: "4px 6px", background: "rgba(255,255,255,0.02)", borderRadius: "4px", borderLeft: `2px solid ${color}` } as React.CSSProperties);
  const areaRowLight = (color: string) => ({ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", padding: "5px 8px", borderRadius: "5px", borderLeft: `3px solid ${color}`, background: color === BLUE ? BLUE_LIGHT : ORANGE_LIGHT } as React.CSSProperties);

  const recoveryAreasList = (
    <div style={{ padding: isDark ? "2px 10px 8px" : "2px 12px 10px", display: "flex", flexDirection: "column", gap: "3px", maxHeight: "120px", overflowY: "auto" }}>
      <div style={sectionLabel}>Lista de áreas de trabajo</div>
      {stats.pc.recoveryAreas.length === 0 && stats.bomberos.recoveryAreas.length === 0 ? (
        <span style={{ fontSize: "0.65rem", color: isDark ? "var(--text-muted)" : SLATE_500, fontStyle: "italic", padding: "0 2px" }}>Sin recuperaciones registradas</span>
      ) : (
        <>
          {stats.pc.recoveryAreas.map((a) => (
            <div key={`pc-${a.featureId}`} style={isDark ? areaRowDark("var(--color-info)") : areaRowLight(BLUE)}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
              <span style={{ fontWeight: 800, color: isDark ? "var(--color-info)" : BLUE, marginLeft: "8px" }}>{a.count}</span>
            </div>
          ))}
          {stats.bomberos.recoveryAreas.map((a) => (
            <div key={`bom-${a.featureId}`} style={isDark ? areaRowDark("#ef4444") : areaRowLight(ORANGE)}>
              <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
              <span style={{ fontWeight: 800, color: isDark ? "#ef4444" : ORANGE, marginLeft: "8px" }}>{a.count}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const headerBtn: React.CSSProperties = {
    width: "32px", height: "32px", borderRadius: "8px",
    border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.3)",
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)",
    color: "#ffffff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div className={isDark ? "dashboard-overlay" : "dashboard-overlay-light"}>
      {/* Header */}
      <div className={isDark ? "dashboard-header" : "dashboard-header-light"}>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: isDark ? "2px" : "4px" }}>
          <h1 className={isDark ? "dashboard-main-title-dark" : "dashboard-main-title"}>
            Reporte diario del Sistema Nacional de Gestión de Riesgos
          </h1>
          <span className={isDark ? "dashboard-main-date-dark" : "dashboard-main-date"}>
            {formatDashboardDate(selectedDate)}
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
          <button onClick={toggleTheme} title={isDark ? "Tema claro" : "Tema oscuro"} style={headerBtn}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectedDateChange(e.target.value)}
            style={{
              background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.18)",
              border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.3)",
              borderRadius: "6px",
              color: "#ffffff",
              fontSize: "0.66rem",
              fontFamily: "var(--font-sans)",
              padding: "4px 8px",
              outline: "none",
              colorScheme: isDark ? "dark" : "light",
            }}
          />
          <button onClick={onClose} title="Cerrar dashboard" style={headerBtn}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Body grid */}
      <div className={isDark ? "dashboard-grid" : "dashboard-grid-light"}>
        {/* Left column */}
        <div className="dashboard-column">
          <DashboardCard dark={isDark} title="Equipos de Trabajo Desplegados" icon={<Users size={isDark ? 13 : 14} />} pcValue={stats.pc.teamsCount} bomberosValue={stats.bomberos.teamsCount} totalValue={stats.totalTeams}>
            {teamBadges}
          </DashboardCard>
          <DashboardCard dark={isDark} title="Personal Desplegado Operando" icon={<UserCheck size={isDark ? 13 : 14} />} pcValue={stats.pc.personnel} bomberosValue={stats.bomberos.personnel} totalValue={stats.totalPersonnel} />
        </div>

        {/* Center column */}
        <div className="dashboard-center">
          <div className={isDark ? "dashboard-map-container" : "dashboard-map-container-light"}>
            {map}
            <button
              onClick={onClose}
              title="Ampliar mapa"
              style={{
                position: "absolute", top: "10px", left: "10px",
                padding: "6px 12px", borderRadius: "8px",
                border: isDark ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,104,0,0.25)",
                background: isDark ? "rgba(10,15,28,0.9)" : "rgba(255,104,0,0.08)",
                color: isDark ? "var(--color-info)" : "#ff6800",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                fontSize: "0.72rem", fontWeight: 700,
                fontFamily: "var(--font-sans)",
                backdropFilter: isDark ? "blur(10px)" : undefined,
                WebkitBackdropFilter: isDark ? "blur(10px)" : undefined,
                boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.1)",
                zIndex: 10,
              }}
            >
              <Maximize2 size={14} />
              Ampliar mapa
            </button>
          </div>

          {canEdit && (
          <div
            style={{
              background: isDark ? "rgba(10, 15, 28, 0.94)" : "#ffffff",
              border: isDark ? "1px solid rgba(255, 255, 255, 0.12)" : "1px solid rgba(0,0,0,0.06)",
              borderRadius: "12px",
              boxShadow: isDark ? "0 12px 30px rgba(0,0,0,0.6)" : "0 2px 16px rgba(0,0,0,0.07)",
              fontFamily: "var(--font-sans)",
              color: isDark ? "#f8fafc" : SLATE_800,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              flexShrink: 0,
              ...(isDark ? { backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" } : {}),
            }}
          >
            <div
              style={{
                padding: isDark ? "8px 10px" : "12px 14px",
                fontSize: isDark ? "0.75rem" : "0.78rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                textAlign: "center",
                color: "#ffffff",
                background: isDark ? "var(--color-info)" : "#002060",
                borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              Actividades Especiales
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "5px", padding: isDark ? "8px 10px" : "10px 12px" }}>
              <textarea
                style={{
                  width: "100%",
                  background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "6px",
                  color: isDark ? "#f8fafc" : SLATE_800,
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-sans)",
                  padding: "8px 10px",
                  resize: "none",
                  outline: "none",
                  height: "42px",
                }}
                placeholder="Actividades especiales del día..."
                value={activitiesDraft}
                onChange={(e) => setActivitiesDraft(e.target.value)}
              />
              <span style={{ fontSize: isDark ? "0.62rem" : "0.65rem", fontWeight: 700, color: isDark ? "var(--text-muted)" : SLATE_500, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Descripción de actividades
              </span>
              <textarea
                style={{
                  width: "100%",
                  background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "6px",
                  color: isDark ? "#f8fafc" : SLATE_800,
                  fontSize: "0.72rem",
                  fontFamily: "var(--font-sans)",
                  padding: "8px 10px",
                  resize: "none",
                  outline: "none",
                  height: "56px",
                }}
                placeholder="Descripción detallada de las actividades..."
                value={descriptionDraft}
                onChange={(e) => setDescriptionDraft(e.target.value)}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={handleSaveActivities}
                  disabled={saving}
                  style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "6px 14px", borderRadius: "8px",
                    border: isDark ? "1px solid rgba(34,197,94,0.4)" : "none",
                    background: saved ? "#16a34a" : isDark ? "rgba(34,197,94,0.1)" : "#002060",
                    color: saved ? "#ffffff" : isDark ? "#22c55e" : "#ffffff",
                    fontSize: "0.68rem", fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <Save size={12} />
                  {saving ? "Guardando…" : "Guardar"}
                </button>
                {saved && !saving && (
                  <span style={{ fontSize: "0.58rem", color: "#22c55e", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                    <Check size={12} /> Guardado
                  </span>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Right column */}
        <div className="dashboard-column">
          <DashboardCard dark={isDark} title="Cantidad de Cuerpos Recuperados" icon={<Skull size={isDark ? 13 : 14} />} pcValue={stats.pc.recovered} bomberosValue={stats.bomberos.recovered} totalValue={stats.totalRecovered}>
            {recoveryAreasList}
          </DashboardCard>
          <DashboardCard dark={isDark} title="Inspecciones de Edificaciones (EDAN)" icon={<Building2 size={isDark ? 13 : 14} />} pcValue={stats.pc.edan} bomberosValue={stats.bomberos.edan} totalValue={stats.totalEdan} />
        </div>
      </div>
    </div>
  );
};
