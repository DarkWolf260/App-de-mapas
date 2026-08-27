import { supabase } from "../lib/supabaseClient";
import { getNormalizedGroupList } from "../utils/logUtils";
import type { DailyLog } from "../types";

export async function fetchLogs(date?: string): Promise<Map<string, DailyLog[]>> {
  let query = supabase.from("daily_logs").select("*");
  if (date) {
    query = query.eq("date", date);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[logService] fetch error:", error);
    return new Map();
  }

  const logsMap = new Map<string, DailyLog[]>();
  (data || []).forEach((row: any) => {
    const fid = String(row.feature_id);
    const log = rowToDailyLog(row);
    if (!logsMap.has(fid)) logsMap.set(fid, []);
    logsMap.get(fid)!.push(log);
  });
  return logsMap;
}

export async function saveDailyLog(featureId: number | string, log: DailyLog): Promise<void> {
  const fidStr = String(featureId ?? "");
  if (!fidStr || fidStr === "NaN" || fidStr === "undefined") {
    console.warn("[logService] Ignorando guardado con featureId inválido:", featureId);
    return;
  }
  const deptToUse = log.department || "pc";

  const { data: existingRecord } = await supabase
    .from("daily_logs")
    .select("id")
    .eq("feature_id", fidStr)
    .eq("date", log.date)
    .eq("department", deptToUse)
    .maybeSingle();

  const payload = dailyLogToRow(featureId, log);

  if (existingRecord?.id) {
    const { error } = await supabase.from("daily_logs").update(payload).eq("id", existingRecord.id);
    if (error) console.error("[logService] update error:", error);
  } else {
    const { error } = await supabase.from("daily_logs").insert(payload);
    if (error) console.error("[logService] insert error:", error);
  }
}

function rowToDailyLog(row: any): DailyLog {
  const rawGroups = Array.isArray(row.groups)
    ? row.groups
    : (typeof row.groups === "string" && row.groups.trim() ? JSON.parse(row.groups) : []);

  let parsedCustomActivities: any[] = [];
  if (Array.isArray(row.custom_activities)) {
    parsedCustomActivities = [...row.custom_activities];
  } else if (typeof row.custom_activities === "string" && row.custom_activities.trim()) {
    try {
      parsedCustomActivities = JSON.parse(row.custom_activities);
    } catch {}
  } else if (Array.isArray(row.customActivities)) {
    parsedCustomActivities = [...row.customActivities];
  }

  const cleanGroups: any[] = [];
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

function dailyLogToRow(featureId: number | string, log: DailyLog): Record<string, unknown> {
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
    updated_at: new Date().toISOString(),
  };
}
