import type { DailyLog, Department, DepartmentView, FeatureType, DrawnFeature } from "../types";
import { buildParentsMap } from "./spatialUtils";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function formatDateFriendly(dateStr: string): string {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const monthIndex = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${MONTHS[monthIndex]}`;
}

export function getDatesRange(startStr: string): string[] {
  const dates: string[] = [];
  const start = new Date(startStr + "T00:00:00");
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  let current = new Date(start);
  while (current <= end) {
    dates.push(current.toLocaleDateString("en-CA"));
    current.setDate(current.getDate() + 1);
  }
  return dates.reverse();
}

export function emptyLog(date: string, department?: Department): DailyLog {
  return {
    date,
    department,
    groupName: "",
    managerName: "",
    managerPhone: "",
    unitOut: "",
    departureTime: "",
    arrivalTime: "",
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    prehospitalCareCount: "",
    transfersCount: "",
    groupName2: "",
    managerName2: "",
    managerPhone2: "",
    unitOut2: "",
    departureTime2: "",
    arrivalTime2: "",
    officersCount2: "",
    rescuedCount2: "",
    recoveredCount2: "",
    prehospitalCareCount2: "",
    transfersCount2: "",
    hasArrivedG1: false,
    hasArrivedG2: false,
    observations: "",
  };
}

export function getTotalPersonnel(log: DailyLog): number {
  const count1 = parseInt(log.officersCount || "0", 10);
  const count2 = parseInt(log.officersCount2 || "0", 10);
  return count1 + count2;
}

export function logHasPersonnel(log: DailyLog): boolean {
  return getTotalPersonnel(log) > 0;
}

export function logIsArrived(log: DailyLog): boolean {
  return (
    (!!log.groupName && !!log.arrivalTime) ||
    (!!log.groupName2 && !!log.arrivalTime2)
  );
}

export function logMatchesArrivalFilter(
  log: DailyLog | undefined,
  filter: "all" | "arrived" | "not_arrived",
): boolean {
  if (!log) return filter === "all";
  if (filter === "arrived") return logIsArrived(log);
  if (filter === "not_arrived") return !logIsArrived(log);
  return true;
}

export function logHasAnyData(log: DailyLog): boolean {
  return !!(
    log.groupName ||
    log.unitOut ||
    log.managerName ||
    parseInt(log.officersCount || "0", 10) > 0 ||
    parseInt(log.rescuedCount || "0", 10) > 0 ||
    parseInt(log.recoveredCount || "0", 10) > 0 ||
    parseInt(log.prehospitalCareCount || "0", 10) > 0 ||
    parseInt(log.transfersCount || "0", 10) > 0 ||
    parseInt(log.rescuedPetsCount || "0", 10) > 0 ||
    log.groupName2 ||
    log.unitOut2 ||
    log.managerName2 ||
    parseInt(log.officersCount2 || "0", 10) > 0 ||
    parseInt(log.rescuedCount2 || "0", 10) > 0 ||
    parseInt(log.recoveredCount2 || "0", 10) > 0 ||
    parseInt(log.prehospitalCareCount2 || "0", 10) > 0 ||
    parseInt(log.transfersCount2 || "0", 10) > 0 ||
    log.groupName3 ||
    log.unitOut3 ||
    log.managerName3 ||
    parseInt(log.officersCount3 || "0", 10) > 0 ||
    parseInt(log.rescuedCount3 || "0", 10) > 0 ||
    parseInt(log.recoveredCount3 || "0", 10) > 0 ||
    parseInt(log.prehospitalCareCount3 || "0", 10) > 0 ||
    parseInt(log.transfersCount3 || "0", 10) > 0 ||
    log.groupName4 ||
    log.unitOut4 ||
    log.managerName4 ||
    parseInt(log.officersCount4 || "0", 10) > 0 ||
    parseInt(log.rescuedCount4 || "0", 10) > 0 ||
    parseInt(log.recoveredCount4 || "0", 10) > 0 ||
    parseInt(log.prehospitalCareCount4 || "0", 10) > 0 ||
    parseInt(log.transfersCount4 || "0", 10) > 0 ||
    (log.observations && log.observations.trim())
  );
}

export interface GroupData {
  groupName: string;
  managerName: string;
  managerPhone: string;
  unitOut: string;
  officersCount: string;
  rescuedCount: string;
  recoveredCount: string;
  prehospitalCareCount: string;
  transfersCount: string;
  departureTime: string;
  arrivalTime: string;
  hasArrived: boolean;
}

export function getGroupData(log: DailyLog, group: 1 | 2 | 3 | 4): GroupData {
  if (group === 2) {
    return {
      groupName: log.groupName2 || "",
      managerName: log.managerName2 || "",
      managerPhone: log.managerPhone2 || "",
      unitOut: log.unitOut2 || "",
      officersCount: log.officersCount2 || "",
      rescuedCount: log.rescuedCount2 || "",
      recoveredCount: log.recoveredCount2 || "",
      prehospitalCareCount: log.prehospitalCareCount2 || "",
      transfersCount: log.transfersCount2 || "",
      departureTime: log.departureTime2 || "",
      arrivalTime: log.arrivalTime2 || "",
      hasArrived: !!log.hasArrivedG2 || !!log.arrivalTime2,
    };
  }
  if (group === 3) {
    return {
      groupName: log.groupName3 || "",
      managerName: log.managerName3 || "",
      managerPhone: log.managerPhone3 || "",
      unitOut: log.unitOut3 || "",
      officersCount: log.officersCount3 || "",
      rescuedCount: log.rescuedCount3 || "",
      recoveredCount: log.recoveredCount3 || "",
      prehospitalCareCount: log.prehospitalCareCount3 || "",
      transfersCount: log.transfersCount3 || "",
      departureTime: log.departureTime3 || "",
      arrivalTime: log.arrivalTime3 || "",
      hasArrived: !!log.hasArrivedG3 || !!log.arrivalTime3,
    };
  }
  if (group === 4) {
    return {
      groupName: log.groupName4 || "",
      managerName: log.managerName4 || "",
      managerPhone: log.managerPhone4 || "",
      unitOut: log.unitOut4 || "",
      officersCount: log.officersCount4 || "",
      rescuedCount: log.rescuedCount4 || "",
      recoveredCount: log.recoveredCount4 || "",
      prehospitalCareCount: log.prehospitalCareCount4 || "",
      transfersCount: log.transfersCount4 || "",
      departureTime: log.departureTime4 || "",
      arrivalTime: log.arrivalTime4 || "",
      hasArrived: !!log.hasArrivedG4 || !!log.arrivalTime4,
    };
  }
  return {
    groupName: log.groupName || "",
    managerName: log.managerName || "",
    managerPhone: log.managerPhone || "",
    unitOut: log.unitOut || "",
    officersCount: log.officersCount || "",
    rescuedCount: log.rescuedCount || "",
    recoveredCount: log.recoveredCount || "",
    prehospitalCareCount: log.prehospitalCareCount || "",
    transfersCount: log.transfersCount || "",
    departureTime: log.departureTime || "",
    arrivalTime: log.arrivalTime || "",
    hasArrived: !!log.hasArrivedG1 || !!log.arrivalTime,
  };
}

export interface DayStats {
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  activePoints: number;
  groupsArrived: number;
}

export function getDayStats(
  features: { dailyLogs?: DailyLog[] }[],
  dateStr: string,
  activeDepartment?: DepartmentView,
): DayStats {
  let totalPersonnel = 0;
  let totalRescued = 0;
  let totalRecovered = 0;
  let totalPets = 0;
  let totalPrehospitalCare = 0;
  let totalTransfers = 0;
  let activePoints = 0;
  let groupsArrived = 0;

  for (const f of features) {
    const logs = f.dailyLogs?.filter((l) =>
      l.date === dateStr && (activeDepartment === "mixto" || !activeDepartment || l.department === activeDepartment || !l.department)
    ) || [];
    const log = logs[0];
    if (!log || !logHasAnyData(log)) continue;

    activePoints++;

    const p1 = parseInt(log.officersCount || "0", 10);
    const p2 = parseInt(log.officersCount2 || "0", 10);
    const p3 = parseInt(log.officersCount3 || "0", 10);
    const p4 = parseInt(log.officersCount4 || "0", 10);
    totalPersonnel += p1 + p2 + p3 + p4;

    const r1 = parseInt(log.rescuedCount || "0", 10);
    const r2 = parseInt(log.rescuedCount2 || "0", 10);
    const r3 = parseInt(log.rescuedCount3 || "0", 10);
    const r4 = parseInt(log.rescuedCount4 || "0", 10);
    totalRescued += r1 + r2 + r3 + r4;

    const rc1 = parseInt(log.recoveredCount || "0", 10);
    const rc2 = parseInt(log.recoveredCount2 || "0", 10);
    const rc3 = parseInt(log.recoveredCount3 || "0", 10);
    const rc4 = parseInt(log.recoveredCount4 || "0", 10);
    totalRecovered += rc1 + rc2 + rc3 + rc4;

    const ph1 = parseInt(log.prehospitalCareCount || "0", 10);
    const ph2 = parseInt(log.prehospitalCareCount2 || "0", 10);
    const ph3 = parseInt(log.prehospitalCareCount3 || "0", 10);
    const ph4 = parseInt(log.prehospitalCareCount4 || "0", 10);
    totalPrehospitalCare += ph1 + ph2 + ph3 + ph4;

    const tr1 = parseInt(log.transfersCount || "0", 10);
    const tr2 = parseInt(log.transfersCount2 || "0", 10);
    const tr3 = parseInt(log.transfersCount3 || "0", 10);
    const tr4 = parseInt(log.transfersCount4 || "0", 10);
    totalTransfers += tr1 + tr2 + tr3 + tr4;

    const pets = parseInt(log.rescuedPetsCount || "0", 10);
    totalPets += pets;

    if (log.hasArrivedG1) groupsArrived++;
    if (log.hasArrivedG2) groupsArrived++;
    if (log.hasArrivedG3) groupsArrived++;
    if (log.hasArrivedG4) groupsArrived++;
  }

  return { totalPersonnel, totalRescued, totalRecovered, totalPets, totalPrehospitalCare, totalTransfers, activePoints, groupsArrived };
}

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
  return (
    (log.groupName || "").toLowerCase().includes(q) ||
    (log.groupName2 || "").toLowerCase().includes(q) ||
    (log.managerName || "").toLowerCase().includes(q) ||
    (log.managerName2 || "").toLowerCase().includes(q) ||
    (log.unitOut || "").toLowerCase().includes(q) ||
    (log.unitOut2 || "").toLowerCase().includes(q) ||
    (log.observations || "").toLowerCase().includes(q)
  );
}

export function isSectorFeature(feat: { type?: string; featureType?: FeatureType; geojsonGeometry?: { type?: string } }): boolean {
  if (!feat) return false;
  const t = (feat.featureType || feat.type || "").toLowerCase();
  if (t === "polygon" || t === "polyline" || t === "area" || t === "line" || t === "linestring" || t === "multipolygon") return true;
  if (t === "point") return false;
  if (feat.geojsonGeometry?.type) {
    const gType = feat.geojsonGeometry.type.toLowerCase();
    if (gType.includes("polygon") || gType.includes("line")) return true;
    if (gType.includes("point")) return false;
  }
  return t !== "point";
}

export const REPORT_START_DATE = "2026-06-24";

/* ── Aggregated stats for Statistics view ── */

export interface GroupStats {
  groupName: string;
  department?: string;
  daysActive: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
}

export interface FeatureStat {
  featureId: number;
  featureTitle: string;
  featureType?: FeatureType;
  featureColor?: string;
  daysActive: number;
  containedPointsCount?: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
}

export interface PeriodStats {
  totalDaysWithData: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPets: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  groupStats: GroupStats[];
  featureStats: FeatureStat[];
}

export function getPeriodStats(
  features: DrawnFeature[],
  activeDepartment?: DepartmentView,
): PeriodStats {
  const groupMap = new Map<string, GroupStats>();
  const featureStatsMap = new Map<number, FeatureStat>();
  const activeDates = new Set<string>();

  let totalPersonnel = 0;
  let totalRescued = 0;
  let totalRecovered = 0;
  let totalPets = 0;
  let totalPrehospitalCare = 0;
  let totalTransfers = 0;

  const { parentsMap } = buildParentsMap(features);

  function upsertGroup(name: string, dept: string | undefined, log: DailyLog, suffix: "" | "2") {
    const key = name + (dept || "");
    const existing = groupMap.get(key) || {
      groupName: name,
      department: dept,
      daysActive: 0,
      totalPersonnel: 0,
      totalRescued: 0,
      totalRecovered: 0,
      totalPets: 0,
      totalPrehospitalCare: 0,
      totalTransfers: 0,
    };
    existing.daysActive++;
    existing.totalPersonnel += parseInt((suffix === "2" ? log.officersCount2 : log.officersCount) || "0", 10);
    existing.totalRescued += parseInt((suffix === "2" ? log.rescuedCount2 : log.rescuedCount) || "0", 10);
    existing.totalRecovered += parseInt((suffix === "2" ? log.recoveredCount2 : log.recoveredCount) || "0", 10);
    existing.totalPrehospitalCare += parseInt((suffix === "2" ? log.prehospitalCareCount2 : log.prehospitalCareCount) || "0", 10);
    existing.totalTransfers += parseInt((suffix === "2" ? log.transfersCount2 : log.transfersCount) || "0", 10);
    existing.totalPets += parseInt(log.rescuedPetsCount || "0", 10);
    groupMap.set(key, existing);
  }

  // 1. Process global totals and group stats (each feature log evaluated once)
  for (const feat of features) {
    for (const log of feat.dailyLogs || []) {
      if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
      if (!logHasAnyData(log)) continue;

      activeDates.add(log.date);

      const p1 = parseInt(log.officersCount || "0", 10);
      const p2 = parseInt(log.officersCount2 || "0", 10);
      const r1 = parseInt(log.rescuedCount || "0", 10);
      const r2 = parseInt(log.rescuedCount2 || "0", 10);
      const rc1 = parseInt(log.recoveredCount || "0", 10);
      const rc2 = parseInt(log.recoveredCount2 || "0", 10);
      const ph1 = parseInt(log.prehospitalCareCount || "0", 10);
      const ph2 = parseInt(log.prehospitalCareCount2 || "0", 10);
      const tr1 = parseInt(log.transfersCount || "0", 10);
      const tr2 = parseInt(log.transfersCount2 || "0", 10);
      const pets = parseInt(log.rescuedPetsCount || "0", 10);

      totalPersonnel += p1 + p2;
      totalRescued += r1 + r2;
      totalRecovered += rc1 + rc2;
      totalPrehospitalCare += ph1 + ph2;
      totalTransfers += tr1 + tr2;
      totalPets += pets;

      if (log.groupName) upsertGroup(log.groupName, log.department, log, "");
      if (log.groupName2) upsertGroup(log.groupName2, log.department, log, "2");
    }
  }

  // 2. Process per-feature statistics (Sectors accumulate manual log + contained points' logs)
  for (const feat of features) {
    const isSector = isSectorFeature(feat);
    const childFeatures = isSector ? features.filter((c) => String(parentsMap[c.id]) === String(feat.id)) : [];

    const fStat: FeatureStat = {
      featureId: feat.id,
      featureTitle: feat.title,
      featureType: feat.type,
      featureColor: feat.color,
      daysActive: 0,
      containedPointsCount: childFeatures.length,
      totalPersonnel: 0,
      totalRescued: 0,
      totalRecovered: 0,
      totalPrehospitalCare: 0,
      totalTransfers: 0,
    };

    const allRelevantFeatures = [feat, ...childFeatures];
    const featDates = new Set<string>();

    for (const fItem of allRelevantFeatures) {
      for (const log of fItem.dailyLogs || []) {
        if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
        if (!logHasAnyData(log)) continue;

        featDates.add(log.date);

        const p1 = parseInt(log.officersCount || "0", 10);
        const p2 = parseInt(log.officersCount2 || "0", 10);
        const r1 = parseInt(log.rescuedCount || "0", 10);
        const r2 = parseInt(log.rescuedCount2 || "0", 10);
        const rc1 = parseInt(log.recoveredCount || "0", 10);
        const rc2 = parseInt(log.recoveredCount2 || "0", 10);
        const ph1 = parseInt(log.prehospitalCareCount || "0", 10);
        const ph2 = parseInt(log.prehospitalCareCount2 || "0", 10);
        const tr1 = parseInt(log.transfersCount || "0", 10);
        const tr2 = parseInt(log.transfersCount2 || "0", 10);

        fStat.totalPersonnel += p1 + p2;
        fStat.totalRescued += r1 + r2;
        fStat.totalRecovered += rc1 + rc2;
        fStat.totalPrehospitalCare += ph1 + ph2;
        fStat.totalTransfers += tr1 + tr2;
      }
    }

    fStat.daysActive = featDates.size;

    if (fStat.daysActive > 0 || fStat.totalRescued > 0 || fStat.totalRecovered > 0 || fStat.totalPrehospitalCare > 0 || fStat.totalTransfers > 0) {
      featureStatsMap.set(feat.id, fStat);
    }
  }

  const groupStats = Array.from(groupMap.values()).sort((a, b) => b.daysActive - a.daysActive);
  const featureStats = Array.from(featureStatsMap.values()).sort((a, b) => b.daysActive - a.daysActive);

  return {
    totalDaysWithData: activeDates.size,
    totalPersonnel,
    totalRescued,
    totalRecovered,
    totalPets,
    totalPrehospitalCare,
    totalTransfers,
    groupStats,
    featureStats,
  };
}

