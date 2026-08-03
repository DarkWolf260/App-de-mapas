import type { DailyLog } from "../types";

export function mergeLogs(logs: DailyLog[]): DailyLog | null {
  if (logs.length === 0) return null;
  if (logs.length === 1) return logs[0];
  const firstGroups = (logs[0].groups || []).map(g => ({
    ...g,
    department: g.department || logs[0].department || "pc"
  }));
  const merged: DailyLog = { ...logs[0], groups: firstGroups };
  const allNovedades = [...(merged.novedades || [])];
  const allGroups = [...firstGroups];
  for (let i = 1; i < logs.length; i++) {
    const other = logs[i];
    merged.rescuedCount = String((parseInt(merged.rescuedCount || "0", 10) || 0) + (parseInt(other.rescuedCount || "0", 10) || 0));
    merged.recoveredCount = String((parseInt(merged.recoveredCount || "0", 10) || 0) + (parseInt(other.recoveredCount || "0", 10) || 0));
    merged.rescuedPetsCount = String((parseInt(merged.rescuedPetsCount || "0", 10) || 0) + (parseInt(other.rescuedPetsCount || "0", 10) || 0));
    merged.prehospitalCareCount = String((parseInt(merged.prehospitalCareCount || "0", 10) || 0) + (parseInt(other.prehospitalCareCount || "0", 10) || 0));
    merged.transfersCount = String((parseInt(merged.transfersCount || "0", 10) || 0) + (parseInt(other.transfersCount || "0", 10) || 0));
    if (other.novedades) allNovedades.push(...other.novedades);
    if (other.groups) {
      const otherGroups = other.groups.map(g => ({
        ...g,
        department: g.department || other.department || "pc"
      }));
      allGroups.push(...otherGroups);
    }
  }
  merged.novedades = allNovedades;
  merged.groups = allGroups;
  merged.department = undefined;
  return merged;
}
