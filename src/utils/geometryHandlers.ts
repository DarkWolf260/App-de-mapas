import type { FeatureType, GeoJSONGeometry } from "../types";

export interface GeometryHandler {
  type: FeatureType;

  /** Spanish label: "Punto", "Poligono", "Linea" */
  typeLabel: string;

  /** GeoJSON geometry type */
  geoJSONType: GeoJSONGeometry["type"];

  /** Whether this feature type is a sector (polygon/polyline) */
  isSector: boolean;

  /** Whether labels should be rendered for this type */
  hasLabels: boolean;

  /** Min zoom threshold for labels to appear */
  labelZoomThreshold: number;

  /** Whether to use centroid for label placement (true for polygons) */
  useCentroidForLabel: boolean;

  /** Vertical offset in pixels for the label symbol */
  labelYOffset: number;

  /** Whether the "collapsed building" feature is relevant */
  supportsCollapsedBuilding: boolean;

  /** Whether the "History" tab should be available */
  hasHistoryTab: boolean;

  /** Whether the "Contained" tab should be available */
  hasContainedTab: boolean;

  /** CSS color variable or hex string for UI borders/accent */
  accentColor: string;

  /** Extract the first coordinate pair for display (e.g. "lon, lat") */
  getFirstCoordinate(geometry: GeoJSONGeometry): [number, number] | null;

  /** Label for the coordinate display */
  coordinateLabel: string;
}

const pointHandler: GeometryHandler = {
  type: "point",
  typeLabel: "Punto",
  geoJSONType: "Point",
  isSector: false,
  hasLabels: true,
  labelZoomThreshold: 16,
  useCentroidForLabel: false,
  labelYOffset: 12,
  supportsCollapsedBuilding: true,
  hasHistoryTab: true,
  hasContainedTab: false,
  accentColor: "var(--color-green)",
  getFirstCoordinate(geometry) {
    const coords = geometry.coordinates as number[];
    return coords?.length >= 2 ? [coords[0], coords[1]] : null;
  },
  coordinateLabel: "Ubicación",
};

const polygonHandler: GeometryHandler = {
  type: "polygon",
  typeLabel: "Poligono",
  geoJSONType: "Polygon",
  isSector: true,
  hasLabels: true,
  labelZoomThreshold: 14,
  useCentroidForLabel: true,
  labelYOffset: 0,
  supportsCollapsedBuilding: false,
  hasHistoryTab: false,
  hasContainedTab: true,
  accentColor: "var(--color-info)",
  getFirstCoordinate(geometry) {
    const rings = geometry.coordinates as number[][][];
    return rings?.[0]?.[0]?.length >= 2 ? [rings[0][0][0], rings[0][0][1]] : null;
  },
  coordinateLabel: "Primer vértice",
};

const polylineHandler: GeometryHandler = {
  type: "polyline",
  typeLabel: "Linea",
  geoJSONType: "LineString",
  isSector: true,
  hasLabels: false,
  labelZoomThreshold: 16,
  useCentroidForLabel: false,
  labelYOffset: 0,
  supportsCollapsedBuilding: false,
  hasHistoryTab: false,
  hasContainedTab: false,
  accentColor: "var(--color-purple)",
  getFirstCoordinate(geometry) {
    const coords = geometry.coordinates as number[][];
    return coords?.[0]?.length >= 2 ? [coords[0][0], coords[0][1]] : null;
  },
  coordinateLabel: "Punto inicial",
};

/** Returns the GeometryHandler for a given feature type string. */
export function getGeometryHandler(type: string): GeometryHandler {
  if (type === "point" || type === "Point") return pointHandler;
  if (type === "polygon" || type === "Polygon" || type === "area") return polygonHandler;
  if (type === "polyline" || type === "LineString" || type === "line" || type === "multipolygon") return polylineHandler;
  return pointHandler; // default
}

/** Returns the GeometryHandler based on a GeoJSON geometry. */
export function getHandlerFromGeoJSON(geometry?: GeoJSONGeometry | null): GeometryHandler {
  if (!geometry) return pointHandler;
  if (geometry.type === "Point") return pointHandler;
  if (geometry.type === "Polygon") return polygonHandler;
  if (geometry.type === "LineString") return polylineHandler;
  return pointHandler;
}

/** Returns the handler for a DrawnFeature-like object. */
export function getFeatureHandler(feat?: { type?: string; featureType?: string; geojsonGeometry?: { type?: string } } | null): GeometryHandler {
  if (!feat) return pointHandler;
  return getGeometryHandler(feat.featureType || feat.geojsonGeometry?.type || feat.type || "point");
}
