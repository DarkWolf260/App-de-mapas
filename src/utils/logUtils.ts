import type { DailyLog } from "../types";

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

export function emptyLog(date: string): DailyLog {
  return {
    date,
    groupName: "",
    managerName: "",
    managerPhone: "",
    unitOut: "",
    departureTime: "",
    arrivalTime: "",
    officersCount: "",
    rescuedCount: "",
    recoveredCount: "",
    groupName2: "",
    managerName2: "",
    managerPhone2: "",
    unitOut2: "",
    departureTime2: "",
    arrivalTime2: "",
    officersCount2: "",
    rescuedCount2: "",
    recoveredCount2: "",
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

interface GroupData {
  groupName: string;
  managerName: string;
  managerPhone: string;
  unitOut: string;
  officersCount: string;
  rescuedCount: string;
  recoveredCount: string;
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
      departureTime: log.departureTime2 || "",
      arrivalTime: log.arrivalTime2 || "",
      hasArrived: !!log.hasArrivedG2,
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
    departureTime: log.departureTime || "",
    arrivalTime: log.arrivalTime || "",
    hasArrived: !!log.hasArrivedG1,
  };
}

export const REPORT_START_DATE = "2026-06-24";
