import React from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DailyLog } from "../types";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { DeploymentSummaryCard } from "./DeploymentSummaryCard";
import { HtmlPointLabels } from "./HtmlPointLabels";
import { useMapSetup } from "./useMapSetup";
import { useDraggable } from "../hooks/useDraggable";

interface MapComponentProps {
  apiKey: string;
  activeBasemap: string;
  activeCity: string;
  layerVisibility: LayerVisibility;
  drawnFeatures: DrawnFeature[];
  onFeatureAdded: (newFeat: DrawnFeature) => void;
  onFeatureDeleted: (id: number) => void;
  zoomToFeature: DrawnFeature | null;
  removeFeatureId: RemoveFeatureId | null;
  importedFeatures: DrawnFeature[];
  hiddenFeatures: Record<number, boolean>;
  onSaveDailyLog?: (featureId: number, log: DailyLog) => Promise<void>;
  onOpenRangeReport?: (feat: DrawnFeature) => void;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  onRenameFeature?: (id: number, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number, newColor: string) => Promise<void>;
  onZoomToFeature?: (feat: DrawnFeature) => void;
}
  
  const MapComponent: React.FC<MapComponentProps> = (props) => {
    const {
      layerVisibility,
      drawnFeatures,
      onSaveDailyLog,
      onToggleFeatureLock,
      onRenameFeature,
      onUpdateFeatureDescription,
      onUpdateFeatureColor,
      onZoomToFeature,
    } = props;

  const [widgetCollapsed, setWidgetCollapsed] = React.useState(() => {
    return localStorage.getItem("pc_widget_collapsed") === "true";
  });

  const {
    mapDiv,
    activeTool,
    editMode,
    selectedGraphic,
    activeColor,
    tooltip,
    customPopup,
    popupScreenPos,
    popupEditDate,
    sketchLayer,
    currentZoom,
    htmlLabels,
    setCustomPopup,
    setPopupEditDate,
    handleSelectTool,
    handleCancel,
    handleDeleteSelected,
    handleToggleEditMode,
    handleColorChange,
  } = useMapSetup(props);

  const { position: toolbarPos, dragHandleProps } = useDraggable(
    typeof window !== "undefined" ? window.innerWidth / 2 - 200 : 200,
    typeof window !== "undefined" ? window.innerHeight - 80 : 500,
  );

  const popoverDirection: "top" | "bottom" = (() => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    return toolbarPos.y + 60 > vh / 2 ? "top" : "bottom";
  })();

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="map-view-container" ref={mapDiv} style={{ width: "100%", height: "100%" }} />
      {layerVisibility?.sketch && (
        <div
          className="draw-toolbar-wrapper"
          style={{ left: toolbarPos.x, top: toolbarPos.y }}
        >
          <DrawingToolbar
            activeTool={activeTool}
            editMode={editMode}
            onSelectTool={handleSelectTool}
            onCancel={handleCancel}
            onDelete={handleDeleteSelected}
            onToggleEditMode={handleToggleEditMode}
            hasSelection={!!selectedGraphic}
            activeColor={activeColor}
            onColorChange={handleColorChange}
            dragHandleProps={dragHandleProps}
            popoverDirection={popoverDirection}
          />
        </div>
      )}

      <CustomMapPopup
        customPopup={customPopup}
        popupScreenPos={popupScreenPos}
        drawnFeatures={drawnFeatures}
        layerVisibility={layerVisibility}
        popupEditDate={popupEditDate}
        setPopupEditDate={setPopupEditDate}
        onSaveDailyLog={onSaveDailyLog}
        onToggleFeatureLock={onToggleFeatureLock}
        onRenameFeature={onRenameFeature}
        onUpdateFeatureDescription={onUpdateFeatureDescription}
        onUpdateFeatureColor={onUpdateFeatureColor}
        sketchLayer={sketchLayer}
        onClose={() => setCustomPopup(null)}
      />

      {/* Floating hover tooltip for lines and polygons */}
      {tooltip.visible && (
        <div
          style={{
            position: "absolute",
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y + 15}px`,
            background: "rgba(10, 15, 29, 0.95)",
            border: "1px solid rgba(56, 189, 248, 0.4)",
            color: "#f8fafc",
            padding: "6px 12px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 600,
            textTransform: "none",
            letterSpacing: "0.03em",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            fontFamily: "var(--font-sans)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            whiteSpace: "pre-wrap",
          }}
        >
          {tooltip.text}
        </div>
      )}
      {/* Floating Active Deployment Summary Card */}
      <DeploymentSummaryCard
        drawnFeatures={drawnFeatures}
        widgetCollapsed={widgetCollapsed}
        onToggleCollapse={(collapsed) => {
          setWidgetCollapsed(collapsed);
          localStorage.setItem("pc_widget_collapsed", String(collapsed));
        }}
        onZoomToFeature={onZoomToFeature}
      />

      {/* Floating Zoom level indicator in bottom-right */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          background: "rgba(10, 15, 29, 0.85)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          color: "#f8fafc",
          padding: "6px 12px",
          borderRadius: "8px",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "var(--font-sans)",
          pointerEvents: "none",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 100,
          letterSpacing: "0.05em",
        }}
      >
        ZOOM: {currentZoom.toFixed(1)}
      </div>

      {/* HTML point labels with background (personnel info) */}
      <HtmlPointLabels labels={htmlLabels} />
    </div>
  );
};

export default MapComponent;
