import type { DailyLog, Department, DepartmentView, FeatureType, DrawnFeature, GroupLogEntry } from "../types";
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
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    prehospitalCareCount: "",
    transfersCount: "",
    groupName2: "",
    managerName2: "",
    managerPhone2: "",
    unitOut2: "",
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

export function getNormalizedGroupList(log?: Partial<DailyLog>): GroupLogEntry[] {
  if (!log) return [];

  if (log.groups && Array.isArray(log.groups) && log.groups.length > 0) {
    return log.groups
      .filter((g) => g && (g.groupName?.trim() || g.officersCount || g.unitOut || g.managerName))
      .map((g) => ({ ...g, commissionId: g.commissionId || "comision_1" }));
  }

  const legacyList: GroupLogEntry[] = [];

  const addLegacy = (slotIndex: number, name?: string, mgr?: string, phone?: string, unit?: string, officers?: string, rescued?: string, recovered?: string, pets?: string, prehospital?: string, transfers?: string, arrived?: boolean, commissionId?: string, isVolunteer?: boolean) => {
    const hasData = !!(name?.trim() || officers || unit?.trim() || mgr?.trim() || rescued || recovered || prehospital || transfers);
    if (hasData) {
      legacyList.push({
        id: `g${slotIndex}`,
        groupName: (name || "").trim(),
        managerName: mgr || "",
        managerPhone: phone || "",
        unitOut: unit || "",
        officersCount: officers || "",
        rescuedCount: rescued || "",
        recoveredCount: recovered || "",
        rescuedPetsCount: pets || "",
        prehospitalCareCount: prehospital || "",
        transfersCount: transfers || "",
        hasArrived: !!arrived,
        commissionId: commissionId || "comision_1",
        isVolunteer: !!isVolunteer,
      });
    }
  };

  addLegacy(1, log.groupName, log.managerName, log.managerPhone, log.unitOut, log.officersCount, log.rescuedCount, log.recoveredCount, log.rescuedPetsCount, log.prehospitalCareCount, log.transfersCount, log.hasArrivedG1, log.commissionId, log.isVolunteer);
  addLegacy(2, log.groupName2, log.managerName2, log.managerPhone2, log.unitOut2, log.officersCount2, log.rescuedCount2, log.recoveredCount2, log.rescuedPetsCount2, log.prehospitalCareCount2, log.transfersCount2, log.hasArrivedG2, log.commissionId2, log.isVolunteer2);
  addLegacy(3, log.groupName3, log.managerName3, log.managerPhone3, log.unitOut3, log.officersCount3, log.rescuedCount3, log.recoveredCount3, log.rescuedPetsCount3, log.prehospitalCareCount3, log.transfersCount3, log.hasArrivedG3, log.commissionId3, log.isVolunteer3);
  addLegacy(4, log.groupName4, log.managerName4, log.managerPhone4, log.unitOut4, log.officersCount4, log.rescuedCount4, log.recoveredCount4, log.rescuedPetsCount4, log.prehospitalCareCount4, log.transfersCount4, log.hasArrivedG4, log.commissionId4, log.isVolunteer4);

  // Inherit shared commission metrics for groups in the same joint commission if not explicitly set
  const commMetricsMap = new Map<string, { rescued?: string; recovered?: string; pets?: string; prehospital?: string; transfers?: string }>();
  for (const g of legacyList) {
    const cid = g.commissionId || "comision_1";
    if (cid !== "independiente" && !commMetricsMap.has(cid)) {
      if (g.rescuedCount || g.recoveredCount || g.prehospitalCareCount || g.transfersCount || g.rescuedPetsCount) {
        commMetricsMap.set(cid, {
          rescued: g.rescuedCount,
          recovered: g.recoveredCount,
          pets: g.rescuedPetsCount,
          prehospital: g.prehospitalCareCount,
          transfers: g.transfersCount,
        });
      }
    }
  }

  for (const g of legacyList) {
    const cid = g.commissionId || "comision_1";
    if (cid !== "independiente" && commMetricsMap.has(cid)) {
      const m = commMetricsMap.get(cid)!;
      if (!g.rescuedCount) g.rescuedCount = m.rescued;
      if (!g.recoveredCount) g.recoveredCount = m.recovered;
      if (!g.rescuedPetsCount) g.rescuedPetsCount = m.pets;
      if (!g.prehospitalCareCount) g.prehospitalCareCount = m.prehospital;
      if (!g.transfersCount) g.transfersCount = m.transfers;
    }
  }

  return legacyList;
}

export function getTotalPersonnel(log?: Partial<DailyLog>): number {
  if (!log) return 0;
  const groups = getNormalizedGroupList(log);
  return groups.reduce((acc, g) => acc + (parseInt(g.officersCount || "0", 10) || 0), 0);
}

export function logHasPersonnel(log?: Partial<DailyLog>): boolean {
  return getTotalPersonnel(log) > 0;
}

export function logIsArrived(log?: Partial<DailyLog>): boolean {
  if (!log) return false;
  const groups = getNormalizedGroupList(log);
  if (groups.length === 0) return false;
  return groups.every((g) => !!g.hasArrived);
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

export function logHasAnyData(log?: Partial<DailyLog>): boolean {
  if (!log) return false;
  const groups = getNormalizedGroupList(log);
  if (groups.length > 0) return true;
  return !!(log.observations && log.observations.trim());
}

export interface GroupData {
  id?: string;
  groupName: string;
  managerName: string;
  managerPhone: string;
  unitOut: string;
  officersCount: string;
  rescuedCount: string;
  recoveredCount: string;
  rescuedPetsCount?: string;
  prehospitalCareCount: string;
  transfersCount: string;
  hasArrived: boolean;
  commissionId?: string;
  isVolunteer?: boolean;
}

export function getGroupData(log: DailyLog, groupIndex: number): GroupData {
  if (!log.groups || log.groups.length === 0) {
    if (groupIndex === 2) {
      return {
        id: "g2",
        groupName: log.groupName2 || "",
        managerName: log.managerName2 || "",
        managerPhone: log.managerPhone2 || "",
        unitOut: log.unitOut2 || "",
        officersCount: log.officersCount2 || "",
        rescuedCount: log.rescuedCount2 || "",
        recoveredCount: log.recoveredCount2 || "",
        rescuedPetsCount: log.rescuedPetsCount2 || "",
        prehospitalCareCount: log.prehospitalCareCount2 || "",
        transfersCount: log.transfersCount2 || "",
        hasArrived: !!log.hasArrivedG2,
        commissionId: log.commissionId2 || "comision_1",
        isVolunteer: !!log.isVolunteer2,
      };
    }
    if (groupIndex === 3) {
      return {
        id: "g3",
        groupName: log.groupName3 || "",
        managerName: log.managerName3 || "",
        managerPhone: log.managerPhone3 || "",
        unitOut: log.unitOut3 || "",
        officersCount: log.officersCount3 || "",
        rescuedCount: log.rescuedCount3 || "",
        recoveredCount: log.recoveredCount3 || "",
        rescuedPetsCount: log.rescuedPetsCount3 || "",
        prehospitalCareCount: log.prehospitalCareCount3 || "",
        transfersCount: log.transfersCount3 || "",
        hasArrived: !!log.hasArrivedG3,
        commissionId: log.commissionId3 || "comision_1",
        isVolunteer: !!log.isVolunteer3,
      };
    }
    if (groupIndex === 4) {
      return {
        id: "g4",
        groupName: log.groupName4 || "",
        managerName: log.managerName4 || "",
        managerPhone: log.managerPhone4 || "",
        unitOut: log.unitOut4 || "",
        officersCount: log.officersCount4 || "",
        rescuedCount: log.rescuedCount4 || "",
        recoveredCount: log.recoveredCount4 || "",
        rescuedPetsCount: log.rescuedPetsCount4 || "",
        prehospitalCareCount: log.prehospitalCareCount4 || "",
        transfersCount: log.transfersCount4 || "",
        hasArrived: !!log.hasArrivedG4,
        commissionId: log.commissionId4 || "comision_1",
        isVolunteer: !!log.isVolunteer4,
      };
    }
    return {
      id: "g1",
      groupName: log.groupName || "",
      managerName: log.managerName || "",
      managerPhone: log.managerPhone || "",
      unitOut: log.unitOut || "",
      officersCount: log.officersCount || "",
      rescuedCount: log.rescuedCount || "",
      recoveredCount: log.recoveredCount || "",
      rescuedPetsCount: log.rescuedPetsCount || "",
      prehospitalCareCount: log.prehospitalCareCount || "",
      transfersCount: log.transfersCount || "",
      hasArrived: !!log.hasArrivedG1,
      commissionId: log.commissionId || "comision_1",
      isVolunteer: !!log.isVolunteer,
    };
  }

  const list = getNormalizedGroupList(log);
  const item = list[groupIndex - 1];
  if (item) {
    return {
      id: item.id,
      groupName: item.groupName,
      managerName: item.managerName || "",
      managerPhone: item.managerPhone || "",
      unitOut: item.unitOut || "",
      officersCount: item.officersCount || "",
      rescuedCount: item.rescuedCount || "",
      recoveredCount: item.recoveredCount || "",
      rescuedPetsCount: item.rescuedPetsCount || "",
      prehospitalCareCount: item.prehospitalCareCount || "",
      transfersCount: item.transfersCount || "",
      hasArrived: !!item.hasArrived,
      commissionId: item.commissionId || "comision_1",
      isVolunteer: !!item.isVolunteer,
    };
  }
  return {
    groupName: "",
    managerName: "",
    managerPhone: "",
    unitOut: "",
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    rescuedPetsCount: "",
    prehospitalCareCount: "",
    transfersCount: "",
    hasArrived: false,
    commissionId: "comision_1",
    isVolunteer: false,
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

    const groups = getNormalizedGroupList(log);
    const commRescued = new Map<string, number>();
    const commRecovered = new Map<string, number>();
    const commPrehospital = new Map<string, number>();
    const commTransfers = new Map<string, number>();

    for (const g of groups) {
      const p = parseInt(g.officersCount || "0", 10) || 0;
      totalPersonnel += p;

      const r = parseInt(g.rescuedCount || "0", 10) || 0;
      const rc = parseInt(g.recoveredCount || "0", 10) || 0;
      const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
      const tr = parseInt(g.transfersCount || "0", 10) || 0;

      const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
      commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
      commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
      commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
      commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));

      if (g.hasArrived) groupsArrived++;
    }

    commRescued.forEach((val) => { totalRescued += val; });
    commRecovered.forEach((val) => { totalRecovered += val; });
    commPrehospital.forEach((val) => { totalPrehospitalCare += val; });
    commTransfers.forEach((val) => { totalTransfers += val; });

    totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
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
  isVolunteer?: boolean;
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
  const groupDatesMap = new Map<string, Set<string>>();

  function upsertGroupItem(g: GroupLogEntry, log: DailyLog) {
    const trimmed = g.groupName.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase() + "_" + (log.department || "");
    const existing = groupMap.get(key) || {
      groupName: trimmed,
      department: log.department,
      daysActive: 0,
      totalPersonnel: 0,
      totalRescued: 0,
      totalRecovered: 0,
      totalPets: 0,
      totalPrehospitalCare: 0,
      totalTransfers: 0,
      isVolunteer: !!g.isVolunteer,
    };

    if (g.isVolunteer) existing.isVolunteer = true;

    if (!groupDatesMap.has(key)) {
      groupDatesMap.set(key, new Set<string>());
    }
    const datesSet = groupDatesMap.get(key)!;
    datesSet.add(log.date);
    existing.daysActive = datesSet.size;

    existing.totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;
    existing.totalRescued += parseInt(g.rescuedCount || "0", 10) || 0;
    existing.totalRecovered += parseInt(g.recoveredCount || "0", 10) || 0;
    existing.totalPrehospitalCare += parseInt(g.prehospitalCareCount || "0", 10) || 0;
    existing.totalTransfers += parseInt(g.transfersCount || "0", 10) || 0;
    existing.totalPets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
    groupMap.set(key, existing);
  }

  // 1. Process global totals and group stats (each feature log evaluated once)
  for (const feat of features) {
    for (const log of feat.dailyLogs || []) {
      if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
      if (!logHasAnyData(log)) continue;

      activeDates.add(log.date);

      const groupList = getNormalizedGroupList(log);
      const commRescued = new Map<string, number>();
      const commRecovered = new Map<string, number>();
      const commPrehospital = new Map<string, number>();
      const commTransfers = new Map<string, number>();

      for (const g of groupList) {
        upsertGroupItem(g, log);

        const p = parseInt(g.officersCount || "0", 10) || 0;
        totalPersonnel += p;

        const r = parseInt(g.rescuedCount || "0", 10) || 0;
        const rc = parseInt(g.recoveredCount || "0", 10) || 0;
        const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
        const tr = parseInt(g.transfersCount || "0", 10) || 0;

        const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
        commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
        commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
        commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
        commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));
      }

      commRescued.forEach((val) => { totalRescued += val; });
      commRecovered.forEach((val) => { totalRecovered += val; });
      commPrehospital.forEach((val) => { totalPrehospitalCare += val; });
      commTransfers.forEach((val) => { totalTransfers += val; });

      totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
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

