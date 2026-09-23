import { supabase } from "../lib/supabaseClient";
import type { NovedadEntry } from "../types";
import { enqueueSyncItem, markItemStatus } from "./syncQueueService";

export async function fetchNovedades(date: string, department?: string): Promise<NovedadEntry[]> {
  let query = supabase.from("novedades").select("*").eq("date", date);
  if (department && department !== "mixto") {
    query = query.eq("department", department);
  }
  const { data, error } = await query;
  if (error) {
    console.error("[novedadService] fetch error:", error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    timestamp: row.timestamp || row.created_at || "",
    time: row.time || "",
    text: row.text || "",
    type: row.type || "novedad",
  }));
}

export async function insertNovedad(entry: NovedadEntry, date: string, department: string): Promise<void> {
  const queueItem = enqueueSyncItem({
    entityType: "novedad",
    entityId: entry.id,
    action: "upsert",
    title: `Novedad ${entry.time || ""} (${department.toUpperCase()})`,
    details: entry.text ? entry.text.substring(0, 50) + "..." : "",
    payload: { entry, date, department },
  });

  try {
    const { error } = await supabase.from("novedades").insert({
      id: entry.id,
      date,
      time: entry.time,
      text: entry.text,
      type: entry.type,
      timestamp: entry.timestamp,
      department,
    });
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (error: any) {
    console.error("[novedadService] insert error:", error);
    markItemStatus(queueItem.id, "failed", error?.message || "Sin conexión");
    throw error;
  }
}

export async function deleteNovedad(entryId: string): Promise<void> {
  const queueItem = enqueueSyncItem({
    entityType: "novedad",
    entityId: entryId,
    action: "delete",
    title: "Eliminar novedad",
    details: `ID: ${entryId}`,
    payload: { entryId },
  });

  try {
    const { error } = await supabase.from("novedades").delete().eq("id", entryId);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (error: any) {
    console.error("[novedadService] delete error:", error);
    markItemStatus(queueItem.id, "failed", error?.message || "Sin conexión");
    throw error;
  }
}

export async function updateNovedad(entryId: string, updates: Record<string, string>): Promise<void> {
  const queueItem = enqueueSyncItem({
    entityType: "novedad",
    entityId: entryId,
    action: "update",
    title: "Modificar novedad",
    details: updates.text ? updates.text.substring(0, 50) + "..." : `ID: ${entryId}`,
    payload: { id: entryId, payload: updates },
  });

  try {
    const { error } = await supabase.from("novedades").update(updates).eq("id", entryId);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (error: any) {
    console.error("[novedadService] update error:", error);
    markItemStatus(queueItem.id, "failed", error?.message || "Sin conexión");
    throw error;
  }
}
