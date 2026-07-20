import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils";
import type { DrawnFeature } from "../App";

/**
 * Convierte una geometría de ArcGIS en una estructura GeoJSON compatible
 * proyectando al vuelo de Web Mercator a coordenadas geográficas (WGS84)
 */
export const geoToJSON = (geometry: any): any => {
  if (!geometry) return null;
  
  const geo = geometry.spatialReference?.isWebMercator
    ? webMercatorUtils.webMercatorToGeographic(geometry)
    : geometry;

  if (geo.type === "point") {
    const pt = geo as any;
    return { type: "Point", coordinates: [pt.longitude, pt.latitude] };
  }
  
  if (geo.type === "polyline") {
    const pl = geo as any;
    const cleanCoords = JSON.parse(JSON.stringify(pl.paths[0] || []));
    return { type: "LineString", coordinates: cleanCoords };
  }
  
  if (geo.type === "polygon") {
    const pg = geo as any;
    const cleanCoords = JSON.parse(JSON.stringify(pg.rings || []));
    return { type: "Polygon", coordinates: cleanCoords };
  }
  
  return null;
};

/**
 * Calcula el área de un polígono 2D en coordenadas geográficas utilizando la fórmula de Shoelace.
 */
export const calculatePolygonArea = (coords: number[][][]): number => {
  if (!coords || coords.length === 0 || !coords[0]) return 0;
  let area = 0;
  const ptsRing = coords[0];
  for (let i = 0; i < ptsRing.length; i++) {
    const j = (i + 1) % ptsRing.length;
    area += ptsRing[i][0] * ptsRing[j][1] - ptsRing[j][0] * ptsRing[i][1];
  }
  return Math.abs(area) / 2;
};

/**
 * Test de inclusión de punto en polígono (Ray Casting / Jordan Curve Theorem).
 */
export const isPointInPolygon = (x: number, y: number, vs: number[][]): boolean => {
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Analiza el conjunto de geometrías dibujadas y determina la relación de inclusión
 * espacial jerárquica (qué punto/polígono está contenido dentro de qué otro polígono más pequeño).
 */
export const buildParentsMap = (drawnFeatures: DrawnFeature[]): {
  parentsMap: Record<string | number, string | number>;
  polygonAreas: Record<string | number, number>;
} => {
  const polys = drawnFeatures.filter((f) => f.type === "polygon");
  const polygonAreas: Record<string | number, number> = {};
  
  polys.forEach((f) => {
    polygonAreas[f.id] = calculatePolygonArea(f.geojsonGeometry?.coordinates as number[][][]);
  });

  const parentsMap: Record<string | number, string | number> = {};
  
  drawnFeatures.forEach((feat) => {
    let bestParentId: string | number | null = null;
    let minArea = Infinity;
    const innerArea = feat.type === "polygon" ? (polygonAreas[feat.id] ?? 0) : 0;

    polys.forEach((poly) => {
      if (poly.id === feat.id) return;
      if (feat.type === "polygon" && (polygonAreas[poly.id] ?? 0) <= innerArea) return;

      const polyCoords = poly.geojsonGeometry?.coordinates as number[][][];
      if (!polyCoords || polyCoords.length === 0 || !polyCoords[0]) return;

      let isContained = false;
      const vs = polyCoords[0];

      if (feat.type === "point" && feat.geojsonGeometry?.type === "Point") {
        const ptCoords = feat.geojsonGeometry.coordinates as number[];
        if (ptCoords) {
          isContained = isPointInPolygon(ptCoords[0], ptCoords[1], vs);
        }
      } else if (feat.type === "polyline" && feat.geojsonGeometry?.type === "LineString") {
        const lineCoords = feat.geojsonGeometry.coordinates as number[][];
        if (lineCoords) {
          isContained = lineCoords.every((pt) => isPointInPolygon(pt[0], pt[1], vs));
        }
      } else if (feat.type === "polygon" && feat.geojsonGeometry?.type === "Polygon") {
        const innerPolyCoords = feat.geojsonGeometry.coordinates as number[][][];
        if (innerPolyCoords && innerPolyCoords[0]) {
          isContained = innerPolyCoords[0].every((pt) => isPointInPolygon(pt[0], pt[1], vs));
        }
      }

      if (isContained) {
        const area = polygonAreas[poly.id] ?? Infinity;
        if (area < minArea) {
          minArea = area;
          bestParentId = poly.id;
        }
      }
    });

    if (bestParentId !== null) {
      parentsMap[feat.id] = bestParentId;
    }
  });

  return { parentsMap, polygonAreas };
};
