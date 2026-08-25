import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import TextSymbol from "@arcgis/core/symbols/TextSymbol";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol";
import { execute as centroidExecute } from "@arcgis/core/geometry/operators/centroidOperator";
import { buildParentsMap } from "./spatialUtils";
import { symbolForType } from "./mapUtils";
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

  const validIds = new Set(drawnFeatures.map((f) => String(f.id)));
  const toRemove: Graphic[] = [];
  layer.graphics.forEach((g) => {
    if (g.attributes?.isLabel) {
      const parentId = g.attributes?.parentId;
      if (parentId && !validIds.has(String(parentId)) && !g.attributes?.title?.startsWith("Importado")) {
        toRemove.push(g);
      }
    } else {
      const featId = g.attributes?.id ?? (g as any).uid;
      if (featId && !validIds.has(String(featId)) && !g.attributes?.title?.startsWith("Importado")) {
        toRemove.push(g);
      }
    }
  });
  toRemove.forEach((g) => layer.remove(g));

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
  _dateStr?: string,
  _activeDepartment?: DepartmentView,
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
  _dateStr?: string,
  _activeDepartment?: DepartmentView,
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
  const validIds = new Set(importedFeatures.map((f) => String(f.id)));
  const toRemove: Graphic[] = [];
  layer.graphics.forEach((g) => {
    const isImported = String(g.attributes?.title || "").startsWith("Importado");
    if (isImported) {
      const featId = g.attributes?.id ?? (g as any).uid;
      const parentId = g.attributes?.parentId;
      if (g.attributes?.isLabel) {
        if (parentId && !validIds.has(String(parentId))) {
          toRemove.push(g);
        }
      } else if (featId && !validIds.has(String(featId))) {
        toRemove.push(g);
      }
    }
  });
  toRemove.forEach((g) => layer.remove(g));

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

export function syncInspeccionesToGraphics(
  layer: GraphicsLayer,
  records: any[],
  visible: boolean,
): void {
  layer.visible = visible;
  layer.removeAll();

  if (!visible || records.length === 0) return;

  records.forEach((r) => {
    if (!r.latitude || !r.longitude) return;

    const rLower = String(r.riesgo_color || "").toLowerCase();
    const isRed = rLower.includes("rojo") || rLower.includes("roja") || rLower.includes("alto") || rLower.includes("insegur");
    const isYellow = rLower.includes("amarillo") || rLower.includes("amarilla") || rLower.includes("medio") || rLower.includes("precau");
    const color = isRed ? "#ef4444" : isYellow ? "#f59e0b" : "#22c55e";

    const symbol = new SimpleMarkerSymbol({
      style: "circle",
      color,
      size: 7,
      outline: { color: [15, 23, 42, 0.8], width: 1 },
    });

    const cleanStr = (val?: string) => {
      if (!val) return "";
      const s = String(val).replace(/_/g, " ").replace(/\s+/g, " ").trim();
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
    };

    const g = new Graphic({
      geometry: {
        type: "point",
        longitude: r.longitude,
        latitude: r.latitude,
        spatialReference: { wkid: 4326 },
      } as any,
      attributes: {
        nombre_edificacion: cleanStr(r.nombre_edificacion) || "Inspección de Edificación",
        uso: cleanStr(r.uso) || "No especificado",
        tipo_estructura: cleanStr(r.tipo_estructura) || "No especificado",
        evaluacion_riesgo: cleanStr(r.evaluacion_riesgo) || "Sin evaluación registrada",
        riesgo_color: r.riesgo_color || "Sin clasificar",
        municipio: cleanStr(r.municipio) || "",
        parroquia: cleanStr(r.parroquia) || "",
        estado: cleanStr(r.estado) || "",
        fecha: r.fecha || "Sin fecha",
      },
      symbol,
      popupTemplate: {
        title: "<span style='font-size:14px; font-weight:800; color:#f8fafc;'>{riesgo_color}</span>",
        actions: [],
        content: `
          <div style="font-family: system-ui, -apple-system, sans-serif; font-size: 12px; color: #f8fafc; padding: 2px 0;">
            <div style="margin-bottom: 8px; font-size: 13px; font-weight: 700; color: #38bdf8;">
              {nombre_edificacion}
            </div>
            <p style="margin: 4px 0; color: #e2e8f0; line-height: 1.4;"><b style="color: #94a3b8;">Uso:</b> {uso}</p>
            <p style="margin: 4px 0; color: #e2e8f0; line-height: 1.4;"><b style="color: #94a3b8;">Estructura:</b> {tipo_estructura}</p>
            <p style="margin: 4px 0; color: #e2e8f0; line-height: 1.4;"><b style="color: #94a3b8;">Evaluación:</b> {evaluacion_riesgo}</p>
            <hr style="margin: 8px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.15);" />
            <p style="margin: 4px 0; color: #cbd5e1; font-size: 11px;"><b style="color: #94a3b8;">Ubicación:</b> {municipio}, {parroquia} ({estado})</p>
            <p style="margin: 4px 0; color: #fbbf24; font-size: 11px; font-weight: 600;"><b style="color: #94a3b8;">Fecha de Inspección:</b> {fecha}</p>
          </div>
        `,
      },
    });

    layer.add(g);
  });
}
