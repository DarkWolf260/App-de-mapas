import React, { useState, useEffect } from "react";
import type { DrawnFeature, DailyLog, LayerVisibility, DepartmentView } from "../types";
import { Lock, Unlock, FileText, Settings, History, Info, X, GraduationCap, Hammer, Calendar, Tag, MessageSquare } from "lucide-react";
import type { UserPermissions } from "../services/adminUsersService";
import { getDemolitionInfo, getFeatureActivityHistory } from "../utils/activityCatalog";
import { TAB_BTN_BASE } from "./popup/popupStyles";
import { GeneralTab } from "./popup/GeneralTab";
import { OperationTab } from "./popup/OperationTab";
import { HistoryTab } from "./popup/HistoryTab";
import { InfoTab } from "./popup/InfoTab";
import { useFeaturePopupSession } from "../hooks/useFeaturePopupSession";

interface FeatureEditActions {
  onRenameFeature?: (id: number | string, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number | string, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number | string, newColor: string) => Promise<void>;
  onUpdateFeatureCollapsed?: (id: number | string, isCollapsed: boolean, collapsedCount: string | number) => Promise<void>;
  onToggleFeatureLock?: (id: number | string, locked: boolean) => void;
  onDeleteFeature?: (feat: DrawnFeature) => void;
}

interface CustomMapPopupProps {
  customPopup: { mapPoint?: any; feat: DrawnFeature } | null;
  popupScreenPos: { x: number; y: number } | null;
  drawnFeatures: DrawnFeature[];
  layerVisibility: LayerVisibility;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  onSaveDailyLog?: (featureId: number | string, log: DailyLog) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
  featureActions: FeatureEditActions;
  sketchLayer?: any;
  onClose: () => void;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
  activeDepartment?: DepartmentView;
  isAdmin?: boolean;
  isOperador?: boolean;
  isSuspended?: boolean;
  permissions?: UserPermissions;
  canEditMap?: boolean;
}

type TabId = "info" | "general" | "operation" | "history" | "contained";

const CONTAINER_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "440px",
  maxWidth: "90vw",
  height: "100vh",
  zIndex: 300,
  padding: "20px 22px",
  paddingBottom: "calc(100px + env(safe-area-inset-bottom, 0px))",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  background: "rgba(10, 15, 29, 0.96)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderLeft: "1px solid var(--border-color)",
  boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.7)",
  color: "var(--text-main)",
  overflowY: "auto",
  pointerEvents: "auto",
  WebkitOverflowScrolling: "touch",
};

const TAB_BAR_STYLE: React.CSSProperties = {
  display: "flex",
  background: "rgba(0,0,0,0.3)",
  padding: "3px",
  borderRadius: "8px",
  gap: "4px",
};

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    ...TAB_BTN_BASE,
    background: active ? "rgba(249, 115, 22, 0.16)" : "transparent",
    color: active ? "#fdba74" : "#94a3b8",
    borderColor: active ? "rgba(249, 115, 22, 0.35)" : "transparent",
    padding: "6px 8px",
    fontSize: "0.71rem",
    fontWeight: 700,
  };
}

export const CustomMapPopup: React.FC<CustomMapPopupProps> = ({
  customPopup,
  drawnFeatures,
  layerVisibility,
  popupEditDate,
  setPopupEditDate,
  onSaveDailyLog,
  onRefreshFeatures,
  featureActions: {
    onToggleFeatureLock,
    onRenameFeature,
    onUpdateFeatureDescription,
    onUpdateFeatureColor,
    onUpdateFeatureCollapsed,
    onDeleteFeature,
  },
  sketchLayer,
  onClose,
  onNavigateToFeature,
  activeDepartment = "pc",
  isAdmin = false,
  isOperador = false,
  permissions,
  canEditMap = false,
}) => {
  const activeFeat = customPopup
    ? drawnFeatures.find((f) => String(f.id) === String(customPopup.feat.id)) || customPopup.feat
    : null;

  const todayStr = new Date().toLocaleDateString("en-CA");
  const isEditingToday = popupEditDate === todayStr;
  const canEditLog = isAdmin || (isOperador && (isEditingToday || !!permissions?.edit_historical_logs));
  const canToggleArrival = isAdmin || (isOperador && (isEditingToday || !!permissions?.edit_historical_logs));

  const [activeTab, setActiveTab] = useState<TabId>(canEditMap ? "general" : "info");

  const session = useFeaturePopupSession({
    activeFeat,
    popupEditDate,
    activeDepartment,
    canEditMap,
    canEditLog,
    canToggleArrival,
    onRenameFeature,
    onUpdateFeatureDescription,
    onUpdateFeatureColor,
    onUpdateFeatureCollapsed,
    onSaveDailyLog,
    onRefreshFeatures,
  });

  useEffect(() => {
    setActiveTab(canEditMap && layerVisibility.sketch ? "general" : "info");
  }, [activeFeat?.id, activeFeat?.type, layerVisibility.sketch, canEditMap]);

  if (!customPopup || !activeFeat) return null;

  const isPoint = activeFeat.type === "point" || activeFeat.geojsonGeometry?.type === "Point";
  const isPolygon = activeFeat.type === "polygon" || activeFeat.geojsonGeometry?.type === "Polygon";

  const formatSpanishDate = (isoDate: string | null) => {
    if (!isoDate) return "Fecha no registrada";
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return isoDate;
    return d.toLocaleDateString("es-VE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Vista dedicada: Capa Edificios Demolidos → tarjeta compacta con fecha de demolición
  if (layerVisibility.demolidos && isPoint) {
    const demolition = getDemolitionInfo(activeFeat);
    return (
      <div
        className="demolition-card-popup"
        role="dialog"
        aria-label={`Información de demolición: ${activeFeat.title}`}
        style={{
          position: "fixed",
          top: "84px",
          right: "20px",
          width: "320px",
          maxWidth: "calc(100vw - 32px)",
          zIndex: 300,
          background: "rgba(10, 15, 29, 0.96)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(248, 250, 252, 0.22)",
          borderRadius: "14px",
          padding: "16px 18px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.72)",
          color: "#f8fafc",
          fontFamily: "var(--font-sans)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          pointerEvents: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                alignSelf: "flex-start",
                padding: "3px 8px",
                borderRadius: "999px",
                background: "#111827",
                border: "1px solid rgba(248, 250, 252, 0.35)",
                color: "#f8fafc",
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              <Hammer size={11} aria-hidden="true" /> Edificio demolido
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.25,
              }}
            >
              {activeFeat.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar tarjeta"
            title="Cerrar"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              color: "#cbd5e1",
              cursor: "pointer",
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {demolition.events.length > 0 ? (
            demolition.events.map((ev) => (
              <div
                key={ev.date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "10px",
                  padding: "11px 14px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "9px",
                    background: "rgba(248, 250, 252, 0.1)",
                    border: "1px solid rgba(248, 250, 252, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={16} aria-hidden="true" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {ev.label ? ev.label : "Fecha de demolición"}
                  </span>
                  <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff" }}>
                    {formatSpanishDate(ev.date)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "10px",
                padding: "12px 14px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  background: "rgba(248, 250, 252, 0.1)",
                  border: "1px solid rgba(248, 250, 252, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <Calendar size={16} aria-hidden="true" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Fecha de demolición
                </span>
                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#ffffff" }}>
                  {formatSpanishDate(demolition.demolishedDate)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: "0.72rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ color: "#94a3b8", fontWeight: 600 }}>{demolition.statusLabel}</span>
          {demolition.description && (
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#cbd5e1", lineHeight: 1.4 }}>
              {demolition.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Vista dedicada: Capa Formación y Prevención Comunitaria → solo historial de actividades
  if (layerVisibility.formacion && isPoint) {
    const activityHistory = getFeatureActivityHistory(activeFeat);
    const totalActivities = activityHistory.reduce((sum, entry) => sum + entry.activities.length, 0);

    return (
      <div className="custom-map-popup right-sidebar-popup" style={CONTAINER_STYLE}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            paddingBottom: "12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                alignSelf: "flex-start",
                padding: "3px 8px",
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.14)",
                color: "#cbd5e1",
                fontSize: "0.62rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#8b5cf6", display: "inline-block" }} />
              <GraduationCap size={12} aria-hidden="true" /> Formación y Prevención
            </span>
            <h3
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: "0.94rem",
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              }}
            >
              {activeFeat.title}
            </h3>
            <span style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 600 }}>
              Historial de actividades · {totalActivities} {totalActivities === 1 ? "registro" : "registros"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            title="Cerrar Panel"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        {activityHistory.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "0.78rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: "10px",
            }}
          >
            Sin actividades registradas en este sitio.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activityHistory.map((entry) => (
              <div
                key={`${entry.date}-${entry.department}`}
                style={{
                  background: "rgba(255, 255, 255, 0.025)",
                  border: "1px solid rgba(255, 255, 255, 0.09)",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.74rem", fontWeight: 800, color: "#e2e8f0" }}>
                    <Calendar size={12} style={{ color: "#94a3b8" }} aria-hidden="true" />
                    {formatSpanishDate(entry.date)}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: "999px",
                      background: entry.department === "bomberos" ? "rgba(239, 68, 68, 0.14)" : "rgba(249, 115, 22, 0.14)",
                      color: entry.department === "bomberos" ? "#fca5a5" : "#fdba74",
                      border: `1px solid ${entry.department === "bomberos" ? "rgba(239, 68, 68, 0.35)" : "rgba(249, 115, 22, 0.35)"}`,
                    }}
                  >
                    {entry.department === "bomberos" ? "Bomberos" : "Protección Civil"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {entry.activities.map((act, idx) => (
                    <div
                      key={act.id || `${entry.date}-${idx}`}
                      style={{
                        background: "rgba(0, 0, 0, 0.28)",
                        border: "1px solid rgba(255, 255, 255, 0.07)",
                        borderRadius: "7px",
                        padding: "7px 9px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", fontWeight: 700, color: "#ffffff" }}>
                          <Tag size={12} style={{ color: "#94a3b8", flexShrink: 0 }} aria-hidden="true" />
                          {act.name}
                        </span>
                        {act.value && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#fdba74",
                              background: "rgba(249, 115, 22, 0.12)",
                              border: "1px solid rgba(249, 115, 22, 0.3)",
                              borderRadius: "6px",
                              padding: "1px 7px",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {act.value}
                          </span>
                        )}
                      </div>
                      {act.description && (
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "5px", fontSize: "0.7rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                          <MessageSquare size={11} style={{ color: "#94a3b8", flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
                          <span>{act.description}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const showSketchTabs = layerVisibility.sketch && canEditMap;
  const historyCount = activeFeat.dailyLogs?.length || 0;
  const historyLabel = historyCount > 0 ? `Historial (${historyCount})` : "Historial";

  return (
    <div className="custom-map-popup right-sidebar-popup" style={CONTAINER_STYLE}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span
            title={`Color del punto: ${session.localColor}`}
            style={{
              width: "11px",
              height: "11px",
              borderRadius: "50%",
              background: session.localColor || "#991b1b",
              border: "1.5px solid rgba(255, 255, 255, 0.78)",
              boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.5)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.9rem",
              color: "#f8fafc",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {activeFeat.title}
          </span>
          {canEditMap && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => onToggleFeatureLock?.(activeFeat.id, !activeFeat.locked)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: activeFeat.locked ? "var(--color-high)" : "var(--text-muted)",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
                title={activeFeat.locked ? "Desbloquear edición del elemento" : "Bloquear edición del elemento"}
              >
                {activeFeat.locked ? <Lock size={14} /> : <Unlock size={14} style={{ opacity: 0.4 }} />}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "6px",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          title="Cerrar Panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab Selector — read-only */}
      {!canEditMap && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}>
            <Info size={12} /> Información
          </button>
          {canEditLog && (
            <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
              <FileText size={12} /> Operación
            </button>
          )}
          {(isPoint || isPolygon) && (
            <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}>
              <History size={12} /> {historyLabel}
            </button>
          )}
        </div>
      )}

      {/* Tab Selector — canEditMap (point or polygon, sketch on or off) */}
      {canEditMap && (isPoint || isPolygon) && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}>
            <Settings size={12} /> General
          </button>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}>
            <Info size={12} /> Información
          </button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
            <FileText size={12} /> Operación
          </button>
          <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}>
            <History size={12} /> {historyLabel}
          </button>
        </div>
      )}

      {/* Tab Selector — polyline (sketch on) */}
      {!isPoint && !isPolygon && showSketchTabs && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}>
            <Settings size={12} /> General
          </button>
        </div>
      )}

      {/* Tab Content — Info (vista situacional de solo lectura + check rápido de llegada) */}
      {activeTab === "info" && (
        <InfoTab
          activeFeat={activeFeat}
          dailyLog={session.localLog}
          mergedLog={session.mergedLog}
          drawnFeatures={drawnFeatures}
          popupEditDate={popupEditDate}
          activeDepartment={activeDepartment}
          selectedDept={session.selectedDept}
          isAdmin={isAdmin}
          canEdit={canEditLog}
          canToggleArrival={canToggleArrival}
          onEdit={() => canEditLog && setActiveTab("operation")}
          onToggleArrivalGroup={session.handleToggleArrivalGroup}
        />
      )}

      {/* Tab Content — General */}
      {activeTab === "general" && (
        <GeneralTab
          activeFeat={activeFeat}
          localTitle={session.localTitle}
          localDescription={session.localDescription}
          localColor={session.localColor}
          localIsCollapsed={session.localIsCollapsed}
          localCollapsedCount={session.localCollapsedCount}
          localIsCampement={session.localIsCampement}
          localCampementCount={session.localCampementCount}
          localIsHealthCenter={session.localIsHealthCenter}
          localHealthCenterType={session.localHealthCenterType}
          localOtherCategoryName={session.localOtherCategoryName}
          generalSaveSuccess={session.generalSaveSuccess}
          onRename={session.setLocalTitle}
          onDescription={session.setLocalDescription}
          onColor={session.setLocalColor}
          onIsCollapsedChange={session.setLocalIsCollapsed}
          onCollapsedCountChange={session.setLocalCollapsedCount}
          onIsCampementChange={session.setLocalIsCampement}
          onCampementCountChange={session.setLocalCampementCount}
          onIsHealthCenterChange={session.setLocalIsHealthCenter}
          onHealthCenterTypeChange={session.setLocalHealthCenterType}
          onOtherCategoryNameChange={session.setLocalOtherCategoryName}
          onSave={session.handleGeneralSave}
        />
      )}

      {/* Tab Content — Operation (único editor del reporte diario) */}
      {activeTab === "operation" && (
        <OperationTab
          localLog={session.localLog}
          popupEditDate={popupEditDate}
          setPopupEditDate={setPopupEditDate}
          onFieldChange={session.handleLogFieldChange}
          onSave={session.handleLogSave}
          saveSuccess={session.logSaveSuccess}
          activeDepartment={activeDepartment}
          selectedDept={session.selectedDept}
          onDepartmentSelect={session.setSelectedDept}
          isPolygon={isPolygon}
        />
      )}

      {/* Tab Content — History */}
      {activeTab === "history" && (
        <HistoryTab
          logs={activeFeat.dailyLogs}
          featureTitle={activeFeat.title}
          isPolygon={isPolygon}
        />
      )}
    </div>
  );
};
