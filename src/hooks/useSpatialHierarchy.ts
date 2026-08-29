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
    const numId = Number(id);
    if (!isNaN(numId)) polygonAreas.set(numId, area);
  }

  const parentsMapNative = new Map<number | string, number | string>();
  for (const [id, parentId] of Object.entries(parentsMap)) {
    parentsMapNative.set(id, parentId);
    const numId = Number(id);
    if (!isNaN(numId)) parentsMapNative.set(numId, parentId);
  }

  const childrenMap = new Map<number | string, DrawnFeature[]>();
  for (const [featId, parentId] of parentsMapNative.entries()) {
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
      const numParent = Number(parentId);
      if (!isNaN(numParent) && !childrenMap.has(numParent)) {
        childrenMap.set(numParent, childrenMap.get(parentId)!);
      }
    }
    const feat = drawnFeatures.find((f) => String(f.id) === String(featId));
    if (feat && !childrenMap.get(parentId)!.some((item) => String(item.id) === String(feat.id))) {
      childrenMap.get(parentId)!.push(feat);
    }
  }

  const rootPoints = points.filter((pt) => !parentsMapNative.has(pt.id) && !parentsMapNative.has(String(pt.id)));
  const rootLines = lines.filter((l) => !parentsMapNative.has(l.id) && !parentsMapNative.has(String(l.id)));
  const rootPolygons = polys.filter((p) => !parentsMapNative.has(p.id) && !parentsMapNative.has(String(p.id)));

  const pointsByParent = new Map<number | string, DrawnFeature[]>();
  for (const pt of points) {
    const parentId = parentsMapNative.get(pt.id) ?? parentsMapNative.get(String(pt.id));
    if (parentId !== undefined) {
      if (!pointsByParent.has(parentId)) {
        pointsByParent.set(parentId, []);
        const numParent = Number(parentId);
        if (!isNaN(numParent)) {
          pointsByParent.set(numParent, pointsByParent.get(parentId)!);
        }
      }
      if (!pointsByParent.get(parentId)!.some((item) => String(item.id) === String(pt.id))) {
        pointsByParent.get(parentId)!.push(pt);
      }
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
