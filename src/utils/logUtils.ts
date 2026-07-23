import type { DailyLog, Department, DepartmentView } from "../types";

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
    log.officersCount ||
    log.groupName2 ||
    log.unitOut2 ||
    log.managerName2 ||
    log.officersCount2
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

export function getGroupData(log: DailyLog, group: 1 | 2): GroupData {
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
    if (!log || !logHasPersonnel(log)) continue;

    activePoints++;

    const p1 = parseInt(log.officersCount || "0", 10);
    const p2 = parseInt(log.officersCount2 || "0", 10);
    totalPersonnel += p1 + p2;

    const r1 = parseInt(log.rescuedCount || "0", 10);
    const r2 = parseInt(log.rescuedCount2 || "0", 10);
    totalRescued += r1 + r2;

    const rc1 = parseInt(log.recoveredCount || "0", 10);
    const rc2 = parseInt(log.recoveredCount2 || "0", 10);
    totalRecovered += rc1 + rc2;

    const ph1 = parseInt(log.prehospitalCareCount || "0", 10);
    const ph2 = parseInt(log.prehospitalCareCount2 || "0", 10);
    totalPrehospitalCare += ph1 + ph2;

    const tr1 = parseInt(log.transfersCount || "0", 10);
    const tr2 = parseInt(log.transfersCount2 || "0", 10);
    totalTransfers += tr1 + tr2;

    const pets = parseInt(log.rescuedPetsCount || "0", 10);
    totalPets += pets;

    if (log.hasArrivedG1) groupsArrived++;
    if (log.hasArrivedG2) groupsArrived++;
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

export const REPORT_START_DATE = "2026-06-24";
