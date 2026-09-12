import React from "react";
import type { BasemapKey, DrawnFeature, LayerVisibility, RemoveFeatureId } from "../types";
import { DrawingToolbar } from "./DrawingToolbar";
import { CustomMapPopup } from "./CustomMapPopup";
import { DeploymentSummaryCard } from "./DeploymentSummaryCard";
import { MapSettingsPanel } from "./MapSettingsPanel";
import { MapSwipeControl } from "./MapSwipeControl";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { useMapSetup } from "./useMapSetup";
import { useDraggable } from "../hooks/useDraggable";
import type { MapFeatureActions, MapUIContext } from "./mapTypes";
import { DEFAULT_CENTER } from "../utils/mapUtils";
import { fromLonLat, toLonLat } from "ol/proj";
import { Satellite, Copy, Link2, Check, Building2, Layers, BarChart2, ExternalLink } from "lucide-react";

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

  const canEditMap = ui.isAuthenticated && (ui.isAdmin || !!ui.permissions?.edit_map);

  const {
    mapDiv,
    activeTool,
    editMode,
    selectedGraphic,
    activeColor,
    customPopup,
    popupScreenPos,
    popupEditDate,
    sketchLayer,
    currentZoom,
    currentScale,
    coords,
    swipeActive,
    swipePosition,
    setSwipePosition,
    mapRef,
    activateSwipe,
    deactivateSwipe,
    setCustomPopup,
    setPopupEditDate,
    handleSelectTool,
    handleCancel,
    deleteConfirmOpen,
    handleConfirmDelete,
    handleCancelDelete,
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
    isAuthenticated: ui.isAuthenticated,
    isMobile,
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
      const map = mapRef.current;
      if (!map) return;

      const rect = container.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const coordinate = map.getCoordinateFromPixel([screenX, screenY]);

      if (coordinate) {
        const [lon, lat] = toLonLat(coordinate);
        const menuWidth = 190;
        const menuHeight = 120;
        const posX = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
        const posY = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

        setContextMenu({
          x: Math.max(10, posX),
          y: Math.max(10, posY),
          lat,
          lng: lon,
        });
        setCopiedType(null);
      }
    };

    container.addEventListener("contextmenu", handleContextMenu, true);
    return () => {
      container.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [mapDiv, mapRef]);

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
    let lon = DEFAULT_CENTER[0];
    let lat = DEFAULT_CENTER[1];

    if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
      lon = (feat.geojsonGeometry.coordinates as number[])[0];
      lat = (feat.geojsonGeometry.coordinates as number[])[1];
    }

    ui.onFeatureClick?.();
    setCustomPopup({ mapPoint: fromLonLat([lon, lat]), feat });

    if (mapRef.current) {
      mapRef.current.getView().animate({
        center: fromLonLat([lon, lat]),
        zoom: Math.max(mapRef.current.getView().getZoom() || 13, 18),
        duration: 500,
      });
    }
  }, [setCustomPopup, mapRef, ui]);

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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      <div className="map-view-container" ref={mapDiv} style={{ width: "100%", height: "100%" }} />

      {/* Floating Draggable Drawing Toolbar */}
      {!bare && canEditMap && layerVisibility.sketch && (
        <div
          className="draw-toolbar-wrapper"
          style={
            isMobile
              ? {
                position: "fixed",
                zIndex: 150,
              }
              : {
                position: "fixed",
                left: displayX,
                top: displayY,
                zIndex: 150,
                transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }
          }
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
            dragHandleProps={isMobile ? undefined : dragHandleProps}
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
            onDeleteFeature: handleDeleteSelected,
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

          {/* Map Settings & Layer Visibility Panel */}
          {props.onToggleLayer && (
            <div style={{ pointerEvents: "auto" }} className="map-settings-wrapper">
              <MapSettingsPanel
                layerVisibility={layerVisibility}
                onToggleLayer={props.onToggleLayer}
                expanded={showMapSettings}
                onToggle={() => setShowMapSettings((v) => !v)}
                canEditMap={canEditMap}
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
                let lon = DEFAULT_CENTER[0];
                let lat = DEFAULT_CENTER[1];
                if (feat.geojsonGeometry && feat.type === "point" && Array.isArray(feat.geojsonGeometry.coordinates)) {
                  lon = (feat.geojsonGeometry.coordinates as number[])[0];
                  lat = (feat.geojsonGeometry.coordinates as number[])[1];
                }
                ui.onFeatureClick?.();
                setCustomPopup({ mapPoint: fromLonLat([lon, lat]), feat });
              }}
              selectedDate={ui.selectedDate}
              activeDepartment={ui.activeDepartment}
              showAccumulated={ui.showAccumulated}
              isInspeccionesMode={layerVisibility.inspecciones ?? false}
              inspeccionesRecords={inspeccionesRecords}
              selectedColorFilter={selectedColorFilter}
              onZoomToInspeccion={(rec) => {
                if (mapRef.current && rec.latitude && rec.longitude) {
                  mapRef.current.getView().animate({
                    center: fromLonLat([Number(rec.longitude), Number(rec.latitude)]),
                    zoom: 17,
                    duration: 1200,
                  });
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
          <div><span>ZOOM:</span> {currentZoom.toFixed(1)}</div>
          {currentScale > 0 && <div><span>ESCALA:</span> 1:{currentScale.toLocaleString()}</div>}
        </div>
      )}

      {/* Satellite Swipe Comparison Slider */}
      {!bare && swipeActive && (
        <MapSwipeControl
          position={swipePosition}
          onPositionChange={(pos) => setSwipePosition(pos)}
          onClose={deactivateSwipe}
          orientation={isMobile ? "vertical" : "horizontal"}
          beforeLabel="Antes (Esri Satelital)"
          afterLabel="Después (Google Satelital HD)"
        />
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

          {/* Fila Inferior: Botón Antes / Después */}
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

      <ConfirmDeleteModal
        isOpen={deleteConfirmOpen}
        itemTitle={selectedGraphic?.title}
        itemType={selectedGraphic?.type}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default MapComponent;
