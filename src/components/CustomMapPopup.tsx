import React, { useState, useEffect } from "react";
import type { DrawnFeature, DailyLog, LayerVisibility, DepartmentView } from "../types";
import { computeContainedItems } from "../utils/spatialUtils";
import { Lock, Unlock, FileText, Settings, History, Layers, Info, X } from "lucide-react";
import { TAB_BTN_BASE } from "./popup/popupStyles";
import { GeneralTab } from "./popup/GeneralTab";
import { OperationTab } from "./popup/OperationTab";
import { HistoryTab } from "./popup/HistoryTab";
import { ContainedTab } from "./popup/ContainedTab";
import { InfoTab } from "./popup/InfoTab";

interface CustomMapPopupProps {
  customPopup: { mapPoint: __esri.Point; feat: DrawnFeature } | null;
  popupScreenPos: { x: number; y: number } | null;
  drawnFeatures: DrawnFeature[];
  layerVisibility: LayerVisibility;
  popupEditDate: string;
  setPopupEditDate: (date: string) => void;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  onRenameFeature?: (id: number, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number, newColor: string) => Promise<void>;
  sketchLayer: __esri.GraphicsLayer;
  onClose: () => void;
  activeDepartment?: DepartmentView;
}

type TabId = "info" | "general" | "operation" | "history" | "contained";

const EMPTY_LOG: Omit<DailyLog, "date"> = {
  groupName: "", managerName: "", managerPhone: "", unitOut: "",
  departureTime: "", arrivalTime: "", officersCount: "", hasArrivedG1: false,
  rescuedCount: "", recoveredCount: "", rescuedPetsCount: "",
  groupName2: "", managerName2: "", managerPhone2: "", unitOut2: "",
  departureTime2: "", arrivalTime2: "", officersCount2: "",
  rescuedCount2: "", recoveredCount2: "", hasArrivedG2: false,
  observations: "",
};

const CONTAINER_STYLE: React.CSSProperties = {
  position: "absolute",
  zIndex: 999,
  padding: "12px 14px",
  borderRadius: "12px",
  width: "330px",
  maxHeight: "82vh",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  background: "rgba(15, 23, 42, 0.94)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid var(--border-subtle)",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
  color: "var(--text-main)",
  pointerEvents: "auto",
};

const TAB_BAR_STYLE: React.CSSProperties = {
  display: "flex",
  background: "rgba(0,0,0,0.3)",
  padding: "2px",
  borderRadius: "6px",
  gap: "2px",
};

function tabBtnStyle(active: boolean): React.CSSProperties {
  return {
    ...TAB_BTN_BASE,
    background: active ? "rgba(255,255,255,0.08)" : "transparent",
    color: active ? "var(--color-info)" : "var(--text-muted)",
  };
}

export const CustomMapPopup: React.FC<CustomMapPopupProps> = ({
  customPopup, popupScreenPos, drawnFeatures, layerVisibility,
  popupEditDate, setPopupEditDate, onSaveDailyLog,
  onToggleFeatureLock, onRenameFeature, onUpdateFeatureDescription,
  onUpdateFeatureColor, sketchLayer, onClose, activeDepartment = "pc",
}) => {
  const activeFeat = customPopup
    ? drawnFeatures.find((f) => String(f.id) === String(customPopup.feat.id)) || customPopup.feat
    : null;

  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [localColor, setLocalColor] = useState("#3b82f6");
  const [showSecondGroup, setShowSecondGroup] = useState(false);
  const [generalSaveSuccess, setGeneralSaveSuccess] = useState(false);
  const [logSaveSuccess, setLogSaveSuccess] = useState(false);

  const [localLog, setLocalLog] = useState<DailyLog>({ date: popupEditDate, ...EMPTY_LOG });

  useEffect(() => {
    if (!activeFeat) return;
    setLocalTitle(activeFeat.title);
    setLocalDescription(activeFeat.description || "");
    setLocalColor(activeFeat.color || "#3b82f6");
    setGeneralSaveSuccess(false);
    setLogSaveSuccess(false);

    const todayLogs = activeFeat.dailyLogs?.filter((l) =>
      l.date === popupEditDate && (activeDepartment === "mixto" || l.department === activeDepartment || !l.department)
    ) || [];
    const todayLog = todayLogs[0];
    setLocalLog(todayLog ? { ...todayLog } : { date: popupEditDate, department: activeDepartment === "mixto" ? "pc" : activeDepartment, ...EMPTY_LOG });
    setShowSecondGroup(todayLog ? !!todayLog.groupName2 || !!todayLog.unitOut2 : false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeFeat re-creates on every parent render; id+date cover the intended trigger
  }, [activeFeat?.id, popupEditDate, activeDepartment]);

  useEffect(() => {
    if (!activeFeat || !layerVisibility.sketch) {
      setActiveTab("info");
    } else {
      setActiveTab("general");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeFeat?.id + type cover all needed resets
  }, [activeFeat?.id, activeFeat?.type, layerVisibility.sketch]);

  if (!customPopup || !popupScreenPos || !activeFeat) return null;

  const POPUP_W = 330;
  const POPUP_H = 400;
  const MARGIN = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = popupScreenPos.x;
  let y = popupScreenPos.y;
  let flipY = false;

  if (y - POPUP_H - MARGIN < 0) {
    flipY = true;
    y = y + MARGIN;
  } else {
    y = y - MARGIN;
  }

  x = Math.max(POPUP_W / 2 + MARGIN, Math.min(x, vw - POPUP_W / 2 - MARGIN));

  const containerStyle: React.CSSProperties = {
    ...CONTAINER_STYLE,
    left: `${x}px`,
    top: `${y}px`,
    transform: flipY ? "translate(-50%, 0)" : "translate(-50%, -100%)",
  };

  const handleGeneralSave = async () => {
    try {
      if (onRenameFeature) await onRenameFeature(activeFeat.id, localTitle);
      if (onUpdateFeatureDescription) await onUpdateFeatureDescription(activeFeat.id, localDescription);
      if (onUpdateFeatureColor) await onUpdateFeatureColor(activeFeat.id, localColor);
      setGeneralSaveSuccess(true);
      setTimeout(() => setGeneralSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving general features:", err);
    }
  };

  const handleLogSave = async () => {
    if (!onSaveDailyLog) return;
    try {
      const logToSave = { ...localLog, department: localLog.department || (activeDepartment === "mixto" ? "pc" : activeDepartment) };
      await onSaveDailyLog(activeFeat.id, logToSave);
      setLogSaveSuccess(true);
      setTimeout(() => setLogSaveSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving daily logs:", err);
    }
  };

  const handleLogFieldChange = (field: string, val: unknown) => {
    setLocalLog((prev) => ({ ...prev, [field]: val }));
  };

  const containedItems = computeContainedItems(activeFeat, sketchLayer, drawnFeatures);

  const isPoint = activeFeat.type === "point";
  const isPolygon = activeFeat.type === "polygon";
  const showSketchTabs = layerVisibility.sketch;

  return (
    <div
      className="custom-map-popup glass-panel"
      style={containerStyle}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontWeight: 800, fontSize: "0.72rem", color: localColor, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {activeFeat.title}
          </span>
          <button
            onClick={() => onToggleFeatureLock?.(activeFeat.id, !activeFeat.locked)}
            style={{ background: "transparent", border: "none", color: activeFeat.locked ? "var(--color-high)" : "var(--text-muted)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
            title={activeFeat.locked ? "Desbloquear edición del elemento" : "Bloquear edición del elemento"}
          >
            {activeFeat.locked ? <Lock size={12} /> : <Unlock size={12} style={{ opacity: 0.4 }} />}
          </button>
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "2px", lineHeight: 1, display: "flex", alignItems: "center" }} title="Cerrar">
          <X size={14} />
        </button>
      </div>

      {/* Tab Selector — when sketch is off */}
      {!showSketchTabs && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("info")} style={tabBtnStyle(activeTab === "info")}><Info size={10} /> Información</button>
          {activeTab === "operation" && (
            <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(true)}><FileText size={10} /> Editar</button>
          )}
        </div>
      )}

      {/* Tab Selector — point (sketch on) */}
      {isPoint && showSketchTabs && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}><Settings size={10} /> General</button>
          <button onClick={() => setActiveTab("operation")} style={tabBtnStyle(activeTab === "operation")}><FileText size={10} /> Operación</button>
          <button onClick={() => setActiveTab("history")} style={tabBtnStyle(activeTab === "history")}><History size={10} /> Historial</button>
        </div>
      )}

      {/* Tab Selector — polygon (sketch on) */}
      {isPolygon && showSketchTabs && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}><Settings size={10} /> General</button>
          <button onClick={() => setActiveTab("contained")} style={tabBtnStyle(activeTab === "contained")}><Layers size={10} /> Elementos</button>
        </div>
      )}

      {/* Tab Selector — polyline (sketch on) */}
      {!isPoint && !isPolygon && showSketchTabs && (
        <div style={TAB_BAR_STYLE}>
          <button onClick={() => setActiveTab("general")} style={tabBtnStyle(activeTab === "general")}><Settings size={10} /> General</button>
        </div>
      )}

      {/* Tab Content — Info (sketch off) */}
      {activeTab === "info" && (
        <InfoTab
          activeFeat={activeFeat}
          dailyLog={localLog}
          onEdit={() => setActiveTab("operation")}
          drawnFeatures={drawnFeatures}
          popupEditDate={popupEditDate}
        />
      )}

      {/* Tab Content — General (sketch on) */}
      {activeTab === "general" && (
        <GeneralTab
          activeFeat={activeFeat}
          localTitle={localTitle}
          localDescription={localDescription}
          localColor={localColor}
          generalSaveSuccess={generalSaveSuccess}
          onRename={setLocalTitle}
          onDescription={setLocalDescription}
          onColor={setLocalColor}
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
        />
      )}

      {activeTab === "history" && <HistoryTab logs={activeFeat.dailyLogs?.filter((l) => activeDepartment === "mixto" || l.department === activeDepartment || !l.department)} />}

      {activeTab === "contained" && <ContainedTab items={containedItems} />}

      {/* Bubble Tail Pointer Arrow */}
      <div
        style={flipY ? {
          position: "absolute",
          top: "-6px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: "12px",
          height: "12px",
          background: "rgba(15, 23, 42, 0.94)",
          borderLeft: "1px solid var(--border-subtle)",
          borderTop: "1px solid var(--border-subtle)",
          zIndex: -1,
        } : {
          position: "absolute",
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%) rotate(45deg)",
          width: "12px",
          height: "12px",
          background: "rgba(15, 23, 42, 0.94)",
          borderRight: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
          zIndex: -1,
        }}
      />
    </div>
  );
};
