import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { fromLonLat } from "ol/proj";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import { buildParentsMap } from "./spatialUtils";
import { isWorkFeatureActive } from "./htmlLabelBuilder";
import { PALETTE } from "./colorUtils";
import type { DrawnFeature, LayerVisibility, DepartmentView, InspeccionRecord } from "../types";

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

export function syncDrawnFeaturesToGraphics(
  drawnFeatures: DrawnFeature[],
  hiddenFeatures: Record<string, boolean>,
  layerVisibility: LayerVisibility,
  _currentZoom: number,
  sourceOrLayer: VectorSource | VectorLayer<VectorSource> | any,
  dateStr?: string,
  _activeDepartment?: DepartmentView,
  _bare?: boolean,
): void {
  const source: VectorSource = sourceOrLayer instanceof VectorSource
    ? sourceOrLayer
    : sourceOrLayer?.getSource?.() || sourceOrLayer;

  if (!source) return;

  source.clear();

  const { parentsMap } = buildParentsMap(drawnFeatures);
  const format = new GeoJSON();

  drawnFeatures.forEach((feat) => {
    if (!feat.geojsonGeometry) return;
    const isHidden = !!hiddenFeatures[String(feat.id)];
    const isNestedArea = feat.type === "polygon" && parentsMap[feat.id] !== undefined;
    const shouldHideNested = isNestedArea && layerVisibility.hideNestedAreas;

    if (isHidden || shouldHideNested) return;

    const hasOverlay = isWorkFeatureActive(feat, parentsMap, dateStr, drawnFeatures);

    try {
      const parsedFeatures = format.readFeatures(
        {
          type: "Feature",
          geometry: feat.geojsonGeometry,
          properties: {
            id: feat.id,
            title: feat.title || "",
            color: feat.color || "#f97316",
            type: feat.type,
            tipo: "drawn",
            hasOverlay,
            feat,
          },
        },
        {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }
      );

      parsedFeatures.forEach((f) => {
        f.setId(feat.id);
        source.addFeature(f);
      });
    } catch (err) {
      console.warn("[OpenLayers Sync] Error al parsear feature:", feat.id, err);
    }
  });
}

export function syncImportedFeatures(
  importedFeatures: DrawnFeature[],
  layerVisibility: LayerVisibility,
  _viewRef: any,
  sourceOrLayer: VectorSource | VectorLayer<VectorSource> | any
): void {
  const source: VectorSource = sourceOrLayer instanceof VectorSource
    ? sourceOrLayer
    : sourceOrLayer?.getSource?.() || sourceOrLayer;

  if (!source || !importedFeatures || importedFeatures.length === 0) return;

  const format = new GeoJSON();

  importedFeatures.forEach((feat) => {
    if (!feat.geojsonGeometry) return;
    // Evitar duplicados
    const existing = source.getFeatureById(`imported_${feat.id}`);
    if (existing) return;

    try {
      const parsed = format.readFeatures(
        {
          type: "Feature",
          geometry: feat.geojsonGeometry,
          properties: {
            id: feat.id,
            title: feat.title || `Importado ${feat.type}`,
            color: feat.color || PALETTE[0].hex,
            type: feat.type,
            tipo: "imported",
            feat,
          },
        },
        {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        }
      );

      parsed.forEach((f) => {
        f.setId(`imported_${feat.id}`);
        source.addFeature(f);
      });
    } catch (err) {
      console.warn("[OpenLayers Sync] Error al importar feature:", feat.id, err);
    }
  });
}

export function syncInspeccionesToGraphics(
  sourceOrLayer: VectorSource | VectorLayer<VectorSource> | any,
  records: InspeccionRecord[],
  visible: boolean,
): void {
  const source: VectorSource = sourceOrLayer instanceof VectorSource
    ? sourceOrLayer
    : sourceOrLayer?.getSource?.() || sourceOrLayer;

  if (!source) return;

  source.clear();

  if (!visible || !records || records.length === 0) return;

  const cleanStr = (val?: string) => {
    if (!val) return "";
    const s = String(val).replace(/_/g, " ").replace(/\s+/g, " ").trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  };

  const olFeatures: Feature[] = [];

  records.forEach((r) => {
    if (!r.latitude || !r.longitude) return;

    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    const rLower = String(r.riesgo_color || "").toLowerCase();
    const isRed = rLower.includes("rojo") || rLower.includes("roja") || rLower.includes("alto") || rLower.includes("insegur");
    const isYellow = rLower.includes("amarillo") || rLower.includes("amarilla") || rLower.includes("medio") || rLower.includes("precau");
    const color = isRed ? "#ef4444" : isYellow ? "#f59e0b" : "#22c55e";

    const feat = new Feature({
      geometry: new Point(fromLonLat([lon, lat])),
      nombre: cleanStr(r.nombre_edificacion) || "Inspección de Edificación",
      uso: cleanStr(r.uso) || "No especificado",
      tipo_estructura: cleanStr(r.tipo_estructura) || "No especificado",
      evaluacion_riesgo: cleanStr(r.evaluacion_riesgo) || "Sin evaluación",
      riesgo: r.riesgo_color || "Sin clasificar",
      riesgo_color: r.riesgo_color || "Sin clasificar",
      color,
      municipio: cleanStr(r.municipio) || "",
      parroquia: cleanStr(r.parroquia) || "",
      estado: cleanStr(r.estado) || "",
      lugar: `${cleanStr(r.municipio) || ""}, ${cleanStr(r.parroquia) || ""}`,
      fecha: r.fecha || "Sin fecha",
      tipo: "inspeccion",
      rawRecord: r,
    });

    olFeatures.push(feat);
  });

  source.addFeatures(olFeatures);
}
