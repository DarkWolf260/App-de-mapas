import { supabase } from "../lib/supabaseClient";
import { fromDatabaseRow, toDatabaseRow, FeatureLogBook } from "../utils/featureLogBook";
import type { DailyLog } from "../types";
import { enqueueSyncItem, markItemStatus } from "./syncQueueService";

export async function fetchLogs(date?: string): Promise<Map<string, DailyLog[]>> {
  let query = supabase.from("daily_logs").select("*").range(0, 50000);
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

  const queueItem = enqueueSyncItem({
    entityType: "log",
    entityId: `${fidStr}_${log.date}_${deptToUse}`,
    action: "upsert",
    title: `Bitácora ${log.date} (${deptToUse.toUpperCase()})`,
    details: `Elemento ID: ${fidStr} | ${log.groups?.length || 0} grupos`,
    payload: { featureId: fidStr, log },
  });

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

    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[logService] Error al guardar bitácora en Supabase, guardado en cola:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión con el servidor");
  }
}
