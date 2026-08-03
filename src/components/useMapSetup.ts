import { useEffect, useRef, useState, useCallback } from "react";
import Graphic from "@arcgis/core/Graphic";
import type { Color } from "../utils/colorUtils";
import { PALETTE, hexToRgb } from "../utils/colorUtils";
import { ToolId } from "./DrawingToolbar";
import { DEFAULT_CENTER, DEFAULT_ZOOM, getBasemapValue, makeSymbols } from "../utils/mapUtils";
import { syncDrawnFeaturesToGraphics, syncImportedFeatures } from "../utils/graphicsSync";
import { useMapInit } from "./useMapInit";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DepartmentView } from "../types";

export interface UseMapSetupProps {
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
  isAdmin?: boolean;
}

export const useMapSetup = (props: UseMapSetupProps) => {
  const {
    activeBasemap, activeCity, layerVisibility, drawnFeatures,
    onFeatureAdded, onFeatureDeleted, zoomToFeature, removeFeatureId,
    importedFeatures, hiddenFeatures, selectedDate, zoomToCoords,
    activeDepartment = "pc", onFeatureClick,
    showAccumulated, sidebarOpen, bitacoraOpen, bare, isAdmin,
  } = props;

  const [activeColor, setActiveColor] = useState<Color>(PALETTE[0]);
  const activeColorRef = useRef(activeColor);
  useEffect(() => { activeColorRef.current = activeColor; }, [activeColor]);

  const init = useMapInit(activeBasemap, layerVisibility, {
    onFeatureAdded,
    onFeatureDeleted,
    onFeatureClick,
    onGraphicSelected: (g) => {
      setActiveTool(null);
      setSelectedGraphic(g);
      setEditMode("transform");
    },
    getActiveColor: () => activeColorRef.current,
  });

  useEffect(() => { init.layerVisibilityRef.current = layerVisibility; }, [layerVisibility, init]);
  useEffect(() => { init.drawnFeaturesRef.current = drawnFeatures; }, [drawnFeatures, init]);
  useEffect(() => { init.hiddenFeaturesRef.current = hiddenFeatures; }, [hiddenFeatures, init]);
  useEffect(() => { init.selectedDateRef.current = selectedDate; }, [selectedDate, init]);
  useEffect(() => { init.activeDepartmentRef.current = activeDepartment; }, [activeDepartment, init]);
  useEffect(() => { init.showAccumulatedRef.current = showAccumulated ?? false; }, [showAccumulated, init]);
  useEffect(() => { init.canEditRef.current = isAdmin === true; }, [isAdmin, init]);

  const { runDeconflict, deconflictGraphicsRef, viewRef, sketchLayerRef, sketchVMRef } = init;
  const onFeatureAddedRef = init.onFeatureAddedRef;
  const onFeatureDeletedRef = init.onFeatureDeletedRef;
  const { drawnFeaturesRef, hiddenFeaturesRef, layerVisibilityRef, selectedDateRef, activeDepartmentRef, showAccumulatedRef } = init;

  useEffect(() => { deconflictGraphicsRef.current = runDeconflict; }, [runDeconflict, deconflictGraphicsRef]);

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedGraphic, setSelectedGraphic] = useState<Graphic | null>(null);
  const [editMode, setEditMode] = useState<"transform" | "reshape">("transform");
  const [popupEditDate, setPopupEditDate] = useState(selectedDate);
  const [popupTick, setPopupTick] = useState(0);
  const [swipeActive, setSwipeActive] = useState(false);

  useEffect(() => { setPopupEditDate(selectedDate); }, [selectedDate]);
  useEffect(() => { setPopupTick((t) => t + 1); }, []);

  const customPopupRef = useRef(init.customPopup);
  useEffect(() => { customPopupRef.current = init.customPopup; }, [init.customPopup]);

  const sidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => { sidebarOpenRef.current = sidebarOpen; }, [sidebarOpen]);
  const bitacoraOpenRef = useRef(bitacoraOpen);
  useEffect(() => { bitacoraOpenRef.current = bitacoraOpen; }, [bitacoraOpen]);

  const getViewPadding = () => ({
    left: sidebarOpenRef.current ? 380 : 0,
    right: customPopupRef.current ? 440 : (bitacoraOpenRef.current ? 480 : 0),
  });

  const applyColorToVM = useCallback((color: Color) => {
    const svm = sketchVMRef.current;
    if (!svm) return;
    const syms = makeSymbols(hexToRgb(color.hex));
    svm.pointSymbol = syms.point;
    svm.polylineSymbol = syms.polyline;
    svm.polygonSymbol = syms.polygon;
  }, [sketchVMRef]);

  const applyColorToGraphic = useCallback((graphic: Graphic, color: Color) => {
    if (!graphic?.geometry) return;
    const syms = makeSymbols(hexToRgb(color.hex));
    if (graphic.geometry.type === "point") graphic.symbol = syms.point;
    else if (graphic.geometry.type === "polyline") graphic.symbol = syms.polyline;
    else graphic.symbol = syms.polygon;
  }, []);

  useEffect(() => {
    if (sketchVMRef.current && init.mapReady) {
      const syms = makeSymbols(hexToRgb(activeColor.hex));
      sketchVMRef.current.pointSymbol = syms.point;
      sketchVMRef.current.polylineSymbol = syms.polyline;
      sketchVMRef.current.polygonSymbol = syms.polygon;
    }
  }, [init.mapReady, activeColor, sketchVMRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !view.map) return;
    const showLabels = layerVisibility.basemapLabels !== false;
    view.map.basemap?.referenceLayers?.forEach((layer) => { layer.visible = showLabels; });
    view.map.basemap?.baseLayers?.forEach((layer: any) => {
      if (layer.title?.toLowerCase().includes("label") || layer.id?.toLowerCase().includes("label")) layer.visible = showLabels;
    });
  }, [layerVisibility.basemapLabels, init.mapReady, viewRef]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || !view.map) return;
    if (view.map.basemap?.id !== activeBasemap) {
      view.map.basemap = getBasemapValue(activeBasemap);
    }
  }, [activeBasemap, init.mapReady, viewRef]);

  useEffect(() => {
    if (sketchLayerRef.current) sketchLayerRef.current.visible = !layerVisibility.svgOverlay;
    if (!layerVisibility.sketch) {
      setActiveTool(null);
      setSelectedGraphic(null);
      if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
    }
    if (layerVisibility.sketch) setSwipeActive(false);
  }, [layerVisibility.sketch, layerVisibility.svgOverlay, sketchLayerRef, sketchVMRef]);

  const handleSelectTool = (toolId: ToolId) => {
    const svm = sketchVMRef.current;
    if (!svm) return;
    if (activeTool) svm.cancel();
    if (sketchVMRef.current?.state === "active") svm.cancel();
    setSelectedGraphic(null);
    setActiveTool(toolId);
    svm.create(toolId);
  };

  const handleCancel = () => {
    if (sketchVMRef.current) sketchVMRef.current.cancel();
    setActiveTool(null);
  };

  const handleDeleteSelected = () => {
    const svm = sketchVMRef.current;
    if (!svm || !selectedGraphic) return;
    const featId = selectedGraphic.attributes?.id || (selectedGraphic as any).uid;
    if (onFeatureDeletedRef.current) onFeatureDeletedRef.current(featId);
  };

  const handleToggleEditMode = (mode: "transform" | "reshape") => {
    setEditMode(mode);
    const svm = sketchVMRef.current;
    if (!svm || !selectedGraphic) return;
    svm.update([selectedGraphic], { tool: mode });
  };

  const onSelectGraphicForEdit = useCallback((g: Graphic) => {
    // Solo admins con herramientas de dibujo activas pueden editar.
    if (isAdmin !== true || !layerVisibilityRef.current.sketch) return;
    setActiveTool(null);
    setSelectedGraphic(g);
    setEditMode("transform");
    const svm = sketchVMRef.current;
    if (svm && svm.state !== "active") {
      svm.update([g], { tool: "transform" });
    }
  }, [sketchVMRef, isAdmin, layerVisibilityRef]);

  const handleColorChange = (color: Color) => {
    setActiveColor(color);
    applyColorToVM(color);
    if (selectedGraphic) {
      applyColorToGraphic(selectedGraphic, color);
      const featId = selectedGraphic.attributes?.id || (selectedGraphic as any).uid;
      const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
      if (feat && onFeatureAddedRef.current) {
        onFeatureAddedRef.current({ ...feat, color: color.hex, _isUpdate: true });
      }
      const svm = sketchVMRef.current;
      if (svm?.state === "active") svm.update([selectedGraphic], { tool: editMode });
    }
  };

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (zoomToFeature && viewRef.current && layer) {
      const g = layer.graphics.find((x) => (x as any).uid === zoomToFeature.id || x.attributes?.id === zoomToFeature.id);
      if (g?.geometry) {
        const opts: any = { target: g.geometry, ...(zoomToFeature?.type === "point" ? { zoom: 18 } : {}) };
        viewRef.current.goTo(opts, { duration: 400, padding: getViewPadding() } as any);
      }
    }
  }, [zoomToFeature, viewRef, sketchLayerRef]);

  useEffect(() => {
    if (zoomToCoords && viewRef.current) {
      viewRef.current.goTo(
        { center: [zoomToCoords.lon, zoomToCoords.lat], zoom: 16 },
        { duration: 800, easing: "ease-in-out", padding: getViewPadding() } as any,
      ).catch(() => {});
    }
  }, [zoomToCoords, viewRef]);

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (removeFeatureId && layer) {
      const g = layer.graphics.find((x) => (x as any).uid === removeFeatureId.id || x.attributes?.id === removeFeatureId.id);
      if (g) layer.remove(g);
      const label = layer.graphics.find((x) => x.attributes?.isLabel && x.attributes?.parentId === removeFeatureId.id);
      if (label) layer.remove(label);
    }
  }, [removeFeatureId, sketchLayerRef]);

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (!layer) return;
    syncDrawnFeaturesToGraphics(drawnFeatures, hiddenFeatures, layerVisibility, init.currentZoom, layer, selectedDateRef.current, activeDepartmentRef.current, bare);
    deconflictGraphicsRef.current?.();
  }, [drawnFeatures, hiddenFeatures, layerVisibility.polygonLabels, layerVisibility.pointLabels, layerVisibility.hideNestedAreas, init.mapReady, init.currentZoom, selectedDate, activeDepartment, sketchLayerRef, deconflictGraphicsRef, bare]);

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (!importedFeatures?.length || !layer) return;
    syncImportedFeatures(importedFeatures, layerVisibility, viewRef, layer);
    deconflictGraphicsRef.current?.();
  }, [importedFeatures, init.mapReady, layerVisibility.pointLabels, sketchLayerRef, viewRef, deconflictGraphicsRef]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.goTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }, { duration: 1500, easing: "ease-in-out", padding: getViewPadding() } as any);
    }
  }, [activeCity, viewRef]);



  const activateSwipe = useCallback(() => {
    if (layerVisibilityRef.current.sketch) {
      setActiveTool(null);
      setSelectedGraphic(null);
      if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
    }
    setSwipeActive(true);
  }, [sketchVMRef, layerVisibilityRef]);

  const deactivateSwipe = useCallback(() => {
    setSwipeActive(false);
  }, []);

  let popupScreenPos = null;
  if (init.customPopup && viewRef.current) {
    const screenPt = viewRef.current.toScreen(init.customPopup.mapPoint);
    if (screenPt) popupScreenPos = { x: screenPt.x, y: screenPt.y };
  }

  return {
    mapDiv: init.mapDiv,
    activeTool,
    editMode,
    selectedGraphic,
    activeColor,
    tooltip: init.tooltip,
    customPopup: init.customPopup,
    popupTick,
    popupScreenPos,
    popupEditDate,
    sketchLayer: sketchLayerRef.current,
    sketchVMRef,
    onSelectGraphicForEdit,
    currentZoom: init.currentZoom,
    currentScale: init.currentScale,
    coords: init.coords,
    htmlLabels: init.htmlLabels,
    swipeActive,
    viewRef,
    activateSwipe,
    deactivateSwipe,
    setCustomPopup: init.setCustomPopup,
    setPopupEditDate,
    handleSelectTool,
    handleCancel,
    handleDeleteSelected,
    handleToggleEditMode,
    handleColorChange,
  };
};
