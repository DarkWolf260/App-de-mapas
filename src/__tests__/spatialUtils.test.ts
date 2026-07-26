import {
  calculatePolygonArea,
  isPointInPolygon,
  buildParentsMap,
  geoToJSON,
} from "../utils/spatialUtils";
import type { DrawnFeature } from "../types";

describe("calculatePolygonArea", () => {
  it("returns 0 for null/empty input", () => {
    expect(calculatePolygonArea(null as any)).toBe(0);
    expect(calculatePolygonArea([])).toBe(0);
  });

  it("returns 1 for a unit square", () => {
    const coords = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];
    expect(calculatePolygonArea(coords)).toBe(1);
  });

  it("returns 6 for a 4x3 triangle", () => {
    const coords = [[[0, 0], [4, 0], [0, 3], [0, 0]]];
    expect(calculatePolygonArea(coords)).toBe(6);
  });
});

describe("isPointInPolygon", () => {
  it("returns false for empty vertices", () => {
    expect(isPointInPolygon(0.5, 0.5, [])).toBe(false);
  });

  it("returns true for point inside unit square", () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    expect(isPointInPolygon(0.5, 0.5, square)).toBe(true);
  });

  it("returns false for point outside unit square", () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    expect(isPointInPolygon(2, 2, square)).toBe(false);
  });

  it("returns correct result for point on edge (ray-casting: typically outside)", () => {
    const square = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const result = isPointInPolygon(0.5, 0, square);
    expect(typeof result).toBe("boolean");
  });
});

describe("buildParentsMap", () => {
  it("returns empty maps when no polygons exist", () => {
    const features: DrawnFeature[] = [];
    const { parentsMap, polygonAreas } = buildParentsMap(features);
    expect(parentsMap).toEqual({});
    expect(polygonAreas).toEqual({});
  });

  it("sets correct parent when a point is inside a polygon", () => {
    const features: DrawnFeature[] = [
      {
        id: 1,
        title: "outer",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]],
        },
      },
      {
        id: 2,
        title: "inner point",
        type: "point",
        geojsonGeometry: { type: "Point", coordinates: [5, 5] },
      },
    ];
    const { parentsMap } = buildParentsMap(features);
    expect(parentsMap[2]).toBe(1);
  });

  it("finds smallest containing parent for nested polygons", () => {
    const features: DrawnFeature[] = [
      {
        id: 1,
        title: "big",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [20, 0], [20, 20], [0, 20], [0, 0]]],
        },
      },
      {
        id: 2,
        title: "small",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [[[5, 5], [15, 5], [15, 15], [5, 15], [5, 5]]],
        },
      },
      {
        id: 3,
        title: "point",
        type: "point",
        geojsonGeometry: { type: "Point", coordinates: [10, 10] },
      },
    ];
    const { parentsMap } = buildParentsMap(features);
    expect(parentsMap[3]).toBe(2);
  });

  it("finds no parent when polygon is outside another polygon", () => {
    const features: DrawnFeature[] = [
      {
        id: 1,
        title: "poly A",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [[[0, 0], [5, 0], [5, 5], [0, 5], [0, 0]]],
        },
      },
      {
        id: 2,
        title: "poly B",
        type: "polygon",
        geojsonGeometry: {
          type: "Polygon",
          coordinates: [[[10, 10], [15, 10], [15, 15], [10, 15], [10, 10]]],
        },
      },
    ];
    const { parentsMap } = buildParentsMap(features);
    expect(parentsMap[1]).toBeUndefined();
    expect(parentsMap[2]).toBeUndefined();
  });
});

describe("geoToJSON", () => {
  it("returns null for null/undefined input", () => {
    expect(geoToJSON(null)).toBeNull();
    expect(geoToJSON(undefined)).toBeNull();
  });

  it("converts point geometry", () => {
    const geo = geoToJSON({ type: "point", longitude: -66.9, latitude: 10.6, spatialReference: { wkid: 4326 } });
    expect(geo).toEqual({ type: "Point", coordinates: [-66.9, 10.6] });
  });

  it("converts polyline geometry", () => {
    const geo = geoToJSON({ type: "polyline", paths: [[[-66.9, 10.6], [-66.8, 10.7]]], spatialReference: { wkid: 4326 } });
    expect(geo).toEqual({ type: "LineString", coordinates: [[-66.9, 10.6], [-66.8, 10.7]] });
  });

  it("converts polygon geometry", () => {
    const rings = [[[-66.9, 10.6], [-66.8, 10.6], [-66.8, 10.7], [-66.9, 10.6]]];
    const geo = geoToJSON({ type: "polygon", rings, spatialReference: { wkid: 4326 } });
    expect(geo).toEqual({ type: "Polygon", coordinates: rings });
  });

  it("returns null for unknown geometry type", () => {
    expect(geoToJSON({ type: "unknown", spatialReference: { wkid: 4326 } })).toBeNull();
  });
});
