import { useEffect, useRef, useState, useCallback, type MutableRefObject } from "react";
import Map from "ol/Map";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Collection from "ol/Collection";
import Draw, { createBox } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Translate from "ol/interaction/Translate";
import Snap from "ol/interaction/Snap";
import { fromCircle } from "ol/geom/Polygon";
import type { Color } from "../../utils/colorUtils";
import { PALETTE } from "../../utils/colorUtils";
import { ToolId } from "../DrawingToolbar";
import type { DrawnFeature, LayerVisibility } from "../../types";

export interface UseMapDrawingOptions {
  mapRef: MutableRefObject<Map | null>;
  featuresSourceRef: MutableRefObject<VectorSource | null>;
  canEditMap: boolean;
  layerVisibility: LayerVisibility;
  drawnFeatures: DrawnFeature[];
  drawnFeaturesRef: MutableRefObject<DrawnFeature[]>;
  onFeatureAddedRef: MutableRefObject<((newFeat: DrawnFeature) => void) | undefined>;
  onFeatureDeletedRef: MutableRefObject<((id: number | string) => void) | undefined>;
  onFeatureClick?: () => void;
  onSelectGraphicCallback?: (feat: DrawnFeature | null) => void;
  customPopup: { mapPoint: any; feat: DrawnFeature } | null;
  setCustomPopup: (p: { mapPoint: any; feat: DrawnFeature } | null) => void;
}

export const useMapDrawing = (opts: UseMapDrawingOptions) => {
  const {
    mapRef,
    featuresSourceRef,
    canEditMap,
    layerVisibility,
    drawnFeatures,
    drawnFeaturesRef,
    onFeatureAddedRef,
    onFeatureDeletedRef,
    customPopup,
    setCustomPopup,
  } = opts;

  const [activeColor, setActiveColor] = useState<Color>(PALETTE[0]);
  const activeColorRef = useRef(activeColor);
  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [selectedGraphic, setSelectedGraphic] = useState<DrawnFeature | null>(null);
  const [editMode, setEditMode] = useState<"transform" | "reshape">("transform");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const translateInteractionRef = useRef<Translate | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);

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

  // 1. Manejo de Herramientas de Dibujo
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

        // Remover la feature temporal sin procesar del source para que graphicsSync gestione la feature definitiva
        try {
          if (source.hasFeature(feature)) {
            source.removeFeature(feature);
          }
        } catch {
          // Ignore
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
  }, [activeTool, canEditMap, mapRef, featuresSourceRef, onFeatureAddedRef]);

  // 2. Manejo de Modificación / Translate Exclusivo para la Figura Seleccionada
  useEffect(() => {
    const map = mapRef.current;
    const source = featuresSourceRef.current;
    if (!map || !source) return;

    if (modifyInteractionRef.current) {
      map.removeInteraction(modifyInteractionRef.current);
      modifyInteractionRef.current = null;
    }
    if (translateInteractionRef.current) {
      map.removeInteraction(translateInteractionRef.current);
      translateInteractionRef.current = null;
    }

    if (canEditMap && layerVisibility.sketch) {
      if (!snapInteractionRef.current) {
        const snap = new Snap({ source });
        map.addInteraction(snap);
        snapInteractionRef.current = snap;
      }

      if (selectedGraphic && !selectedGraphic.locked && selectedGraphic.id != null) {
        const featId = selectedGraphic.id;
        const olFeature =
          (featId !== undefined && featId !== null && String(featId).trim() !== ""
            ? source.getFeatureById(featId)
            : null) ||
          source.getFeatures().find(
            (f) => String(f.get("id")) === String(featId) || String(f.getId()) === String(featId)
          );

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
    onFeatureAddedRef,
  ]);

  const handleSelectTool = useCallback((toolId: ToolId) => {
    if (!canEditMap) return;
    setSelectedGraphic(null);
    setActiveTool(toolId);
  }, [canEditMap]);

  const handleCancel = useCallback(() => {
    const map = mapRef.current;
    if (map && drawInteractionRef.current) {
      map.removeInteraction(drawInteractionRef.current);
      drawInteractionRef.current = null;
    }
    setActiveTool(null);
    setSelectedGraphic(null);
  }, [mapRef]);

  const handleDeleteSelected = useCallback((targetFeat?: any) => {
    const isActualFeature =
      targetFeat &&
      typeof targetFeat === "object" &&
      !("nativeEvent" in targetFeat) &&
      ("geojsonGeometry" in targetFeat || "type" in targetFeat);
    const target = (isActualFeature ? targetFeat : null) || selectedGraphic;
    if (!target || target.locked) return;
    setSelectedGraphic(target);
    setDeleteConfirmOpen(true);
  }, [selectedGraphic]);

  const handleConfirmDelete = useCallback(() => {
    if (selectedGraphic && onFeatureDeletedRef.current) {
      const idToDelete = selectedGraphic.id;
      const source = featuresSourceRef.current;
      if (source) {
        try {
          const olFeat =
            (idToDelete != null ? source.getFeatureById(idToDelete) || source.getFeatureById(String(idToDelete)) : null) ||
            source.getFeatures().find(
              (f) => String(f.get("id")) === String(idToDelete) || String(f.getId()) === String(idToDelete)
            );
          if (olFeat) {
            source.removeFeature(olFeat);
          }
        } catch (err) {
          console.warn("[useMapDrawing] Error al remover feature del source:", err);
        }
      }
      onFeatureDeletedRef.current(idToDelete);
      if (customPopup?.feat && String(customPopup.feat.id) === String(idToDelete)) {
        setCustomPopup(null);
      }
    }
    setDeleteConfirmOpen(false);
    setSelectedGraphic(null);
  }, [selectedGraphic, onFeatureDeletedRef, featuresSourceRef, customPopup, setCustomPopup]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmOpen(false);
  }, []);

  const handleToggleEditMode = useCallback((mode: "transform" | "reshape") => {
    setEditMode(mode);
  }, []);

  const handleColorChange = useCallback((color: Color) => {
    setActiveColor(color);
    if (selectedGraphic) {
      const featId = selectedGraphic.id;
      const feat = drawnFeaturesRef.current.find((f) => String(f.id) === String(featId));
      if (feat && onFeatureAddedRef.current) {
        onFeatureAddedRef.current({ ...feat, color: color.hex, _isUpdate: true });
      }
    }
  }, [selectedGraphic, drawnFeaturesRef, onFeatureAddedRef]);

  return {
    activeColor,
    activeColorRef,
    activeTool,
    setActiveTool,
    selectedGraphic,
    setSelectedGraphic,
    editMode,
    deleteConfirmOpen,
    onSelectGraphicForEdit,
    handleSelectTool,
    handleCancel,
    handleDeleteSelected,
    handleConfirmDelete,
    handleCancelDelete,
    handleToggleEditMode,
    handleColorChange,
    drawInteractionRef,
    modifyInteractionRef,
    snapInteractionRef,
    translateInteractionRef,
  };
};
