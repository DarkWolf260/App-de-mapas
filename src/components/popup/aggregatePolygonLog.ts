import type { DailyLog, GroupLogEntry, DrawnFeature, CustomActivity } from "../../types";
import { getNormalizedGroupList } from "../../utils/logUtils";
import { mergeCustomActivities } from "../../utils/logMerge";
import { METRIC_FIELDS, getMetricNumeric, COMMISSION_INDEPENDENT } from "./metricFields";

interface ContainedPoint {
  point: DrawnFeature;
  log: Partial<DailyLog>;
}

function parseMetric(val: string | undefined): number {
  return parseInt(val || "0", 10) || 0;
}

function addMetricsFromLog(target: Record<string, number>, log: Partial<DailyLog>) {
  for (const m of METRIC_FIELDS) {
    target[m.field] += parseMetric((log as Record<string, string | undefined>)[m.field]);
  }
}

function addMetricsFromGroup(target: Record<string, number>, g: GroupLogEntry) {
  for (const m of METRIC_FIELDS) {
    target[m.field] += getMetricNumeric(g, m.field);
  }
}

export interface AggregatedLog extends Partial<DailyLog> {
  _hasData?: boolean;
}

export function aggregatePolygonLog(
  polygonOwnLog: Partial<DailyLog>,
  polygonGroups: GroupLogEntry[],
  containedWithLogs: ContainedPoint[],
): AggregatedLog {
  const totals: Record<string, number> = {};
  for (const m of METRIC_FIELDS) totals[m.field] = 0;

  let customActivities: CustomActivity[] = polygonOwnLog.customActivities ? [...polygonOwnLog.customActivities] : [];

  // 1. General polygon stats (independent from groups)
  addMetricsFromLog(totals, polygonOwnLog);

  // 2. Add group metrics (de-duplicating joint commission groups)
  const seenComms = new Set<string>();
  for (const g of polygonGroups) {
    const cid = g.commissionId || COMMISSION_INDEPENDENT;
    if (cid !== COMMISSION_INDEPENDENT) {
      if (seenComms.has(cid)) continue;
      seenComms.add(cid);
    }
    addMetricsFromGroup(totals, g);
    if (g.customActivities) {
      customActivities = mergeCustomActivities(customActivities, g.customActivities);
    }
  }

  // 3. Add contained point metrics
  let observations = polygonOwnLog.observations ? `Polígono: ${polygonOwnLog.observations}` : "";
  for (const { point, log } of containedWithLogs) {
    const gList = getNormalizedGroupList(log);
    const ptComms = new Set<string>();
    if (gList.length > 0) {
      for (const g of gList) {
        const cid = g.commissionId || COMMISSION_INDEPENDENT;
        if (cid !== COMMISSION_INDEPENDENT) {
          if (ptComms.has(cid)) continue;
          ptComms.add(cid);
        }
        addMetricsFromGroup(totals, g);
        if (g.customActivities) {
          customActivities = mergeCustomActivities(customActivities, g.customActivities);
        }
      }
    } else {
      addMetricsFromLog(totals, log);
    }
    if (log.customActivities) {
      customActivities = mergeCustomActivities(customActivities, log.customActivities);
    }
    if (log.observations) {
      observations += (observations ? "\n" : "") + `${point.title}: ${log.observations}`;
    }
  }

  const hasAnyLog = METRIC_FIELDS.some((m) => totals[m.field] > 0) || customActivities.length > 0;

  const result: AggregatedLog = {
    ...polygonOwnLog,
    observations: observations || undefined,
    customActivities: customActivities.length > 0 ? customActivities : undefined,
    _hasData: hasAnyLog || containedWithLogs.length > 0 || polygonGroups.length > 0,
  };

  for (const m of METRIC_FIELDS) {
    (result as Record<string, unknown>)[m.field] = totals[m.field] > 0 ? String(totals[m.field]) : undefined;
  }

  return result;
}
