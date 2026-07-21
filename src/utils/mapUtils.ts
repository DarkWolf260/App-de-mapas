import Basemap from "@arcgis/core/Basemap";
import TileLayer from "@arcgis/core/layers/TileLayer";
import type { DrawnFeature } from "../types";
import { hexToRgb } from "../components/ColorPicker";

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
    type: "simple-marker",
    color: [r, g, b, 0.9],
    outline: { color: [255, 255, 255, 0.8], width: 1.5 },
    size: "10px",
  },
  polyline: {
    type: "simple-line",
    color: [r, g, b, 0.95],
    width: 3,
    style: "solid",
  },
  polygon: {
    type: "simple-fill",
    color: [r, g, b, 0.25],
    outline: { color: [r, g, b, 0.95], width: 2 },
  },
});

export const getLabelText = (feat: DrawnFeature): string => {
  if (feat.type !== "point") {
    return feat.title;
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  const todayLog = feat.dailyLogs?.find((l) => l.date === todayStr);
  if (todayLog) {
    const parts: string[] = [];

    const g1 = todayLog.groupName?.trim();
    const u1 = todayLog.unitOut?.trim();
    if (g1 && u1) {
      parts.push(`${g1}, ${u1}`);
    } else if (g1) {
      parts.push(g1);
    } else if (u1) {
      parts.push(u1);
    }

    const g2 = todayLog.groupName2?.trim();
    const u2 = todayLog.unitOut2?.trim();
    if (g2 && u2) {
      parts.push(`${g2}, ${u2}`);
    } else if (g2) {
      parts.push(g2);
    } else if (u2) {
      parts.push(u2);
    }

    if (parts.length > 0) {
      return `${feat.title} (${parts.join(" | ")})`;
    }
  }

  return feat.title;
};

export const symbolForType = (type: string, color: string) => {
  const syms = makeSymbols(hexToRgb(color));
  if (type === "point") return syms.point;
  if (type === "polyline") return syms.polyline;
  return syms.polygon;
};
