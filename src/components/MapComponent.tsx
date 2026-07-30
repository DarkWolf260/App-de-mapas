import React from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId } from "../types";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { DeploymentSummaryCard } from "./DeploymentSummaryCard";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { HtmlPointLabels } from "./HtmlPointLabels";
import { SwipeComparison } from "./SwipeComparison";
import { useMapSetup } from "./useMapSetup";
import { useDraggable } from "../hooks/useDraggable";
import type { MapFeatureActions, MapUIContext } from "./mapTypes";
import Point from "@arcgis/core/geometry/Point";
import { Satellite, Calendar } from "lucide-react";

interface MapComponentProps {
  apiKey: string;
  activeBasemap: string;
  activeCity: string;
  layerVisibility: LayerVisibility;
  onToggleLayer?: (layerName: keyof LayerVisibility) => void;
  drawnFeatures: DrawnFeature[];
  hiddenFeatures: Record<string, boolean>;
  zoomToFeature: DrawnFeature | null;
  removeFeatureId: RemoveFeatureId | null;
  importedFeatures: DrawnFeature[];
  zoomToCoords?: { lat: number; lon: number } | null;
  onZoomToFeature?: (feat: DrawnFeature) => void;
  /** Feature CRUD + log + report actions */
  actions: MapFeatureActions;
  /** UI state: date, department, permissions, visibility toggles */
  ui: MapUIContext;
  /** Dashboard mode: renders only the map, hiding all floating widgets/toolbars/popups */
  bare?: boolean;
}
  
  const MapComponent: React.FC<MapComponentProps> = (props) => {
    const { layerVisibility, drawnFeatures, onZoomToFeature, actions, ui, bare = false } = props;
    const {
      onSaveDailyLog,
      onToggleFeatureLock,
      onRenameFeature,
      onUpdateFeatureDescription,
      onUpdateFeatureColor,
      onUpdateFeatureCollapsed,
    } = actions;

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
  } = useMapSetup({
    ...props,
    selectedDate: ui.selectedDate,
    onFeatureAdded: actions.onFeatureAdded,
    onFeatureDeleted: actions.onFeatureDeleted,
    activeDepartment: ui.activeDepartment,
    onFeatureClick: ui.onFeatureClick,
    showAccumulated: ui.showAccumulated,
    showPoints: ui.showPoints,
    showAreas: ui.showAreas,
    sidebarOpen: ui.sidebarOpen,
    bitacoraOpen: ui.bitacoraOpen,
  });

  const handleNavigateToFeature = React.useCallback((feat: DrawnFeature) => {
    let mapPoint: Point | null = null;
    if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
      const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
      mapPoint = new Point({ longitude: lng, latitude: lat });
    }
    if (!mapPoint) mapPoint = new Point({ longitude: -66.9331, latitude: 10.6000 });
    ui.onFeatureClick?.();
    setCustomPopup({ mapPoint, feat });
    // Also fly the map to the feature's location
    if (viewRef.current) {
      const padding = {
        left: ui.sidebarOpen ? 380 : 0,
        right: ui.bitacoraOpen ? 480 : 440,
      };
      const target: any = { target: mapPoint };
      if (feat.type === "point") target.zoom = Math.max(viewRef.current.zoom, 18);
      viewRef.current.goTo(target, { duration: 400, padding } as any);
    }
  }, [setCustomPopup, viewRef, ui.sidebarOpen, ui.bitacoraOpen, ui.onFeatureClick]);

  const handlePopupDateChange = React.useCallback((date: string) => {
    setPopupEditDate(date);
    ui.onSelectedDateChange?.(date);
  }, [setPopupEditDate, ui]);

  const defaultX = typeof window !== "undefined" ? Math.floor(window.innerWidth / 2 - 180) : 400;
  const { position: toolbarPos, dragHandleProps, isDragging } = useDraggable(
    defaultX,
    typeof window !== "undefined" ? Math.max(20, window.innerHeight - 135) : 450,
  );

  const popoverDirection: "top" | "bottom" = (() => {
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    return toolbarPos.y + 60 > vh / 2 ? "top" : "bottom";
  })();

  const displayX = (ui.showSidebar && toolbarPos.x < 380) ? 396 : Math.max(16, toolbarPos.x);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="map-view-container" ref={mapDiv} style={{ width: "100%", height: "100%" }} />
      {/* Floating Draggable Drawing Toolbar (Solo visible para Administradores) */}
      {!bare && ui.isAdmin !== false && layerVisibility.sketch && (
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

      {!bare && (
      <CustomMapPopup
        customPopup={customPopup}
        popupScreenPos={popupScreenPos}
        drawnFeatures={drawnFeatures}
        layerVisibility={layerVisibility}
        popupEditDate={popupEditDate}
        setPopupEditDate={handlePopupDateChange}
        onSaveDailyLog={onSaveDailyLog}
        onRefreshFeatures={actions.onRefreshFeatures}
        featureActions={{
          onToggleFeatureLock,
          onRenameFeature,
          onUpdateFeatureDescription,
          onUpdateFeatureColor,
          onUpdateFeatureCollapsed,
        }}
        sketchLayer={sketchLayer}
        onClose={() => setCustomPopup(null)}
        onNavigateToFeature={handleNavigateToFeature}
        activeDepartment={ui.activeDepartment}
        isAdmin={ui.isAdmin}
        isOperador={ui.isOperador}
      />
      )}

      {/* Floating hover tooltip for lines and polygons */}
      {!bare && tooltip.visible && (
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
      {!bare && (
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
        {actions.onOpenRangeReport && (
          <button
            className="bitacora-floating-btn"
            onClick={() => actions.onOpenRangeReport && actions.onOpenRangeReport("all")}
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
        {/* Map Settings & Layer Visibility Panel */}
        {props.onToggleLayer && (
          <div style={{ pointerEvents: "auto" }} className="map-settings-wrapper">
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
              ui.onFeatureClick?.();
              setCustomPopup({ mapPoint, feat });
            }}
            selectedDate={ui.selectedDate}
            activeDepartment={ui.activeDepartment}
          />
        </div>
      </div>
      )}

      {/* Barra de Estado / Coordenadas Flotante (Diseño COE) */}
      {!bare && (
      <div className="status-bar-coordinates">
        <div><span>LAT:</span> {coords.lat.toFixed(6)}</div>
        <div><span>LNG:</span> {coords.lng.toFixed(6)}</div>
        <div><span>ZOOM:</span> {Math.round(currentZoom)}</div>
        {currentScale > 0 && <div><span>ESCALA:</span> 1:{currentScale.toLocaleString()}</div>}
      </div>
      )}

      {/* HTML point labels with background (personnel info) */}
      <HtmlPointLabels
        labels={htmlLabels}
        isAuthenticated={ui.isAuthenticated ?? false}
        onSelectLabel={(lblId) => {
          const feat = drawnFeatures.find((f) => String(f.id) === String(lblId));
          if (feat) {
            let mapPoint: Point | null = null;
            if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
              const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
              mapPoint = new Point({ longitude: lng, latitude: lat });
            }
            if (!mapPoint) mapPoint = new Point({ longitude: -66.9331, latitude: 10.6000 });
            ui.onFeatureClick?.();
            setCustomPopup({ mapPoint, feat });
          }
        }}
      />

      {/* Satellite Swipe Comparison */}
      {!bare && swipeActive && viewRef.current && (
        <SwipeComparison view={viewRef.current} onClose={deactivateSwipe} />
      )}

      {/* Floating comparison toggle button — bottom-left */}
      {!bare && (
      <button
        className={`swipe-toggle-btn ${swipeActive ? "active" : ""}`}
        onClick={swipeActive ? deactivateSwipe : activateSwipe}
        title={swipeActive ? "Cerrar comparación" : "Comparar antes/después"}
      >
        <Satellite size={16} />
        <span className="swipe-toggle-label">{swipeActive ? "Cerrar" : "Antes / Después"}</span>
      </button>
      )}
    </div>
  );
};

export default MapComponent;
