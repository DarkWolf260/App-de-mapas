import React, { useState, useEffect } from "react";
import type { DrawnFeature, DailyLog, LayerVisibility, DepartmentView, Department, WorkGroup } from "../types";
import { computeContainedItems } from "../utils/spatialUtils";
import { getNormalizedGroupList } from "../utils/logUtils";
import { Lock, Unlock, FileText, Settings, History, Layers, Info, X } from "lucide-react";
import { TAB_BTN_BASE } from "./popup/popupStyles";
import { GeneralTab } from "./popup/GeneralTab";
import { OperationTab } from "./popup/OperationTab";
import { HistoryTab } from "./popup/HistoryTab";
import { ContainedTab } from "./popup/ContainedTab";
import { InfoTab } from "./popup/InfoTab";

import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

interface CustomMapPopupProps {
  customPopup: { mapPoint: Point; feat: DrawnFeature } | null;
  popupScreenPos: { x: number; y: number } | null;
  drawnFeatures: DrawnFeature[];
  layerVisibility: LayerVisibility;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  onRefreshFeatures?: () => Promise<void>;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  onRenameFeature?: (id: number, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number, newColor: string) => Promise<void>;
  onUpdateFeatureCollapsed?: (id: number, isCollapsed: boolean, collapsedCount: string | number) => Promise<void>;
  sketchLayer: GraphicsLayer | null;
  onClose: () => void;
  onNavigateToFeature?: (feat: DrawnFeature) => void;
  activeDepartment?: DepartmentView;
  isAdmin?: boolean;
  isOperador?: boolean;
  workGroups?: WorkGroup[];
}

type TabId = "info" | "general" | "operation" | "history" | "contained";

const EMPTY_LOG: Omit<DailyLog, "date"> = {
  groupName: "", managerName: "", managerPhone: "", unitOut: "",
  officersCount: "", hasArrivedG1: false,
  rescuedCount: "", recoveredCount: "", rescuedPetsCount: "",
  groupName2: "", managerName2: "", managerPhone2: "", unitOut2: "",
  officersCount2: "", rescuedCount2: "", recoveredCount2: "", hasArrivedG2: false,
  observations: "",
};

const CONTAINER_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  width: "440px",
  maxWidth: "90vw",
  height: "100vh",
  zIndex: 140,
  padding: "20px 22px",
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
  customPopup, popupScreenPos, drawnFeatures, layerVisibility,
  popupEditDate, setPopupEditDate, onSaveDailyLog, onRefreshFeatures,
  onToggleFeatureLock, onRenameFeature, onUpdateFeatureDescription,
  onUpdateFeatureColor, onUpdateFeatureCollapsed, sketchLayer, onClose, onNavigateToFeature,
  activeDepartment = "pc",
  isAdmin = false,
  isOperador = false,
  workGroups = [],
}) => {
  const activeFeat = customPopup
    ? drawnFeatures.find((f) => String(f.id) === String(customPopup.feat.id)) || customPopup.feat
    : null;

  const todayStr = new Date().toLocaleDateString("en-CA");
  const isEditingToday = popupEditDate === todayStr;
  const canEditLog = isAdmin || (isOperador && isEditingToday);
  const canToggleArrival = isAdmin || (isOperador && isEditingToday);

  const [activeTab, setActiveTab] = useState<TabId>(isAdmin ? "general" : "info");
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localColor, setLocalColor] = useState("#3b82f6");
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const [localCollapsedCount, setLocalCollapsedCount] = useState("1");
  const [showSecondGroup, setShowSecondGroup] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);
  const [logSaveSuccess, setLogSaveSuccess] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department>(activeDepartment === "bomberos" ? "bomberos" : "pc");

  const [localLog, setLocalLog] = useState<DailyLog>({ date: popupEditDate, ...EMPTY_LOG });

  useEffect(() => {
    if (!activeFeat) return;
    setLocalTitle(activeFeat.title);
    setLocalDescription(activeFeat.description || "");
    setLocalColor(activeFeat.color || "#3b82f6");
    setLocalIsCollapsed(!!activeFeat.isCollapsed);
    setLocalCollapsedCount(activeFeat.collapsedCount ? String(activeFeat.collapsedCount) : "1");
    setGeneralSaveSuccess(false);
    setLogSaveSuccess(false);

    const deptToUse: Department = activeDepartment === "mixto" ? selectedDept : (activeDepartment === "bomberos" ? "bomberos" : "pc");
    const todayLogs = activeFeat.dailyLogs?.filter((l) =>
      l.date === popupEditDate && (activeDepartment === "mixto" ? (l.department === deptToUse || (!l.department && deptToUse === "pc")) : (l.department === activeDepartment || !l.department))
    ) || [];
    const todayLog = todayLogs[0];
    setLocalLog(todayLog ? { ...todayLog, department: deptToUse } : { date: popupEditDate, department: deptToUse, ...EMPTY_LOG });
    setShowSecondGroup(todayLog ? !!todayLog.groupName2 || !!todayLog.unitOut2 : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeFeat re-creates on every parent render; id+date cover the intended trigger
  }, [activeFeat?.id, popupEditDate, activeDepartment, selectedDept]);

  useEffect(() => {
    if (isAdmin && layerVisibility.sketch) {
      setActiveTab("general");
    } else if (canEditLog && !layerVisibility.sketch) {
      setActiveTab("info");
    } else {
      setActiveTab("info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeFeat?.id + type cover all needed resets
  }, [activeFeat?.id, activeFeat?.type, layerVisibility.sketch, isAdmin]);

  if (!customPopup || !activeFeat) return null;

  const handleGeneralSave = async () => {
    if (!isAdmin) return;
    try {
      if (onRenameFeature) await onRenameFeature(activeFeat.id, localTitle);
      if (onUpdateFeatureDescription) await onUpdateFeatureDescription(activeFeat.id, localDescription);
      if (onUpdateFeatureColor) await onUpdateFeatureColor(activeFeat.id, localColor);
      if (onUpdateFeatureCollapsed) await onUpdateFeatureCollapsed(activeFeat.id, localIsCollapsed, localCollapsedCount);
      setGeneralSaveSuccess(true);
      setTimeout(() => setGeneralSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving general features:", err);
    }
  };

  const handleLogSave = async () => {
    if (!canEditLog || !onSaveDailyLog) return;
    try {
      const deptToUse: Department = activeDepartment === "mixto" ? selectedDept : (activeDepartment === "bomberos" ? "bomberos" : "pc");
      const logToSave = { ...localLog, department: deptToUse };
      await onSaveDailyLog(activeFeat.id, logToSave);
      setLogSaveSuccess(true);
      setTimeout(() => setLogSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving daily logs:", err);
    }
  };

  const handleLogFieldChange = (field: string, val: unknown) => {
    if (!canEditLog) return;
    setLocalLog((prev) => {
      const updated = { ...prev, [field]: val };
      // If the user edits any group-related field, clear log.groups so the flat
      // key values always win when building the groups array on save.
      if (
        /^(groupName|unitOut|managerName|managerPhone|officersCount|rescuedCount|recoveredCount|rescuedPetsCount|prehospitalCareCount|transfersCount|commissionId|isVolunteer|hasArrivedG)\d*$/.test(field)
      ) {
        updated.groups = undefined;
      }
      return updated;
    });
  };

  const handleGroupFieldChange = (groupIdx: number, field: string, value: string | boolean) => {
    if (!canEditLog) return;
    setLocalLog((prev) => {
      // If groups not yet initialized (e.g. loaded from legacy flat fields),
      // build the array from getNormalizedGroupList so updates are visible immediately.
      const base =
        Array.isArray(prev.groups) && prev.groups.length > 0
          ? [...prev.groups]
          : getNormalizedGroupList(prev as DailyLog).map((g) => ({ ...g }));
      if (base[groupIdx] !== undefined) {
        base[groupIdx] = { ...base[groupIdx], [field]: value };
      }
      return { ...prev, groups: base };
    });
  };

  const handleGeneralFieldChange = (field: string, value: string) => {
    if (!canEditLog) return;
    // General polygon stats — update flat field without clearing the groups array
    setLocalLog((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddNovedad = async (time: string, text: string) => {
    if (!canEditLog || !onSaveDailyLog) return;
    const entry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      time,
      text,
      type: "novedad" as const,
    };
    const deptToUse: Department = activeDepartment === "mixto" ? selectedDept : (activeDepartment === "bomberos" ? "bomberos" : "pc");
    const updatedLog = { ...localLog, department: deptToUse, novedades: [...(localLog.novedades || []), entry] };
    setLocalLog(updatedLog);
    await onSaveDailyLog(activeFeat.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const handleDeleteNovedad = async (entryId: string) => {
    if (!canEditLog || !onSaveDailyLog) return;
    const deptToUse: Department = activeDepartment === "mixto" ? selectedDept : (activeDepartment === "bomberos" ? "bomberos" : "pc");
    const updatedLog = { ...localLog, department: deptToUse, novedades: (localLog.novedades || []).filter((n) => n.id !== entryId) };
    setLocalLog(updatedLog);
    await onSaveDailyLog(activeFeat.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const handleUpdateNovedad = async (entryId: string, newText: string, newTime?: string) => {
    if (!canEditLog || !onSaveDailyLog) return;
    const deptToUse: Department = activeDepartment === "mixto" ? selectedDept : (activeDepartment === "bomberos" ? "bomberos" : "pc");
    const updatedNovedades = (localLog.novedades || []).map((n) =>
      n.id === entryId ? { ...n, text: newText, ...(newTime !== undefined ? { time: newTime } : {}) } : n
    );
    const updatedLog = { ...localLog, department: deptToUse, novedades: updatedNovedades };
    setLocalLog(updatedLog);
    await onSaveDailyLog(activeFeat.id, updatedLog);
    await onRefreshFeatures?.();
  };

  const handleToggleArrivalGroup = async (groupIndex: 1 | 2 | 3 | 4, hasArrived: boolean) => {
    if (!canToggleArrival || !onSaveDailyLog) return;
    const fieldKey = groupIndex === 1 ? "hasArrivedG1" : groupIndex === 2 ? "hasArrivedG2" : groupIndex === 3 ? "hasArrivedG3" : "hasArrivedG4";
    const deptToUse: Department = activeDepartment === "mixto" ? selectedDept : (activeDepartment === "bomberos" ? "bomberos" : "pc");
    const updatedGroups = [...(localLog.groups || [])];
    const targetIdx = groupIndex - 1;
    if (targetIdx < updatedGroups.length) {
      updatedGroups[targetIdx] = { ...updatedGroups[targetIdx], hasArrived };
    }
    const updatedLog = {
      ...localLog,
      department: deptToUse,
      [fieldKey]: hasArrived,
      groups: updatedGroups,
    };
    setLocalLog(updatedLog);
    try {
      await onSaveDailyLog(activeFeat.id, updatedLog);
    } catch (err) {
      console.error("[Popup] Error saving arrival status:", err);
    }
  };

  const containedItems = computeContainedItems(activeFeat, sketchLayer, drawnFeatures);
  const isPoint = activeFeat.type === "point";
  const isPolygon = activeFeat.type === "polygon";

  // Novedades from contained points (for polygon InfoTab)
  const containedNovedades = (!isPolygon || containedItems.length === 0)
    ? []
    : containedItems
        .map((feat) => {
          const log = feat.dailyLogs?.find((l) =>
            l.date === popupEditDate && (activeDepartment === "mixto" ? true : (l.department === (activeDepartment === "bomberos" ? "bomberos" : "pc") || !l.department))
          );
          const novedades = log?.novedades || [];
          const observations = log?.observations?.trim() || "";
          if (novedades.length === 0 && !observations) return null;
          return { origin: feat.title || `Punto ${feat.id}`, originFeatId: feat.id, novedades };
        })
        .filter(Boolean) as Array<{ origin: string; originFeatId: number; novedades: Array<{ id: string; timestamp: string; time: string; text: string; type: string }> }>;

  const showSketchTabs = layerVisibility.sketch && isAdmin;

  return (
    <div
      className="custom-map-popup right-sidebar-popup"
      style={CONTAINER_STYLE}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontWeight: 800, fontSize: "0.9rem", color: localColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {activeFeat.title}
          </span>
          {isAdmin && (
            <button
              onClick={() => onToggleFeatureLock?.(activeFeat.id, !activeFeat.locked)}
              style={{ background: "transparent", border: "none", color: activeFeat.locked ? "var(--color-high)" : "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
              title={activeFeat.locked ? "Desbloquear edición del elemento" : "Bloquear edición del elemento"}
            >
              {activeFeat.locked ? <Lock size={14} /> : <Unlock size={14} style={{ opacity: 0.4 }} />}
            </button>
          )}
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", lineHeight: 1, display: "flex", alignItems: "center", gap: "4px" }} title="Cerrar Panel">
          <X size={14} />
        </button>
      </div>

      {/* Tab Selector — for non-admins and operators */}
      {!isAdmin && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}><Info size={12} /> Información</button>
          {canEditLog && (
            <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
              <FileText size={12} /> {isPolygon ? "Editar Grupos" : "Editar"}
            </button>
          )}
          {isPoint && (
            <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}><History size={12} /> Historial</button>
          )}
          {isPolygon && isOperador && (
            <button onClick={() => setActiveTab("contained")} style={tabBtnStyle(activeTab === "contained")}><Layers size={12} /> Elementos</button>
          )}
        </div>
      )}

      {/* Tab Selector — for admin (sketch off) */}
      {isAdmin && !layerVisibility.sketch && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}><Info size={12} /> Información</button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}>
            <FileText size={12} /> {isPolygon ? "Editar Grupos" : "Editar"}
          </button>
          {isPoint && (
            <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}><History size={12} /> Historial</button>
          )}
        </div>
      )}

      {/* Tab Selector — point admin (sketch on) */}
      {isAdmin && isPoint && layerVisibility.sketch && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}><Settings size={12} /> General</button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}><FileText size={12} /> Operación</button>
          <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}><History size={12} /> Historial</button>
        </div>
      )}

      {/* Tab Selector — polygon admin (sketch on) */}
      {isAdmin && isPolygon && layerVisibility.sketch && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}><Settings size={12} /> General</button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}><FileText size={12} /> Editar Grupos</button>
          <button onClick={() => setActiveTab("contained")} style={tabBtnStyle(activeTab === "contained")}><Layers size={12} /> Elementos</button>
        </div>
      )}

      {/* Tab Selector — polyline (sketch on) */}
      {!isPoint && !isPolygon && showSketchTabs && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}><Settings size={12} /> General</button>
        </div>
      )}

      {/* Tab Content — Info (sketch off) */}
      {activeTab === "info" && (
        <InfoTab
          activeFeat={activeFeat}
          dailyLog={localLog}
          onEdit={() => canEditLog && setActiveTab("operation")}
          drawnFeatures={drawnFeatures}
          popupEditDate={popupEditDate}
          isAdmin={isAdmin}
          canEdit={canEditLog}
          canToggleArrival={canToggleArrival}
          onToggleArrivalGroup={handleToggleArrivalGroup}
          localLog={localLog}
          onGroupFieldChange={handleGroupFieldChange}
          onGeneralFieldChange={handleGeneralFieldChange}
          onSaveStats={handleLogSave}
          saveSuccess={logSaveSuccess}
          novedades={localLog.novedades || []}
          onAddNovedad={handleAddNovedad}
          onDeleteNovedad={handleDeleteNovedad}
          onUpdateNovedad={handleUpdateNovedad}
          containedNovedades={containedNovedades}
          onNavigateToFeature={onNavigateToFeature}
          activeDepartment={activeDepartment}
        />
      )}

      {/* Tab Content — General (sketch on) */}
      {activeTab === "general" && (
        <GeneralTab
          activeFeat={activeFeat}
          localTitle={localTitle}
          localDescription={localDescription}
          localColor={localColor}
          localIsCollapsed={localIsCollapsed}
          localCollapsedCount={localCollapsedCount}
          generalSaveSuccess={generalSaveSuccess}
          onRename={setLocalTitle}
          onDescription={setLocalDescription}
          onColor={setLocalColor}
          onIsCollapsedChange={setLocalIsCollapsed}
          onCollapsedCountChange={setLocalCollapsedCount}
          onSave={handleGeneralSave}
        />
      )}

      {activeTab === "operation" && (
        <OperationTab
          localLog={localLog}
          popupEditDate={popupEditDate}
          setPopupEditDate={setPopupEditDate}
          showSecondGroup={showSecondGroup}
          setShowSecondGroup={setShowSecondGroup}
          onFieldChange={handleLogFieldChange}
          onSave={handleLogSave}
          saveSuccess={logSaveSuccess}
          activeDepartment={activeDepartment}
          selectedDept={selectedDept}
          onDepartmentSelect={setSelectedDept}
          workGroups={workGroups}
        />
      )}

      {activeTab === "history" && <HistoryTab logs={activeFeat.dailyLogs?.filter((l) => activeDepartment === "mixto" || l.department === activeDepartment || !l.department)} />}

      {activeTab === "contained" && (
        <ContainedTab
          features={containedItems}
          popupEditDate={popupEditDate}
          activeDepartment={activeDepartment}
          onNavigateToFeature={onNavigateToFeature}
        />
      )}
    </div>
  );
};
