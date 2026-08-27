import { useState } from "react";
import type { DrawnFeature } from "../types";
import { buildParentsMap } from "../utils/spatialUtils";

interface SpatialHierarchy {
  rootPoints: DrawnFeature[];
  rootLines: DrawnFeature[];
  rootPolygons: DrawnFeature[];
  pointsByParent: Map<number | string, DrawnFeature[]>;
  childrenMap: Map<number | string, DrawnFeature[]>;
  polygonAreas: Map<number | string, number>;
}

export function useSpatialHierarchy(drawnFeatures: DrawnFeature[]): SpatialHierarchy {
  const polys = drawnFeatures.filter((f) => f.type === "polygon");
  const points = drawnFeatures.filter((f) => f.type === "point");
  const lines = drawnFeatures.filter((f) => f.type === "polyline");

  const { parentsMap, polygonAreas: areasRecord } = buildParentsMap(drawnFeatures);

  const polygonAreas = new Map<number | string, number>();
  for (const [id, area] of Object.entries(areasRecord)) {
    polygonAreas.set(id, area);
  }

  const parentsMapNative = new Map<number | string, number | string>();
  for (const [id, parentId] of Object.entries(parentsMap)) {
    parentsMapNative.set(id, parentId);
  }

  const childrenMap = new Map<number | string, DrawnFeature[]>();
  for (const [featId, parentId] of parentsMapNative.entries()) {
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    const feat = drawnFeatures.find((f) => String(f.id) === String(featId));
    if (feat) childrenMap.get(parentId)!.push(feat);
  }

  const rootPoints = points.filter((pt) => !parentsMapNative.has(pt.id));
  const rootLines = lines.filter((l) => !parentsMapNative.has(l.id));
  const rootPolygons = polys.filter((p) => !parentsMapNative.has(p.id));

  const pointsByParent = new Map<number | string, DrawnFeature[]>();
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
  const [collapsedChildren, setCollapsedChildren] = useState<Record<number | string, boolean>>({});

  const toggleChildrenCollapse = (polyId: number | string) => {
    setCollapsedChildren((prev) => ({ ...prev, [polyId]: !prev[polyId] }));
  };

  return { collapsedChildren, toggleChildrenCollapse };
}
