import { supabase } from "../lib/supabaseClient";
import { getNormalizedGroupList } from "../utils/logUtils";
import type { DailyLog } from "../types";

export async function fetchLogs(): Promise<Map<string, DailyLog[]>> {
  const { data, error } = await supabase.from("daily_logs").select("*");
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

export async function saveDailyLog(featureId: number, log: DailyLog): Promise<void> {
  const fidStr = String(featureId);
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
  const parsedGroups = Array.isArray(row.groups)
    ? row.groups
    : (typeof row.groups === "string" && row.groups.trim() ? JSON.parse(row.groups) : []);

  return {
    date: row.date,
    department: row.department,
    groups: parsedGroups,
    observations: row.observations || "",
    novedades: Array.isArray(row.novedades)
      ? row.novedades
      : (typeof row.novedades === "string" && row.novedades.trim() ? JSON.parse(row.novedades) : []),
    rescuedCount: row.rescued_count || "",
    recoveredCount: row.recovered_count || "",
    rescuedPetsCount: row.rescued_pets_count || "",
    prehospitalCareCount: row.prehospital_care_count || "",
    transfersCount: row.transfers_count || "",
  };
}

function dailyLogToRow(featureId: number, log: DailyLog): Record<string, unknown> {
  const fidStr = String(featureId);
  const deptToUse = log.department || "pc";
  const groupsList = getNormalizedGroupList(log).filter((g) =>
    !!(g.groupName?.trim() || g.officersCount?.trim() || g.unitOut?.trim() || g.managerName?.trim() ||
       g.rescuedCount?.trim() || g.recoveredCount?.trim() || g.rescuedPetsCount?.trim() ||
       g.prehospitalCareCount?.trim() || g.transfersCount?.trim())
  );

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
