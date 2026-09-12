import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import GeoJSON from "ol/format/GeoJSON";
import { fromLonLat, toLonLat } from "ol/proj";
import { fromCircle } from "ol/geom/Polygon";
import Collection from "ol/Collection";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Translate from "ol/interaction/Translate";
import Snap from "ol/interaction/Snap";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import Overlay from "ol/Overlay";
import { getRenderPixel } from "ol/render";
import type { Color } from "../utils/colorUtils";
import { PALETTE } from "../utils/colorUtils";
import { ToolId } from "./DrawingToolbar";
import { DEFAULT_CENTER, DEFAULT_ZOOM, getBasemapUrl, getBasemapMaxZoom } from "../utils/mapUtils";
import { syncDrawnFeaturesToGraphics, syncImportedFeatures, syncInspeccionesToGraphics } from "../utils/graphicsSync";
import { fetchInspecciones } from "../services/inspeccionService";
import { useMapInit } from "./useMapInit";
import { featureToLabelData, buildHtmlLabelElement, LABEL_ZOOM_THRESHOLD } from "../utils/htmlLabelBuilder";
import { buildParentsMap } from "../utils/spatialUtils";
import type { DrawnFeature, LayerVisibility, RemoveFeatureId, DepartmentView, InspeccionRecord } from "../types";

export interface UseMapSetupProps {
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
    removeFeatureId,
    importedFeatures,
    hiddenFeatures,
    selectedDate,
    zoomToCoords,
    activeDepartment = "pc",
    onFeatureClick,
    showAccumulated = false,
    showPoints = true,
    showAreas = true,
    sidebarOpen = true,
    bitacoraOpen = false,
    bare = false,
    canEditMap = false,
    isAuthenticated = false,
    isMobile = false,
  } = props;

  const [activeColor, setActiveColor] = useState<Color>(PALETTE[0]);
  const activeColorRef = useRef(activeColor);
  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedGraphic, setSelectedGraphic] = useState<DrawnFeature | null>(null);
  const [editMode, setEditMode] = useState<"transform" | "reshape">("transform");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [popupEditDate, setPopupEditDate] = useState(selectedDate);
  const [popupTick, setPopupTick] = useState(0);
  const [swipeActive, setSwipeActive] = useState(false);
  const [swipePosition, setSwipePosition] = useState(50);

  const swipePositionRef = useRef(swipePosition);
  useEffect(() => {
    swipePositionRef.current = swipePosition;
  }, [swipePosition]);

  const isMobileRef = useRef(isMobile);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);

  const swipeLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const translateInteractionRef = useRef<Translate | null>(null);

  const onSelectGraphicForEdit = useCallback(
    (g: DrawnFeature | null) => {
      if (!g) {
        setSelectedGraphic(null);
        return;
      }
      if (canEditMap !== true || !layerVisibility.sketch) return;
      const feat = drawnFeatures.find((f) => String(f.id) === String(g.id));
      if (feat?.locked) {
        setSelectedGraphic(null);
        return;
      }
      setActiveTool(null);
      setSelectedGraphic(feat || g);
    },
    [canEditMap, layerVisibility.sketch, drawnFeatures]
  );

  const init = useMapInit(activeBasemap, layerVisibility, {
    onFeatureAdded,
    onFeatureDeleted,
    onFeatureClick,
    onSelectFeature: onSelectGraphicForEdit,
    onToolComplete: () => {
      setActiveTool(null);
    },
    getActiveColor: () => activeColorRef.current,
  });

  // Sincronizar refs del init
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
    drawInteractionRef,
    modifyInteractionRef,
    snapInteractionRef,
    onFeatureAddedRef,
    onFeatureDeletedRef,
    drawnFeaturesRef,
  } = init;

  useEffect(() => {
    setPopupEditDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    setPopupTick((t) => t + 1);
  }, []);

  // 1. Manejo de Basemap
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

  // 2. Manejo de Herramientas de Dibujo
  useEffect(() => {
    const map = mapRef.current;
    const source = featuresSourceRef.current;
    if (!map || !source) return;

    if (drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }

    if (activeTool && canEditMap) {
      let draw: Draw;
      if (activeTool === "point") {
        draw = new Draw({ source, type: "Point" });
      } else if (activeTool === "polyline") {
        draw = new Draw({ source, type: "LineString" });
      } else if (activeTool === "polygon") {
        draw = new Draw({ source, type: "Polygon" });
      } else if (activeTool === "rectangle") {
        draw = new Draw({ source, type: "Circle", geometryFunction: createBox() });
      } else if (activeTool === "circle") {
        draw = new Draw({ source, type: "Circle" });
      } else {
        return;
      }

      draw.on("drawend", (evt) => {
        const feature = evt.feature;
        let geom = feature.getGeometry();
        if (geom && geom.getType() === "Circle") {
          geom = fromCircle(geom as any, 64);
        }

        if (geom) {
          const format = new GeoJSON();
          const geojsonObj = format.writeGeometryObject(geom, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });

          const newFeat: DrawnFeature = {
            id: Date.now(),
            title: `Elemento ${activeTool}`,
            type: activeTool === "point" ? "point" : activeTool === "polyline" ? "polyline" : "polygon",
            color: activeColorRef.current.hex,
            geojsonGeometry: geojsonObj as any,
            dailyLogs: [],
          };

          onFeatureAddedRef.current?.(newFeat);
        }

        setTimeout(() => {
          map.removeInteraction(draw);
          drawInteractionRef.current = null;
          setActiveTool(null);
        }, 50);
      });

      map.addInteraction(draw);
      drawInteractionRef.current = draw;
    }

    return () => {
      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
    };
  }, [activeTool, canEditMap, mapRef, featuresSourceRef, drawInteractionRef, onFeatureAddedRef]);

  // 3. Manejo de Modificación / Translate Exclusivo para la Figura Seleccionada (No bloqueada)
  useEffect(() => {
    const map = mapRef.current;
    const source = featuresSourceRef.current;
    if (!map || !source) return;

    // Limpiar interacciones anteriores
    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }
    if (translateInteractionRef.current) {
      map.removeInteraction(translateInteractionRef.current);
      translateInteractionRef.current = null;
    }

    if (canEditMap && layerVisibility.sketch) {
      // Snapping para dibujo preciso
      if (!snapInteractionRef.current) {
        const snap = new Snap({ source });
        map.addInteraction(snap);
        snapInteractionRef.current = snap;
      }

      // Solo habilitar modificación o traslación si hay un elemento seleccionado y NO está bloqueado
      if (selectedGraphic && !selectedGraphic.locked) {
        const featId = selectedGraphic.id;
        const olFeature =
          source.getFeatureById(featId) ||
          source.getFeatures().find((f) => String(f.get("id")) === String(featId));

        if (olFeature) {
          const featureCollection = new Collection([olFeature]);

          if (editMode === "reshape") {
            const modify = new Modify({ features: featureCollection });
            modify.on("modifyend", () => {
              const geom = olFeature.getGeometry();
              if (geom) {
                const format = new GeoJSON();
                const geojsonObj = format.writeGeometryObject(geom, {
                  dataProjection: "EPSG:4326",
                  featureProjection: "EPSG:3857",
                });
                onFeatureAddedRef.current?.({
                  ...selectedGraphic,
                  geojsonGeometry: geojsonObj as any,
                  _isUpdate: true,
                });
              }
            });
            map.addInteraction(modify);
            modifyInteractionRef.current = modify;
          } else if (editMode === "transform") {
            const translate = new Translate({ features: featureCollection });
            translate.on("translateend", () => {
              const geom = olFeature.getGeometry();
              if (geom) {
                const format = new GeoJSON();
                const geojsonObj = format.writeGeometryObject(geom, {
                  dataProjection: "EPSG:4326",
                  featureProjection: "EPSG:3857",
                });
                onFeatureAddedRef.current?.({
                  ...selectedGraphic,
                  geojsonGeometry: geojsonObj as any,
                  _isUpdate: true,
                });
              }
            });
            map.addInteraction(translate);
            translateInteractionRef.current = translate;
          }
        }
      }
    } else {
      if (snapInteractionRef.current) {
        map.removeInteraction(snapInteractionRef.current);
        snapInteractionRef.current = null;
      }
    }
  }, [
    canEditMap,
    layerVisibility.sketch,
    selectedGraphic,
    editMode,
    mapRef,
    featuresSourceRef,
    modifyInteractionRef,
    snapInteractionRef,
    onFeatureAddedRef,
  ]);

  const handleSelectTool = (toolId: ToolId) => {
    if (!canEditMap) return;
    setSelectedGraphic(null);
    setActiveTool(toolId);
  };

  const handleCancel = () => {
    const map = mapRef.current;
    if (map && drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    setActiveTool(null);
    setSelectedGraphic(null);
  };

  const handleDeleteSelected = (targetFeat?: DrawnFeature) => {
    const target = targetFeat || selectedGraphic;
    if (!target || target.locked) return;
    setSelectedGraphic(target);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedGraphic && onFeatureDeletedRef.current) {
      onFeatureDeletedRef.current(Number(selectedGraphic.id));
      if (init.customPopup?.feat && String(init.customPopup.feat.id) === String(selectedGraphic.id)) {
        init.setCustomPopup(null);
      }
    }
    setDeleteConfirmOpen(false);
    setSelectedGraphic(null);
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
  };

  const handleToggleEditMode = (mode: "transform" | "reshape") => {
    setEditMode(mode);
  };

  const handleColorChange = (color: Color) => {
    setActiveColor(color);
    if (selectedGraphic) {
      const featId = selectedGraphic.id;
      const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
      if (feat && onFeatureAddedRef.current) {
        onFeatureAddedRef.current({ ...feat, color: color.hex, _isUpdate: true });
      }
    }
  };

  // 4. Sincronización de features dibujadas e importadas
  useEffect(() => {
    const source = featuresSourceRef.current;
    if (!source) return;

    if (layerVisibility.inspecciones) {
      const polygonFeatures = drawnFeatures.filter((f) => f.type === "polygon");
      syncDrawnFeaturesToGraphics(polygonFeatures, hiddenFeatures, layerVisibility, init.currentZoom, source, selectedDate, activeDepartment, bare);
    } else {
      syncDrawnFeaturesToGraphics(drawnFeatures, hiddenFeatures, layerVisibility, init.currentZoom, source, selectedDate, activeDepartment, bare);
    }
  }, [drawnFeatures, hiddenFeatures, layerVisibility, init.currentZoom, selectedDate, activeDepartment, bare, featuresSourceRef]);

  useEffect(() => {
    const source = featuresSourceRef.current;
    if (!source || !importedFeatures) return;
    const targetImported = layerVisibility.inspecciones
      ? importedFeatures.filter((f) => f.type === "polygon" || f.geojsonGeometry?.type === "Polygon")
      : importedFeatures;
    syncImportedFeatures(targetImported, layerVisibility, mapRef, source);
  }, [importedFeatures, layerVisibility, mapRef, featuresSourceRef]);

  // 5. Carga y filtrado de inspecciones Kobo
  const [inspeccionesRecords, setInspeccionesRecords] = useState<InspeccionRecord[]>([]);
  const [selectedColorFilter, setSelectedColorFilter] = useState<"all" | "rojo" | "amarillo" | "verde">("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("");

  useEffect(() => {
    fetchInspecciones().then((records) => {
      setInspeccionesRecords(records);
    });
  }, []);

  const filteredInspeccionesRecords = useMemo(() => {
    return inspeccionesRecords.filter((r) => {
      if (!showAccumulated && !selectedDateFilter) {
        if (selectedDate && selectedDate.trim().length >= 8 && r.fecha) {
          if (!r.fecha.startsWith(selectedDate)) {
            return false;
          }
        }
      } else if (selectedDateFilter) {
        if (r.fecha && !r.fecha.startsWith(selectedDateFilter)) {
          return false;
        }
      }
      if (selectedColorFilter !== "all") {
        const tag = String(r.riesgo_color || "").toLowerCase();
        if (selectedColorFilter === "rojo") {
          return tag.includes("rojo") || tag.includes("roja") || tag.includes("alto") || tag.includes("insegur");
        }
        if (selectedColorFilter === "amarillo") {
          return tag.includes("amarillo") || tag.includes("amarilla") || tag.includes("medio") || tag.includes("precau");
        }
        if (selectedColorFilter === "verde") {
          return !tag.includes("rojo") && !tag.includes("roja") && !tag.includes("alto") && !tag.includes("amarillo") && !tag.includes("amarilla") && !tag.includes("medio");
        }
      }
      return true;
    });
  }, [inspeccionesRecords, selectedDateFilter, selectedDate, showAccumulated, selectedColorFilter]);

  useEffect(() => {
    const source = inspeccionesSourceRef.current;
    if (!source) return;
    syncInspeccionesToGraphics(source, filteredInspeccionesRecords, layerVisibility.inspecciones ?? false);
  }, [filteredInspeccionesRecords, layerVisibility.inspecciones, inspeccionesSourceRef]);

  // 5.1 Sincronización de Overlays HTML Nativos de OpenLayers (Pines en zoom < 14, Tarjetas en zoom >= 14)
  const labelOverlaysRef = useRef<Overlay[]>([]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let lastZoomBucket = -1;

    const renderOverlays = () => {
      const view = map.getView();
      const currentZoom = view.getZoom() || 13;
      const isCard = currentZoom >= 16;
      const zoomBucket = isCard ? 1 : 0;

      if (lastZoomBucket === zoomBucket && labelOverlaysRef.current.length > 0) return;
      lastZoomBucket = zoomBucket;

      labelOverlaysRef.current.forEach((ov) => map.removeOverlay(ov));
      labelOverlaysRef.current = [];

      const showLabels = layerVisibility.pointLabels !== false && !layerVisibility.inspecciones;
      if (!showLabels) return;

      const { parentsMap } = buildParentsMap(drawnFeatures);

      drawnFeatures.forEach((feat) => {
        if (!feat.geojsonGeometry) return;
        if (hiddenFeatures[String(feat.id)]) return;
        const labelData = featureToLabelData(feat, parentsMap, selectedDate, drawnFeatures);
        if (!labelData) return;

        const isPoint = feat.type === "point" || feat.geojsonGeometry?.type === "Point";
        const el = buildHtmlLabelElement(
          labelData,
          () => {
            onFeatureClick?.();
            init.setCustomPopup({ mapPoint: fromLonLat([labelData.lng, labelData.lat]), feat });
            onSelectGraphicForEdit(feat);
          },
          currentZoom
        );

        const overlay = new Overlay({
          element: el,
          position: fromLonLat([labelData.lng, labelData.lat]),
          positioning: "bottom-center",
          offset: isCard ? (isPoint ? [0, -12] : [0, 0]) : [0, 0],
          stopEvent: true,
        });

        map.addOverlay(overlay);
        labelOverlaysRef.current.push(overlay);
      });
    };

    renderOverlays();
    const listener = () => renderOverlays();
    map.getView().on("change:resolution", listener);

    return () => {
      map.getView().un("change:resolution", listener);
      labelOverlaysRef.current.forEach((ov) => map.removeOverlay(ov));
      labelOverlaysRef.current = [];
    };
  }, [drawnFeatures, hiddenFeatures, selectedDate, layerVisibility.pointLabels, layerVisibility.inspecciones, mapRef]);

  // 6. Navegación / Zoom
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

  // 7. Manejo de Swipe (Antes y Después con Google Satelital)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (swipeActive) {
      if (!swipeLayerRef.current) {
        const swipeLayer = new TileLayer({
          preload: 0,
          source: new XYZ({
            url: "https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            maxZoom: 20,
          }),
        });

        swipeLayer.on("prerender", (event: any) => {
          const ctx = event.context as CanvasRenderingContext2D;
          if (!ctx) return;
          const mapSize = map.getSize();
          if (!mapSize) return;
          const width = mapSize[0];
          const height = mapSize[1];
          const pos = swipePositionRef.current;
          const mobile = isMobileRef.current;

          if (mobile) {
            // En móvil: deslizamiento vertical (de arriba a abajo)
            const clipY = height * (pos / 100);
            const tl = getRenderPixel(event, [0, clipY]);
            const tr = getRenderPixel(event, [width, clipY]);
            const bl = getRenderPixel(event, [0, height]);
            const br = getRenderPixel(event, [width, height]);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tl[0], tl[1]);
            ctx.lineTo(tr[0], tr[1]);
            ctx.lineTo(br[0], br[1]);
            ctx.lineTo(bl[0], bl[1]);
            ctx.closePath();
            ctx.clip();
          } else {
            // En escritorio: deslizamiento horizontal (de izquierda a derecha)
            const clipX = width * (pos / 100);
            const tl = getRenderPixel(event, [clipX, 0]);
            const tr = getRenderPixel(event, [width, 0]);
            const bl = getRenderPixel(event, [clipX, height]);
            const br = getRenderPixel(event, [width, height]);

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(tl[0], tl[1]);
            ctx.lineTo(tr[0], tr[1]);
            ctx.lineTo(br[0], br[1]);
            ctx.lineTo(bl[0], bl[1]);
            ctx.closePath();
            ctx.clip();
          }
        });

        swipeLayer.on("postrender", (event: any) => {
          const ctx = event.context as CanvasRenderingContext2D;
          if (ctx) ctx.restore();
        });

        const layers = map.getLayers();
        layers.insertAt(1, swipeLayer);
        swipeLayerRef.current = swipeLayer;
      }
      map.render();
    } else {
      if (swipeLayerRef.current) {
        map.removeLayer(swipeLayerRef.current);
        swipeLayerRef.current = null;
        map.render();
      }
    }
  }, [swipeActive, swipePosition, mapRef]);

  const activateSwipe = useCallback(() => {
    setActiveTool(null);
    setSelectedGraphic(null);
    setSwipeActive(true);
  }, []);

  const deactivateSwipe = useCallback(() => {
    setSwipeActive(false);
  }, []);

  return {
    mapDiv: init.mapDiv,
    activeTool,
    editMode,
    selectedGraphic,
    activeColor,
    tooltip: null,
    customPopup: init.customPopup,
    popupTick,
    popupScreenPos: init.popupScreenPos,
    popupEditDate,
    sketchLayer: featuresLayerRef.current,
    sketchVMRef: { current: null },
    onSelectGraphicForEdit,
    currentZoom: init.currentZoom,
    currentScale: init.currentScale,
    coords: init.coords,
    htmlLabels: [],
    swipeActive,
    swipePosition,
    setSwipePosition,
    viewRef: mapRef,
    mapRef,
    activateSwipe,
    deactivateSwipe,
    setCustomPopup: init.setCustomPopup,
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
  };
};
