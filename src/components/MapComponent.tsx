import React from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DailyLog, DepartmentView } from "../types";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { DeploymentSummaryCard } from "./DeploymentSummaryCard";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { HtmlPointLabels } from "./HtmlPointLabels";
import { SwipeComparison } from "./SwipeComparison";
import { useMapSetup } from "./useMapSetup";
import { useDraggable } from "../hooks/useDraggable";
import { Satellite } from "lucide-react";

interface MapComponentProps {
  apiKey: string;
  activeBasemap: string;
  activeCity: string;
  layerVisibility: LayerVisibility;
  onToggleLayer?: (layerName: keyof LayerVisibility) => void;
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
  zoomToCoords?: { lat: number; lon: number } | null;
  selectedDate: string;
  onSelectedDateChange?: (date: string) => void;
  activeDepartment?: DepartmentView;
  showSidebar?: boolean;
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
      showSidebar = false,
    } = props;

  const [widgetCollapsed, setWidgetCollapsed] = React.useState(() => {
    return localStorage.getItem("pc_widget_collapsed") === "true";
  });
  const [showMapSettings, setShowMapSettings] = React.useState(false);

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
    swipeActive,
    viewRef,
    activateSwipe,
    deactivateSwipe,
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
        activeDepartment={props.activeDepartment}
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
      {/* Floating Bottom-Right Container (Map Settings Panel + Deployment Summary Card) */}
      <div
        style={{
          position: "absolute",
          bottom: "52px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "flex-end",
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        {/* Map Settings & Layer Visibility Panel */}
        {props.onToggleLayer && (
          <div
            style={{
              width: "260px",
              background: "rgba(10, 15, 28, 0.92)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              padding: "8px 12px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              pointerEvents: "auto",
            }}
          >
            <MapSettingsPanel
              layerVisibility={layerVisibility}
              onToggleLayer={props.onToggleLayer}
              expanded={showMapSettings}
              onToggle={() => setShowMapSettings((v) => !v)}
            />
          </div>
        )}

        {/* Floating Active Deployment Summary Card */}
        <div style={{ pointerEvents: "auto" }}>
          <DeploymentSummaryCard
            drawnFeatures={drawnFeatures}
            widgetCollapsed={widgetCollapsed}
            onToggleCollapse={(collapsed) => {
              setWidgetCollapsed(collapsed);
              localStorage.setItem("pc_widget_collapsed", String(collapsed));
            }}
            onZoomToFeature={onZoomToFeature}
            selectedDate={props.selectedDate}
            activeDepartment={props.activeDepartment}
          />
        </div>
      </div>

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

      {/* Satellite Swipe Comparison */}
      {swipeActive && viewRef.current && (
        <SwipeComparison view={viewRef.current} onClose={deactivateSwipe} showSidebar={showSidebar} />
      )}

      {/* Floating comparison toggle button — bottom-left, shifts when sidebar is open */}
      <button
        className={`swipe-toggle-btn ${swipeActive ? "active" : ""}`}
        onClick={swipeActive ? deactivateSwipe : activateSwipe}
        title={swipeActive ? "Cerrar comparacion" : "Comparar antes/despues"}
        style={{
          left: showSidebar ? "410px" : "16px",
          transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Satellite size={18} />
        <span className="swipe-toggle-label">{swipeActive ? "Cerrar" : "Antes / Despues"}</span>
      </button>
    </div>
  );
};

export default MapComponent;
