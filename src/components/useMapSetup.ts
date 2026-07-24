import Point from "@arcgis/core/geometry/Point";
import { useEffect, useRef, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import Zoom from "@arcgis/core/widgets/Zoom";
import Compass from "@arcgis/core/widgets/Compass";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { execute as centroidExecute } from "@arcgis/core/geometry/operators/centroidOperator";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import type { Color } from "../utils/colorUtils";
import { PALETTE, hexToRgb } from "../utils/colorUtils";
import { ToolId } from "./DrawingToolbar";
import { geoToJSON } from "../utils/spatialUtils";
import { DEFAULT_CENTER, DEFAULT_ZOOM, getBasemapValue, typeLabel, makeSymbols, getLabelText } from "../utils/mapUtils";
import { deconflictGraphics } from "../utils/labelDeconfliction";
import { syncDrawnFeaturesToGraphics, syncImportedFeatures } from "../utils/graphicsSync";
import type { DrawnFeature, HtmlLabel, LayerVisibility, RemoveFeatureId, DepartmentView } from "../types";

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
  hiddenFeatures: Record<number, boolean>;
  selectedDate: string;
  zoomToCoords?: { lat: number; lon: number } | null;
  activeDepartment?: DepartmentView;
}

export const useMapSetup = ({
  activeBasemap,
  activeCity,
  layerVisibility,
  drawnFeatures,
  onFeatureAdded,
  onFeatureDeleted,
  zoomToFeature,
  removeFeatureId,
  importedFeatures,
  hiddenFeatures,
  selectedDate,
  zoomToCoords,
  activeDepartment = "pc",
}: UseMapSetupProps) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const sketchLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);

  const layerVisibilityRef = useRef(layerVisibility);
  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
    deconflictGraphicsRef.current?.();

    // Toggling basemap reference layers / street labels
    const view = viewRef.current;
    if (view && view.map && view.map.basemap) {
      const showLabels = layerVisibility.basemapLabels !== false;
      const basemap = view.map.basemap;

      if (basemap.referenceLayers) {
        basemap.referenceLayers.forEach((layer) => {
          layer.visible = showLabels;
        });
      }
      if (basemap.baseLayers) {
        basemap.baseLayers.forEach((layer: any) => {
          if (layer.title && (layer.title.toLowerCase().includes("label") || layer.title.toLowerCase().includes("reference"))) {
            layer.visible = showLabels;
          }
        });
      }
    }
  }, [layerVisibility, activeBasemap]);

  const onFeatureAddedRef = useRef(onFeatureAdded);
  useEffect(() => { onFeatureAddedRef.current = onFeatureAdded; }, [onFeatureAdded]);

  const onFeatureDeletedRef = useRef(onFeatureDeleted);
  useEffect(() => { onFeatureDeletedRef.current = onFeatureDeleted; }, [onFeatureDeleted]);

  const hiddenFeaturesRef = useRef(hiddenFeatures);
  const deconflictGraphicsRef = useRef<() => void>(() => {});

  useEffect(() => {
    hiddenFeaturesRef.current = hiddenFeatures;
    deconflictGraphicsRef.current?.();
  }, [hiddenFeatures]);

  const drawnFeaturesRef = useRef(drawnFeatures);
  useEffect(() => { drawnFeaturesRef.current = drawnFeatures; }, [drawnFeatures]);

  const selectedDateRef = useRef(selectedDate);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  const activeDepartmentRef = useRef(activeDepartment);
  useEffect(() => { activeDepartmentRef.current = activeDepartment; }, [activeDepartment]);

  const [mapReady, setMapReady] = useState(false);
  const [customPopup, setCustomPopup] = useState<{ mapPoint: Point; feat: DrawnFeature } | null>(null);
  const [_showHistoryInPopup, setShowHistoryInPopup] = useState(false);
  const [popupEditDate, setPopupEditDate] = useState(selectedDate);
  const [popupTick, setPopupTick] = useState(0);

  useEffect(() => {
    setPopupEditDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setShowHistoryInPopup(false);
    setPopupEditDate(selectedDateRef.current || selectedDate);
  }, [customPopup?.feat?.id]);

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedGraphic, setSelectedGraphic] = useState<Graphic | null>(null);
  const [editMode, setEditMode] = useState<"transform" | "reshape">("transform");
  const [activeColor, setActiveColor] = useState<Color>(PALETTE[0]);
  const activeColorRef = useRef(activeColor);
  useEffect(() => { activeColorRef.current = activeColor; }, [activeColor]);

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [currentScale, setCurrentScale] = useState<number>(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 10.6000, lng: -66.9331 });
  const [htmlLabels, setHtmlLabels] = useState<HtmlLabel[]>([]);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({
    text: "", x: 0, y: 0, visible: false,
  });
  const [swipeActive, setSwipeActive] = useState(false);

  const callDeconflict = useCallback(() => {
    const sketchLayer = sketchLayerRef.current;
    const view = viewRef.current;
    if (sketchLayer && view) {
      deconflictGraphics(sketchLayer, view, { drawnFeaturesRef, hiddenFeaturesRef, layerVisibilityRef, selectedDateRef, activeDepartmentRef }, setHtmlLabels);
    }
  }, []);

  useEffect(() => { deconflictGraphicsRef.current = callDeconflict; }, [callDeconflict]);

  const applyColorToVM = useCallback((color: Color) => {
    const svm = sketchVMRef.current;
    if (!svm) return;
    const syms = makeSymbols(hexToRgb(color.hex));
    svm.pointSymbol = syms.point;
    svm.polylineSymbol = syms.polyline;
    svm.polygonSymbol = syms.polygon;
  }, []);

  const applyColorToGraphic = useCallback((graphic: Graphic, color: Color) => {
    if (!graphic?.geometry) return;
    const syms = makeSymbols(hexToRgb(color.hex));
    if (graphic.geometry.type === "point") graphic.symbol = syms.point;
    else if (graphic.geometry.type === "polyline") graphic.symbol = syms.polyline;
    else graphic.symbol = syms.polygon;
  }, []);

  // ── 1. Map Init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDiv.current) return;
    mapDiv.current.innerHTML = "";

    const map = new Map({ basemap: getBasemapValue(activeBasemap || "satellite-free") });
    const view = new MapView({
      container: mapDiv.current,
      map,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      popupEnabled: false,
      ui: { components: [] },
    });
    viewRef.current = view;

    const sketchLayer = new GraphicsLayer({ title: "Dibujos y Trazados" });
    map.add(sketchLayer);
    sketchLayerRef.current = sketchLayer;

    view.when(() => {
      const zoomWidget = new Zoom({ view });
      const compassWidget = new Compass({ view });
      view.ui.add([zoomWidget, compassWidget], "top-right");

      const initialSyms = makeSymbols(hexToRgb(PALETTE[0].hex));
      const svm = new SketchViewModel({
        view,
        layer: sketchLayer,
        updateOnGraphicClick: false,
        pointSymbol: initialSyms.point,
        polylineSymbol: initialSyms.polyline,
        polygonSymbol: initialSyms.polygon,
        defaultUpdateOptions: {
          tool: "transform",
          enableRotation: true,
          enableScaling: true,
          toggleToolOnClick: false,
          multipleSelectionEnabled: true,
        },
      });
      sketchVMRef.current = svm;

      const runDeconflict = () => {
        deconflictGraphics(sketchLayer, view, { drawnFeaturesRef, hiddenFeaturesRef, layerVisibilityRef, selectedDateRef, activeDepartmentRef }, setHtmlLabels);
      };
      deconflictGraphicsRef.current = runDeconflict;
      runDeconflict();

      reactiveUtils.watch(() => view.extent, () => { runDeconflict(); setPopupTick((t) => t + 1); });
      reactiveUtils.watch(() => view.zoom, (z) => { if (typeof z === "number") setCurrentZoom(z); });
      reactiveUtils.watch(() => view.scale, (s) => { if (typeof s === "number") setCurrentScale(Math.round(s)); });
      reactiveUtils.watch(() => view.stationary, (isStationary) => { if (isStationary) { runDeconflict(); setPopupTick((t) => t + 1); } });

      view.on("pointer-move", (evt: any) => {
        const point = view.toMap({ x: evt.x, y: evt.y });
        if (point) {
          setCoords({
            lat: point.latitude ?? 0,
            lng: point.longitude ?? 0
          });
        }
      });

      svm.on("create", (evt: any) => {
        if (evt.state === "complete") {
          const g = evt.graphic;
          const count = sketchLayer.graphics.filter((x) => !x.attributes?.isLabel && x.geometry?.type === g.geometry?.type).length + 1;
          const title = typeLabel(g.geometry.type) + " " + count;
          g.attributes = { title };

          if (g.geometry.type === "point" || g.geometry.type === "polygon") {
            const isPolyLabel = g.geometry.type === "polygon";
            const labelSym = new TextSymbol({
              text: title,
              color: "white",
              haloColor: "black",
              haloSize: "1px",
              font: { size: 11, family: "sans-serif", weight: "bold" },
              yoffset: g.geometry.type === "point" ? 12 : 0,
            });
            const currentZ = view.zoom;
            const requiredZoom = isPolyLabel ? 14 : 16;
            const isZoomOk = currentZ !== undefined && !isNaN(currentZ) && currentZ >= requiredZoom;
            sketchLayer.add(new Graphic({
              geometry: isPolyLabel ? centroidExecute(g.geometry!) : g.geometry!.clone(),
              symbol: labelSym,
              visible: isZoomOk && (isPolyLabel ? layerVisibility.polygonLabels : layerVisibility.pointLabels),
              attributes: { isLabel: true, parentId: (g as any).uid, isPolygonLabel: isPolyLabel },
            }));
          }

          setActiveTool(null);
          if (onFeatureAddedRef.current) {
            onFeatureAddedRef.current({
              id: (g as any).uid,
              title,
              type: g.geometry.type as DrawnFeature["type"],
              color: activeColorRef.current.hex,
              geojsonGeometry: geoToJSON(g.geometry),
            });
          }
          setTimeout(runDeconflict, 50);
        }
        if (evt.state === "cancel") setActiveTool(null);
      });

      svm.on("update", (evt: any) => {
        evt.graphics?.forEach((g: any) => {
          const label = sketchLayer.graphics.find((x) => x.attributes?.isLabel && (x.attributes?.parentId === g.uid || x.attributes?.parentId === g.attributes?.id));
          if (label) {
            label.geometry = g.geometry?.type === "polygon" ? centroidExecute(g.geometry!) : g.geometry!.clone();
          }
        });
        if (evt.state === "complete") {
          setSelectedGraphic(null);
          evt.graphics?.forEach((g: any) => {
            if (onFeatureAddedRef.current && g.geometry) {
              const featId = g.attributes?.id || g.uid;
              const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
              onFeatureAddedRef.current({
                id: featId,
                title: g.attributes?.title || "Elemento",
                type: g.geometry.type as DrawnFeature["type"],
                color: feat?.color || activeColorRef.current.hex,
                geojsonGeometry: geoToJSON(g.geometry),
                _isUpdate: true,
              });
            }
          });
          runDeconflict();
        }
        if (evt.state === "start") setSelectedGraphic(evt.graphics?.[0] || null);
      });

      svm.on("delete", (evt: any) => {
        setSelectedGraphic(null);
        evt.graphics?.forEach((g: any) => {
          const label = sketchLayer.graphics.find((x) => x.attributes?.isLabel && (x.attributes?.parentId === g.uid || x.attributes?.parentId === g.attributes?.id));
          if (label) sketchLayer.remove(label);
          if (onFeatureDeletedRef.current) onFeatureDeletedRef.current(g.attributes?.id || g.uid);
        });
        runDeconflict();
      });

      view.on("click", async (evt: any) => {
        if (sketchVMRef.current?.activeTool) return;
        const hit = await view.hitTest(evt);
        const result = hit.results.find(
          (r: any) => "graphic" in r && r.graphic?.layer === sketchLayerRef.current && !r.graphic?.attributes?.isLabel
        );

        if (result) {
          const g = (result as any).graphic;
          const featId = g.attributes?.id || (g as any).uid;
          const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
          if (feat) {
            setCustomPopup({ mapPoint: view.toMap(evt), feat });
          } else {
            setCustomPopup(null);
          }
          if (layerVisibilityRef.current.sketch && !feat?.locked) {
            setSelectedGraphic(g);
            setEditMode("transform");
            sketchVMRef.current?.update([g], { tool: "transform" });
          } else if (feat?.locked) {
            if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
            setSelectedGraphic(null);
          }
        } else {
          if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
          setSelectedGraphic(null);
          setCustomPopup(null);
        }
      });

      view.on("pointer-move", (evt: any) => {
        if (sketchVMRef.current?.activeTool || sketchVMRef.current?.state === "active") {
          setTooltip((t) => (t.visible ? { ...t, visible: false } : t));
          return;
        }
        view.hitTest(evt).then((response: any) => {
          const result = response.results.find(
            (r: any) => "graphic" in r && r.graphic?.layer === sketchLayerRef.current && !r.graphic?.attributes?.isLabel
          );
          if (result) {
            const g = (result as any).graphic;
            const featId = g.attributes?.id || (g as any).uid;
            const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
            setTooltip({ text: feat ? getLabelText(feat, selectedDateRef.current) : (g.attributes?.title || "Elemento"), x: evt.x, y: evt.y, visible: true });
            return;
          }
          setTooltip((t) => (t.visible ? { ...t, visible: false } : t));
        });
      });

      setMapReady(true);
    });

    return () => {
      if (sketchVMRef.current) { sketchVMRef.current.destroy(); sketchVMRef.current = null; }
      if (view) view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Map init runs once; basemap is synced in useEffect #2
  }, []);

  // ── 2. Sync basemap ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewRef.current?.map) {
      if (viewRef.current.map.basemap?.id === activeBasemap) return;
      viewRef.current.map.basemap = getBasemapValue(activeBasemap);
    }
  }, [activeBasemap]);

  // ── 3. Sync layer visibility ─────────────────────────────────────────────────
  useEffect(() => {
    if (sketchLayerRef.current) sketchLayerRef.current.visible = true;
    if (!layerVisibility.sketch) {
      setActiveTool(null);
      setSelectedGraphic(null);
      if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
    }
    if (layerVisibility.sketch) setSwipeActive(false);
  }, [layerVisibility.sketch]);

  // ── 4. Toolbar handlers ──────────────────────────────────────────────────────
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
    const layer = sketchLayerRef.current;
    if (layer) {
      layer.remove(selectedGraphic);
      const label = layer.graphics.find((x) => x.attributes?.isLabel && (x.attributes?.parentId === (selectedGraphic as any).uid || x.attributes?.parentId === selectedGraphic.attributes?.id));
      if (label) layer.remove(label);
    }
    if (onFeatureDeletedRef.current) onFeatureDeletedRef.current(featId);
    svm.delete();
    setSelectedGraphic(null);
    setCustomPopup(null);
    deconflictGraphicsRef.current?.();
  };

  const handleToggleEditMode = (mode: "transform" | "reshape") => {
    setEditMode(mode);
    const svm = sketchVMRef.current;
    if (!svm || !selectedGraphic) return;
    svm.update([selectedGraphic], { tool: mode });
  };

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

  // ── 5. External events ───────────────────────────────────────────────────────
  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (zoomToFeature && viewRef.current && layer) {
      const g = layer.graphics.find((x) => (x as any).uid === zoomToFeature.id || x.attributes?.id === zoomToFeature.id);
      if (g?.geometry) viewRef.current.goTo(g.geometry);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Uses ref.current only
  }, [zoomToFeature]);

  useEffect(() => {
    if (zoomToCoords && viewRef.current) {
      viewRef.current.goTo(
        { center: [zoomToCoords.lon, zoomToCoords.lat], zoom: 16 },
        { duration: 800, easing: "ease-in-out" },
      ).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoomToCoords]);

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (removeFeatureId && layer) {
      const g = layer.graphics.find((x) => (x as any).uid === removeFeatureId.id || x.attributes?.id === removeFeatureId.id);
      if (g) layer.remove(g);
      const label = layer.graphics.find((x) => x.attributes?.isLabel && x.attributes?.parentId === removeFeatureId.id);
      if (label) layer.remove(label);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Uses ref.current only
  }, [removeFeatureId]);

  // ── 6. Sync drawnFeatures to map graphics ────────────────────────────────────
  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (!layer) return;
    syncDrawnFeaturesToGraphics(drawnFeatures, hiddenFeatures, layerVisibility, currentZoom, layer, selectedDateRef.current, activeDepartmentRef.current);
    deconflictGraphicsRef.current?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- layerVisibility sub-props are sufficient
  }, [drawnFeatures, activeColor, hiddenFeatures, layerVisibility.polygonLabels, layerVisibility.pointLabels, layerVisibility.hideNestedAreas, mapReady, currentZoom, selectedDate, activeDepartment]);

  // ── 7. Sync imported features ────────────────────────────────────────────────
  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (!importedFeatures?.length || !layer) return;
    syncImportedFeatures(importedFeatures, layerVisibility, viewRef, layer);
    deconflictGraphicsRef.current?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- layerVisibility.pointLabels is sufficient
  }, [importedFeatures, mapReady, layerVisibility.pointLabels]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.goTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }, { duration: 1500, easing: "ease-in-out" });
    }
  }, [activeCity]);

  const activateSwipe = useCallback(() => {
    if (layerVisibilityRef.current.sketch) {
      setActiveTool(null);
      setSelectedGraphic(null);
      if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
    }
    setSwipeActive(true);
  }, []);

  const deactivateSwipe = useCallback(() => {
    setSwipeActive(false);
  }, []);

  let popupScreenPos = null;
  if (customPopup && viewRef.current) {
    const screenPt = viewRef.current.toScreen(customPopup.mapPoint);
    if (screenPt) popupScreenPos = { x: screenPt.x, y: screenPt.y };
  }

  return {
    mapDiv,
    activeTool,
    editMode,
    selectedGraphic,
    activeColor,
    tooltip,
    customPopup,
    popupTick,
    popupScreenPos,
    popupEditDate,
    sketchLayer: sketchLayerRef.current,
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
  };
};
