import type { DailyLog, GroupLogEntry, FeatureType, DrawnFeature } from "../../types";
import { getGeometryHandler } from "../../utils/geometryHandlers";

export const METRIC_FIELDS = [
  { label: "Rescat.", field: "rescuedCount" as const, color: "var(--color-info)" },
  { label: "Recup.", field: "recoveredCount" as const, color: "#ef4444" },
  { label: "Masc.", field: "rescuedPetsCount" as const, color: "var(--color-green)" },
  { label: "Atenc.", field: "prehospitalCareCount" as const, color: "#0ea5e9" },
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

export function formatCoordFromFeature(feat: { type: string; geojsonGeometry?: { type?: string; coordinates: unknown } }): { lat: number; lon: number } | null {
  const geom = feat.geojsonGeometry;
  if (!geom) return null;
  const handler = getGeometryHandler(feat.type);
  const coord = handler.getFirstCoordinate(geom as any);
  if (!coord) return null;
  return { lon: coord[0], lat: coord[1] };
}

export function formatCoordinates(feat: { type: string; geojsonGeometry?: { coordinates: unknown } }): string {
  const c = formatCoordFromFeature(feat);
  if (!c) return "Sin coordenadas";
  return `${c.lat.toFixed(6)}, ${c.lon.toFixed(6)}`;
}

export function getCoordLabel(feat: { type: string }): string {
  if (!["point", "polyline", "polygon"].includes(feat.type)) return "Coordenadas";
  return getGeometryHandler(feat.type).coordinateLabel;
}
