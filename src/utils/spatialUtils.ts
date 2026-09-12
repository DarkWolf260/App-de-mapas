import type { DrawnFeature } from "../types";

/**
 * Convierte una estructura de geometría en GeoJSON estándar
 */
export const geoToJSON = (geom: any): { type: string; coordinates: any } | null => {
  if (!geom || typeof geom !== "object") return null;

  if (typeof geom.getCoordinates === "function" && typeof geom.getType === "function") {
    return {
      type: geom.getType(),
      coordinates: geom.getCoordinates(),
    };
  }

  if (geom.type === "point" || geom.type === "Point") {
    if (geom.coordinates) return { type: "Point", coordinates: geom.coordinates };
    if (typeof geom.longitude === "number" && typeof geom.latitude === "number") {
      return { type: "Point", coordinates: [geom.longitude, geom.latitude] };
    }
  }
  if (geom.type === "polyline" || geom.type === "LineString") {
    if (geom.coordinates) return { type: "LineString", coordinates: geom.coordinates };
    if (Array.isArray(geom.paths)) {
      return { type: "LineString", coordinates: geom.paths[0] || [] };
    }
  }
  if (geom.type === "polygon" || geom.type === "Polygon") {
    if (geom.coordinates) return { type: "Polygon", coordinates: geom.coordinates };
    if (Array.isArray(geom.rings)) {
      return { type: "Polygon", coordinates: geom.rings };
    }
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

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calcula la caja envolvente (Bounding Box) O(N) de un anillo de vértices.
 */
export const getPolygonBoundingBox = (vs: number[][]): BoundingBox | null => {
  if (!vs || vs.length === 0 || !vs[0]) return null;
  let minX = vs[0][0];
  let maxX = vs[0][0];
  let minY = vs[0][1];
  let maxY = vs[0][1];

  for (let i = 1; i < vs.length; i++) {
    const x = vs[i][0];
    const y = vs[i][1];
    if (x < minX) minX = x;
    else if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    else if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
};

/**
 * Test de inclusión de punto en polígono (Ray Casting / Jordan Curve Theorem)
 * con descarte previo O(1) por Bounding Box.
 */
export const isPointInPolygon = (x: number, y: number, vs: number[][], bbox?: BoundingBox | null): boolean => {
  if (!vs || vs.length === 0) return false;

  const box = bbox !== undefined ? bbox : getPolygonBoundingBox(vs);
  if (box && (x < box.minX || x > box.maxX || y < box.minY || y > box.maxY)) {
    return false;
  }

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
  const polygonBBoxes: Record<string | number, BoundingBox | null> = {};
  
  polys.forEach((f) => {
    const coords = f.geojsonGeometry?.coordinates as number[][][];
    polygonAreas[f.id] = calculatePolygonArea(coords);
    polygonBBoxes[f.id] = coords && coords[0] ? getPolygonBoundingBox(coords[0]) : null;
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
      const bbox = polygonBBoxes[poly.id];

      if (feat.type === "point") {
        const ptCoords = feat.geojsonGeometry?.coordinates && Array.isArray(feat.geojsonGeometry.coordinates)
          ? (feat.geojsonGeometry.coordinates as number[])
          : (feat as any).coordinates?.longitude !== undefined
          ? [(feat as any).coordinates.longitude, (feat as any).coordinates.latitude]
          : null;
        if (ptCoords) {
          isContained = isPointInPolygon(ptCoords[0], ptCoords[1], vs, bbox);
        }
      } else if (feat.type === "polyline" && feat.geojsonGeometry?.coordinates) {
        const lineCoords = feat.geojsonGeometry.coordinates as number[][];
        if (Array.isArray(lineCoords)) {
          isContained = lineCoords.every((pt) => isPointInPolygon(pt[0], pt[1], vs, bbox));
        }
      } else if (feat.type === "polygon" && feat.geojsonGeometry?.coordinates) {
        const innerPolyCoords = feat.geojsonGeometry.coordinates as number[][][];
        if (Array.isArray(innerPolyCoords) && innerPolyCoords[0]) {
          isContained = innerPolyCoords[0].every((pt) => isPointInPolygon(pt[0], pt[1], vs, bbox));
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

export function computeContainedItems(
  activeFeat: DrawnFeature,
  sketchLayer: any,
  drawnFeatures: DrawnFeature[]
): DrawnFeature[] {
  const items: DrawnFeature[] = [];
  if (activeFeat.type !== "polygon") return items;

  const polyCoords = activeFeat.geojsonGeometry?.coordinates as number[][][];
  const vs = polyCoords && polyCoords[0] ? polyCoords[0] : null;

  if (vs) {
    const bbox = getPolygonBoundingBox(vs);
    for (const f of drawnFeatures) {
      if (String(f.id) === String(activeFeat.id)) continue;
      let isContained = false;
      if (f.type === "point") {
        const ptCoords = f.geojsonGeometry?.coordinates && Array.isArray(f.geojsonGeometry.coordinates)
          ? (f.geojsonGeometry.coordinates as number[])
          : (f as any).coordinates?.longitude !== undefined
          ? [(f as any).coordinates.longitude, (f as any).coordinates.latitude]
          : null;
        if (ptCoords) {
          isContained = isPointInPolygon(ptCoords[0], ptCoords[1], vs, bbox);
        }
      } else if (f.type === "polyline" && f.geojsonGeometry?.coordinates) {
        const lineCoords = f.geojsonGeometry.coordinates as number[][];
        if (Array.isArray(lineCoords)) {
          isContained = lineCoords.every((pt) => isPointInPolygon(pt[0], pt[1], vs, bbox));
        }
      } else if (f.type === "polygon" && f.geojsonGeometry?.coordinates) {
        const innerPolyCoords = f.geojsonGeometry.coordinates as number[][][];
        if (Array.isArray(innerPolyCoords) && innerPolyCoords[0]) {
          isContained = innerPolyCoords[0].every((pt) => isPointInPolygon(pt[0], pt[1], vs, bbox));
        }
      }
      if (isContained) {
        items.push(f);
      }
    }
    return items;
  }

  return items;
}

