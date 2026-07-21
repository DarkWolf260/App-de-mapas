import { useState } from "react";
import type { DrawnFeature } from "../types";
import { buildParentsMap } from "../utils/spatialUtils";

interface SpatialHierarchy {
  rootPoints: DrawnFeature[];
  rootLines: DrawnFeature[];
  rootPolygons: DrawnFeature[];
  pointsByParent: Map<number, DrawnFeature[]>;
  childrenMap: Map<number, DrawnFeature[]>;
  polygonAreas: Map<number, number>;
}

export function useSpatialHierarchy(drawnFeatures: DrawnFeature[]): SpatialHierarchy {
  const polys = drawnFeatures.filter((f) => f.type === "polygon");
  const points = drawnFeatures.filter((f) => f.type === "point");
  const lines = drawnFeatures.filter((f) => f.type === "polyline");

  const { parentsMap, polygonAreas: areasRecord } = buildParentsMap(drawnFeatures);

  const polygonAreas = new Map<number, number>();
  for (const [id, area] of Object.entries(areasRecord)) {
    polygonAreas.set(Number(id), area);
  }

  const parentsMapNative = new Map<number, number>();
  for (const [id, parentId] of Object.entries(parentsMap)) {
    parentsMapNative.set(Number(id), Number(parentId));
  }

  const childrenMap = new Map<number, DrawnFeature[]>();
  for (const [featId, parentId] of parentsMapNative.entries()) {
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    const feat = drawnFeatures.find((f) => f.id === featId);
    if (feat) childrenMap.get(parentId)!.push(feat);
  }

  const rootPoints = points.filter((pt) => !parentsMapNative.has(pt.id));
  const rootLines = lines.filter((l) => !parentsMapNative.has(l.id));
  const rootPolygons = polys.filter((p) => !parentsMapNative.has(p.id));

  const pointsByParent = new Map<number, DrawnFeature[]>();
  for (const pt of points) {
    const parentId = parentsMapNative.get(pt.id);
    if (parentId !== undefined) {
      if (!pointsByParent.has(parentId)) {
        pointsByParent.set(parentId, []);
      }
      pointsByParent.get(parentId)!.push(pt);
    }
  }

  return {
    rootPoints,
    rootLines,
    rootPolygons,
    pointsByParent,
    childrenMap,
    polygonAreas,
  };
}

export function useCollapsedGroups() {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    polygon: false,
    polyline: false,
    point: false,
  });

  const toggleGroupCollapse = (type: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return { collapsedGroups, toggleGroupCollapse };
}

export function useCollapsedChildren() {
  const [collapsedChildren, setCollapsedChildren] = useState<Record<number, boolean>>({});

  const toggleChildrenCollapse = (polyId: number) => {
    setCollapsedChildren((prev) => ({ ...prev, [polyId]: !prev[polyId] }));
  };

  return { collapsedChildren, toggleChildrenCollapse };
}
