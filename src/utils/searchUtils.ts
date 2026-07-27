import type { DailyLog } from "../types";
import { getNormalizedGroupList } from "./groupParser";
import { getFeatureHandler } from "./geometryHandlers";

export function featureMatchesSearch(
  pt: { title: string; dailyLogs?: DailyLog[] },
  query: string,
  dateStr: string,
): boolean {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (pt.title.toLowerCase().includes(q)) return true;
  const log = pt.dailyLogs?.find((l) => l.date === dateStr);
  if (!log) return false;
  const groups = getNormalizedGroupList(log);
  return groups.some((g) =>
    (g.groupName || "").toLowerCase().includes(q) ||
    (g.managerName || "").toLowerCase().includes(q) ||
    (g.unitOut || "").toLowerCase().includes(q)
  ) || (log.observations || "").toLowerCase().includes(q);
}

export function isSectorFeature(feat?: { type?: string; featureType?: string; geojsonGeometry?: { type?: string } } | null): boolean {
  if (!feat) return false;
  return getFeatureHandler(feat).isSector;
}
