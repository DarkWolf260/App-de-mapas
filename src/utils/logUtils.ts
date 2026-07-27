import type { DailyLog, Department, DepartmentView, FeatureType, DrawnFeature, GroupLogEntry, DailyLogIndexed } from "../types";
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
    novedades: [],
  };
}

export function splitGroupNames(name: string): string[] {
  if (!name || !name.trim()) return [];
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+(?:y|Y|e|E|\/|\+)\s+|\s*[/,+]\s*/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

export function getNormalizedGroupList(log?: Partial<DailyLog>): GroupLogEntry[] {
  if (!log) return [];

  const rawEntries: GroupLogEntry[] = [];

  if (log.groups && Array.isArray(log.groups) && log.groups.length > 0) {
    log.groups.forEach((g, idx) => {
      const slot = idx + 1;
      const idxS = slot > 1 ? String(slot) : "";

      // Identity fields: read from flat keys only if they have a real value,
      // otherwise fall back to the group object value.
      const name = (log as DailyLogIndexed)[`groupName${idxS}`]?.trim() || g.groupName || "";
      const mgr = (log as DailyLogIndexed)[`managerName${idxS}`]?.trim() || g.managerName || "";
      const phone = (log as DailyLogIndexed)[`managerPhone${idxS}`]?.trim() || g.managerPhone || "";
      const unit = (log as DailyLogIndexed)[`unitOut${idxS}`]?.trim() || g.unitOut || "";
      const officers = (log as DailyLogIndexed)[`officersCount${idxS}`]?.trim() || g.officersCount || "";

      // Metric fields: ALWAYS come from the group object.
      // The flat rescuedCount/recoveredCount/etc. are GENERAL polygon stats, not Group 1 metrics.
      const rescued = g.rescuedCount;
      const recovered = g.recoveredCount;
      const pets = g.rescuedPetsCount;
      const prehospital = g.prehospitalCareCount;
      const transfers = g.transfersCount;
      const arrived = g.hasArrived !== undefined ? !!g.hasArrived : !!(log as DailyLogIndexed)[`hasArrivedG${slot}`];
      const flatCommId = (log as DailyLogIndexed)[`commissionId${idxS}`];
      const arrayCommId = g.commissionId;
      const commissionId = (arrayCommId && arrayCommId !== "independiente")
        ? arrayCommId
        : (flatCommId || arrayCommId || "independiente");
      const isVolunteer = (log as DailyLogIndexed)[`isVolunteer${idxS}`] !== undefined ? !!(log as DailyLogIndexed)[`isVolunteer${idxS}`] : g.isVolunteer;

      const hasData = !!(name?.trim() || officers || unit?.trim() || mgr?.trim() || rescued || recovered || prehospital || transfers);
      if (hasData) {
        rawEntries.push({
          id: g.id || `g${slot}`,
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
          commissionId: commissionId || "independiente",
          isVolunteer: !!isVolunteer,
        });
      }
    });

    let slot = log.groups.length + 1;
    while (slot <= 50) {
      const idxS = String(slot);
      const name = (log as DailyLogIndexed)[`groupName${idxS}`];
      const mgr = (log as DailyLogIndexed)[`managerName${idxS}`];
      const phone = (log as DailyLogIndexed)[`managerPhone${idxS}`];
      const unit = (log as DailyLogIndexed)[`unitOut${idxS}`];
      const officers = (log as DailyLogIndexed)[`officersCount${idxS}`];
      const rescued = (log as DailyLogIndexed)[`rescuedCount${idxS}`];
      const recovered = (log as DailyLogIndexed)[`recoveredCount${idxS}`];
      const pets = (log as DailyLogIndexed)[`rescuedPetsCount${idxS}`];
      const prehospital = (log as DailyLogIndexed)[`prehospitalCareCount${idxS}`];
      const transfers = (log as DailyLogIndexed)[`transfersCount${idxS}`];
      const arrived = (log as DailyLogIndexed)[`hasArrivedG${slot}`];
      const commissionId = (log as DailyLogIndexed)[`commissionId${idxS}`];
      const isVolunteer = (log as DailyLogIndexed)[`isVolunteer${idxS}`];

      const hasData = !!(name?.trim() || officers || unit?.trim() || mgr?.trim() || rescued || recovered || prehospital || transfers);
      if (hasData) {
        rawEntries.push({
          id: `g${slot}`,
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
          commissionId: commissionId || "independiente",
          isVolunteer: !!isVolunteer,
        });
      } else if (slot > 4) {
        break;
      }
      slot++;
    }
  } else {
    const addLegacy = (slotIndex: number, name?: string, mgr?: string, phone?: string, unit?: string, officers?: string, rescued?: string, recovered?: string, pets?: string, prehospital?: string, transfers?: string, arrived?: boolean, commissionId?: string, isVolunteer?: boolean) => {
      const hasData = !!(name?.trim() || officers || unit?.trim() || mgr?.trim() || rescued || recovered || prehospital || transfers);
      if (hasData) {
        rawEntries.push({
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
          commissionId: commissionId || "independiente",
          isVolunteer: !!isVolunteer,
        });
      }
    };

    let slot = 1;
    while (slot <= 50) {
      const idxS = slot > 1 ? String(slot) : "";
      const name = (log as DailyLogIndexed)[`groupName${idxS}`];
      const mgr = (log as DailyLogIndexed)[`managerName${idxS}`];
      const phone = (log as DailyLogIndexed)[`managerPhone${idxS}`];
      const unit = (log as DailyLogIndexed)[`unitOut${idxS}`];
      const officers = (log as DailyLogIndexed)[`officersCount${idxS}`];
      const rescued = (log as DailyLogIndexed)[`rescuedCount${idxS}`] || (log as DailyLogIndexed)[`rescuedCount${slot}`];
      const recovered = (log as DailyLogIndexed)[`recoveredCount${idxS}`] || (log as DailyLogIndexed)[`recoveredCount${slot}`];
      const pets = (log as DailyLogIndexed)[`rescuedPetsCount${idxS}`] || (log as DailyLogIndexed)[`rescuedPetsCount${slot}`];
      const prehospital = (log as DailyLogIndexed)[`prehospitalCareCount${idxS}`] || (log as DailyLogIndexed)[`prehospitalCareCount${slot}`];
      const transfers = (log as DailyLogIndexed)[`transfersCount${idxS}`] || (log as DailyLogIndexed)[`transfersCount${slot}`];
      const arrived = (log as DailyLogIndexed)[`hasArrivedG${slot}`];
      const commissionId = (log as DailyLogIndexed)[`commissionId${idxS}`];
      const isVolunteer = (log as DailyLogIndexed)[`isVolunteer${idxS}`];

      const hasData = !!(name?.trim() || officers || unit?.trim() || mgr?.trim() || rescued || recovered || prehospital || transfers);
      if (hasData) {
        addLegacy(slot, name, mgr, phone, unit, officers, rescued, recovered, pets, prehospital, transfers, arrived, commissionId, isVolunteer);
      } else if (slot > 4) {
        break;
      }
      slot++;
    }
  }

  // Inherit shared commission metrics for groups in the same joint commission if not explicitly set
  const commMetricsMap = new Map<string, { rescued?: string; recovered?: string; pets?: string; prehospital?: string; transfers?: string }>();
  for (const g of rawEntries) {
    const cid = g.commissionId || "independiente";
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

  for (const g of rawEntries) {
    const cid = g.commissionId || "independiente";
    if (cid !== "independiente" && commMetricsMap.has(cid)) {
      const m = commMetricsMap.get(cid)!;
      if (!g.rescuedCount) g.rescuedCount = m.rescued;
      if (!g.recoveredCount) g.recoveredCount = m.recovered;
      if (!g.rescuedPetsCount) g.rescuedPetsCount = m.pets;
      if (!g.prehospitalCareCount) g.prehospitalCareCount = m.prehospital;
      if (!g.transfersCount) g.transfersCount = m.transfers;
    }
  }

  // Expand compound names (e.g. "REDAN Los Llanos y PC Miranda" -> "REDAN Los Llanos", "PC Miranda")
  const expandedList: GroupLogEntry[] = [];
  for (const entry of rawEntries) {
    const subNames = splitGroupNames(entry.groupName);
    if (subNames.length > 1) {
      subNames.forEach((sName, sIdx) => {
        expandedList.push({
          ...entry,
          id: `${entry.id || "g"}_${sIdx}`,
          groupName: sName,
          commissionId: entry.commissionId && entry.commissionId !== "independiente" ? entry.commissionId : "comision_1",
        });
      });
    } else {
      expandedList.push(entry);
    }
  }

  return expandedList;
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
        commissionId: log.commissionId2 || "independiente",
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
        commissionId: log.commissionId3 || "independiente",
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
        commissionId: log.commissionId4 || "independiente",
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
      commissionId: log.commissionId || "independiente",
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
      commissionId: item.commissionId || "independiente",
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
    commissionId: "independiente",
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

export function mergeLogs(logs: DailyLog[]): DailyLog | null {
  if (logs.length === 0) return null;
  if (logs.length === 1) return logs[0];
  const merged: DailyLog = { ...logs[0] };
  const allNovedades = [...(merged.novedades || [])];
  const allGroups = [...(merged.groups || [])];
  for (let i = 1; i < logs.length; i++) {
    const other = logs[i];
    merged.rescuedCount = String((parseInt(merged.rescuedCount || "0", 10) || 0) + (parseInt(other.rescuedCount || "0", 10) || 0));
    merged.recoveredCount = String((parseInt(merged.recoveredCount || "0", 10) || 0) + (parseInt(other.recoveredCount || "0", 10) || 0));
    merged.rescuedPetsCount = String((parseInt(merged.rescuedPetsCount || "0", 10) || 0) + (parseInt(other.rescuedPetsCount || "0", 10) || 0));
    merged.prehospitalCareCount = String((parseInt(merged.prehospitalCareCount || "0", 10) || 0) + (parseInt(other.prehospitalCareCount || "0", 10) || 0));
    merged.transfersCount = String((parseInt(merged.transfersCount || "0", 10) || 0) + (parseInt(other.transfersCount || "0", 10) || 0));
    if (other.novedades) allNovedades.push(...other.novedades);
    if (other.groups) allGroups.push(...other.groups);
    for (let g = 1; g <= 4; g++) {
      if ((other as DailyLogIndexed)[`hasArrivedG${g}`]) (merged as DailyLogIndexed)[`hasArrivedG${g}`] = true;
    }
  }
  merged.novedades = allNovedades;
  merged.groups = allGroups;
  merged.department = undefined;
  return merged;
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
    const commPets = new Map<string, number>();

    for (const g of groups) {
      const p = parseInt(g.officersCount || "0", 10) || 0;
      totalPersonnel += p;

      const r = parseInt(g.rescuedCount || "0", 10) || 0;
      const rc = parseInt(g.recoveredCount || "0", 10) || 0;
      const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
      const tr = parseInt(g.transfersCount || "0", 10) || 0;
      const pets = parseInt(g.rescuedPetsCount || "0", 10) || 0;

      const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
      commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
      commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
      commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
      commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));
      commPets.set(commKey, Math.max(commPets.get(commKey) || 0, pets));

      if (g.hasArrived) groupsArrived++;
    }

    commRescued.forEach((val) => { totalRescued += val; });
    commRecovered.forEach((val) => { totalRecovered += val; });
    commPrehospital.forEach((val) => { totalPrehospitalCare += val; });
    commTransfers.forEach((val) => { totalTransfers += val; });
    commPets.forEach((val) => { totalPets += val; });

    // Fallback: if no groups but flat field has pets, use that
    if (groups.length === 0) {
      totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
    }
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
  jointPartners?: string[];
  commissionId?: string;
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

export interface JointCommissionGroupStat {
  groupName: string;
  department?: string;
  isVolunteer?: boolean;
  daysActive: number;
  rescued: number;
  recovered: number;
  prehospital: number;
  transfers: number;
  pets: number;
}

export interface JointCommissionStat {
  commissionId: string;
  commissionLabel: string;
  participatingGroups: JointCommissionGroupStat[];
  daysActive: number;
  totalPersonnel: number;
  totalRescued: number;
  totalRecovered: number;
  totalPrehospitalCare: number;
  totalTransfers: number;
  totalPets: number;
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
  independentGroupStats: GroupStats[];
  jointCommissionStats?: JointCommissionStat[];
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
      const commPets = new Map<string, number>();

      for (const g of groupList) {
        upsertGroupItem(g, log);

        const p = parseInt(g.officersCount || "0", 10) || 0;
        totalPersonnel += p;

        const r = parseInt(g.rescuedCount || "0", 10) || 0;
        const rc = parseInt(g.recoveredCount || "0", 10) || 0;
        const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
        const tr = parseInt(g.transfersCount || "0", 10) || 0;
        const pets = parseInt(g.rescuedPetsCount || "0", 10) || 0;

        const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
        commRescued.set(commKey, Math.max(commRescued.get(commKey) || 0, r));
        commRecovered.set(commKey, Math.max(commRecovered.get(commKey) || 0, rc));
        commPrehospital.set(commKey, Math.max(commPrehospital.get(commKey) || 0, ph));
        commTransfers.set(commKey, Math.max(commTransfers.get(commKey) || 0, tr));
        commPets.set(commKey, Math.max(commPets.get(commKey) || 0, pets));
      }

      commRescued.forEach((val) => { totalRescued += val; });
      commRecovered.forEach((val) => { totalRecovered += val; });
      commPrehospital.forEach((val) => { totalPrehospitalCare += val; });
      commTransfers.forEach((val) => { totalTransfers += val; });
      commPets.forEach((val) => { totalPets += val; });

      // Fallback: if no groups but flat field has pets, use that
      if (groupList.length === 0) {
        totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
      }

      // Track joint commission partners per group in this log
      const logCommGroups = new Map<string, GroupLogEntry[]>();
      for (const g of groupList) {
        const commKey = g.commissionId || "comision_1";
        if (commKey !== "independiente" && g.groupName.trim()) {
          if (!logCommGroups.has(commKey)) logCommGroups.set(commKey, []);
          logCommGroups.get(commKey)!.push(g);
        }
      }

      logCommGroups.forEach((gList) => {
        if (gList.length > 1) {
          const groupNames = gList.map((g) => g.groupName.trim());
          for (const gItem of gList) {
            const trimmedName = gItem.groupName.trim();
            const key = trimmedName.toLowerCase() + "_" + (log.department || "");
            const existing = groupMap.get(key);
            if (existing) {
              if (!existing.jointPartners) existing.jointPartners = [];
              groupNames.forEach((other) => {
                if (other !== trimmedName && !existing.jointPartners!.includes(other)) {
                  existing.jointPartners!.push(other);
                }
              });
            }
          }
        }
      });
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

        // Use getNormalizedGroupList for correct handling of groups[] array and commission de-dup
        const gList = getNormalizedGroupList(log);
        const fCommRescued = new Map<string, number>();
        const fCommRecovered = new Map<string, number>();
        const fCommPrehospital = new Map<string, number>();
        const fCommTransfers = new Map<string, number>();

        for (const g of gList) {
          fStat.totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;

          const r = parseInt(g.rescuedCount || "0", 10) || 0;
          const rc = parseInt(g.recoveredCount || "0", 10) || 0;
          const ph = parseInt(g.prehospitalCareCount || "0", 10) || 0;
          const tr = parseInt(g.transfersCount || "0", 10) || 0;

          const commKey = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : `ind_${Math.random()}`;
          fCommRescued.set(commKey, Math.max(fCommRescued.get(commKey) || 0, r));
          fCommRecovered.set(commKey, Math.max(fCommRecovered.get(commKey) || 0, rc));
          fCommPrehospital.set(commKey, Math.max(fCommPrehospital.get(commKey) || 0, ph));
          fCommTransfers.set(commKey, Math.max(fCommTransfers.get(commKey) || 0, tr));
        }

        fCommRescued.forEach((val) => { fStat.totalRescued += val; });
        fCommRecovered.forEach((val) => { fStat.totalRecovered += val; });
        fCommPrehospital.forEach((val) => { fStat.totalPrehospitalCare += val; });
        fCommTransfers.forEach((val) => { fStat.totalTransfers += val; });
      }
    }

    fStat.daysActive = featDates.size;

    if (fStat.daysActive > 0 || fStat.totalRescued > 0 || fStat.totalRecovered > 0 || fStat.totalPrehospitalCare > 0 || fStat.totalTransfers > 0) {
      featureStatsMap.set(feat.id, fStat);
    }
  }

  // 3. Compile Joint Commission Stats & Independent Group Stats
  const indepMap = new Map<string, {
    groupName: string;
    department?: string;
    isVolunteer?: boolean;
    datesSet: Set<string>;
    totalPersonnel: number;
    totalRescued: number;
    totalRecovered: number;
    totalPrehospitalCare: number;
    totalTransfers: number;
    totalPets: number;
  }>();

  const jointPairsMap = new Map<string, {
    commissionId: string;
    commissionLabel: string;
    groupsMap: Map<string, {
      groupName: string;
      department?: string;
      isVolunteer?: boolean;
      daysActive: number;
      rescued: number;
      recovered: number;
      prehospital: number;
      transfers: number;
      pets: number;
    }>;
    datesSet: Set<string>;
    rescued: number;
    recovered: number;
    prehospital: number;
    transfers: number;
    pets: number;
    personnel: number;
  }>();

  for (const feat of features) {
    for (const log of feat.dailyLogs || []) {
      if (activeDepartment && activeDepartment !== "mixto" && log.department && log.department !== activeDepartment) continue;
      if (!logHasAnyData(log)) continue;

      const groupList = getNormalizedGroupList(log).filter((g) => g.groupName.trim());
      if (groupList.length === 0) continue;

      const _hasMultipleGroups = groupList.length > 1;

      // Log-level group classification strictly following point configuration commissionId
      const logCommBuckets = new Map<string, GroupLogEntry[]>();

      for (const g of groupList) {
        const name = g.groupName.trim();
        if (!name) continue;

        // If set to 'independiente' or no commission specified, treat as independent
        const isIndep = !g.commissionId || g.commissionId === "independiente";

        if (isIndep) {
          const key = name.toLowerCase() + "_" + (log.department || "");
          if (!indepMap.has(key)) {
            indepMap.set(key, {
              groupName: name,
              department: log.department,
              isVolunteer: !!g.isVolunteer,
              datesSet: new Set(),
              totalPersonnel: 0,
              totalRescued: 0,
              totalRecovered: 0,
              totalPrehospitalCare: 0,
              totalTransfers: 0,
              totalPets: 0,
            });
          }
          const item = indepMap.get(key)!;
          item.datesSet.add(log.date);
          if (g.isVolunteer) item.isVolunteer = true;
          item.totalPersonnel += parseInt(g.officersCount || "0", 10) || 0;
          item.totalRescued += parseInt(g.rescuedCount || "0", 10) || 0;
          item.totalRecovered += parseInt(g.recoveredCount || "0", 10) || 0;
          item.totalPrehospitalCare += parseInt(g.prehospitalCareCount || "0", 10) || 0;
          item.totalTransfers += parseInt(g.transfersCount || "0", 10) || 0;
          item.totalPets += parseInt(g.rescuedPetsCount || "0", 10) || 0;
        } else {
          const cid = g.commissionId && g.commissionId !== "independiente" ? g.commissionId : "comision_1";
          if (!logCommBuckets.has(cid)) logCommBuckets.set(cid, []);
          logCommBuckets.get(cid)!.push(g);
        }
      }

      logCommBuckets.forEach((gList, cid) => {
        // Build pair key for joint commission
        const sortedNames = gList.map((g) => g.groupName.trim()).sort();
        const pairKey = cid + "_" + sortedNames.join("__");

        if (!jointPairsMap.has(pairKey)) {
          jointPairsMap.set(pairKey, {
            commissionId: cid,
            commissionLabel: cid.startsWith("comision_")
              ? `Comisión Conjunta ${cid.replace("comision_", "")}`
              : "Comisión Conjunta",
            groupsMap: new Map(),
            datesSet: new Set(),
            rescued: 0,
            recovered: 0,
            prehospital: 0,
            transfers: 0,
            pets: 0,
            personnel: 0,
          });
        }

        const jData = jointPairsMap.get(pairKey)!;
        jData.datesSet.add(log.date);

        gList.forEach((g) => {
          const name = g.groupName.trim();
          const gKey = name.toLowerCase();
          if (!jData.groupsMap.has(gKey)) {
            jData.groupsMap.set(gKey, {
              groupName: name,
              department: log.department,
              isVolunteer: !!g.isVolunteer,
              daysActive: 0,
              rescued: 0,
              recovered: 0,
              prehospital: 0,
              transfers: 0,
              pets: 0,
            });
          }
          const gData = jData.groupsMap.get(gKey)!;
          gData.daysActive++;
          if (g.isVolunteer) gData.isVolunteer = true;

          gData.rescued += parseInt(g.rescuedCount || "0", 10) || 0;
          gData.recovered += parseInt(g.recoveredCount || "0", 10) || 0;
          gData.prehospital += parseInt(g.prehospitalCareCount || "0", 10) || 0;
          gData.transfers += parseInt(g.transfersCount || "0", 10) || 0;
          gData.pets += parseInt(g.rescuedPetsCount || "0", 10) || 0;

          jData.personnel += parseInt(g.officersCount || "0", 10) || 0;
        });

        const maxR = Math.max(...gList.map((g) => parseInt(g.rescuedCount || "0", 10) || 0));
        const maxRc = Math.max(...gList.map((g) => parseInt(g.recoveredCount || "0", 10) || 0));
        const maxPh = Math.max(...gList.map((g) => parseInt(g.prehospitalCareCount || "0", 10) || 0));
        const maxTr = Math.max(...gList.map((g) => parseInt(g.transfersCount || "0", 10) || 0));
        const maxPets = parseInt(log.rescuedPetsCount || "0", 10) || 0;

        jData.rescued += maxR;
        jData.recovered += maxRc;
        jData.prehospital += maxPh;
        jData.transfers += maxTr;
        jData.pets += maxPets;
      });
    }
  }

  const jointCommissionStats: JointCommissionStat[] = [];
  jointPairsMap.forEach((jData) => {
    const participatingGroups: JointCommissionGroupStat[] = Array.from(jData.groupsMap.values()).map((item) => ({
      groupName: item.groupName,
      department: item.department,
      isVolunteer: item.isVolunteer,
      daysActive: item.daysActive,
      rescued: item.rescued,
      recovered: item.recovered,
      prehospital: item.prehospital,
      transfers: item.transfers,
      pets: item.pets,
    }));

    jointCommissionStats.push({
      commissionId: jData.commissionId,
      commissionLabel: jData.commissionLabel,
      participatingGroups,
      daysActive: jData.datesSet.size,
      totalPersonnel: jData.personnel,
      totalRescued: jData.rescued,
      totalRecovered: jData.recovered,
      totalPrehospitalCare: jData.prehospital,
      totalTransfers: jData.transfers,
      totalPets: jData.pets,
    });
  });

  const groupStats = Array.from(groupMap.values()).sort((a, b) => b.daysActive - a.daysActive);
  const independentGroupStats: GroupStats[] = Array.from(indepMap.values())
    .map((item) => ({
      groupName: item.groupName,
      department: item.department,
      isVolunteer: item.isVolunteer,
      daysActive: item.datesSet.size,
      totalPersonnel: item.totalPersonnel,
      totalRescued: item.totalRescued,
      totalRecovered: item.totalRecovered,
      totalPrehospitalCare: item.totalPrehospitalCare,
      totalTransfers: item.totalTransfers,
      totalPets: item.totalPets,
    }))
    .sort((a, b) => b.daysActive - a.daysActive);
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
    independentGroupStats,
    jointCommissionStats,
    featureStats,
  };
}

