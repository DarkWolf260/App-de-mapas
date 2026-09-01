import React from "react";
import "@arcgis/core/assets/esri/themes/dark/main.css";
import type { BasemapKey, DrawnFeature, LayerVisibility, RemoveFeatureId } from "../types";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { DeploymentSummaryCard } from "./DeploymentSummaryCard";
import { GlobalStatsWidget } from "./GlobalStatsWidget";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { HtmlPointLabels } from "./HtmlPointLabels";
import { SwipeComparison } from "./SwipeComparison";
import { FeatureSvgOverlay } from "./FeatureSvgOverlay";
import { useMapSetup } from "./useMapSetup";
import { useDraggable } from "../hooks/useDraggable";
import type { MapFeatureActions, MapUIContext } from "./mapTypes";
import Point from "@arcgis/core/geometry/Point";
import { DEFAULT_CENTER } from "../utils/mapUtils";
import { Satellite, Calendar, MapPin, ExternalLink, Copy, Link2, Check, Building2, Layers, BarChart2 } from "lucide-react";

interface MapComponentProps {
  activeBasemap: BasemapKey | string;
  onSelectBasemap?: (basemap: BasemapKey) => void;
  activeCity: string;
  layerVisibility: LayerVisibility;
  onToggleLayer?: (layerName: keyof LayerVisibility) => void;
  onToggleAccumulated?: () => void;
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
  const [isMobile, setIsMobile] = React.useState(() => typeof window !== "undefined" && window.innerWidth <= 768);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const canEditMap = ui.isAdmin || !ui.isAuthenticated || !!ui.permissions?.edit_map;

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
    sketchVMRef,
    onSelectGraphicForEdit,
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
    inspeccionesRecords,
    selectedColorFilter,
    setSelectedColorFilter,
    selectedDateFilter,
    setSelectedDateFilter,
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
    canEditMap,
  });

  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent("swipe-state-changed", { detail: swipeActive }));
  }, [swipeActive]);

  React.useEffect(() => {
    const handleToggleSwipe = () => {
      if (swipeActive) {
        deactivateSwipe();
      } else {
        activateSwipe();
      }
    };
    window.addEventListener("toggle-swipe", handleToggleSwipe);
    return () => window.removeEventListener("toggle-swipe", handleToggleSwipe);
  }, [swipeActive, activateSwipe, deactivateSwipe]);

  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    lat: number;
    lng: number;
  } | null>(null);
  const [copiedType, setCopiedType] = React.useState<"link" | "coords" | null>(null);

  const handleCopyLink = React.useCallback((lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(() => { });
    } else {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedType("link");
    setTimeout(() => {
      setCopiedType(null);
      setContextMenu(null);
    }, 600);
  }, []);

  const handleToggleInspeccionesLayer = React.useCallback(() => {
    const isCurrentlyActive = !!layerVisibility.inspecciones;
    if (!isCurrentlyActive) {
      if (layerVisibility.sketch) {
        props.onToggleLayer?.("sketch");
      }
    } else {
      if (!layerVisibility.sketch) {
        props.onToggleLayer?.("sketch");
      }
    }
    props.onToggleLayer?.("inspecciones");
  }, [layerVisibility.inspecciones, layerVisibility.sketch, props.onToggleLayer]);

  const handleCopyCoords = React.useCallback((lat: number, lng: number) => {
    const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(coordsStr).catch(() => { });
    } else {
      const input = document.createElement("input");
      input.value = coordsStr;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopiedType("coords");
    setTimeout(() => {
      setCopiedType(null);
      setContextMenu(null);
    }, 600);
  }, []);

  React.useEffect(() => {
    const container = mapDiv.current;
    if (!container) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const view = viewRef.current;
      if (!view) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const mapPoint = view.toMap({ x: screenX, y: screenY });

      if (mapPoint && typeof mapPoint.latitude === "number" && typeof mapPoint.longitude === "number") {
        const menuWidth = 190;
        const menuHeight = 120;
        const posX = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
        const posY = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

        setContextMenu({
          x: Math.max(10, posX),
          y: Math.max(10, posY),
          lat: mapPoint.latitude,
          lng: mapPoint.longitude,
        });
        setCopiedType(null);
      }
    };

    container.addEventListener("contextmenu", handleContextMenu, true);
    return () => {
      container.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [mapDiv, viewRef]);

  React.useEffect(() => {
    if (!contextMenu) return;
    const handleClose = () => setContextMenu(null);
    window.addEventListener("click", handleClose);
    window.addEventListener("scroll", handleClose, true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClose);
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleNavigateToFeature = React.useCallback((feat: DrawnFeature) => {
    let mapPoint: Point | null = null;
    if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
      const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
      mapPoint = new Point({ longitude: lng, latitude: lat });
    }
    if (!mapPoint) mapPoint = new Point({ longitude: DEFAULT_CENTER[0], latitude: DEFAULT_CENTER[1] });
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

  const displayX = (ui.showSidebar && toolbarPos.x < 380) ? 396 : Math.max(16, Math.min(typeof window !== "undefined" ? window.innerWidth - 300 : 800, toolbarPos.x));
  const displayY = Math.max(20, Math.min(typeof window !== "undefined" ? window.innerHeight - 80 : 600, toolbarPos.y));

  const handleSvgFeatureClick = React.useCallback((featId: number | string, screenPt: { x: number; y: number }) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(featId));
    if (!feat || !viewRef.current) return;
    const mapPoint = viewRef.current.toMap(screenPt);
    ui.onFeatureClick?.();
    setCustomPopup({ mapPoint, feat });
    const g = sketchLayer?.graphics.find((gr) => {
      const fid = gr.attributes?.id ?? (gr as any).uid;
      return String(fid) === String(featId);
    });
    if (g && !feat.locked && onSelectGraphicForEdit) onSelectGraphicForEdit(g);
  }, [drawnFeatures, viewRef, ui, setCustomPopup, sketchLayer, onSelectGraphicForEdit]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="map-view-container" ref={mapDiv} style={{ width: "100%", height: "100%" }} />
      {/* Capa de dibujo SVG alternativa (modo compatible con PCs antiguas) */}
      <FeatureSvgOverlay
        view={viewRef.current}
        sketchLayer={sketchLayer}
        sketchVMRef={sketchVMRef}
        enabled={!!layerVisibility.svgOverlay}
        drawnFeatures={layerVisibility.inspecciones ? drawnFeatures.filter((f) => f.type === "polygon") : drawnFeatures}
        htmlLabels={layerVisibility.inspecciones ? [] : htmlLabels}
        interactive={!bare}
        onFeatureClick={handleSvgFeatureClick}
      />
      {/* Floating Draggable Drawing Toolbar */}
      {!bare && layerVisibility.sketch && (
        <div
          className="draw-toolbar-wrapper"
          style={{
            position: "fixed",
            left: displayX,
            top: displayY,
            zIndex: 9999,
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
          permissions={ui.permissions}
          canEditMap={canEditMap}
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

      {/* Floating Bottom-Right Container (Map Settings Panel + Deployment Summary Card - Solo Escritorio) */}
      {!bare && !isMobile && (
        <div
          className="floating-bottom-right-container"
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
          {/* Botón Flotante Discreto de Panel de Estadísticas (Cyan Neón) */}
          {actions.onOpenRangeReport && (
            <button
              className="bitacora-floating-btn"
              onClick={() => actions.onOpenRangeReport && actions.onOpenRangeReport("all")}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(10, 15, 29, 0.85)",
                border: "1px solid rgba(56, 189, 248, 0.45)",
                color: "#38bdf8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 4px 12px rgba(56, 189, 248, 0.25)",
                transition: "all 0.2s ease",
                padding: 0,
                pointerEvents: "auto",
              }}
              title="Abrir Panel de Estadísticas"
            >
              <BarChart2 size={16} style={{ color: "#38bdf8" }} />
            </button>
          )}

          {/* Botón Flotante Grupos de Trabajo */}
          {/* Map Settings & Layer Visibility Panel */}
          {props.onToggleLayer && (
            <div style={{ pointerEvents: "auto" }} className="map-settings-wrapper">
              <MapSettingsPanel
                activeBasemap={props.activeBasemap}
                onSelectBasemap={props.onSelectBasemap}
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
                if (!mapPoint) mapPoint = new Point({ longitude: DEFAULT_CENTER[0], latitude: DEFAULT_CENTER[1] });
                ui.onFeatureClick?.();
                setCustomPopup({ mapPoint, feat });
              }}
              selectedDate={ui.selectedDate}
              activeDepartment={ui.activeDepartment}
              showAccumulated={ui.showAccumulated}
              isInspeccionesMode={layerVisibility.inspecciones ?? false}
              inspeccionesRecords={inspeccionesRecords}
              selectedColorFilter={selectedColorFilter}
              onZoomToInspeccion={(rec) => {
                if (viewRef.current && rec.latitude && rec.longitude) {
                  viewRef.current.goTo(
                    { center: [rec.longitude, rec.latitude], zoom: 17 },
                    { duration: 1200, easing: "ease-in-out" } as any
                  );
                }
              }}
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
        labels={layerVisibility.inspecciones ? [] : htmlLabels}
        isAuthenticated={ui.isAuthenticated ?? false}
        onSelectLabel={(lblId) => {
          const feat = drawnFeatures.find((f) => String(f.id) === String(lblId));
          if (feat) {
            let mapPoint: Point | null = null;
            if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
              const [lng, lat] = feat.geojsonGeometry.coordinates as number[];
              mapPoint = new Point({ longitude: lng, latitude: lat });
            }
            if (!mapPoint) mapPoint = new Point({ longitude: DEFAULT_CENTER[0], latitude: DEFAULT_CENTER[1] });
            ui.onFeatureClick?.();
            setCustomPopup({ mapPoint, feat });
          }
        }}
      />

      {/* Satellite Swipe Comparison */}
      {!bare && swipeActive && viewRef.current && (
        <SwipeComparison view={viewRef.current} onClose={deactivateSwipe} />
      )}

      {/* Floating Action Buttons — Bottom Left (Solo Escritorio cuando el sidebar está colapsado) */}
      {!bare && !isMobile && !ui.sidebarOpen && (
        <div style={{ position: "fixed", bottom: "24px", left: "24px", zIndex: 30, display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
          {/* Fila Superior: Botón de Inspecciones (Encima de Antes / Después) */}
          <button
            className={`swipe-toggle-btn ${layerVisibility.inspecciones ? "active" : ""}`}
            onClick={handleToggleInspeccionesLayer}
            title={layerVisibility.inspecciones ? "Desactivar Capa de Inspecciones Kobo" : "Activar Capa de Inspecciones Kobo"}
            style={{
              position: "relative",
              bottom: "auto",
              left: "auto",
              borderColor: layerVisibility.inspecciones ? "rgba(99, 102, 241, 0.8)" : undefined,
              backgroundColor: layerVisibility.inspecciones ? "rgba(99, 102, 241, 0.25)" : undefined,
            }}
          >
            <Building2 size={16} style={{ color: layerVisibility.inspecciones ? "#818cf8" : undefined }} />
            <span className="swipe-toggle-label">Inspecciones</span>
          </button>

          {/* Fila Inferior: Botón Antes / Después + Capas (Sín hueco) */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className={`swipe-toggle-btn ${swipeActive ? "active" : ""}`}
              style={{ position: "relative", bottom: "auto", left: "auto" }}
              onClick={swipeActive ? deactivateSwipe : activateSwipe}
              title={swipeActive ? "Cerrar comparación" : "Comparar antes/después"}
            >
              <Satellite size={16} />
              <span className="swipe-toggle-label">{swipeActive ? "Cerrar" : "Antes / Después"}</span>
            </button>

            {swipeActive && (
              <button
                className="swipe-layer-toggle"
                onClick={() => window.dispatchEvent(new CustomEvent("toggle-swipe-panel"))}
                title="Seleccionar capas post-sismo"
                style={{ position: "relative", top: "auto", left: "auto" }}
              >
                <Layers size={16} />
              </button>
            )}
          </div>
        </div>
      )}



      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 999999,
            background: "rgba(10, 15, 29, 0.96)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "4px",
            minWidth: "185px",
            animation: "fadeIn 0.1s ease-out",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => handleCopyCoords(contextMenu.lat, contextMenu.lng)}
            title="Copiar coordenadas"
            style={{
              padding: "5px 8px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              borderRadius: "4px",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ fontSize: "0.64rem", color: copiedType === "coords" ? "#4ade80" : "var(--text-muted)", fontFamily: "monospace", fontWeight: 600 }}>
              {copiedType === "coords" ? "¡Coordenadas copiadas!" : `${contextMenu.lat.toFixed(5)}, ${contextMenu.lng.toFixed(5)}`}
            </span>
            {copiedType === "coords" ? (
              <Check size={12} style={{ color: "#4ade80", flexShrink: 0, marginLeft: "6px" }} />
            ) : (
              <Copy size={12} style={{ color: "var(--text-muted)", flexShrink: 0, marginLeft: "6px" }} />
            )}
          </div>

          <button
            onClick={() => {
              const url = `https://www.google.com/maps?q=${contextMenu.lat},${contextMenu.lng}`;
              window.open(url, "_blank", "noopener,noreferrer");
              setContextMenu(null);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 8px",
              background: "transparent",
              border: "none",
              borderRadius: "5px",
              color: "#f8fafc",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--sans-font)",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ExternalLink size={13} style={{ color: "#38bdf8", flexShrink: 0 }} />
            <span>Ver en Maps</span>
          </button>

          <button
            onClick={() => handleCopyLink(contextMenu.lat, contextMenu.lng)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 8px",
              background: "transparent",
              border: "none",
              borderRadius: "5px",
              color: copiedType === "link" ? "#4ade80" : "#f8fafc",
              fontSize: "0.72rem",
              fontWeight: 600,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "var(--sans-font)",
              transition: "background 0.12s ease, color 0.12s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {copiedType === "link" ? (
              <Check size={13} style={{ color: "#4ade80", flexShrink: 0 }} />
            ) : (
              <Link2 size={13} style={{ color: "var(--accent-orange)", flexShrink: 0 }} />
            )}
            <span>{copiedType === "link" ? "¡Enlace copiado!" : "Copiar enlace de Maps"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
