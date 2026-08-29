import type { DailyLog, Department, DepartmentView, GroupLogEntry, CustomActivity, DrawnFeature, NovedadEntry } from "../types";
import { METRIC_FIELDS, getMetricNumeric, COMMISSION_INDEPENDENT } from "../components/popup/metricFields";
import { buildParentsMap } from "./spatialUtils";

/**
 * Split comma/slash/plus/and-separated group names into individual names.
 */
export function splitGroupNames(name: string): string[] {
  if (!name || !name.trim()) return [];
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+(?:y|Y|e|E|\/|\+)\s+|\s*[/,+]\s*/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

/**
 * Creates an empty DailyLog object.
 */
export function emptyLog(date: string, department?: Department): DailyLog {
  return {
    date,
    department,
    groups: [],
    observations: "",
    novedades: [],
    rescuedCount: "",
    recoveredCount: "",
    rescuedPetsCount: "",
    prehospitalCareCount: "",
    transfersCount: "",
    customActivities: [],
  };
}

/**
 * Normalizes groups in a DailyLog, supporting flat legacy fields and group splitting.
 */
export function getNormalizedGroupList(log?: Partial<DailyLog>): GroupLogEntry[] {
  if (!log) return [];
  const rawEntries: GroupLogEntry[] = [];

  if (Array.isArray(log.groups) && log.groups.length > 0) {
    log.groups.forEach((g) => {
      if (g.id === "__custom_meta__") return;
      const hasData = !!(
        g.groupName?.trim() ||
        g.officersCount ||
        g.unitOut?.trim() ||
        g.managerName?.trim() ||
        g.rescuedCount ||
        g.recoveredCount ||
        g.prehospitalCareCount ||
        g.transfersCount ||
        g.edanCount ||
        (g.customActivities && g.customActivities.length > 0)
      );
      if (hasData) {
        rawEntries.push({
          id: g.id || crypto.randomUUID(),
          groupName: (g.groupName || "").trim(),
          managerName: g.managerName || "",
          managerPhone: g.managerPhone || "",
          unitOut: g.unitOut || "",
          departureTime: g.departureTime || "",
          arrivalTime: g.arrivalTime || "",
          officersCount: g.officersCount || "",
          rescuedCount: g.rescuedCount || "",
          recoveredCount: g.recoveredCount || "",
          rescuedPetsCount: g.rescuedPetsCount || "",
          prehospitalCareCount: g.prehospitalCareCount || "",
          transfersCount: g.transfersCount || "",
          edanCount: g.edanCount || "",
          hasArrived: !!g.hasArrived,
          commissionId: g.commissionId || "independiente",
          isVolunteer: !!g.isVolunteer,
          department: g.department || log.department,
          customActivities: g.customActivities,
        });
      }
    });
  } else {
    // Support legacy flat fields if any exist
    const legacyG1 = (log as any).groupName || (log as any).officersCount || (log as any).unitOut;
    const legacyG2 = (log as any).group2Name || (log as any).group2OfficersCount || (log as any).group2UnitOut;
    if (legacyG1) {
      rawEntries.push({
        id: "g1",
        groupName: (log as any).groupName || "",
        managerName: (log as any).managerName || "",
        managerPhone: (log as any).managerPhone || "",
        unitOut: (log as any).unitOut || "",
        departureTime: (log as any).departureTime || "",
        arrivalTime: (log as any).arrivalTime || "",
        officersCount: (log as any).officersCount || "",
        rescuedCount: (log as any).rescuedCount || "",
        recoveredCount: (log as any).recoveredCount || "",
        rescuedPetsCount: (log as any).rescuedPetsCount || "",
        prehospitalCareCount: (log as any).prehospitalCareCount || "",
        transfersCount: (log as any).transfersCount || "",
        edanCount: (log as any).edanCount || "",
        hasArrived: !!(log as any).hasArrived,
        commissionId: (log as any).commissionId || "independiente",
        isVolunteer: !!(log as any).isVolunteer,
      });
    }
    if (legacyG2) {
      rawEntries.push({
        id: "g2",
        groupName: (log as any).group2Name || "",
        managerName: (log as any).group2ManagerName || "",
        managerPhone: (log as any).group2ManagerPhone || "",
        unitOut: (log as any).group2UnitOut || "",
        departureTime: (log as any).group2DepartureTime || "",
        arrivalTime: (log as any).group2ArrivalTime || "",
        officersCount: (log as any).group2OfficersCount || "",
        rescuedCount: (log as any).group2RescuedCount || "",
        recoveredCount: (log as any).group2RecoveredCount || "",
        rescuedPetsCount: (log as any).group2RescuedPetsCount || "",
        prehospitalCareCount: (log as any).group2PrehospitalCareCount || "",
        transfersCount: (log as any).group2TransfersCount || "",
        edanCount: (log as any).group2EdanCount || "",
        hasArrived: !!(log as any).group2HasArrived,
        commissionId: (log as any).group2CommissionId || "independiente",
        isVolunteer: !!(log as any).group2IsVolunteer,
      });
    }
  }

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
  if (!!(log.observations && log.observations.trim())) return true;
  if (parseInt(log.rescuedCount || "0", 10) > 0) return true;
  if (parseInt(log.recoveredCount || "0", 10) > 0) return true;
  if (parseInt(log.rescuedPetsCount || "0", 10) > 0) return true;
  if (parseInt(log.prehospitalCareCount || "0", 10) > 0) return true;
  if (parseInt(log.transfersCount || "0", 10) > 0) return true;
  if (Array.isArray(log.customActivities) && log.customActivities.length > 0) return true;
  if (Array.isArray(log.novedades) && log.novedades.length > 0) return true;
  return false;
}

export interface GroupData {
  id?: string;
  groupName: string;
  managerName: string;
  managerPhone: string;
  unitOut: string;
  departureTime?: string;
  arrivalTime?: string;
  officersCount: string;
  rescuedCount: string;
  recoveredCount: string;
  rescuedPetsCount?: string;
  prehospitalCareCount: string;
  transfersCount: string;
  edanCount?: string;
  hasArrived: boolean;
  commissionId?: string;
  isVolunteer?: boolean;
  customActivities?: CustomActivity[];
}

export function getGroupData(log: DailyLog, groupIndex: number): GroupData {
  const list = getNormalizedGroupList(log);
  const item = list[groupIndex - 1];
  if (item) {
    return {
      id: item.id,
      groupName: item.groupName,
      managerName: item.managerName || "",
      managerPhone: item.managerPhone || "",
      unitOut: item.unitOut || "",
      departureTime: item.departureTime || "",
      arrivalTime: item.arrivalTime || "",
      officersCount: item.officersCount || "",
      rescuedCount: item.rescuedCount || "",
      recoveredCount: item.recoveredCount || "",
      rescuedPetsCount: item.rescuedPetsCount || "",
      prehospitalCareCount: item.prehospitalCareCount || "",
      transfersCount: item.transfersCount || "",
      edanCount: item.edanCount || "",
      hasArrived: !!item.hasArrived,
      commissionId: item.commissionId || "independiente",
      isVolunteer: !!item.isVolunteer,
      customActivities: item.customActivities,
    };
  }
  return {
    groupName: "",
    managerName: "",
    managerPhone: "",
    unitOut: "",
    departureTime: "",
    arrivalTime: "",
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    rescuedPetsCount: "",
    prehospitalCareCount: "",
    transfersCount: "",
    edanCount: "",
    hasArrived: false,
    commissionId: "independiente",
    isVolunteer: false,
  };
}

/**
 * Merge two lists of custom activities combining counts for numeric values
 * and concatenating descriptive text.
 */
export function mergeCustomActivities(listA: CustomActivity[] = [], listB: CustomActivity[] = []): CustomActivity[] {
  const map = new Map<string, { id: string; name: string; valNum: number; isNum: boolean; valStr: string; descriptions: string[] }>();

  const processItem = (item: CustomActivity) => {
    const key = item.name.trim().toLowerCase();
    if (!key) return;
    const num = parseFloat(item.value);
    const isNumber = !isNaN(num) && isFinite(num) && String(num) === item.value.trim();
    const desc = item.description?.trim();

    if (!map.has(key)) {
      map.set(key, {
        id: item.id || crypto.randomUUID(),
        name: item.name.trim(),
        valNum: isNumber ? num : 0,
        isNum: isNumber,
        valStr: item.value.trim(),
        descriptions: desc ? [desc] : [],
      });
    } else {
      const existing = map.get(key)!;
      if (existing.isNum && isNumber) {
        existing.valNum += num;
      } else {
        existing.isNum = false;
        existing.valStr = existing.valStr ? `${existing.valStr}, ${item.value.trim()}` : item.value.trim();
      }
      if (desc && !existing.descriptions.includes(desc)) {
        existing.descriptions.push(desc);
      }
    }
  };

  listA.forEach(processItem);
  listB.forEach(processItem);

  return Array.from(map.values()).map((entry) => ({
    id: entry.id,
    name: entry.name,
    value: entry.isNum ? String(entry.valNum) : entry.valStr,
    description: entry.descriptions.length > 0 ? entry.descriptions.join(" • ") : undefined,
  }));
}

/**
 * Merges multiple daily logs into a single aggregated daily log.
 */
export function mergeLogs(logs: DailyLog[]): DailyLog | null {
  if (logs.length === 0) return null;
  if (logs.length === 1) return logs[0];
  const firstGroups = (logs[0].groups || []).map((g) => ({
    ...g,
    department: g.department || logs[0].department || "pc",
  }));
  const merged: DailyLog = { ...logs[0], groups: firstGroups };
  const allNovedades: NovedadEntry[] = [...(merged.novedades || [])];
  const allGroups = [...firstGroups];
  let mergedCustomActivities = [...(logs[0].customActivities || [])];

  for (let i = 1; i < logs.length; i++) {
    const other = logs[i];
    merged.rescuedCount = String((parseInt(merged.rescuedCount || "0", 10) || 0) + (parseInt(other.rescuedCount || "0", 10) || 0));
    merged.recoveredCount = String((parseInt(merged.recoveredCount || "0", 10) || 0) + (parseInt(other.recoveredCount || "0", 10) || 0));
    merged.rescuedPetsCount = String((parseInt(merged.rescuedPetsCount || "0", 10) || 0) + (parseInt(other.rescuedPetsCount || "0", 10) || 0));
    merged.prehospitalCareCount = String((parseInt(merged.prehospitalCareCount || "0", 10) || 0) + (parseInt(other.prehospitalCareCount || "0", 10) || 0));
    merged.transfersCount = String((parseInt(merged.transfersCount || "0", 10) || 0) + (parseInt(other.transfersCount || "0", 10) || 0));
    if (other.novedades) allNovedades.push(...other.novedades);
    if (other.customActivities) {
      mergedCustomActivities = mergeCustomActivities(mergedCustomActivities, other.customActivities);
    }
    if (other.groups) {
      const otherGroups = other.groups.map((g) => ({
        ...g,
        department: g.department || other.department || "pc",
      }));
      allGroups.push(...otherGroups);
    }
  }
  merged.novedades = allNovedades;
  merged.groups = allGroups;
  merged.customActivities = mergedCustomActivities;
  merged.department = undefined;
  return merged;
}

export interface ContainedPointItem {
  point: DrawnFeature;
  log: Partial<DailyLog>;
}

export interface AggregatedLog extends Partial<DailyLog> {
  _hasData?: boolean;
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

/**
 * Aggregates all metrics and activities for a polygon sector, including its own logs,
 * groups, and all contained points.
 */
export function aggregatePolygonLog(
  polygonOwnLog: Partial<DailyLog>,
  polygonGroups: GroupLogEntry[],
  containedWithLogs: ContainedPointItem[],
): AggregatedLog {
  const totals: Record<string, number> = {};
  for (const m of METRIC_FIELDS) totals[m.field] = 0;

  let customActivities: CustomActivity[] = polygonOwnLog.customActivities ? [...polygonOwnLog.customActivities] : [];

  // 1. General polygon stats (independent from groups)
  addMetricsFromLog(totals, polygonOwnLog);

  // Maps for joint commissions deduplication with Math.max
  const commMetrics: Record<string, Map<string, number>> = {};
  for (const m of METRIC_FIELDS) commMetrics[m.field] = new Map();

  const processGroupEntry = (g: GroupLogEntry) => {
    const isInd = !g.commissionId || g.commissionId === COMMISSION_INDEPENDENT;
    for (const m of METRIC_FIELDS) {
      const val = getMetricNumeric(g, m.field);
      if (isInd) {
        totals[m.field] += val;
      } else {
        const cMap = commMetrics[m.field];
        cMap.set(g.commissionId!, Math.max(cMap.get(g.commissionId!) || 0, val));
      }
    }
    if (g.customActivities) {
      customActivities = mergeCustomActivities(customActivities, g.customActivities);
    }
  };

  // 2. Add polygon group metrics
  for (const g of polygonGroups) {
    processGroupEntry(g);
  }

  // 3. Add contained point metrics
  let observations = polygonOwnLog.observations ? `Polígono: ${polygonOwnLog.observations}` : "";
  for (const { point, log } of containedWithLogs) {
    const gList = getNormalizedGroupList(log);
    if (gList.length > 0) {
      for (const g of gList) {
        processGroupEntry(g);
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

  // Sum joint commission metrics
  for (const m of METRIC_FIELDS) {
    commMetrics[m.field].forEach((val) => {
      totals[m.field] += val;
    });
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

/**
 * Calculates day-level aggregated stats across an array of features.
 */
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

    totalRescued += parseInt(log.rescuedCount || "0", 10) || 0;
    totalRecovered += parseInt(log.recoveredCount || "0", 10) || 0;
    totalPrehospitalCare += parseInt(log.prehospitalCareCount || "0", 10) || 0;
    totalTransfers += parseInt(log.transfersCount || "0", 10) || 0;
    totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
  }

  return { totalPersonnel, totalRescued, totalRecovered, totalPets, totalPrehospitalCare, totalTransfers, activePoints, groupsArrived };
}

/**
 * Database serialization: Converts a database row to a typed DailyLog.
 */
export function fromDatabaseRow(row: any): DailyLog {
  const rawGroups = Array.isArray(row.groups)
    ? row.groups
    : (typeof row.groups === "string" && row.groups.trim() ? JSON.parse(row.groups) : []);

  let parsedCustomActivities: CustomActivity[] = [];
  if (Array.isArray(row.custom_activities)) {
    parsedCustomActivities = [...row.custom_activities];
  } else if (typeof row.custom_activities === "string" && row.custom_activities.trim()) {
    try {
      parsedCustomActivities = JSON.parse(row.custom_activities);
    } catch {}
  } else if (Array.isArray(row.customActivities)) {
    parsedCustomActivities = [...row.customActivities];
  }

  const cleanGroups: GroupLogEntry[] = [];
  for (const g of rawGroups) {
    if (g.customActivities && Array.isArray(g.customActivities)) {
      for (const ca of g.customActivities) {
        if (!parsedCustomActivities.some((existing) => existing.id === ca.id || existing.name === ca.name)) {
          parsedCustomActivities.push(ca);
        }
      }
    }
    if (g.id !== "__custom_meta__") {
      cleanGroups.push(g);
    }
  }

  return {
    date: row.date,
    department: row.department,
    groups: cleanGroups,
    observations: row.observations || "",
    novedades: Array.isArray(row.novedades)
      ? row.novedades
      : (typeof row.novedades === "string" && row.novedades.trim() ? JSON.parse(row.novedades) : []),
    rescuedCount: row.rescued_count || "",
    recoveredCount: row.recovered_count || "",
    rescuedPetsCount: row.rescued_pets_count || "",
    prehospitalCareCount: row.prehospital_care_count || "",
    transfersCount: row.transfers_count || "",
    customActivities: parsedCustomActivities,
  };
}

/**
 * Database serialization: Converts a DailyLog to a row dictionary for Supabase.
 */
export function toDatabaseRow(featureId: number | string, log: DailyLog): Record<string, unknown> {
  const fidStr = String(featureId);
  const deptToUse = log.department || "pc";
  const groupsList = getNormalizedGroupList(log).filter((g) =>
    g.id !== "__custom_meta__" &&
    !!(g.groupName?.trim() || g.officersCount?.trim() || g.unitOut?.trim() || g.managerName?.trim() ||
       g.departureTime?.trim() || g.arrivalTime?.trim() || g.managerPhone?.trim() ||
       g.rescuedCount?.trim() || g.recoveredCount?.trim() || g.rescuedPetsCount?.trim() ||
       g.prehospitalCareCount?.trim() || g.transfersCount?.trim() || g.edanCount?.trim() ||
       (g.customActivities && g.customActivities.length > 0))
  );

  if (log.customActivities && log.customActivities.length > 0) {
    if (groupsList.length > 0) {
      groupsList[0] = { ...groupsList[0], customActivities: log.customActivities };
    } else {
      groupsList.push({ id: "__custom_meta__", groupName: "", customActivities: log.customActivities });
    }
  }

  return {
    feature_id: fidStr,
    date: log.date,
    department: deptToUse,
    groups: groupsList,
    observations: log.observations || "",
    novedades: log.novedades || [],
    rescued_count: log.rescuedCount || "",
    recovered_count: log.recoveredCount || "",
    rescued_pets_count: log.rescuedPetsCount || "",
    prehospital_care_count: log.prehospitalCareCount || "",
    transfers_count: log.transfersCount || "",
    custom_activities: log.customActivities || [],
    updated_at: new Date().toISOString(),
  };
}

/**
 * Consolidated Deep Module Namespace
 */
export const FeatureLogBook = {
  splitGroupNames,
  emptyLog,
  normalizeGroups: getNormalizedGroupList,
  getTotalPersonnel,
  hasPersonnel: logHasPersonnel,
  isArrived: logIsArrived,
  matchesArrivalFilter: logMatchesArrivalFilter,
  hasAnyData: logHasAnyData,
  getGroupData,
  mergeCustomActivities,
  mergeLogs,
  aggregatePolygon: aggregatePolygonLog,
  getDayStats,
  fromDatabaseRow,
  toDatabaseRow,
};
