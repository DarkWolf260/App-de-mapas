import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import { execute as centroidExecute } from "@arcgis/core/geometry/operators/centroidOperator";
import { buildParentsMap } from "./spatialUtils";
import { symbolForType, getLabelText } from "./mapUtils";
import { PALETTE } from "./colorUtils";
import type { DrawnFeature, LayerVisibility, DepartmentView } from "../types";

export function syncDrawnFeaturesToGraphics(
  drawnFeatures: DrawnFeature[],
  hiddenFeatures: Record<string, boolean>,
  layerVisibility: LayerVisibility,
  currentZoom: number,
  layer: GraphicsLayer,
  dateStr?: string,
  activeDepartment?: DepartmentView,
  bare?: boolean,
): void {
  const effectiveZoom = bare ? 999 : currentZoom;
  const { parentsMap, polygonAreas } = buildParentsMap(drawnFeatures);

  drawnFeatures.forEach((feat) => {
    const g = layer.graphics.find((x) => String((x as any).uid) === String(feat.id) || String(x.attributes?.id) === String(feat.id));
    const isHidden = !!hiddenFeatures[String(feat.id)];
    const isNestedArea = feat.type === "polygon" && (parentsMap as any)[feat.id] !== undefined;
    const shouldHideNested = isNestedArea && layerVisibility.hideNestedAreas;
    const featColor = feat.color || "#3b82f6";

    if (g) {
      g.visible = !isHidden && !shouldHideNested;
      const storedColor = g.attributes?._color;
      if (storedColor !== featColor) {
        g.symbol = symbolForType(feat.type, featColor);
        g.attributes = { ...g.attributes, _color: featColor };
      }

      const label = layer.graphics.find((x) => x.attributes?.isLabel && String(x.attributes?.parentId) === String(feat.id));
      if (label) {
        syncExistingLabel(label, feat, g, parentsMap as any, effectiveZoom, layerVisibility, isHidden, shouldHideNested, dateStr, activeDepartment);
      }
    } else {
      addFeatureGraphic(feat, hiddenFeatures, layerVisibility, effectiveZoom, parentsMap as any, isHidden, shouldHideNested, layer, dateStr, activeDepartment);
    }
  });

  reorderGraphics(drawnFeatures, polygonAreas, layer);
}

function syncExistingLabel(
  label: Graphic,
  feat: DrawnFeature,
  g: Graphic,
  parentsMap: Record<string | number, any>,
  currentZoom: number,
  layerVisibility: LayerVisibility,
  isHidden: boolean,
  shouldHideNested: boolean,
  dateStr?: string,
  activeDepartment?: DepartmentView,
): void {
  const isPolygonLabel = label.attributes?.isPolygonLabel;
  const isSubpolygon = isPolygonLabel && parentsMap[feat.id] !== undefined;
  const requiredZoom = isPolygonLabel && !isSubpolygon ? 14 : 16;
  const isZoomOk = currentZoom !== undefined && !isNaN(currentZoom) && currentZoom >= requiredZoom;

  if (isPolygonLabel) {
    label.visible = !isHidden && !shouldHideNested && layerVisibility.polygonLabels && isZoomOk;
  } else {
    label.visible = !isHidden && layerVisibility.pointLabels && isZoomOk;
  }

  if (feat.type === "polygon" && g.geometry) {
    label.geometry = centroidExecute(g.geometry);
  }

  if (g.attributes?.title !== feat.title) {
    g.attributes = { ...g.attributes, title: feat.title };
  }

  if (label.symbol) {
    const ts = label.symbol as TextSymbol;
    const isPoint = feat.geojsonGeometry?.type === "Point";
    const labelText = feat.title;
    if (ts.text !== labelText) {
      const clone = ts.clone();
      clone.text = labelText;
      clone.backgroundColor = null;
      clone.borderLineColor = null;
      clone.borderLineSize = null;
      clone.haloColor = "black" as any;
      clone.haloSize = "1.5px" as any;
      clone.yoffset = isPoint ? 12 : 0;
      label.symbol = clone;
    }
  }
}

function addFeatureGraphic(
  feat: DrawnFeature,
  hiddenFeatures: Record<string, boolean>,
  layerVisibility: LayerVisibility,
  currentZoom: number,
  parentsMap: Record<string | number, any>,
  isHidden: boolean,
  shouldHideNested: boolean,
  layer: GraphicsLayer,
  dateStr?: string,
  activeDepartment?: DepartmentView,
): void {
  const geomCfg = convertGeoJSONGeometry(feat);
  if (!geomCfg) return;

  const featColor = feat.color || "#3b82f6";
  const ng = new Graphic({
    geometry: geomCfg as any,
    attributes: { id: feat.id, title: feat.title, _color: featColor },
    symbol: symbolForType(feat.type, featColor),
    visible: !isHidden && !shouldHideNested,
    popupTemplate: { title: "<b>{title}</b>", content: "<div style=\"font:13px sans-serif;color:#0f172a;padding:4px\">Elemento guardado.</div>" },
  });
  layer.add(ng);

  if (feat.geojsonGeometry && (feat.geojsonGeometry.type === "Point" || feat.geojsonGeometry.type === "Polygon")) {
    const isPolyLabel = feat.geojsonGeometry.type === "Polygon";
    const isPoint = feat.geojsonGeometry.type === "Point";
    const labelGeom = isPoint ? ng.geometry!.clone() : centroidExecute(ng.geometry!);
    const labelText = feat.title;

    const labelSym = new TextSymbol({
      text: labelText,
      color: "white",
      backgroundColor: null,
      borderLineColor: null,
      borderLineSize: null,
      haloColor: "black" as any,
      haloSize: "1.5px" as any,
      font: { size: 10, family: "sans-serif", weight: "bold" },
      yoffset: isPoint ? 12 : 0,
    });

    const isSubpolygon = isPolyLabel && parentsMap[feat.id] !== undefined;
    const requiredZoom = isPolyLabel && !isSubpolygon ? 14 : 16;
    const isZoomOk = currentZoom !== undefined && !isNaN(currentZoom) && currentZoom >= requiredZoom;

    layer.add(new Graphic({
      geometry: labelGeom,
      symbol: labelSym,
      visible: !isHidden && !shouldHideNested && (isPolyLabel ? layerVisibility.polygonLabels && isZoomOk : layerVisibility.pointLabels && isZoomOk),
      attributes: { isLabel: true, parentId: feat.id, isPolygonLabel: isPolyLabel },
    }));
  }
}

function convertGeoJSONGeometry(feat: DrawnFeature): any {
  if (!feat.geojsonGeometry) return null;
  const coords = feat.geojsonGeometry.coordinates;
  if (feat.geojsonGeometry.type === "Point") {
    return { type: "point", longitude: (coords as number[])[0], latitude: (coords as number[])[1], spatialReference: { wkid: 4326 } };
  }
  if (feat.geojsonGeometry.type === "LineString") {
    return { type: "polyline", paths: [coords], spatialReference: { wkid: 4326 } };
  }
  if (feat.geojsonGeometry.type === "Polygon") {
    return { type: "polygon", rings: coords, spatialReference: { wkid: 4326 } };
  }
  return null;
}

function reorderGraphics(
  drawnFeatures: DrawnFeature[],
  polygonAreas: Record<number, number>,
  layer: GraphicsLayer
): void {
  if (!drawnFeatures) return;
  const polys = drawnFeatures.filter((f) => f.type === "polygon").map((f) => ({ f, area: polygonAreas[f.id] ?? 0 }));
  polys.sort((a, b) => b.area - a.area);
  const sortedPolys = polys.map((p) => p.f);
  const lines = drawnFeatures.filter((f) => f.type === "polyline");
  const pts = drawnFeatures.filter((f) => f.type === "point");
  const drawingOrdered = [...sortedPolys, ...lines, ...pts];

  drawingOrdered.forEach((feat, index) => {
    const g = layer.graphics.find((x) => String((x as any).uid) === String(feat.id) || String(x.attributes?.id) === String(feat.id));
    if (g) layer.graphics.reorder(g, index);
  });
  drawingOrdered.forEach((feat, index) => {
    const label = layer.graphics.find((x) => x.attributes?.isLabel && String(x.attributes?.parentId) === String(feat.id));
    if (label) layer.graphics.reorder(label, drawingOrdered.length + index);
  });
}

export function syncImportedFeatures(
  importedFeatures: DrawnFeature[],
  layerVisibility: LayerVisibility,
  viewRef: React.MutableRefObject<MapView | null>,
  layer: GraphicsLayer
): void {
  importedFeatures.forEach((feat) => {
    if (layer.graphics.some((g) => String((g as any).uid) === String(feat.id) || String(g.attributes?.id) === String(feat.id))) return;

    const geomCfg = convertGeoJSONGeometry(feat);
    if (!geomCfg) return;

    const ng = new Graphic({
      geometry: geomCfg as any,
      attributes: { id: feat.id, title: feat.title || `Importado ${feat.type}`, _color: PALETTE[0].hex },
      symbol: symbolForType(feat.geojsonGeometry?.type ?? feat.type, PALETTE[0].hex),
      popupTemplate: { title: "<b>{title}</b>", content: "<div style=\"font:13px sans-serif;color:#0f172a;padding:4px\">Importado via GeoJSON.</div>" },
    });
    layer.add(ng);

    if (feat.geojsonGeometry?.type === "Point") {
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
      layer.add(new Graphic({
        geometry: ng.geometry!.clone(),
        symbol: labelSym,
        visible: isZoomOk && layerVisibility.pointLabels,
        attributes: { isLabel: true, parentId: feat.id, isPolygonLabel: false },
      }));
    }
  });
}
