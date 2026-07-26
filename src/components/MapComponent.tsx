import React from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DailyLog, DepartmentView, WorkGroup } from "../types";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { DeploymentSummaryCard } from "./DeploymentSummaryCard";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { HtmlPointLabels } from "./HtmlPointLabels";
import { SwipeComparison } from "./SwipeComparison";
import { useMapSetup } from "./useMapSetup";
import { useDraggable } from "../hooks/useDraggable";
import Point from "@arcgis/core/geometry/Point";
import { Satellite, Calendar, Users2 } from "lucide-react";

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
  onOpenRangeReport?: (feat: DrawnFeature | "all") => void;
  onToggleFeatureLock?: (id: number, locked: boolean) => void;
  onRenameFeature?: (id: number, newTitle: string) => Promise<void>;
  onUpdateFeatureDescription?: (id: number, newDesc: string) => Promise<void>;
  onUpdateFeatureColor?: (id: number, newColor: string) => Promise<void>;
  onUpdateFeatureCollapsed?: (id: number, isCollapsed: boolean, collapsedCount: string | number) => Promise<void>;
  onZoomToFeature?: (feat: DrawnFeature) => void;
  zoomToCoords?: { lat: number; lon: number } | null;
  selectedDate: string;
  onSelectedDateChange?: (date: string) => void;
  activeDepartment?: DepartmentView;
  showSidebar?: boolean;
  isAdmin?: boolean;
  isOperador?: boolean;
  onOpenWorkGroups?: () => void;
  workGroups?: WorkGroup[];
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
      onUpdateFeatureCollapsed,
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

  const handleNavigateToFeature = React.useCallback((feat: DrawnFeature) => {
    let mapPoint: Point | null = null;
    if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
      const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
      mapPoint = new Point({ longitude: lng, latitude: lat });
    }
    if (!mapPoint) mapPoint = new Point({ longitude: -66.9331, latitude: 10.6000 });
    setCustomPopup({ mapPoint, feat });
    // Also fly the map to the feature's location
    if (viewRef.current) {
      viewRef.current.goTo({ target: mapPoint, zoom: Math.max(viewRef.current.zoom, 18) }, { duration: 400 });
    }
  }, [setCustomPopup, viewRef]);

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
      {/* Floating Draggable Drawing Toolbar (Solo visible para Administradores) */}
      {props.isAdmin !== false && layerVisibility.sketch && (
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
        onUpdateFeatureCollapsed={onUpdateFeatureCollapsed}
        sketchLayer={sketchLayer}
        onClose={() => setCustomPopup(null)}
        onNavigateToFeature={handleNavigateToFeature}
        activeDepartment={props.activeDepartment}
        isAdmin={props.isAdmin}
        isOperador={props.isOperador}
        workGroups={props.workGroups}
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
            zIndex: 40,
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
        {/* Botón Flotante Discreto de Bitácora General (Verde Neón) */}
        {props.onOpenRangeReport && (
          <button
            onClick={() => props.onOpenRangeReport && props.onOpenRangeReport("all")}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(10, 15, 29, 0.85)",
              border: "1px solid rgba(34, 197, 94, 0.45)",
              color: "#4ade80",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.25)",
              transition: "all 0.2s ease",
              padding: 0,
              pointerEvents: "auto",
            }}
            title="Abrir Bitácora General de Novedades"
          >
            <Calendar size={16} style={{ color: "#4ade80" }} />
          </button>
        )}

        {/* Botón Flotante Grupos de Trabajo */}
        {props.onOpenWorkGroups && (
          <button
            onClick={props.onOpenWorkGroups}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(10, 15, 29, 0.85)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              color: "#38bdf8",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              boxShadow: "0 4px 12px rgba(56, 189, 248, 0.2)",
              transition: "all 0.2s ease",
              padding: 0,
              pointerEvents: "auto",
            }}
            title="Directorio de Grupos de Trabajo"
          >
            <Users2 size={15} style={{ color: "#38bdf8" }} />
          </button>
        )}

        {/* Map Settings & Layer Visibility Panel */}
        {props.onToggleLayer && (
          <div style={{ pointerEvents: "auto" }}>
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
      <HtmlPointLabels
        labels={htmlLabels}
        onSelectLabel={(lblId) => {
          const feat = drawnFeatures.find((f) => String(f.id) === String(lblId));
          if (feat) {
            let mapPoint: Point | null = null;
            if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
              const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
              mapPoint = new Point({ longitude: lng, latitude: lat });
            }
            if (!mapPoint) mapPoint = new Point({ longitude: -66.9331, latitude: 10.6000 });
            setCustomPopup({ mapPoint, feat });
          }
        }}
      />

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
