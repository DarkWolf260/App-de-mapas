import React, { useState, useEffect } from "react";
import type { DrawnFeature, DailyLog, LayerVisibility, DepartmentView, NovedadEntry } from "../types";
import { computeContainedItems } from "../utils/spatialUtils";
import { Lock, Unlock, FileText, Settings, History, Info, X } from "lucide-react";
import type { UserPermissions } from "../services/adminUsersService";
import { TAB_BTN_BASE } from "./popup/popupStyles";
import { GeneralTab } from "./popup/GeneralTab";
import { OperationTab } from "./popup/OperationTab";
import { HistoryTab } from "./popup/HistoryTab";
import { InfoTab } from "./popup/InfoTab";
import { useFeaturePopupSession } from "../hooks/useFeaturePopupSession";

import Point from "@arcgis/core/geometry/Point";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

interface FeatureEditActions {
  onRenameFeature?: (id: number | string, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number | string, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number | string, newColor: string) => Promise<void>;
  onUpdateFeatureCollapsed?: (id: number | string, isCollapsed: boolean, collapsedCount: string | number) => Promise<void>;
  onToggleFeatureLock?: (id: number | string, locked: boolean) => void;
}

interface CustomMapPopupProps {
  customPopup: { mapPoint: Point; feat: DrawnFeature } | null;
  popupScreenPos: { x: number; y: number } | null;
  drawnFeatures: DrawnFeature[];
  layerVisibility: LayerVisibility;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  onSaveDailyLog?: (featureId: number | string, log: DailyLog) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
  featureActions: FeatureEditActions;
  sketchLayer: GraphicsLayer | null;
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
    background: active ? "rgba(56, 189, 248, 0.15)" : "transparent",
    color: active ? "var(--color-info)" : "var(--text-muted)",
    padding: "6px 10px",
    fontSize: "0.72rem",
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

  const containedItems = computeContainedItems(activeFeat, sketchLayer, drawnFeatures);
  const isPoint = activeFeat.type === "point";
  const isPolygon = activeFeat.type === "polygon";

  const containedNovedades =
    !isPolygon || containedItems.length === 0
      ? []
      : (containedItems
          .map((feat) => {
            const log = feat.dailyLogs?.find((l) =>
              l.date === popupEditDate &&
              (activeDepartment === "mixto"
                ? true
                : l.department === (activeDepartment === "bomberos" ? "bomberos" : "pc") || !l.department)
            );
            const novedades = log?.novedades || [];
            const observations = log?.observations?.trim() || "";
            if (novedades.length === 0 && !observations) return null;
            return { origin: feat.title || `Punto ${feat.id}`, originFeatId: feat.id, novedades };
          })
          .filter(Boolean) as Array<{ origin: string; originFeatId?: number | string; novedades: NovedadEntry[] }>);

  const showSketchTabs = layerVisibility.sketch && canEditMap;

  return (
    <div className="custom-map-popup right-sidebar-popup" style={CONTAINER_STYLE}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.9rem",
              color: session.localColor,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {activeFeat.title}
          </span>
          {canEditMap && (
            <button
              onClick={() => onToggleFeatureLock?.(activeFeat.id, !activeFeat.locked)}
              style={{
                background: "transparent",
                border: "none",
                color: activeFeat.locked ? "var(--color-high)" : "var(--text-muted)",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
              title={activeFeat.locked ? "Desbloquear edición del elemento" : "Bloquear edición del elemento"}
            >
              {activeFeat.locked ? <Lock size={14} /> : <Unlock size={14} style={{ opacity: 0.4 }} />}
            </button>
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
              <FileText size={12} /> Editar Grupos
            </button>
          )}
          {isPoint && (
            <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}>
              <History size={12} /> Historial
            </button>
          )}
        </div>
      )}

      {/* Tab Selector — canEditMap (sketch off) */}
      {canEditMap && !layerVisibility.sketch && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}>
            <Settings size={12} /> General
          </button>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}>
            <Info size={12} /> Información
          </button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
            <FileText size={12} /> Editar Grupos
          </button>
          {isPoint && (
            <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}>
              <History size={12} /> Historial
            </button>
          )}
        </div>
      )}

      {/* Tab Selector — point with canEditMap (sketch on) */}
      {canEditMap && isPoint && layerVisibility.sketch && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}>
            <Settings size={12} /> General
          </button>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}>
            <Info size={12} /> Información
          </button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
            <FileText size={12} /> Editar Grupos
          </button>
          <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}>
            <History size={12} /> Historial
          </button>
        </div>
      )}

      {/* Tab Selector — polygon with canEditMap (sketch on) */}
      {canEditMap && isPolygon && layerVisibility.sketch && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}>
            <Settings size={12} /> General
          </button>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}>
            <Info size={12} /> Información
          </button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
            <FileText size={12} /> Editar Grupos
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

      {/* Tab Content — Info */}
      {activeTab === "info" && (
        <InfoTab
          activeFeat={activeFeat}
          dailyLog={session.localLog}
          onEdit={() => canEditLog && setActiveTab("operation")}
          drawnFeatures={drawnFeatures}
          popupEditDate={popupEditDate}
          isAdmin={isAdmin}
          canEdit={canEditLog}
          canToggleArrival={canToggleArrival}
          onToggleArrivalGroup={session.handleToggleArrivalGroup}
          localLog={session.localLog}
          onGroupFieldChange={session.handleGroupFieldChange}
          onGeneralFieldChange={session.handleGeneralFieldChange}
          onSaveStats={session.handleLogSave}
          saveSuccess={session.logSaveSuccess}
          novedades={session.localLog.novedades || []}
          onAddNovedad={session.handleAddNovedad}
          onDeleteNovedad={session.handleDeleteNovedad}
          onUpdateNovedad={session.handleUpdateNovedad}
          containedNovedades={containedNovedades}
          onNavigateToFeature={onNavigateToFeature}
          activeDepartment={activeDepartment}
          selectedDept={session.selectedDept}
          onDepartmentSelect={session.setSelectedDept}
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

      {/* Tab Content — Operation */}
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
        />
      )}

      {/* Tab Content — History */}
      {activeTab === "history" && (
        <HistoryTab
          logs={activeFeat.dailyLogs?.filter(
            (l) => activeDepartment === "mixto" || l.department === activeDepartment || !l.department
          )}
        />
      )}
    </div>
  );
};
