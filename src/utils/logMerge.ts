import type { DailyLog, GroupLogEntry, CustomActivity, NovedadEntry, Department } from "../types";
import { generateUUID } from "./uuidUtils";

/**
 * Checks if a daily log contains any relevant operational data
 * without relying on legacy flat fields.
 */
export function logHasAnyData(log?: Partial<DailyLog>): boolean {
  if (!log) return false;
  if (Array.isArray(log.groups) && log.groups.some((g) => {
    if (!g || g.id === "__custom_meta__") return false;
    return !!(
      g.groupName?.trim() ||
      (g.officersCount && g.officersCount !== "0") ||
      g.unitOut?.trim() ||
      g.managerName?.trim() ||
      (g.rescuedCount && g.rescuedCount !== "0") ||
      (g.recoveredCount && g.recoveredCount !== "0") ||
      (g.rescuedPetsCount && g.rescuedPetsCount !== "0") ||
      (g.prehospitalCareCount && g.prehospitalCareCount !== "0") ||
      (g.transfersCount && g.transfersCount !== "0") ||
      (g.edanCount && g.edanCount !== "0") ||
      (Array.isArray(g.customActivities) && g.customActivities.length > 0)
    );
  })) {
    return true;
  }
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

/**
 * Extracts only active, non-empty groups from a log, assigning department fallback.
 */
export function extractActiveGroups(log: Partial<DailyLog>, defaultDept: Department = "pc"): GroupLogEntry[] {
  if (!log || !Array.isArray(log.groups)) return [];
  const dept = (log.department as Department) || defaultDept;

  return log.groups
    .filter((g) => {
      if (!g || g.id === "__custom_meta__") return false;
      const hasName = !!g.groupName?.trim();
      const hasOfficers = !!(g.officersCount && g.officersCount !== "0");
      const hasUnit = !!g.unitOut?.trim();
      const hasManager = !!g.managerName?.trim();
      const hasMetrics = !!(
        (g.rescuedCount && g.rescuedCount !== "0") ||
        (g.recoveredCount && g.recoveredCount !== "0") ||
        (g.rescuedPetsCount && g.rescuedPetsCount !== "0") ||
        (g.prehospitalCareCount && g.prehospitalCareCount !== "0") ||
        (g.transfersCount && g.transfersCount !== "0") ||
        (g.edanCount && g.edanCount !== "0")
      );
      const hasActivities = Array.isArray(g.customActivities) && g.customActivities.length > 0;
      return hasName || hasOfficers || hasUnit || hasManager || hasMetrics || hasActivities;
    })
    .map((g) => ({
      id: g.id || generateUUID(),
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
      department: (g.department as Department) || dept,
      customActivities: g.customActivities,
    }));
}

/**
 * Merge two lists of custom activities combining counts for numeric values
 * and concatenating descriptive text without duplicates.
 */
export function mergeCustomActivities(listA: CustomActivity[] = [], listB: CustomActivity[] = []): CustomActivity[] {
  const map = new Map<string, { id: string; name: string; valNum: number; isNum: boolean; valStr: string; descriptions: string[] }>();

  const processItem = (item: CustomActivity) => {
    if (!item?.name) return;
    const key = item.name.trim().toLowerCase();
    if (!key) return;
    const num = parseFloat(item.value);
    const isNumber = !isNaN(num) && isFinite(num) && String(num) === item.value.trim();
    const desc = item.description?.trim();

    if (!map.has(key)) {
      map.set(key, {
        id: item.id || generateUUID(),
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
 * Core engine to merge multiple daily logs into a single aggregated daily log.
 * Clean modern TypeScript implementation without legacy flat fields.
 */
export function mergeLogs(logs: DailyLog[]): DailyLog | null {
  if (!logs || logs.length === 0) return null;

  const validLogs = logs.filter(Boolean);
  if (validLogs.length === 0) return null;

  if (validLogs.length === 1) {
    const single = validLogs[0];
    const dept = single.department || "pc";
    return {
      ...single,
      groups: extractActiveGroups(single, dept),
    };
  }

  const base = validLogs[0];
  const date = base.date;
  const allGroups: GroupLogEntry[] = [];
  const allNovedades: NovedadEntry[] = [];
  let mergedActivities: CustomActivity[] = [];
  const observationParts: string[] = [];

  let totalRescued = 0;
  let totalRecovered = 0;
  let totalPets = 0;
  let totalPrehospital = 0;
  let totalTransfers = 0;

  for (const log of validLogs) {
    const logDept = log.department || "pc";

    totalRescued += parseInt(log.rescuedCount || "0", 10) || 0;
    totalRecovered += parseInt(log.recoveredCount || "0", 10) || 0;
    totalPets += parseInt(log.rescuedPetsCount || "0", 10) || 0;
    totalPrehospital += parseInt(log.prehospitalCareCount || "0", 10) || 0;
    totalTransfers += parseInt(log.transfersCount || "0", 10) || 0;

    const logGroups = extractActiveGroups(log, logDept);
    allGroups.push(...logGroups);

    if (Array.isArray(log.novedades)) {
      allNovedades.push(...log.novedades);
    }

    if (Array.isArray(log.customActivities) && log.customActivities.length > 0) {
      mergedActivities = mergeCustomActivities(mergedActivities, log.customActivities);
    }

    if (log.observations?.trim()) {
      observationParts.push(log.observations.trim());
    }
  }

  // Deduplicate and sort novedades by time or timestamp
  const uniqueNovedades = Array.from(
    new Map(allNovedades.map((n) => [n.id || `${n.time}_${n.text}`, n])).values()
  ).sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return {
    date,
    department: undefined,
    rescuedCount: String(totalRescued),
    recoveredCount: String(totalRecovered),
    rescuedPetsCount: String(totalPets),
    prehospitalCareCount: String(totalPrehospital),
    transfersCount: String(totalTransfers),
    observations: observationParts.join("\n"),
    novedades: uniqueNovedades,
    customActivities: mergedActivities,
    groups: allGroups,
  };
}

/**
 * Dedicated merger for Protección Civil and Bomberos layers in InfoTab & Popups.
 * Cleanly unifies both departments into an aggregated view while preserving
 * individual group identities and departments.
 */
export function mergeDepartmentLogs(
  pcLog?: Partial<DailyLog> | null,
  bomberosLog?: Partial<DailyLog> | null,
  dateStr: string = ""
): DailyLog {
  const pcHasData = logHasAnyData(pcLog || undefined);
  const bomberosHasData = logHasAnyData(bomberosLog || undefined);

  const fallbackDate = dateStr || pcLog?.date || bomberosLog?.date || "";

  if (!pcHasData && !bomberosHasData) {
    return {
      date: fallbackDate,
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

  if (pcHasData && !bomberosHasData) {
    const safePc = pcLog as DailyLog;
    return {
      ...safePc,
      date: fallbackDate || safePc.date,
      department: undefined,
      groups: extractActiveGroups(safePc, "pc"),
    };
  }

  if (!pcHasData && bomberosHasData) {
    const safeBomberos = bomberosLog as DailyLog;
    return {
      ...safeBomberos,
      date: fallbackDate || safeBomberos.date,
      department: undefined,
      groups: extractActiveGroups(safeBomberos, "bomberos"),
    };
  }

  const merged = mergeLogs([
    { ...(pcLog as DailyLog), department: "pc" },
    { ...(bomberosLog as DailyLog), department: "bomberos" },
  ]);

  return (
    merged || {
      date: fallbackDate,
      groups: [],
      observations: "",
      novedades: [],
      rescuedCount: "",
      recoveredCount: "",
      rescuedPetsCount: "",
      prehospitalCareCount: "",
      transfersCount: "",
      customActivities: [],
    }
  );
}
