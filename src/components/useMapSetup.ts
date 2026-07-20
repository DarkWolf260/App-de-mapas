import { useEffect, useRef, useState, useCallback } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel";
import TileLayer from "@arcgis/core/layers/TileLayer";
import Basemap from "@arcgis/core/Basemap";
import Zoom from "@arcgis/core/widgets/Zoom";
import Compass from "@arcgis/core/widgets/Compass";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { execute as centroidExecute } from "@arcgis/core/geometry/operators/centroidOperator";
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import { Color, PALETTE, hexToRgb } from "./ColorPicker";
import { ToolId } from "./DrawingToolbar";
import { geoToJSON, buildParentsMap } from "../utils/spatialUtils";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId } from "../App";

const DEFAULT_CENTER: [number, number] = [-66.9303, 10.6011];
const DEFAULT_ZOOM = 14;

const getBasemapValue = (key: string): string | Basemap => {
  if (key === "satellite-free") {
    const bm = new Basemap({
      baseLayers: [new TileLayer({ url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" })],
      title: "Satelital Gratis",
      id: "satellite-free",
    });
    bm.load().catch(() => {});
    return bm;
  }
  return key;
};

const typeLabel = (type: string): "Poligono" | "Linea" | "Punto" => {
  if (type === "polygon") return "Poligono";
  if (type === "polyline") return "Linea";
  return "Punto";
};

const makeSymbols = ([r, g, b]: [number, number, number]): any => ({
  point: {
    type: "simple-marker",
    color: [r, g, b, 0.9],
    outline: { color: [255, 255, 255, 0.8], width: 1.5 },
    size: "10px",
  },
  polyline: {
    type: "simple-line",
    color: [r, g, b, 0.95],
    width: 3,
    style: "solid",
  },
  polygon: {
    type: "simple-fill",
    color: [r, g, b, 0.25],
    outline: { color: [r, g, b, 0.95], width: 2 },
  },
});

const getLabelText = (feat: DrawnFeature): string => {
  if (feat.type !== "point") {
    return feat.title;
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
  if (todayLog) {
    const parts: string[] = [];
    
    const g1 = todayLog.groupName?.trim();
    const u1 = todayLog.unitOut?.trim();
    if (g1 && u1) {
      parts.push(`${g1}, ${u1}`);
    } else if (g1) {
      parts.push(g1);
    } else if (u1) {
      parts.push(u1);
    }

    const g2 = todayLog.groupName2?.trim();
    const u2 = todayLog.unitOut2?.trim();
    if (g2 && u2) {
      parts.push(`${g2}, ${u2}`);
    } else if (g2) {
      parts.push(g2);
    } else if (u2) {
      parts.push(u2);
    }

    if (parts.length > 0) {
      return `${feat.title} (${parts.join(" | ")})`;
    }
  }

  return feat.title;
};

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
}: UseMapSetupProps) => {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const sketchLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);

  const layerVisibilityRef = useRef(layerVisibility);
  useEffect(() => {
    layerVisibilityRef.current = layerVisibility;
    deconflictGraphicsRef.current?.();
  }, [layerVisibility]);

  const onFeatureAddedRef = useRef(onFeatureAdded);
  useEffect(() => {
    onFeatureAddedRef.current = onFeatureAdded;
  }, [onFeatureAdded]);

  const onFeatureDeletedRef = useRef(onFeatureDeleted);
  useEffect(() => {
    onFeatureDeletedRef.current = onFeatureDeleted;
  }, [onFeatureDeleted]);

  const hiddenFeaturesRef = useRef(hiddenFeatures);
  const deconflictGraphicsRef = useRef<() => void>(() => { });

  useEffect(() => {
    hiddenFeaturesRef.current = hiddenFeatures;
    deconflictGraphicsRef.current?.();
  }, [hiddenFeatures]);

  const drawnFeaturesRef = useRef(drawnFeatures);
  useEffect(() => {
    drawnFeaturesRef.current = drawnFeatures;
  }, [drawnFeatures]);

  const [mapReady, setMapReady] = useState(false);
  const [customPopup, setCustomPopup] = useState<{ mapPoint: any; feat: DrawnFeature } | null>(null);
  const [showHistoryInPopup, setShowHistoryInPopup] = useState(false);
  const [popupEditDate, setPopupEditDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [popupTick, setPopupTick] = useState(0);

  useEffect(() => {
    setShowHistoryInPopup(false);
    setPopupEditDate(new Date().toLocaleDateString('en-CA'));
  }, [customPopup?.feat?.id]);

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedGraphic, setSelectedGraphic] = useState<Graphic | null>(null);
  const [editMode, setEditMode] = useState<"transform" | "reshape">("transform");
  const [activeColor, setActiveColor] = useState<Color>(PALETTE[0]);
  const activeColorRef = useRef(activeColor);
  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [htmlLabels, setHtmlLabels] = useState<Array<{ id: number | string; title: string; info: string; x: number; y: number; themeColor?: string }>>([]);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({
    text: "",
    x: 0,
    y: 0,
    visible: false,
  });

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
    if (graphic.geometry.type === "point") {
      graphic.symbol = syms.point as any;
    } else if (graphic.geometry.type === "polyline") {
      graphic.symbol = syms.polyline as any;
    } else {
      graphic.symbol = syms.polygon as any;
    }
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
        pointSymbol: initialSyms.point as any,
        polylineSymbol: initialSyms.polyline as any,
        polygonSymbol: initialSyms.polygon as any,
        defaultUpdateOptions: {
          tool: "transform",
          enableRotation: true,
          enableScaling: true,
          toggleToolOnClick: false,
          multipleSelectionEnabled: true,
        },
      });
      sketchVMRef.current = svm;

      const deconflictGraphics = () => {
        if (!sketchLayer || !view) return;
        const points = sketchLayer.graphics.filter((x: any) => x.geometry?.type === "point" && !x.attributes?.isLabel).toArray();
        const labels = sketchLayer.graphics.filter((x: any) => !!x.attributes?.isLabel).toArray();

        points.forEach((g: any) => {
          const pid = g.attributes?.id || (g as any).uid;
          g.visible = !hiddenFeaturesRef.current[pid];
        });

        const { parentsMap } = buildParentsMap(drawnFeaturesRef.current);
        const candidateLabels = labels.filter((lbl: any) => {
          const pid = lbl.attributes?.parentId;
          const isPolygonLabel = lbl.attributes?.isPolygonLabel;
          const parentGraphic = sketchLayer.graphics.find((x: any) => !x.attributes?.isLabel && (String((x as any).uid) === String(pid) || String(x.attributes?.id) === String(pid)));
          if (!parentGraphic || !parentGraphic.visible || !parentGraphic.geometry) return false;

          const isParentHidden = hiddenFeaturesRef.current[pid];
          if (isParentHidden) return false;

          const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(pid));
          const isSubpolygon = isPolygonLabel && feat && parentsMap[feat.id] !== undefined;
          const requiredZoom = (isPolygonLabel && !isSubpolygon) ? 14 : 16;

          if (currentZoom === undefined || currentZoom === null || isNaN(currentZoom) || currentZoom < requiredZoom) return false;

          if (isPolygonLabel) {
            if (!layerVisibilityRef.current.polygonLabels) return false;
          } else {
            if (!layerVisibilityRef.current.pointLabels) return false;
          }

          return true;
        });

        labels.forEach((lbl: any) => {
          if (!candidateLabels.includes(lbl)) {
            lbl.visible = false;
          }
        });

        const screenLabels = candidateLabels.map((lbl: any) => {
          const screenPt = view.toScreen(lbl.geometry);
          const pid = lbl.attributes?.parentId;
          const isPolygonLabel = lbl.attributes?.isPolygonLabel;
          let priority = 2; // Default point label
          if (isPolygonLabel) {
            priority = 3; // Polygon label (lowest priority)
          } else {
            const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(pid));
            if (feat?.type === "point") {
              const todayStr = new Date().toLocaleDateString('en-CA');
              const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
              const hasPersonnel = todayLog && (todayLog.groupName?.trim() || todayLog.unitOut?.trim());
              if (hasPersonnel) {
                priority = 1; // Point label with active personnel (highest priority)
              }
            }
          }
          return {
            graphic: lbl,
            x: screenPt ? screenPt.x : null,
            y: screenPt ? screenPt.y : null,
            visible: screenPt !== null,
            priority
          };
        });

        // Sort screenLabels by priority: highest priority (1) first
        screenLabels.sort((a, b) => a.priority - b.priority);

        const minLabelDistance = 55;
        for (let i = 0; i < screenLabels.length; i++) {
          const l1 = screenLabels[i];
          if (!l1.visible || l1.x === null || l1.y === null) continue;
          for (let j = i + 1; j < screenLabels.length; j++) {
            const l2 = screenLabels[j];
            if (!l2.visible || l2.x === null || l2.y === null) continue;
            const dx = l1.x - l2.x;
            const dy = l1.y - l2.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minLabelDistance) {
              l2.visible = false;
              l2.graphic.visible = false;
            }
          }
        }

        const activeHtmlLabels: Array<{ id: number | string; title: string; info: string; x: number; y: number; themeColor?: string }> = [];

        screenLabels.forEach((item) => {
          const lbl = item.graphic;
          const pid = lbl.attributes?.parentId;
          const isPolygonLabel = lbl.attributes?.isPolygonLabel;

          const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(pid));
          let title = feat ? feat.title : (lbl.symbol as any)?.text || "";
          let info = "";

          if (feat && feat.type === "point") {
            const todayStr = new Date().toLocaleDateString('en-CA');
            const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
            if (todayLog) {
              const parts: string[] = [];
              const g1 = todayLog.groupName?.trim();
              const u1 = todayLog.unitOut?.trim();
              if (g1 && u1) parts.push(`${g1}, ${u1}`);
              else if (g1) parts.push(g1);
              else if (u1) parts.push(u1);

              const g2 = todayLog.groupName2?.trim();
              const u2 = todayLog.unitOut2?.trim();
              if (g2 && u2) parts.push(`${g2}, ${u2}`);
              else if (g2) parts.push(g2);
              else if (u2) parts.push(u2);

              if (parts.length > 0) {
                info = parts.join(" | ");
              }
            }
          }

          const hasPersonnel = info !== "";

          if (item.visible && !isPolygonLabel && hasPersonnel) {
            activeHtmlLabels.push({
              id: pid,
              title,
              info,
              x: item.x!,
              y: item.y!,
              themeColor: feat?.color
            });
            lbl.visible = false;
          } else {
            lbl.visible = item.visible;
            if (lbl.symbol) {
              lbl.symbol = lbl.symbol.clone();
            }
          }
        });

        setHtmlLabels(activeHtmlLabels);
      };
      deconflictGraphicsRef.current = deconflictGraphics;
      deconflictGraphics();

      reactiveUtils.watch(
        () => view.extent,
        () => {
          deconflictGraphics();
          setPopupTick((t) => t + 1);
        }
      );
      reactiveUtils.watch(
        () => view.zoom,
        (z) => {
          if (typeof z === "number") {
            setCurrentZoom(z);
          }
        }
      );
      reactiveUtils.watch(
        () => view.stationary,
        (isStationary) => {
          if (isStationary) {
            deconflictGraphics();
            setPopupTick((t) => t + 1);
          }
        }
      );

      svm.on("create", (evt: any) => {
        if (evt.state === "complete") {
          const g = evt.graphic;
          const count = sketchLayer.graphics.filter((x: any) => !x.attributes?.isLabel && x.geometry?.type === g.geometry?.type).length + 1;
          const title = typeLabel(g.geometry.type) + " " + count;
          g.attributes = { title };
          g.popupTemplate = {
            title: "<b>{title}</b>",
            content: "<div style=\"font:13px sans-serif;color:#0f172a;padding:4px\">Elemento de dibujo personalizado.</div>",
          } as any;

          if (g.geometry.type === "point" || g.geometry.type === "polygon") {
            const labelSym = new TextSymbol({
              text: title,
              color: "white",
              haloColor: "black",
              haloSize: "1px",
              font: { size: 11, family: "sans-serif", weight: "bold" },
              yoffset: g.geometry.type === "point" ? 12 : 0,
            });
            const isPolyLabel = g.geometry!.type === "polygon";
            const currentZoom = view.zoom;
            const requiredZoom = isPolyLabel ? 14 : 16;
            const isZoomOk = currentZoom !== undefined && !isNaN(currentZoom) && currentZoom >= requiredZoom;
            const labelG = new Graphic({
              geometry: isPolyLabel ? centroidExecute(g.geometry!) : g.geometry!.clone(),
              symbol: labelSym,
              visible: isZoomOk && (isPolyLabel ? layerVisibility.polygonLabels : layerVisibility.pointLabels),
              attributes: { isLabel: true, parentId: g.uid, isPolygonLabel: isPolyLabel },
            });
            sketchLayer.add(labelG);
          }

          setActiveTool(null);
          if (onFeatureAddedRef.current) {
            onFeatureAddedRef.current({
              id: (g as any).uid,
              title,
              type: g.geometry.type as any,
              color: activeColorRef.current.hex,
              geojsonGeometry: geoToJSON(g.geometry),
            });
          }
          setTimeout(deconflictGraphics, 50);
        }
        if (evt.state === "cancel") setActiveTool(null);
      });

      svm.on("update", (evt: any) => {
        evt.graphics?.forEach((g: any) => {
          const label = sketchLayer.graphics.find((x: any) => x.attributes?.isLabel && (x.attributes?.parentId === g.uid || x.attributes?.parentId === g.attributes?.id));
          if (label) {
            if (g.geometry?.type === "polygon") {
              label.geometry = centroidExecute(g.geometry!);
            } else {
              label.geometry = g.geometry!.clone();
            }
          }
        });

        if (evt.state === "complete") {
          setSelectedGraphic(null);
          evt.graphics?.forEach((g: any) => {
            if (onFeatureAddedRef.current && g.geometry) {
              const featId = g.attributes?.id || (g as any).uid;
              const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
              onFeatureAddedRef.current({
                id: featId,
                title: g.attributes?.title || "Elemento",
                type: g.geometry.type as any,
                color: feat?.color || activeColorRef.current.hex,
                geojsonGeometry: geoToJSON(g.geometry),
                _isUpdate: true,
              });
            }
          });
          deconflictGraphics();
        }
        if (evt.state === "start") {
          setSelectedGraphic(evt.graphics?.[0] || null);
        }
      });

      svm.on("delete", (evt: any) => {
        setSelectedGraphic(null);
        evt.graphics?.forEach((g: any) => {
          const label = sketchLayer.graphics.find((x: any) => x.attributes?.isLabel && (x.attributes?.parentId === (g as any).uid || x.attributes?.parentId === g.attributes?.id));
          if (label) sketchLayer.remove(label);
          if (onFeatureDeletedRef.current) onFeatureDeletedRef.current(g.attributes?.id || (g as any).uid);
        });
        deconflictGraphics();
      });

      view.on("click", async (evt: any) => {
        if (sketchVMRef.current?.activeTool) return;
        const hit = await view.hitTest(evt);
        const result = hit.results.find((r: any) => r.graphic?.layer === sketchLayerRef.current && !r.graphic?.attributes?.isLabel) as any;

        if (result) {
          const g = result.graphic;
          const featId = g.attributes?.id || (g as any).uid;
          const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));

          if (feat) {
            const mapPoint = view.toMap(evt);
            setCustomPopup({ mapPoint, feat });
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
            (r: any) => r.graphic?.layer === sketchLayerRef.current && !r.graphic?.attributes?.isLabel
          ) as any;
          if (result) {
            const g = result.graphic;
            const featId = g.attributes?.id || (g as any).uid;
            const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
            const tooltipText = feat ? getLabelText(feat) : (g.attributes?.title || "Elemento");
            setTooltip({
              text: tooltipText,
              x: evt.x,
              y: evt.y,
              visible: true,
            });
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
  }, []);

  // ── 2. Sync basemap ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (viewRef.current?.map) {
      const currentBasemap = viewRef.current.map.basemap;
      if (currentBasemap && currentBasemap.id === activeBasemap) {
        return;
      }
      viewRef.current.map.basemap = getBasemapValue(activeBasemap);
    }
  }, [activeBasemap]);

  // ── 3. Sync layer visibility ─────────────────────────────────────────────────
  useEffect(() => {
    if (sketchLayerRef.current) {
      sketchLayerRef.current.visible = true;
    }
    if (!layerVisibility.sketch) {
      setActiveTool(null);
      setSelectedGraphic(null);
      if (sketchVMRef.current?.state === "active") sketchVMRef.current.cancel();
    }
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
      const label = layer.graphics.find((x: any) => x.attributes?.isLabel && (x.attributes?.parentId === (selectedGraphic as any).uid || x.attributes?.parentId === selectedGraphic.attributes?.id));
      if (label) layer.remove(label);
    }
    if (onFeatureDeletedRef.current) {
      onFeatureDeletedRef.current(featId);
    }
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
        onFeatureAddedRef.current({
          ...feat,
          color: color.hex,
          _isUpdate: true
        });
      }
      const svm = sketchVMRef.current;
      if (svm && svm.state === "active") {
        svm.update([selectedGraphic], { tool: editMode });
      }
    }
  };

  // ── 5. External events ───────────────────────────────────────────────────────
  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (zoomToFeature && viewRef.current && layer) {
      const g = layer.graphics.find((x: any) => (x as any).uid === zoomToFeature.id || x.attributes?.id === zoomToFeature.id);
      if (g && g.geometry) viewRef.current.goTo(g.geometry as any);
    }
  }, [zoomToFeature]);

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (removeFeatureId && layer) {
      const g = layer.graphics.find((x: any) => (x as any).uid === removeFeatureId.id || x.attributes?.id === removeFeatureId.id);
      if (g) layer.remove(g);
      const label = layer.graphics.find((x: any) => x.attributes?.isLabel && x.attributes?.parentId === removeFeatureId.id);
      if (label) layer.remove(label);
    }
  }, [removeFeatureId]);

  // ── Sync drawnFeatures to map graphics ─────────────────────────────────────────
  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (!layer) return;

    // Fast O(1) containment calculations
    const { parentsMap, polygonAreas } = buildParentsMap(drawnFeatures);

    drawnFeatures?.forEach((feat) => {
      const g = layer.graphics.find((x: any) => (x as any).uid === feat.id || x.attributes?.id === feat.id);
      const isHidden = !!hiddenFeatures[feat.id];
      const isNestedArea = feat.type === "polygon" && parentsMap[feat.id] !== undefined;
      const shouldHideNested = isNestedArea && layerVisibility.hideNestedAreas;
      const featColor = feat.color || "#3b82f6";
      const syms = makeSymbols(hexToRgb(featColor));
      const symbolFor = (type: string) => {
        if (type === "point") return syms.point;
        if (type === "polyline") return syms.polyline;
        return syms.polygon;
      };

      if (g) {
        g.visible = !isHidden && !shouldHideNested;
        const storedColor = g.attributes?._color;
        if (storedColor !== featColor) {
          g.symbol = symbolFor(feat.type) as any;
          g.attributes = { ...g.attributes, _color: featColor };
        }

        const label = layer.graphics.find((x: any) => x.attributes?.isLabel && String(x.attributes?.parentId) === String(feat.id));
        if (label) {
          const isPolygonLabel = label.attributes?.isPolygonLabel;
          const isSubpolygon = isPolygonLabel && parentsMap[feat.id] !== undefined;
          const requiredZoom = (isPolygonLabel && !isSubpolygon) ? 14 : 16;
          const isZoomOk = currentZoom !== undefined && !isNaN(currentZoom) && currentZoom >= requiredZoom;
          if (isPolygonLabel) {
            label.visible = !isHidden && !shouldHideNested && layerVisibility.polygonLabels && isZoomOk;
          } else {
            label.visible = !isHidden && layerVisibility.pointLabels && isZoomOk;
          }

          if (feat.type === "polygon" && g.geometry) {
            label.geometry = centroidExecute(g.geometry!);
          }

          if (g.attributes && g.attributes.title !== feat.title) {
            g.attributes = { ...g.attributes, title: feat.title };
          }
          if (label.symbol) {
            const ts = label.symbol as TextSymbol;
            const targetText = getLabelText(feat);
            const isPolygonLabel = label.attributes?.isPolygonLabel;
            const hasPersonnel = !isPolygonLabel && targetText !== feat.title;
            const showBox = hasPersonnel;
            const currentHasBox = ts.backgroundColor !== null && ts.backgroundColor !== undefined;
            if (ts.text !== targetText || currentHasBox !== showBox) {
              ts.text = targetText;
              ts.backgroundColor = showBox ? [15, 23, 42, 0.95] as any : null as any;
              ts.borderLineColor = showBox ? [56, 189, 248, 0.95] as any : null as any;
              ts.borderLineSize = showBox ? 1 : null as any;
              ts.haloColor = showBox ? null as any : "black";
              ts.haloSize = showBox ? null as any : "1.5px";
              ts.yoffset = feat.geojsonGeometry?.type === "Point" ? (showBox ? 18 : 12) : 0;
              label.symbol = ts.clone();
            }
          }
        }
      } else {
        let geomCfg: any = null;
        if (feat.geojsonGeometry) {
          if (feat.geojsonGeometry.type === "Point") {
            geomCfg = { type: "point", longitude: (feat.geojsonGeometry.coordinates as number[])[0], latitude: (feat.geojsonGeometry.coordinates as number[])[1], spatialReference: { wkid: 4326 } };
          } else if (feat.geojsonGeometry.type === "LineString") {
            geomCfg = { type: "polyline", paths: [feat.geojsonGeometry.coordinates], spatialReference: { wkid: 4326 } };
          } else if (feat.geojsonGeometry.type === "Polygon") {
            geomCfg = { type: "polygon", rings: feat.geojsonGeometry.coordinates, spatialReference: { wkid: 4326 } };
          }
        }

        if (geomCfg) {
          const isNestedArea = feat.type === "polygon" && parentsMap[feat.id] !== undefined;
          const shouldHideNested = isNestedArea && layerVisibility.hideNestedAreas;
          const ng = new Graphic({
            geometry: geomCfg,
            attributes: { id: feat.id, title: feat.title, _color: featColor },
            symbol: symbolFor(feat.type) as any,
            visible: !isHidden && !shouldHideNested,
            popupTemplate: { title: "<b>{title}</b>", content: "<div style=\"font:13px sans-serif;color:#0f172a;padding:4px\">Elemento guardado.</div>" } as any
          });
          layer.add(ng);

          if (feat.geojsonGeometry && (feat.geojsonGeometry.type === "Point" || feat.geojsonGeometry.type === "Polygon")) {
            const isPolyLabel = feat.geojsonGeometry.type === "Polygon";
            const labelGeom = feat.geojsonGeometry.type === "Point"
              ? ng.geometry!.clone()
              : centroidExecute(ng.geometry!);

            const hasPersonnel = !isPolyLabel && getLabelText(feat) !== feat.title;
            const showBox = hasPersonnel;
            const labelSym = new TextSymbol({
              text: getLabelText(feat),
              color: "white",
              backgroundColor: showBox ? [15, 23, 42, 0.95] as any : null as any,
              borderLineColor: showBox ? [56, 189, 248, 0.95] as any : null as any,
              borderLineSize: showBox ? 1 : null as any,
              haloColor: showBox ? null as any : "black",
              haloSize: showBox ? null as any : "1.5px",
              font: { size: 10, family: "sans-serif", weight: "bold" },
              yoffset: feat.geojsonGeometry.type === "Point" ? (showBox ? 18 : 12) : 0
            });

            const isSubpolygon = isPolyLabel && parentsMap[feat.id] !== undefined;
            const requiredZoom = (isPolyLabel && !isSubpolygon) ? 14 : 16;
            const isZoomOk = currentZoom !== undefined && !isNaN(currentZoom) && currentZoom >= requiredZoom;
            const labelG = new Graphic({
              geometry: labelGeom,
              symbol: labelSym,
              visible: !isHidden && !shouldHideNested && (isPolyLabel 
                ? (layerVisibility.polygonLabels && isZoomOk) 
                : (layerVisibility.pointLabels && isZoomOk)),
              attributes: { isLabel: true, parentId: feat.id, isPolygonLabel: isPolyLabel }
            });
            layer.add(labelG);
          }
        }
      }
    });

    if (drawnFeatures) {
      const polysList = drawnFeatures.filter((f) => f.type === "polygon");
      const lines = drawnFeatures.filter((f) => f.type === "polyline");
      const pts = drawnFeatures.filter((f) => f.type === "point");

      const polysWithArea = polysList.map((feat) => ({
        feat,
        area: polygonAreas[feat.id] ?? 0
      }));
      polysWithArea.sort((a, b) => b.area - a.area);
      const sortedPolys = polysWithArea.map((p) => p.feat);

      const drawingOrdered = [...sortedPolys, ...lines, ...pts];

      drawingOrdered.forEach((feat, index) => {
        const g = layer.graphics.find((x: any) => (x as any).uid === feat.id || x.attributes?.id === feat.id);
        if (g) {
          layer.graphics.reorder(g, index);
        }
      });
      drawingOrdered.forEach((feat, index) => {
        const label = layer.graphics.find((x: any) => x.attributes?.isLabel && String(x.attributes?.parentId) === String(feat.id));
        if (label) {
          layer.graphics.reorder(label, drawingOrdered.length + index);
        }
      });
    }
    deconflictGraphicsRef.current?.();
  }, [drawnFeatures, activeColor, hiddenFeatures, layerVisibility.polygonLabels, layerVisibility.pointLabels, layerVisibility.hideNestedAreas, mapReady, currentZoom]);

  useEffect(() => {
    const layer = sketchLayerRef.current;
    if (!importedFeatures?.length || !layer) return;
    const syms = makeSymbols(hexToRgb(PALETTE[0].hex));
    const symbolFor = (type: string) => {
      if (type === "Point") return syms.point;
      if (type === "LineString") return syms.polyline;
      return syms.polygon;
    };
    importedFeatures.forEach((feat) => {
      if (layer.graphics.some((g: any) => (g as any).uid === feat.id || g.attributes?.id === feat.id)) return;
      let geomCfg: any = null;
      if (feat.geojsonGeometry) {
        if (feat.geojsonGeometry.type === "Point") geomCfg = { type: "point", longitude: (feat.geojsonGeometry.coordinates as number[])[0], latitude: (feat.geojsonGeometry.coordinates as number[])[1], spatialReference: { wkid: 4326 } };
        else if (feat.geojsonGeometry.type === "LineString") geomCfg = { type: "polyline", paths: [feat.geojsonGeometry.coordinates], spatialReference: { wkid: 4326 } };
        else if (feat.geojsonGeometry.type === "Polygon") geomCfg = { type: "polygon", rings: feat.geojsonGeometry.coordinates, spatialReference: { wkid: 4326 } };
      }
      if (geomCfg) {
        const ng = new Graphic({ geometry: geomCfg, attributes: { id: feat.id, title: feat.title || ("Importado " + feat.type), _color: PALETTE[0].hex }, symbol: symbolFor(feat.geojsonGeometry.type) as any, popupTemplate: { title: "<b>{title}</b>", content: "<div style=\"font:13px sans-serif;color:#0f172a;padding:4px\">Importado via GeoJSON.</div>" } as any });
        layer.add(ng);

        if (feat.geojsonGeometry.type === "Point") {
          const currentZoom = viewRef.current?.zoom;
          const isZoomOk = currentZoom !== undefined && !isNaN(currentZoom) && currentZoom >= 16;
          const labelSym = new TextSymbol({
            text: feat.title || "Importado Punto",
            color: "white",
            haloColor: "black",
            haloSize: "1px",
            font: { size: 11, family: "sans-serif", weight: "bold" },
            yoffset: 12,
          });
          const labelG = new Graphic({
            geometry: ng.geometry!.clone(),
            symbol: labelSym,
            visible: isZoomOk && layerVisibility.pointLabels,
            attributes: { isLabel: true, parentId: feat.id, isPolygonLabel: false },
          });
          layer.add(labelG);
        }
      }
    });
    deconflictGraphicsRef.current?.();
  }, [importedFeatures, mapReady]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.goTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }, { duration: 1500, easing: "ease-in-out" });
    }
  }, [activeCity]);

  let popupScreenPos = null;
  if (customPopup && viewRef.current) {
    const screenPt = viewRef.current.toScreen(customPopup.mapPoint);
    if (screenPt) {
      popupScreenPos = { x: screenPt.x, y: screenPt.y };
    }
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
    showHistoryInPopup,
    popupEditDate,
    sketchLayer: sketchLayerRef.current,
    currentZoom,
    htmlLabels,
    setCustomPopup,
    setShowHistoryInPopup,
    setPopupEditDate,
    handleSelectTool,
    handleCancel,
    handleDeleteSelected,
    handleToggleEditMode,
    handleColorChange,
  };
};
