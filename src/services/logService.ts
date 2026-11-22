import { supabase } from "../lib/supabaseClient";
import { fromDatabaseRow, toDatabaseRow, FeatureLogBook } from "../utils/featureLogBook";
import type { DailyLog } from "../types";

export async function fetchLogs(date?: string): Promise<Map<string, DailyLog[]>> {
  const allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    let query = supabase.from("daily_logs").select("*").range(from, to);
    if (date) {
      query = query.eq("date", date);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[logService] fetch error:", error);
      break;
    }
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allData.push(...data);
      if (data.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }
  }

  const logsMap = new Map<string, DailyLog[]>();
  allData.forEach((row: any) => {
    const fid = String(row.feature_id);
    const log = fromDatabaseRow(row);
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

  try {
    const { data: existingRecord } = await supabase
      .from("daily_logs")
      .select("id")
      .eq("feature_id", fidStr)
      .eq("date", log.date)
      .eq("department", deptToUse)
      .maybeSingle();

    const hasData = FeatureLogBook.hasAnyData(log);

    if (!hasData) {
      if (existingRecord?.id) {
        const { error } = await supabase.from("daily_logs").delete().eq("id", existingRecord.id);
        if (error) throw error;
      }
    } else {
      const payload = toDatabaseRow(featureId, log);

      if (existingRecord?.id) {
        const { error } = await supabase.from("daily_logs").update(payload).eq("id", existingRecord.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("daily_logs").insert(payload);
        if (error) throw error;
      }
    }
  } catch (err: any) {
    console.warn("[logService] Error al guardar bitácora en Supabase:", err);
    throw err;
  }
}
