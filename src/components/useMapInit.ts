import { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromCircle } from "ol/geom/Polygon";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import DragRotate from "ol/interaction/DragRotate";
import PinchRotate from "ol/interaction/PinchRotate";
import { altKeyOnly, altShiftKeysOnly } from "ol/events/condition";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import Overlay from "ol/Overlay";
import { defaults as defaultControls, Rotate } from "ol/control";
import { defaults as defaultInteractions } from "ol/interaction";
import "ol/ol.css";
import type { Color } from "../utils/colorUtils";
import { PALETTE, hexToRgb } from "../utils/colorUtils";
import { DEFAULT_CENTER, DEFAULT_ZOOM, getBasemapUrl, getBasemapMaxZoom } from "../utils/mapUtils";
import { featureToLabelData, buildHtmlLabelElement, LABEL_ZOOM_THRESHOLD } from "../utils/htmlLabelBuilder";
import { buildParentsMap } from "../utils/spatialUtils";
import type { DrawnFeature, HtmlLabel, LayerVisibility, DepartmentView, InspeccionRecord } from "../types";

export interface MapInitRefs {
  mapRef: React.MutableRefObject<Map | null>;
  featuresSourceRef: React.MutableRefObject<VectorSource | null>;
  featuresLayerRef: React.MutableRefObject<VectorLayer<VectorSource> | null>;
  inspeccionesSourceRef: React.MutableRefObject<VectorSource | null>;
  inspeccionesLayerRef: React.MutableRefObject<VectorLayer<VectorSource> | null>;
  drawnFeaturesRef: React.MutableRefObject<DrawnFeature[]>;
  hiddenFeaturesRef: React.MutableRefObject<Record<string, boolean>>;
  layerVisibilityRef: React.MutableRefObject<LayerVisibility>;
  selectedDateRef: React.MutableRefObject<string>;
  activeDepartmentRef: React.MutableRefObject<DepartmentView>;
  showAccumulatedRef: React.MutableRefObject<boolean>;
  canEditRef: React.MutableRefObject<boolean>;
}

export interface MapInitCallbacks {
  onFeatureAdded: (feat: DrawnFeature) => void;
  onFeatureDeleted: (id: number) => void;
  onFeatureClick?: () => void;
  onToolComplete?: () => void;
  getActiveColor: () => Color;
}

function toRgba(hex: any, alpha = 1): string {
  if (!hex || typeof hex !== "string") return `rgba(249, 115, 22, ${alpha})`;
  let c = hex.trim().replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  if (c.length === 6) {
    const num = parseInt(c, 16);
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }
  return `rgba(249, 115, 22, ${alpha})`;
}

export function useMapInit(
  activeBasemap: string,
  layerVisibility: LayerVisibility,
  callbacks: MapInitCallbacks,
) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const baseLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const featuresSourceRef = useRef<VectorSource | null>(null);
  const featuresLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const inspeccionesSourceRef = useRef<VectorSource | null>(null);
  const inspeccionesLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const labelOverlaysRef = useRef<Overlay[]>([]);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);

  const onFeatureAddedRef = useRef(callbacks.onFeatureAdded);
  const onFeatureDeletedRef = useRef(callbacks.onFeatureDeleted);
  const onToolCompleteRef = useRef(callbacks.onToolComplete);

  useEffect(() => { onFeatureAddedRef.current = callbacks.onFeatureAdded; }, [callbacks.onFeatureAdded]);
  useEffect(() => { onFeatureDeletedRef.current = callbacks.onFeatureDeleted; }, [callbacks.onFeatureDeleted]);
  useEffect(() => { onToolCompleteRef.current = callbacks.onToolComplete; }, [callbacks.onToolComplete]);

  const drawnFeaturesRef = useRef<DrawnFeature[]>([]);
  const hiddenFeaturesRef = useRef<Record<string, boolean>>({});
  const layerVisibilityRef = useRef(layerVisibility);
  const selectedDateRef = useRef<string>("");
  const activeDepartmentRef = useRef<DepartmentView>("pc");
  const showAccumulatedRef = useRef<boolean>(false);
  const canEditRef = useRef<boolean>(false);
  const isAuthenticatedRef = useRef<boolean>(false);

  const [mapReady, setMapReady] = useState(false);
  const [customPopup, setCustomPopup] = useState<{ mapPoint: any; feat: DrawnFeature } | null>(null);
  const [popupScreenPos, setPopupScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [currentScale, setCurrentScale] = useState<number>(50000);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_CENTER[1], lng: DEFAULT_CENTER[0] });

  // Inicialización del Mapa de OpenLayers
  useEffect(() => {
    if (!mapDiv.current) return;
    mapDiv.current.innerHTML = "";

    const basemapUrl = getBasemapUrl(activeBasemap);
    const maxZoom = getBasemapMaxZoom(activeBasemap);

    const baseLayer = new TileLayer({
      preload: 4,
      source: new XYZ({
        url: basemapUrl,
        maxZoom,
        interpolate: true,
        crossOrigin: "anonymous",
      }),
    });
    baseLayerRef.current = baseLayer;

    const featuresSource = new VectorSource();
    featuresSourceRef.current = featuresSource;

    const featuresLayer = new VectorLayer({
      source: featuresSource,
      renderBuffer: 1200,
      style: (feature, resolution) => {
        const rawColor = feature.get("color") || "#f97316";
        const strokeColor = toRgba(rawColor, 0.95);
        const fillColor = toRgba(rawColor, 0.25);
        const title = feature.get("title") || "";
        const hasOverlay = feature.get("hasOverlay") === true;
        const geomType = feature.getGeometry()?.getType();
        const isPoint = geomType === "Point" || geomType === "MultiPoint";

        // Obtener zoom actual a partir de la vista o resolución
        const view = mapRef.current?.getView();
        const currentZoom = view
          ? (view.getZoom() ?? (resolution ? view.getZoomForResolution(resolution) ?? 15 : 15))
          : 15;

        // Puntos visibles a partir de zoom 16, polígonos/líneas a partir de zoom 13
        const zoomThreshold = isPoint ? 16 : 13;
        const passesZoom = currentZoom >= zoomThreshold;

        // Verificar visibilidad de labels según configuración
        const passesVisibility = isPoint
          ? (layerVisibilityRef.current?.pointLabels ?? true)
          : (layerVisibilityRef.current?.polygonLabels ?? true);

        const showText = !hasOverlay && !!title && passesZoom && passesVisibility;

        return new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color: strokeColor, width: 2, lineCap: "round", lineJoin: "round" }),
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({ color: strokeColor }),
            stroke: new Stroke({ color: "#ffffff", width: 1.5 }),
          }),
          text: showText
            ? new Text({
                text: title,
                font: "bold 11px Inter, system-ui, -apple-system, sans-serif",
                fill: new Fill({ color: "#ffffff" }),
                stroke: new Stroke({ color: "rgba(10, 15, 29, 0.95)", width: 3.5 }),
                offsetY: isPoint ? -14 : 0,
                overflow: true,
              })
            : undefined,
        });
      },
    });
    featuresLayerRef.current = featuresLayer;

    const inspeccionesSource = new VectorSource();
    inspeccionesSourceRef.current = inspeccionesSource;

    const inspeccionesLayer = new VectorLayer({
      source: inspeccionesSource,
      renderBuffer: 1200,
      style: (feature) => {
        const rawColor = feature.get("color") || "#22c55e";
        const fillColor = toRgba(rawColor, 0.95);
        return new Style({
          image: new CircleStyle({
            radius: 4,
            fill: new Fill({ color: fillColor }),
            stroke: new Stroke({ color: "rgba(15, 23, 42, 0.8)", width: 1 }),
          }),
        });
      },
    });
    inspeccionesLayerRef.current = inspeccionesLayer;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    const targetElement = mapDiv.current;
    targetElement.addEventListener("contextmenu", handleContextMenu);

    const isRightClick = (mapBrowserEvent: any) => {
      const orig = mapBrowserEvent?.originalEvent;
      if (!orig) return false;
      return orig.button === 2 || (orig.buttons & 2) === 2 || orig.which === 3;
    };

    const map = new Map({
      target: mapDiv.current,
      layers: [baseLayer, featuresLayer, inspeccionesLayer],
      controls: defaultControls({ rotate: false, attribution: false }).extend([
        new Rotate({
          autoHide: false,
          tipLabel: "Restablecer orientación al Norte",
        }),
      ]),
      interactions: defaultInteractions().extend([
        new DragRotate({
          condition: (e) => isRightClick(e) || altKeyOnly(e) || altShiftKeysOnly(e),
        }),
        new PinchRotate(),
      ]),
      view: new View({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        maxZoom: 20,
        minZoom: 3,
      }),
    });
    mapRef.current = map;

    // Rastrear posición del puntero y zoom
    map.on("pointermove", (evt) => {
      const lonLat = toLonLat(evt.coordinate);
      setCoords({ lat: lonLat[1], lng: lonLat[0] });
    });

    const updateZoomAndScale = () => {
      const view = map.getView();
      if (!view) return;
      const z = view.getZoom() || DEFAULT_ZOOM;
      setCurrentZoom(Math.round(z * 10) / 10);
      const res = view.getResolution() || 1;
      setCurrentScale(Math.round(res * 39.37 * 72));
    };

    map.on("moveend", updateZoomAndScale);
    map.getView().on("change:resolution", updateZoomAndScale);
    updateZoomAndScale();

    // Detección de clics en geometrías
    map.on("singleclick", (evt) => {
      if (drawInteractionRef.current) return;

      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (f) => f,
        { hitTolerance: 8 }
      );

      if (feature) {
        const featId = feature.get("id");
        const isInsp = feature.get("tipo") === "inspeccion";

        if (isInsp) {
          // Inspección Kobo
          callbacks.onFeatureClick?.();
          const props = feature.getProperties();
          const lonLat = toLonLat(evt.coordinate);
          setCustomPopup({
            mapPoint: evt.coordinate,
            feat: {
              id: Number(feature.getId()) || Date.now(),
              title: props.nombre || "Edificación Inspeccionada",
              type: "point",
              color: props.color || "#22c55e",
              description: `${props.lugar || ""}\nRiesgo: ${props.riesgo || ""}\nFecha: ${props.fecha || ""}`,
              geojsonGeometry: {
                type: "Point",
                coordinates: [lonLat[0], lonLat[1]],
              },
              dailyLogs: [],
            },
          });
          setPopupScreenPos({ x: evt.pixel[0], y: evt.pixel[1] });
          return;
        }

        // Trazado dibujado
        const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
        if (feat) {
          callbacks.onFeatureClick?.();
          setCustomPopup({ mapPoint: evt.coordinate, feat });
          setPopupScreenPos({ x: evt.pixel[0], y: evt.pixel[1] });
        } else {
          setCustomPopup(null);
          setPopupScreenPos(null);
        }
      } else {
        setCustomPopup(null);
        setPopupScreenPos(null);
      }
    });

    const resizeTimer = setTimeout(() => {
      map.updateSize();
    }, 80);

    setMapReady(true);

    return () => {
      clearTimeout(resizeTimer);
      targetElement?.removeEventListener("contextmenu", handleContextMenu);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  return {
    mapDiv,
    mapRef,
    baseLayerRef,
    featuresSourceRef,
    featuresLayerRef,
    inspeccionesSourceRef,
    inspeccionesLayerRef,
    labelOverlaysRef,
    drawInteractionRef,
    modifyInteractionRef,
    snapInteractionRef,
    drawnFeaturesRef,
    hiddenFeaturesRef,
    layerVisibilityRef,
    selectedDateRef,
    activeDepartmentRef,
    showAccumulatedRef,
    canEditRef,
    isAuthenticatedRef,
    onFeatureAddedRef,
    onFeatureDeletedRef,
    mapReady,
    customPopup,
    setCustomPopup,
    popupScreenPos,
    setPopupScreenPos,
    currentZoom,
    currentScale,
    coords,
  };
}
