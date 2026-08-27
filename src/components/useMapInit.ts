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
import { geoToJSON } from "../utils/spatialUtils";
import { DEFAULT_CENTER, DEFAULT_ZOOM, getBasemapValue, typeLabel, makeSymbols } from "../utils/mapUtils";
import { deconflictGraphics } from "../utils/labelDeconfliction";
import type { DrawnFeature, HtmlLabel, LayerVisibility, DepartmentView } from "../types";

export interface MapInitRefs {
  viewRef: React.MutableRefObject<MapView | null>;
  sketchLayerRef: React.MutableRefObject<GraphicsLayer | null>;
  sketchVMRef: React.MutableRefObject<SketchViewModel | null>;
  drawnFeaturesRef: React.MutableRefObject<DrawnFeature[]>;
  hiddenFeaturesRef: React.MutableRefObject<Record<string, boolean>>;
  layerVisibilityRef: React.MutableRefObject<LayerVisibility>;
  selectedDateRef: React.MutableRefObject<string>;
  activeDepartmentRef: React.MutableRefObject<DepartmentView>;
  showAccumulatedRef: React.MutableRefObject<boolean>;
  /** Solo los administradores pueden entrar en modo edición/transformación. */
  canEditRef: React.MutableRefObject<boolean>;
}

export interface MapInitCallbacks {
  onFeatureAdded: (feat: DrawnFeature) => void;
  onFeatureDeleted: (id: number) => void;
  onFeatureClick?: () => void;
  onGraphicSelected?: (graphic: Graphic) => void;
  getActiveColor: () => Color;
}

export function useMapInit(
  activeBasemap: string,
  layerVisibility: LayerVisibility,
  callbacks: MapInitCallbacks,
) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const viewRef = useRef<MapView | null>(null);
  const sketchLayerRef = useRef<GraphicsLayer | null>(null);
  const inspeccionesLayerRef = useRef<GraphicsLayer | null>(null);
  const sketchVMRef = useRef<SketchViewModel | null>(null);

  const deconflictGraphicsRef = useRef<() => void>(() => { });
  const onFeatureAddedRef = useRef(callbacks.onFeatureAdded);
  const onFeatureDeletedRef = useRef(callbacks.onFeatureDeleted);

  useEffect(() => { onFeatureAddedRef.current = callbacks.onFeatureAdded; }, [callbacks.onFeatureAdded]);
  useEffect(() => { onFeatureDeletedRef.current = callbacks.onFeatureDeleted; }, [callbacks.onFeatureDeleted]);

  const drawnFeaturesRef = useRef<DrawnFeature[]>([]);
  const hiddenFeaturesRef = useRef<Record<string, boolean>>({});
  const layerVisibilityRef = useRef(layerVisibility);
  const selectedDateRef = useRef<string>("");
  const activeDepartmentRef = useRef<DepartmentView>("pc");
  const showAccumulatedRef = useRef<boolean>(false);
  const canEditRef = useRef<boolean>(false);

  const [mapReady, setMapReady] = useState(false);
  const [customPopup, setCustomPopup] = useState<{ mapPoint: any; feat: DrawnFeature } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [currentScale, setCurrentScale] = useState<number>(0);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] });
  const [htmlLabels, setHtmlLabels] = useState<HtmlLabel[]>([]);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number; visible: boolean }>({
    text: "", x: 0, y: 0, visible: false,
  });

  const runDeconflict = () => {
    const sl = sketchLayerRef.current;
    const v = viewRef.current;
    if (sl && v) {
      deconflictGraphics(sl, v, {
        drawnFeaturesRef, hiddenFeaturesRef, layerVisibilityRef,
        selectedDateRef, activeDepartmentRef, showAccumulatedRef,
      }, setHtmlLabels);
    }
  };

  useEffect(() => { deconflictGraphicsRef.current = runDeconflict; });

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

    const inspeccionesLayer = new GraphicsLayer({ title: "Inspecciones de Edificaciones" });
    map.add(inspeccionesLayer);
    inspeccionesLayerRef.current = inspeccionesLayer;

    const sketchLayer = new GraphicsLayer({ title: "Dibujos y Trazados" });
    map.add(sketchLayer);
    sketchLayerRef.current = sketchLayer;

    view.when(
      () => {
        const zoomWidget = new Zoom({ view });
        const compassWidget = new Compass({ view });
        view.ui.add([zoomWidget, compassWidget], "top-right");

        if (layerVisibility.sketch) {
          const svm = new SketchViewModel({
            view,
            layer: sketchLayer,
            updateOnGraphicClick: false,
            defaultUpdateOptions: {
              tool: "transform",
              enableRotation: true,
              enableScaling: true,
              toggleToolOnClick: false,
              multipleSelectionEnabled: true,
            },
          });
          sketchVMRef.current = svm;
        }

        runDeconflict();

        reactiveUtils.watch(() => view.extent, () => { runDeconflict(); });
        reactiveUtils.watch(() => view.zoom, (z) => { if (typeof z === "number") setCurrentZoom(z); });
        reactiveUtils.watch(() => view.scale, (s) => { if (typeof s === "number") setCurrentScale(Math.round(s)); });
        reactiveUtils.watch(() => view.stationary, (isStationary) => { if (isStationary) runDeconflict(); });

        view.on("pointer-move", (evt: any) => {
          const point = view.toMap({ x: evt.x, y: evt.y });
          if (point) setCoords({ lat: point.latitude ?? 0, lng: point.longitude ?? 0 });
        });

        if (layerVisibility.sketch && sketchVMRef.current) {
          const svm = sketchVMRef.current;
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

              if (onFeatureAddedRef.current) {
                onFeatureAddedRef.current({
                  id: (g as any).uid,
                  title,
                  type: g.geometry.type as DrawnFeature["type"],
                  color: callbacks.getActiveColor().hex,
                  geojsonGeometry: geoToJSON(g.geometry),
                });
              }
              setTimeout(runDeconflict, 50);
            }
            if (evt.state === "cancel") { /* handled externally */ }
          });

          svm.on("update", (evt: any) => {
            // Verificar si algún elemento está bloqueado (locked)
            const hasLocked = evt.graphics?.some((g: any) => {
              const featId = g.attributes?.id || g.uid;
              const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
              return feat?.locked === true;
            });

            if (hasLocked) {
              svm.cancel();
              return;
            }

            evt.graphics?.forEach((g: any) => {
              const label = sketchLayer.graphics.find((x) => x.attributes?.isLabel && (x.attributes?.parentId === g.uid || x.attributes?.parentId === g.attributes?.id));
              if (label) {
                label.geometry = g.geometry?.type === "polygon" ? centroidExecute(g.geometry!) : g.geometry!.clone();
              }
            });
            if (evt.state === "complete") {
              evt.graphics?.forEach((g: any) => {
                if (onFeatureAddedRef.current && g.geometry) {
                  const featId = g.attributes?.id || g.uid;
                  const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
                  onFeatureAddedRef.current({
                    id: featId,
                    title: g.attributes?.title || "Elemento",
                    type: g.geometry.type as DrawnFeature["type"],
                    color: feat?.color || callbacks.getActiveColor().hex,
                    geojsonGeometry: geoToJSON(g.geometry),
                    _isUpdate: true,
                  });
                }
              });
              runDeconflict();
            }
          });

          svm.on("delete", (evt: any) => {
            evt.graphics?.forEach((g: any) => {
              const featId = g.attributes?.id || g.uid;
              const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
              if (feat?.locked) return;

              const label = sketchLayer.graphics.find((x) => x.attributes?.isLabel && (x.attributes?.parentId === g.uid || x.attributes?.parentId === g.attributes?.id));
              if (label) sketchLayer.remove(label);
              if (onFeatureDeletedRef.current) onFeatureDeletedRef.current(featId);
            });
            runDeconflict();
          });
        }

        view.on("click", async (evt: any) => {
          if (sketchVMRef.current?.activeTool) return;
          // En modo SVG el overlay maneja los clics (hit-test propio); con la capa
          // oculta hitTest() no encuentra nada y cerraría el popup recién abierto.
          if (layerVisibilityRef.current.svgOverlay) return;
          const hit = await view.hitTest(evt);
          const inspeccionResult = hit.results.find(
            (r: any) => "graphic" in r && r.graphic?.layer === inspeccionesLayerRef.current
          );
          if (inspeccionResult) {
            const g = (inspeccionResult as any).graphic;
            if (view.popup) {
              view.popup.visibleElements = {
                actionBar: false,
                closeButton: true,
              };
            }
            view.openPopup({
              location: g.geometry,
              features: [g],
            });
            return;
          }

          const result = hit.results.find(
            (r: any) => "graphic" in r && r.graphic?.layer === sketchLayerRef.current && !r.graphic?.attributes?.isLabel
          );
          if (result) {
            const g = (result as any).graphic;
            const featId = g.attributes?.id || (g as any).uid;
            const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
            if (feat) {
              callbacks.onFeatureClick?.();
              setCustomPopup({ mapPoint: view.toMap(evt), feat });

              const svm = sketchVMRef.current;
              // Solo entrar en modo edición/transformación si las herramientas de
              // dibujo están activas, el elemento NO está bloqueado y el usuario es admin.
              const canEdit =
                layerVisibilityRef.current.sketch &&
                !feat.locked &&
                canEditRef.current;
              if (svm && svm.state !== "active" && callbacks.onGraphicSelected && canEdit) {
                callbacks.onGraphicSelected(g);
                svm.update([g], { tool: "transform" });
              }
            } else {
              setCustomPopup(null);
            }
          } else {
            setCustomPopup(null);
          }
        });

        setMapReady(true);
      },
      (err) => {
        console.error("[map] view.when() failed:", err);
        setMapReady(true);
      });

    return () => {
      if (sketchVMRef.current) { sketchVMRef.current.destroy(); sketchVMRef.current = null; }
      if (viewRef.current) { viewRef.current.destroy(); viewRef.current = null; }
    };
  }, [activeBasemap]);

  return {
    mapDiv,
    viewRef,
    sketchLayerRef,
    inspeccionesLayerRef,
    sketchVMRef,
    drawnFeaturesRef,
    hiddenFeaturesRef,
    layerVisibilityRef,
    selectedDateRef,
    activeDepartmentRef,
    showAccumulatedRef,
    canEditRef,
    deconflictGraphicsRef,
    onFeatureAddedRef,
    onFeatureDeletedRef,
    mapReady,
    customPopup,
    setCustomPopup,
    currentZoom,
    currentScale,
    coords,
    htmlLabels,
    tooltip,
    setTooltip,
    runDeconflict,
  };
}
