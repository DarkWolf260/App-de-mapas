import type { CustomActivity, DailyLog, Department, DepartmentView, DrawnFeature, GroupLogEntry } from "../../types";
import { isPointInPolygon } from "../../utils/spatialUtils";
import { extractActiveGroups, getNormalizedGroupList, logHasAnyData, mergeDepartmentLogs, mergeLogs } from "../../utils/logUtils";
import { aggregatePolygonLog } from "./aggregatePolygonLog";
import { formatCoordinates, getCoordLabel, getMetricValue, METRIC_FIELDS } from "./metricFields";
import { buildDisplayItems, type DisplayItem } from "./WorkTeamsSection";

export interface PointReportSummary {
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospital: number;
  totalTransfers: number;
  hasArrived: boolean;
  hasAnyLogData: boolean;
}

export interface ReportedPointItem {
  point: DrawnFeature;
  summary: PointReportSummary;
}

export interface FeatureInfoModelInput {
  activeFeat: DrawnFeature;
  dailyLog?: Partial<DailyLog>;
  mergedLog?: Partial<DailyLog>;
  drawnFeatures?: DrawnFeature[];
  popupEditDate: string;
  activeDepartment?: DepartmentView;
  selectedDept?: Department;
}

export interface FeatureInfoModel {
  isPolygon: boolean;
  coords: string;
  coordLabel: string;
  activeGroups: GroupLogEntry[];
  displayItems: DisplayItem[];
  displayLog: Partial<DailyLog>;
  aggregatedLog: Partial<DailyLog>;
  containedCount: number;
  reportedPoints: ReportedPointItem[];
  activities: CustomActivity[];
  observations: string;
  hasPointMetrics: boolean;
  hasAnyData: boolean;
}

export function getPointReportSummary(ptLog: Partial<DailyLog>): PointReportSummary {
  const groups = getNormalizedGroupList(ptLog);
  let totalPersonnel = 0;
  let totalRescued = parseInt(ptLog.rescuedCount || "0", 10) || 0;
  let totalRecovered = parseInt(ptLog.recoveredCount || "0", 10) || 0;
  let totalPets = parseInt(ptLog.rescuedPetsCount || "0", 10) || 0;
  let totalPrehospital = parseInt(ptLog.prehospitalCareCount || "0", 10) || 0;
  let totalTransfers = parseInt(ptLog.transfersCount || "0", 10) || 0;
  let hasArrived = false;

  for (const g of groups) {
    totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;
    totalRescued += parseInt(g.rescuedCount || "0", 10) || 0;
    totalRecovered += parseInt(g.recoveredCount || "0", 10) || 0;
    totalPets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
    totalPrehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
    totalTransfers += parseInt(g.transfersCount || "0", 10) || 0;
    if (g.hasArrived) hasArrived = true;
  }

  const hasAnyLogData =
    logHasAnyData(ptLog) ||
    totalPersonnel > 0 ||
    totalRescued > 0 ||
    totalRecovered > 0 ||
    totalPets > 0 ||
    totalPrehospital > 0 ||
    totalTransfers > 0 ||
    hasArrived ||
    (Array.isArray(ptLog.novedades) && ptLog.novedades.length > 0) ||
    !!(ptLog.observations && ptLog.observations.trim());

  return {
    totalPersonnel,
    totalRescued,
    totalRecovered,
    totalPets,
    totalPrehospital,
    totalTransfers,
    hasArrived,
    hasAnyLogData,
  };
}

function getContainedPoints(activeFeat: DrawnFeature, drawnFeatures: DrawnFeature[]): DrawnFeature[] {
  const polyCoords = activeFeat.geojsonGeometry?.coordinates as number[][][] | undefined;
  const ring = polyCoords?.[0];
  if (!ring) return [];

  return drawnFeatures.filter((f) => {
    if (f.type !== "point") return false;
    const rawCoords = f.geojsonGeometry?.coordinates;
    const ptCoords = Array.isArray(rawCoords)
      ? (rawCoords as number[])
      : (f as unknown as { coordinates?: { longitude: number; latitude: number } }).coordinates?.longitude !== undefined
      ? [
          (f as unknown as { coordinates: { longitude: number; latitude: number } }).coordinates.longitude,
          (f as unknown as { coordinates: { longitude: number; latitude: number } }).coordinates.latitude,
        ]
      : null;
    if (!ptCoords) return false;
    return isPointInPolygon(ptCoords[0], ptCoords[1], ring);
  });
}

function resolveMergedLog(
  activeFeat: DrawnFeature,
  popupEditDate: string,
  activeDepartment: DepartmentView,
  mergedLog?: Partial<DailyLog>
): Partial<DailyLog> | null {
  if (activeDepartment !== "mixto") return null;
  if (mergedLog) return mergedLog;
  const allLogs = activeFeat.dailyLogs?.filter((l) => l.date === popupEditDate) || [];
  if (allLogs.length === 0) return null;
  const pc = allLogs.find((l) => (l.department || "pc") === "pc");
  const bomberos = allLogs.find((l) => l.department === "bomberos");
  return mergeDepartmentLogs(pc, bomberos, popupEditDate);
}

function hasAnyMetricValue(log: Partial<DailyLog>): boolean {
  return METRIC_FIELDS.some((m) => {
    const v = getMetricValue(log, m.field);
    return !!v && v !== "0";
  });
}

/**
 * Construye el modelo de vista de solo lectura para InfoTab,
 * concentrando la lógica espacial, fusión departamental y agregación del sector.
 */
export function buildFeatureInfoModel({
  activeFeat,
  dailyLog,
  mergedLog,
  drawnFeatures = [],
  popupEditDate,
  activeDepartment = "pc",
  selectedDept = "pc",
}: FeatureInfoModelInput): FeatureInfoModel {
  const isPolygon = activeFeat.type === "polygon";
  const coords = formatCoordinates(activeFeat);
  const coordLabel = getCoordLabel(activeFeat);
  const baseLog: Partial<DailyLog> = dailyLog || {};
  const mergedForDisplay = resolveMergedLog(activeFeat, popupEditDate, activeDepartment, mergedLog);
  const effectiveOwnLog: Partial<DailyLog> = mergedForDisplay || baseLog;
  const activeGroups = extractActiveGroups(effectiveOwnLog, selectedDept);
  const displayItems = buildDisplayItems(activeGroups);

  let containedCount = 0;
  let reportedPoints: ReportedPointItem[] = [];
  let aggregatedLog: Partial<DailyLog> = effectiveOwnLog;

  if (isPolygon) {
    const containedPoints = getContainedPoints(activeFeat, drawnFeatures);
    containedCount = containedPoints.length;

    const containedWithLogs = containedPoints.map((pt) => {
      const logs =
        pt.dailyLogs?.filter(
          (l) =>
            l.date === popupEditDate &&
            (activeDepartment === "mixto" || !activeDepartment || (l.department || "pc") === activeDepartment)
        ) || [];
      const ptLog: Partial<DailyLog> = logs.length > 1 ? mergeLogs(logs) || {} : logs[0] || {};
      return { point: pt, log: ptLog };
    });

    reportedPoints = containedWithLogs
      .map(({ point, log: ptLog }) => ({ point, summary: getPointReportSummary(ptLog) }))
      .filter((item) => item.summary.hasAnyLogData);

    aggregatedLog = aggregatePolygonLog(baseLog, activeGroups, containedWithLogs);
  }

  const displayLog = isPolygon ? aggregatedLog : effectiveOwnLog;
  const activities = Array.isArray(displayLog.customActivities) ? displayLog.customActivities : [];
  const observations = (effectiveOwnLog.observations || displayLog.observations || "").trim();
  const hasPointMetrics = hasAnyMetricValue(displayLog);

  const hasAnyData = isPolygon
    ? activeGroups.length > 0 ||
      hasAnyMetricValue(baseLog) ||
      activities.length > 0 ||
      reportedPoints.length > 0 ||
      observations.length > 0
    : activeGroups.length > 0 ||
      hasPointMetrics ||
      activities.length > 0 ||
      observations.length > 0;

  return {
    isPolygon,
    coords,
    coordLabel,
    activeGroups,
    displayItems,
    displayLog,
    aggregatedLog,
    containedCount,
    reportedPoints,
    activities,
    observations,
    hasPointMetrics,
    hasAnyData,
  };
}
