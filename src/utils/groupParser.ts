import type { DailyLog, Department, GroupLogEntry } from "../types";

export function splitGroupNames(name: string): string[] {
  if (!name || !name.trim()) return [];
  const trimmed = name.trim();
  const parts = trimmed.split(/\s+(?:y|Y|e|E|\/|\+)\s+|\s*[/,+]\s*/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [trimmed];
}

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
  };
}

export function getNormalizedGroupList(log?: Partial<DailyLog>): GroupLogEntry[] {
  if (!log) return [];
  if (!log.groups || !Array.isArray(log.groups) || log.groups.length === 0) return [];

  const rawEntries: GroupLogEntry[] = [];

  log.groups.forEach((g) => {
    const hasData = !!(g.groupName?.trim() || g.officersCount || g.unitOut?.trim() || g.managerName?.trim() ||
      g.rescuedCount || g.recoveredCount || g.prehospitalCareCount || g.transfersCount || g.edanCount);
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
      });
    }
  });

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
