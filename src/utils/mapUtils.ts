import Basemap from "@arcgis/core/Basemap";
import TileLayer from "@arcgis/core/layers/TileLayer";
import type { DrawnFeature, DepartmentView } from "../types";
import { hexToRgb } from "./colorUtils";

export const DEFAULT_CENTER: [number, number] = [-66.9303, 10.6011];
export const DEFAULT_ZOOM = 14;

export const getBasemapValue = (key: string): string | Basemap => {
  if (key === "satellite-free") {
    const bm = new Basemap({
      baseLayers: [new TileLayer({ url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer" })],
      title: "Satelital Gratis",
      id: "satellite-free",
    });
    bm.load().catch(() => {});
    return bm;
  }
  return key;
};

export const typeLabel = (type: string): "Poligono" | "Linea" | "Punto" => {
  if (type === "polygon") return "Poligono";
  if (type === "polyline") return "Linea";
  return "Punto";
};

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
  const todayLogs = feat.dailyLogs?.filter((l) =>
    l.date === todayStr && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
  ) || [];

  const parts: string[] = [];
  const addedSet = new Set<string>();

  for (const todayLog of todayLogs) {
    if (feat.type === "point") {
      const g1 = todayLog.groupName?.trim();
      const u1 = todayLog.unitOut?.trim();
      const str1 = g1 && u1 ? `${g1}, ${u1}` : g1 || u1;
      if (str1 && !addedSet.has(str1)) { addedSet.add(str1); parts.push(str1); }

      const g2 = todayLog.groupName2?.trim();
      const u2 = todayLog.unitOut2?.trim();
      const str2 = g2 && u2 ? `${g2}, ${u2}` : g2 || u2;
      if (str2 && !addedSet.has(str2)) { addedSet.add(str2); parts.push(str2); }

      const g3 = todayLog.groupName3?.trim();
      const u3 = todayLog.unitOut3?.trim();
      const str3 = g3 && u3 ? `${g3}, ${u3}` : g3 || u3;
      if (str3 && !addedSet.has(str3)) { addedSet.add(str3); parts.push(str3); }

      const g4 = todayLog.groupName4?.trim();
      const u4 = todayLog.unitOut4?.trim();
      const str4 = g4 && u4 ? `${g4}, ${u4}` : g4 || u4;
      if (str4 && !addedSet.has(str4)) { addedSet.add(str4); parts.push(str4); }
    }

    const rescued = (parseInt(todayLog.rescuedCount || "0", 10) || 0) + (parseInt(todayLog.rescuedCount2 || "0", 10) || 0) + (parseInt(todayLog.rescuedCount3 || "0", 10) || 0) + (parseInt(todayLog.rescuedCount4 || "0", 10) || 0);
    const recovered = (parseInt(todayLog.recoveredCount || "0", 10) || 0) + (parseInt(todayLog.recoveredCount2 || "0", 10) || 0) + (parseInt(todayLog.recoveredCount3 || "0", 10) || 0) + (parseInt(todayLog.recoveredCount4 || "0", 10) || 0);
    const prehospital = (parseInt(todayLog.prehospitalCareCount || "0", 10) || 0) + (parseInt(todayLog.prehospitalCareCount2 || "0", 10) || 0) + (parseInt(todayLog.prehospitalCareCount3 || "0", 10) || 0) + (parseInt(todayLog.prehospitalCareCount4 || "0", 10) || 0);
    const transfers = (parseInt(todayLog.transfersCount || "0", 10) || 0) + (parseInt(todayLog.transfersCount2 || "0", 10) || 0) + (parseInt(todayLog.transfersCount3 || "0", 10) || 0) + (parseInt(todayLog.transfersCount4 || "0", 10) || 0);

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
