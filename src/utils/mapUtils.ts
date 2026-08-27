import Basemap from "@arcgis/core/Basemap";
import TileLayer from "@arcgis/core/layers/TileLayer";
import type { DrawnFeature, DepartmentView } from "../types";
import { hexToRgb } from "./colorUtils";
import { getNormalizedGroupList } from "./logUtils";
import { getGeometryHandler } from "./geometryHandlers";

export const DEFAULT_CENTER: [number, number] = [-66.9303, 10.6011];
export const DEFAULT_ZOOM = 13;

export const getBasemapValue = (key: string): string | Basemap => {
  if (key === "satellite-free") {
    return new Basemap({
      baseLayers: [new TileLayer({ url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" })],
      title: "Satelital Gratis",
      id: "satellite-free",
    });
  }
  return key;
};

export const typeLabel = (type: string): string => getGeometryHandler(type).typeLabel;

export const makeSymbols = ([r, g, b]: [number, number, number]) => ({
  point: {
    type: "simple-marker" as const,
    color: [r, g, b, 0.9],
    outline: { color: [255, 255, 255, 0.8], width: 1.5 },
    size: "10px",
  },
  polyline: {
    type: "simple-line" as const,
    color: [r, g, b, 0.95],
    width: 3,
    style: "solid" as const,
  },
  polygon: {
    type: "simple-fill" as const,
    color: [r, g, b, 0.25],
    outline: { color: [r, g, b, 0.95], width: 2 },
  },
});

export const formatFeatureLabelText = (feat: DrawnFeature, todayStr: string, activeDepartment?: DepartmentView): string => {
  const handler = getGeometryHandler(feat.type);
  const todayLogs = feat.dailyLogs?.filter((l) =>
    l.date === todayStr && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
  ) || [];

  const parts: string[] = [];

  if (handler.hasLabels) {
    const groupItems: Array<{ name?: string; unit?: string }> = [];
    for (const todayLog of todayLogs) {
      const activeGroups = getNormalizedGroupList(todayLog);
      for (const g of activeGroups) {
        if (g.groupName?.trim() || g.unitOut?.trim()) {
          groupItems.push({ name: g.groupName?.trim(), unit: g.unitOut?.trim() });
        }
      }
    }

    if (groupItems.length > 0) {
      const onlyNames = groupItems.length > 2;
      const addedSet = new Set<string>();
      groupItems.forEach((item) => {
        const str = onlyNames ? (item.name || item.unit || "") : (item.name && item.unit ? `${item.name}, ${item.unit}` : item.name || item.unit || "");
        if (str && !addedSet.has(str)) {
          addedSet.add(str);
          parts.push(str);
        }
      });
    }
  }

  for (const todayLog of todayLogs) {
    const groups = getNormalizedGroupList(todayLog);
    let rescued = 0;
    let recovered = 0;
    let prehospital = 0;
    let transfers = 0;
    for (const g of groups) {
      rescued += parseInt(g.rescuedCount || "0", 10) || 0;
      recovered += parseInt(g.recoveredCount || "0", 10) || 0;
      prehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
      transfers += parseInt(g.transfersCount || "0", 10) || 0;
    }
    rescued += parseInt(todayLog.rescuedCount || "0", 10) || 0;
    recovered += parseInt(todayLog.recoveredCount || "0", 10) || 0;
    prehospital += parseInt(todayLog.prehospitalCareCount || "0", 10) || 0;
    transfers += parseInt(todayLog.transfersCount || "0", 10) || 0;

    if (rescued > 0) parts.push(`${rescued} Resc.`);
    if (recovered > 0) parts.push(`${recovered} Recup.`);
    if (prehospital > 0) parts.push(`${prehospital} Atenc.`);
    if (transfers > 0) parts.push(`${transfers} Trasl.`);
  }

  if (parts.length > 0) {
    return `${feat.title} (${parts.join(" | ")})`;
  }

  return feat.title;
};

export const getLabelText = (feat: DrawnFeature, dateStr?: string, activeDepartment?: DepartmentView): string => {
  const todayStr = dateStr || new Date().toLocaleDateString("en-CA");
  return formatFeatureLabelText(feat, todayStr, activeDepartment);
};

export const symbolForType = (type: string, color: string) => {
  const syms = makeSymbols(hexToRgb(color));
  if (type === "point") return syms.point;
  if (type === "polyline") return syms.polyline;
  return syms.polygon;
};
