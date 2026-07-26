import { renderHook } from "@testing-library/react";
import { useSpatialHierarchy, useCollapsedGroups, useCollapsedChildren } from "../hooks/useSpatialHierarchy";
import type { DrawnFeature } from "../types";
import { act } from "react";

describe("useSpatialHierarchy", () => {
  it("separates root points, lines, and polygons", () => {
    const features: DrawnFeature[] = [
      { id: 1, title: "poly", type: "polygon", geojsonGeometry: { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
      { id: 2, title: "pt", type: "point", geojsonGeometry: { type: "Point", coordinates: [20, 20] } },
      { id: 3, title: "line", type: "polyline", geojsonGeometry: { type: "LineString", coordinates: [[20, 20], [30, 30]] } },
    ];
    const { result } = renderHook(() => useSpatialHierarchy(features));
    expect(result.current.rootPolygons.length).toBe(1);
    expect(result.current.rootPoints.length).toBe(1);
    expect(result.current.rootLines.length).toBe(1);
  });

  it("identifies child points inside polygons", () => {
    const features: DrawnFeature[] = [
      { id: 1, title: "poly", type: "polygon", geojsonGeometry: { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] } },
      { id: 2, title: "pt", type: "point", geojsonGeometry: { type: "Point", coordinates: [5, 5] } },
      { id: 3, title: "pt-out", type: "point", geojsonGeometry: { type: "Point", coordinates: [20, 20] } },
    ];
    const { result } = renderHook(() => useSpatialHierarchy(features));
    expect(result.current.pointsByParent.has(1)).toBe(true);
    expect(result.current.pointsByParent.get(1)!.length).toBe(1);
    expect(result.current.pointsByParent.get(1)![0].id).toBe(2);
    expect(result.current.rootPoints.length).toBe(1);
    expect(result.current.rootPoints[0].id).toBe(3);
  });

  it("computes polygon areas", () => {
    const features: DrawnFeature[] = [
      { id: 1, title: "sq", type: "polygon", geojsonGeometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]] } },
    ];
    const { result } = renderHook(() => useSpatialHierarchy(features));
    expect(result.current.polygonAreas.get(1)).toBe(1);
  });
});

describe("useCollapsedGroups", () => {
  it("starts with all groups expanded", () => {
    const { result } = renderHook(() => useCollapsedGroups());
    expect(result.current.collapsedGroups.polygon).toBe(false);
    expect(result.current.collapsedGroups.polyline).toBe(false);
    expect(result.current.collapsedGroups.point).toBe(false);
  });

  it("toggles group collapse", () => {
    const { result } = renderHook(() => useCollapsedGroups());
    act(() => result.current.toggleGroupCollapse("polygon"));
    expect(result.current.collapsedGroups.polygon).toBe(true);
    act(() => result.current.toggleGroupCollapse("polygon"));
    expect(result.current.collapsedGroups.polygon).toBe(false);
  });
});

describe("useCollapsedChildren", () => {
  it("starts with empty collapsed children", () => {
    const { result } = renderHook(() => useCollapsedChildren());
    expect(result.current.collapsedChildren).toEqual({});
  });

  it("toggles children collapse for specific polygon", () => {
    const { result } = renderHook(() => useCollapsedChildren());
    act(() => result.current.toggleChildrenCollapse(1));
    expect(result.current.collapsedChildren[1]).toBe(true);
    act(() => result.current.toggleChildrenCollapse(1));
    expect(result.current.collapsedChildren[1]).toBe(false);
  });
});
