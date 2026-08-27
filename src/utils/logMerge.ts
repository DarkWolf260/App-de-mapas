import type { DailyLog, CustomActivity } from "../types";

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
      const otherGroups = other.groups.map(g => ({
        ...g,
        department: g.department || other.department || "pc"
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
