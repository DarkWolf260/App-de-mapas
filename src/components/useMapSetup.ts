import { useEffect, useState, useCallback, useMemo } from "react";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat } from "ol/proj";
import XYZ from "ol/source/XYZ";
import { DEFAULT_CENTER, DEFAULT_ZOOM, getBasemapUrl, getBasemapMaxZoom } from "../utils/mapUtils";
import { syncDrawnFeaturesToGraphics, syncImportedFeatures } from "../utils/graphicsSync";
import { shouldShowFeatureForLayerMode } from "../utils/activityCatalog";
import { buildParentsMap } from "../utils/spatialUtils";
import { useMapInit } from "./useMapInit";
import { useMapDrawing } from "./map/useMapDrawing";
import { useMapOverlays } from "./map/useMapOverlays";
import { useMapInspecciones } from "./map/useMapInspecciones";
import { useMapSwipe } from "./map/useMapSwipe";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DepartmentView } from "../types";

export interface UseMapSetupProps {
  activeBasemap: string;
  activeCity: string;
  layerVisibility: LayerVisibility;
  drawnFeatures: DrawnFeature[];
  onFeatureAdded: (newFeat: DrawnFeature) => void;
  onFeatureDeleted: (id: number | string) => void;
  zoomToFeature: DrawnFeature | null;
  removeFeatureId: RemoveFeatureId | null;
  importedFeatures: DrawnFeature[];
  hiddenFeatures: Record<string, boolean>;
  selectedDate: string;
  zoomToCoords?: { lat: number; lon: number } | null;
  activeDepartment?: DepartmentView;
  onFeatureClick?: () => void;
  showAccumulated?: boolean;
  showPoints?: boolean;
  showAreas?: boolean;
  sidebarOpen?: boolean;
  bitacoraOpen?: boolean;
  bare?: boolean;
  canEditMap?: boolean;
  isAuthenticated?: boolean;
  isMobile?: boolean;
}

export const useMapSetup = (props: UseMapSetupProps) => {
  const {
    activeBasemap,
    activeCity,
    layerVisibility,
    drawnFeatures,
    onFeatureAdded,
    onFeatureDeleted,
    zoomToFeature,
    importedFeatures,
    hiddenFeatures,
    selectedDate,
    zoomToCoords,
    activeDepartment = "pc",
    onFeatureClick,
    showAccumulated = false,
    bare = false,
    canEditMap = false,
    isAuthenticated = false,
    isMobile = false,
  } = props;

  const [popupEditDate, setPopupEditDate] = useState(selectedDate);
  const [popupTick, setPopupTick] = useState(0);

  // 1. Inicialización base del mapa OpenLayers
  const init = useMapInit(activeBasemap, layerVisibility, {
    onFeatureAdded,
    onFeatureDeleted,
    onFeatureClick,
    onSelectFeature: (g) => {
      drawing.onSelectGraphicForEdit(g);
    },
    onToolComplete: () => {
      drawing.setActiveTool(null);
    },
    getActiveColor: () => drawing.activeColorRef.current,
  });

  // Sincronizar referencias del init
  init.layerVisibilityRef.current = layerVisibility;
  init.drawnFeaturesRef.current = drawnFeatures;
  init.hiddenFeaturesRef.current = hiddenFeatures;
  init.selectedDateRef.current = selectedDate;
  init.activeDepartmentRef.current = activeDepartment;
  init.showAccumulatedRef.current = showAccumulated ?? false;
  init.canEditRef.current = canEditMap === true;
  init.isAuthenticatedRef.current = isAuthenticated === true;

  const {
    mapRef,
    baseLayerRef,
    featuresSourceRef,
    featuresLayerRef,
    inspeccionesSourceRef,
    drawnFeaturesRef,
    onFeatureAddedRef,
    onFeatureDeletedRef,
  } = init;

  // 2. Sub-hook de Dibujo e Interacciones (Draw, Modify, Translate, Snap, Delete)
  const drawing = useMapDrawing({
    mapRef,
    featuresSourceRef,
    canEditMap,
    layerVisibility,
    drawnFeatures,
    drawnFeaturesRef,
    onFeatureAddedRef,
    onFeatureDeletedRef,
    onFeatureClick,
    customPopup: init.customPopup,
    setCustomPopup: init.setCustomPopup,
  });

  // 3. Sub-hook de Overlays HTML nativos (Pines y Tarjetas fluidas)
  useMapOverlays({
    mapRef,
    drawnFeatures,
    hiddenFeatures,
    selectedDate,
    activeDepartment,
    layerVisibility,
    onFeatureClick,
    onSelectGraphicForEdit: drawing.onSelectGraphicForEdit,
    setCustomPopup: init.setCustomPopup,
  });

  // 4. Sub-hook de Inspecciones Kobo
  const inspecciones = useMapInspecciones({
    inspeccionesSourceRef,
    layerVisibility,
    selectedDate,
    showAccumulated,
  });

  // 5. Sub-hook de Swipe Satelital
  const swipe = useMapSwipe({
    mapRef,
    isMobile,
    onBeforeActivate: () => {
      drawing.setActiveTool(null);
      drawing.setSelectedGraphic(null);
    },
  });

  // Sincronización de fecha popup
  useEffect(() => {
    setPopupEditDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setPopupTick((t) => t + 1);
  }, []);

  // Manejo de Basemap
  useEffect(() => {
    if (!baseLayerRef.current) return;
    const url = getBasemapUrl(activeBasemap);
    const maxZoom = getBasemapMaxZoom(activeBasemap);
    baseLayerRef.current.setSource(
      new XYZ({
        url,
        maxZoom,
        interpolate: true,
        crossOrigin: "anonymous",
      })
    );
  }, [activeBasemap, baseLayerRef]);

  // Memoizar mapa de jerarquía espacial (parentsMap) para no recalcularlo en cada cambio de fecha
  const { parentsMap } = useMemo(() => buildParentsMap(drawnFeatures), [drawnFeatures]);

  // Sincronización incremental de features dibujadas e importadas
  useEffect(() => {
    const source = featuresSourceRef.current;
    if (!source) return;

    const visibleFeatures = drawnFeatures.filter((f) => shouldShowFeatureForLayerMode(f, layerVisibility));
    syncDrawnFeaturesToGraphics(visibleFeatures, hiddenFeatures, layerVisibility, 0, source, selectedDate, activeDepartment, bare, parentsMap);
    featuresLayerRef.current?.changed();
  }, [drawnFeatures, parentsMap, hiddenFeatures, layerVisibility, selectedDate, activeDepartment, bare, featuresSourceRef, featuresLayerRef]);

  useEffect(() => {
    const source = featuresSourceRef.current;
    if (!source || !importedFeatures) return;
    const targetImported = (layerVisibility.inspecciones || layerVisibility.formacion || layerVisibility.demolidos)
      ? importedFeatures.filter((f) => f.type === "polygon" || f.geojsonGeometry?.type === "Polygon")
      : importedFeatures;
    syncImportedFeatures(targetImported, layerVisibility, mapRef, source);
  }, [importedFeatures, layerVisibility, mapRef, featuresSourceRef]);

  // Navegación / Zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (zoomToFeature && zoomToFeature.geojsonGeometry) {
      try {
        const format = new GeoJSON();
        const featOrFeats = format.readFeature(
          {
            type: "Feature",
            geometry: zoomToFeature.geojsonGeometry,
            properties: {},
          },
          {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          }
        );
        const singleFeat: any = Array.isArray(featOrFeats) ? featOrFeats[0] : featOrFeats;
        const geom = singleFeat?.getGeometry();
        if (geom) {
          if (geom.getType() === "Point") {
            const coord = (geom as any).getCoordinates();
            map.getView().animate({ center: coord, zoom: 18, duration: 500 });
          } else {
            const extent = geom.getExtent();
            map.getView().fit(extent, { padding: [60, 60, 60, 60], duration: 500, maxZoom: 18 });
          }
        }
      } catch (err) {
        console.warn("[OpenLayers] Error al hacer zoom a feature:", err);
      }
    }
  }, [zoomToFeature, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (zoomToCoords && map) {
      map.getView().animate({
        center: fromLonLat([zoomToCoords.lon, zoomToCoords.lat]),
        zoom: 20,
        duration: 800,
      });
    }
  }, [zoomToCoords, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (map) {
      map.getView().animate({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        duration: 1200,
      });
    }
  }, [activeCity, mapRef]);

  return {
    mapDiv: init.mapDiv,
    activeTool: drawing.activeTool,
    editMode: drawing.editMode,
    selectedGraphic: drawing.selectedGraphic,
    activeColor: drawing.activeColor,
    tooltip: null,
    customPopup: init.customPopup,
    popupTick,
    popupScreenPos: init.popupScreenPos,
    popupEditDate,
    sketchLayer: featuresLayerRef.current,
    sketchVMRef: { current: null },
    onSelectGraphicForEdit: drawing.onSelectGraphicForEdit,
    currentZoom: init.currentZoom,
    currentScale: init.currentScale,
    coords: init.coords,
    htmlLabels: [],
    swipeActive: swipe.swipeActive,
    swipePosition: swipe.swipePosition,
    setSwipePosition: swipe.setSwipePosition,
    viewRef: mapRef,
    mapRef,
    activateSwipe: swipe.activateSwipe,
    deactivateSwipe: swipe.deactivateSwipe,
    setCustomPopup: init.setCustomPopup,
    setPopupEditDate,
    handleSelectTool: drawing.handleSelectTool,
    handleCancel: drawing.handleCancel,
    deleteConfirmOpen: drawing.deleteConfirmOpen,
    handleConfirmDelete: drawing.handleConfirmDelete,
    handleCancelDelete: drawing.handleCancelDelete,
    handleDeleteSelected: drawing.handleDeleteSelected,
    handleToggleEditMode: drawing.handleToggleEditMode,
    handleColorChange: drawing.handleColorChange,
    inspeccionesRecords: inspecciones.inspeccionesRecords,
    selectedColorFilter: inspecciones.selectedColorFilter,
    setSelectedColorFilter: inspecciones.setSelectedColorFilter,
    selectedDateFilter: inspecciones.selectedDateFilter,
    setSelectedDateFilter: inspecciones.setSelectedDateFilter,
  };
};
