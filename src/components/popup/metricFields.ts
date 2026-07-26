import type { DailyLog, GroupLogEntry } from "../../types";

export const METRIC_FIELDS = [
  { label: "Rescat.", field: "rescuedCount" as const, color: "var(--color-green)" },
  { label: "Recup.", field: "recoveredCount" as const, color: "var(--color-info)" },
  { label: "Masc.", field: "rescuedPetsCount" as const, color: "#a855f7" },
  { label: "Atenc.", field: "prehospitalCareCount" as const, color: "#38bdf8" },
  { label: "Trasl.", field: "transfersCount" as const, color: "var(--color-purple)" },
];

export const COMMISSION_INDEPENDENT = "independiente";
export const COMMISSION_PREFIX = "comision_";

export const GROUP_COLORS = [
  "var(--color-info)",
  "var(--color-purple)",
  "#c084fc",
  "#fb923c",
  "#34d399",
  "#f87171",
];

export function getGroupColor(idx: number): string {
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

export type MetricField = (typeof METRIC_FIELDS)[number]["field"];

export function getMetricValue(source: Partial<DailyLog> | GroupLogEntry, field: MetricField): string {
  return (source as Record<string, unknown>)[field] as string || "";
}

export function getMetricNumeric(source: Partial<DailyLog> | GroupLogEntry, field: MetricField): number {
  return parseInt(getMetricValue(source, field) || "0", 10) || 0;
}

export function hasAnyMetric(source: Partial<DailyLog> | GroupLogEntry): boolean {
  return METRIC_FIELDS.some((m) => {
    const v = getMetricValue(source, m.field);
    return v && v !== "0";
  });
}

export function formatCoordFromFeature(feat: { type: string; geojsonGeometry?: { coordinates: unknown } }): { lat: number; lon: number } | null {
  const geom = feat.geojsonGeometry;
  if (!geom) return null;
  const coords = geom.coordinates;

  if (feat.type === "point" && Array.isArray(coords)) {
    const [lon, lat] = coords as number[];
    return { lat, lon };
  }
  if (feat.type === "polyline" && Array.isArray(coords) && coords.length > 0) {
    const [lon, lat] = (coords as number[][])[0];
    return { lat, lon };
  }
  if (feat.type === "polygon" && Array.isArray(coords)) {
    const rings = coords as number[][][];
    if (rings.length > 0 && rings[0].length > 0) {
      const [lon, lat] = rings[0][0];
      return { lat, lon };
    }
  }
  return null;
}

export function formatCoordinates(feat: { type: string; geojsonGeometry?: { coordinates: unknown } }): string {
  const c = formatCoordFromFeature(feat);
  if (!c) return "Sin coordenadas";
  return `${c.lat.toFixed(6)}, ${c.lon.toFixed(6)}`;
}

export function getCoordLabel(feat: { type: string }): string {
  if (feat.type === "point") return "Ubicación";
  if (feat.type === "polyline") return "Punto inicial";
  if (feat.type === "polygon") return "Primer vértice";
  return "Coordenadas";
}
