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
import Point from "@arcgis/core/geometry/Point";
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
    currentScale,
    coords,
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

  const defaultX = typeof window !== "undefined" ? Math.floor(window.innerWidth / 2 - 180) : 400;
  const { position: toolbarPos, dragHandleProps, isDragging } = useDraggable(
    defaultX,
    typeof window !== "undefined" ? Math.max(20, window.innerHeight - 135) : 450,
  );

  const popoverDirection: "top" | "bottom" = (() => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    return toolbarPos.y + 60 > vh / 2 ? "top" : "bottom";
  })();

  const displayX = (showSidebar && toolbarPos.x < 380) ? 396 : Math.max(16, toolbarPos.x);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="map-view-container" ref={mapDiv} style={{ width: "100%", height: "100%" }} />
      {layerVisibility?.sketch && (
        <div
          className="draw-toolbar-wrapper"
          style={{
            position: "fixed",
            left: displayX,
            top: toolbarPos.y,
            zIndex: 150,
            transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
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
            onOpenEditFeature={(feat) => {
              let mapPoint: Point | null = null;
              if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
                const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
                mapPoint = new Point({ longitude: lng, latitude: lat });
              }
              if (!mapPoint) mapPoint = new Point({ longitude: -66.9331, latitude: 10.6000 });
              setCustomPopup({ mapPoint, feat });
            }}
            selectedDate={props.selectedDate}
            activeDepartment={props.activeDepartment}
          />
        </div>
      </div>

      {/* Barra de Estado / Coordenadas Flotante (Diseño COE) */}
      <div className="status-bar-coordinates">
        <div><span>LAT:</span> {coords.lat.toFixed(6)}</div>
        <div><span>LNG:</span> {coords.lng.toFixed(6)}</div>
        <div><span>ZOOM:</span> {Math.round(currentZoom)}</div>
        {currentScale > 0 && <div><span>ESCALA:</span> 1:{currentScale.toLocaleString()}</div>}
      </div>

      {/* HTML point labels with background (personnel info) */}
      <HtmlPointLabels labels={htmlLabels} />

      {/* Satellite Swipe Comparison */}
      {swipeActive && viewRef.current && (
        <SwipeComparison view={viewRef.current} onClose={deactivateSwipe} showSidebar={showSidebar} />
      )}

      {/* Floating comparison toggle button — bottom-left */}
      <button
        className={`swipe-toggle-btn ${swipeActive ? "active" : ""}`}
        onClick={swipeActive ? deactivateSwipe : activateSwipe}
        title={swipeActive ? "Cerrar comparación" : "Comparar antes/después"}
        style={{
          left: "16px",
          bottom: "36px",
        }}
      >
        <Satellite size={16} />
        <span className="swipe-toggle-label">{swipeActive ? "Cerrar" : "Antes / Después"}</span>
      </button>
    </div>
  );
};

export default MapComponent;
