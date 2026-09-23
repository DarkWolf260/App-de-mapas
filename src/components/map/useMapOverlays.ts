import { useEffect, useRef, useMemo, type MutableRefObject } from "react";
import OlMap from "ol/Map";
import Overlay from "ol/Overlay";
import { fromLonLat } from "ol/proj";
import { buildParentsMap } from "../../utils/spatialUtils";
import { featureToLabelData, buildHtmlLabelElement, updateHtmlLabelElementContent } from "../../utils/htmlLabelBuilder";
import type { DrawnFeature, LayerVisibility, DepartmentView } from "../../types";

export interface UseMapOverlaysOptions {
  mapRef: MutableRefObject<OlMap | null>;
  drawnFeatures: DrawnFeature[];
  hiddenFeatures: Record<string, boolean>;
  selectedDate: string;
  activeDepartment?: DepartmentView;
  layerVisibility: LayerVisibility;
  onFeatureClick?: () => void;
  onSelectGraphicForEdit: (feat: DrawnFeature | null) => void;
  setCustomPopup: (p: { mapPoint: any; feat: DrawnFeature } | null) => void;
}

export const useMapOverlays = ({
  mapRef,
  drawnFeatures,
  hiddenFeatures,
  selectedDate,
  activeDepartment,
  layerVisibility,
  onFeatureClick,
  onSelectGraphicForEdit,
  setCustomPopup,
}: UseMapOverlaysOptions) => {
  const overlayMapRef = useRef<Map<string, Overlay>>(new Map());
  const lastCardStateRef = useRef<boolean | null>(null);
  const callbacksRef = useRef({ onFeatureClick, onSelectGraphicForEdit, setCustomPopup });
  callbacksRef.current = { onFeatureClick, onSelectGraphicForEdit, setCustomPopup };

  // Memoizar el cálculo de contención y áreas para no recalcularlo en cada cambio de fecha
  const { parentsMap } = useMemo(() => buildParentsMap(drawnFeatures), [drawnFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const renderOverlays = (forceUpdate = false) => {
      const view = map.getView();
      const currentZoom = view.getZoom() || 13;
      const isCard = currentZoom >= 16;
      const cardModeChanged = isCard !== lastCardStateRef.current;

      // Si no es una actualización de datos y el modo visual (Pin vs Tarjeta) no cambió,
      // OpenLayers ya traslada el overlay automáticamente vía GPU CSS transform sin tocar el DOM.
      if (!forceUpdate && !cardModeChanged) {
        return;
      }
      lastCardStateRef.current = isCard;

      const showLabels = layerVisibility.pointLabels !== false && !layerVisibility.inspecciones;
      const overlayMap = overlayMapRef.current;

      if (!showLabels) {
        overlayMap.forEach((ov) => ov.setPosition(undefined));
        return;
      }

      const activeIds = new Set<string>();
      const currentDrawnIds = new Set<string>();

      drawnFeatures.forEach((feat) => {
        if (!feat.geojsonGeometry) return;
        const fid = String(feat.id);
        currentDrawnIds.add(fid);

        if (hiddenFeatures[fid]) {
          const existing = overlayMap.get(fid);
          if (existing) existing.setPosition(undefined);
          return;
        }

        const labelData = featureToLabelData(feat, parentsMap, selectedDate, drawnFeatures, activeDepartment);
        if (!labelData) {
          const existing = overlayMap.get(fid);
          if (existing) existing.setPosition(undefined);
          return;
        }

        activeIds.add(fid);
        const isPoint = feat.type === "point" || feat.geojsonGeometry?.type === "Point";
        const targetPos = fromLonLat([labelData.lng, labelData.lat]);
        const targetOffset: [number, number] = isCard ? (isPoint ? [0, -12] : [0, 0]) : [0, 0];

        let overlay = overlayMap.get(fid);
        if (overlay) {
          // Reutilizar elemento existente: solo actualizar contenido y posición sin mutar el DOM de OpenLayers
          const el = overlay.getElement();
          if (el) {
            updateHtmlLabelElementContent(el, labelData, currentZoom);
          }
          overlay.setPosition(targetPos);
          overlay.setOffset(targetOffset);
        } else {
          // Crear un nuevo overlay únicamente si no existe
          const el = buildHtmlLabelElement(
            labelData,
            () => {
              callbacksRef.current.onFeatureClick?.();
              callbacksRef.current.setCustomPopup({ mapPoint: fromLonLat([labelData.lng, labelData.lat]), feat });
              callbacksRef.current.onSelectGraphicForEdit(feat);
            },
            currentZoom
          );

          overlay = new Overlay({
            element: el,
            position: targetPos,
            positioning: "bottom-center",
            offset: targetOffset,
            stopEvent: true,
          });

          map.addOverlay(overlay);
          overlayMap.set(fid, overlay);
        }
      });

      // Ocultar overlays inactivos y remover los de features eliminadas
      overlayMap.forEach((ov, id) => {
        if (!currentDrawnIds.has(id)) {
          map.removeOverlay(ov);
          overlayMap.delete(id);
        } else if (!activeIds.has(id)) {
          ov.setPosition(undefined);
        }
      });
    };

    renderOverlays(true);

    const listener = () => renderOverlays(false);
    map.getView().on("change:resolution", listener);

    return () => {
      map.getView().un("change:resolution", listener);
    };
  }, [
    mapRef,
    drawnFeatures,
    parentsMap,
    hiddenFeatures,
    selectedDate,
    activeDepartment,
    layerVisibility.pointLabels,
    layerVisibility.inspecciones,
  ]);

  // Limpieza total al desmontar el componente del mapa
  useEffect(() => {
    const map = mapRef.current;
    const overlayMap = overlayMapRef.current;
    return () => {
      if (map) {
        overlayMap.forEach((ov) => map.removeOverlay(ov));
      }
      overlayMap.clear();
    };
  }, [mapRef]);

  return { labelOverlaysRef: overlayMapRef };
};
