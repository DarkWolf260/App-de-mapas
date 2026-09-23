import { supabase } from "../lib/supabaseClient";
import { fromDatabaseRow, toDatabaseRow, FeatureLogBook } from "../utils/featureLogBook";
import type { DrawnFeature, DailyLog, NovedadEntry } from "../types";

export type EntityType = "feature" | "log" | "novedad" | "daily_activity";
export type QueueAction = "upsert" | "update" | "delete";
export type QueueStatus = "pending" | "syncing" | "failed" | "synced";

export interface SyncQueueItem {
  id: string;
  entityType: EntityType;
  entityId: string;
  action: QueueAction;
  title: string;
  details?: string;
  payload: any;
  createdAt: string;
  status: QueueStatus;
  retryCount: number;
  errorMessage?: string;
}

const QUEUE_STORAGE_KEY = "pc_offline_sync_queue_v1";
const listeners = new Set<(items: SyncQueueItem[]) => void>();

function notifyListeners() {
  const items = getQueueItems();
  listeners.forEach((fn) => {
    try {
      fn(items);
    } catch (e) {
      console.error("[syncQueueService] listener error:", e);
    }
  });
}

export function getQueueItems(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Deduplicar por entityType y entityId para limpiar registros repetidos/obsoletos
    const map = new Map<string, SyncQueueItem>();
    let hasDuplicates = false;

    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (!item || !item.entityType || !item.entityId) continue;
      const key = `${item.entityType}:${item.entityId}`;

      const existing = map.get(key);
      if (existing) {
        hasDuplicates = true;
        const isNewPending = item.status === "pending" || item.status === "failed" || item.status === "syncing";
        const isExistingPending = existing.status === "pending" || existing.status === "failed" || existing.status === "syncing";

        if (isNewPending && !isExistingPending) {
          map.set(key, item);
        } else if (!isNewPending && isExistingPending) {
          // Mantener el existente pendiente
        } else {
          // Si ambos tienen igual categoría de estado, conservar el más reciente en el tiempo
          const timeNew = new Date(item.createdAt || 0).getTime();
          const timeExisting = new Date(existing.createdAt || 0).getTime();
          if (timeNew >= timeExisting) {
            map.set(key, item);
          }
        }
      } else {
        map.set(key, item);
      }
    }

    const deduplicated = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (hasDuplicates) {
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(deduplicated));
      } catch {
        // Ignore
      }
    }

    return deduplicated;
  } catch (err) {
    console.warn("[syncQueueService] getQueueItems error:", err);
    return [];
  }
}

function saveQueueItems(items: SyncQueueItem[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    notifyListeners();
  } catch (err) {
    console.error("[syncQueueService] saveQueueItems error:", err);
  }
}

export function getPendingQueueItems(): SyncQueueItem[] {
  return getQueueItems().filter((item) => item.status === "pending" || item.status === "failed");
}

export function getPendingCount(): number {
  return getPendingQueueItems().length;
}

export function subscribeToQueue(callback: (items: SyncQueueItem[]) => void): () => void {
  listeners.add(callback);
  callback(getQueueItems());
  return () => {
    listeners.delete(callback);
  };
}

export function enqueueSyncItem(
  item: Omit<SyncQueueItem, "id" | "createdAt" | "status" | "retryCount">
): SyncQueueItem {
  const items = getQueueItems();
  const newItem: SyncQueueItem = {
    ...item,
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    status: "pending",
    retryCount: 0,
  };

  // Buscar si ya existe algún elemento previo para esta misma entidad (sea pendiente o ya sincronizado)
  const existingIdx = items.findIndex(
    (i) => i.entityType === item.entityType && i.entityId === item.entityId
  );

  if (existingIdx !== -1) {
    const existing = items[existingIdx];

    // Si la acción nueva es delete:
    if (item.action === "delete") {
      // Si el elemento nunca llegó a sincronizarse con el servidor y era upsert,
      // se cancelan mutuamente y simplemente se elimina de la cola.
      if (existing.status !== "synced" && existing.action === "upsert") {
        items.splice(existingIdx, 1);
        saveQueueItems(items);
        return { ...newItem, status: "synced" };
      }
      // Si ya existía en el servidor, reemplazamos por la acción delete
      items[existingIdx] = { ...newItem, id: existing.id };
    }
    // Si la acción nueva es update pero el anterior era upsert pendiente (aún no en Supabase):
    else if (item.action === "update" && existing.action === "upsert" && existing.status !== "synced") {
      // Mantener action: "upsert" para no fallar en el servidor, fusionando los campos actualizados
      const mergedPayload = {
        ...existing.payload,
        ...(item.payload?.payload || item.payload),
      };
      items[existingIdx] = {
        ...existing,
        title: item.title || existing.title,
        details: item.details || existing.details,
        payload: mergedPayload,
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };
    } else {
      // Reemplazar la entrada anterior por la más reciente para evitar duplicados en la cola
      items[existingIdx] = { ...newItem, id: existing.id };
    }
  } else {
    items.unshift(newItem);
  }

  saveQueueItems(items);
  return newItem;
}

export function markItemStatus(
  id: string,
  status: QueueStatus,
  errorMessage?: string
): void {
  const items = getQueueItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) {
    items[idx].status = status;
    if (errorMessage !== undefined) {
      items[idx].errorMessage = errorMessage;
    }
    if (status === "failed") {
      items[idx].retryCount = (items[idx].retryCount || 0) + 1;
    }
    saveQueueItems(items);
  }
}

export function removeQueueItem(id: string): void {
  const items = getQueueItems().filter((i) => i.id !== id);
  saveQueueItems(items);
}

export function clearCompletedItems(): void {
  const items = getQueueItems().filter((i) => i.status !== "synced");
  saveQueueItems(items);
}

export function clearAllQueue(): void {
  saveQueueItems([]);
}

/**
 * Ejecuta la sincronización individual de un elemento contra Supabase
 */
export async function syncSingleItem(item: SyncQueueItem): Promise<boolean> {
  markItemStatus(item.id, "syncing");
  try {
    if (item.entityType === "feature") {
      if (item.action === "upsert") {
        const feat: DrawnFeature = item.payload;
        const countVal = feat.collapsedCount ? (parseInt(String(feat.collapsedCount), 10) || null) : null;
        const { error } = await supabase.from("drawn_features").upsert({
          id: String(feat.id),
          title: feat.title,
          type: feat.type,
          color: feat.color || "#3b82f6",
          description: feat.description || "",
          geojson_geometry: feat.geojsonGeometry,
          is_collapsed: !!feat.isCollapsed,
          collapsed_count: countVal,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      } else if (item.action === "update") {
        const { id, payload } = item.payload;
        const cleanPayload = { ...payload };
        // Sanitizar collapsed_count para evitar error de Postgres 'invalid input syntax for type integer: ""'
        if ("collapsed_count" in cleanPayload) {
          if (
            cleanPayload.collapsed_count === "" ||
            cleanPayload.collapsed_count === undefined ||
            cleanPayload.collapsed_count === null
          ) {
            cleanPayload.collapsed_count = null;
          } else {
            const parsed = parseInt(String(cleanPayload.collapsed_count), 10);
            cleanPayload.collapsed_count = isNaN(parsed) ? null : parsed;
          }
        }
        const { error } = await supabase
          .from("drawn_features")
          .update({ ...cleanPayload, updated_at: new Date().toISOString() })
          .eq("id", String(id));
        if (error) throw error;
      } else if (item.action === "delete") {
        const { error } = await supabase.from("drawn_features").delete().eq("id", String(item.entityId));
        if (error) throw error;
      }
    } else if (item.entityType === "log") {
      const { featureId, log } = item.payload as { featureId: string | number; log: DailyLog };
      const fidStr = String(featureId);
      const deptToUse = log.department || "pc";

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
    } else if (item.entityType === "novedad") {
      if (item.action === "upsert") {
        const { entry, date, department } = item.payload as { entry: NovedadEntry; date: string; department: string };
        const payload = {
          id: entry.id,
          feature_id: null,
          date,
          department,
          time: entry.time,
          text: entry.text,
          type: entry.type || "novedad",
          timestamp: entry.timestamp || new Date().toISOString(),
          created_at: entry.timestamp || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("novedades").upsert(payload);
        if (error) throw error;
      } else if (item.action === "update") {
        const { id, payload } = item.payload;
        const { error } = await supabase
          .from("novedades")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      } else if (item.action === "delete") {
        const { error } = await supabase.from("novedades").delete().eq("id", item.entityId);
        if (error) throw error;
      }
    } else if (item.entityType === "daily_activity") {
      const { date, activities, description } = item.payload;
      const { error } = await supabase.from("daily_activities").upsert({
        date,
        activities,
        description,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    markItemStatus(item.id, "synced");
    return true;
  } catch (err: any) {
    const msg = err?.message || err?.error_description || "Error de conexión con el servidor";
    markItemStatus(item.id, "failed", msg);
    return false;
  }
}

/**
 * Procesa y sincroniza todos los elementos en cola pendientes o fallidos
 */
export async function syncAllPending(): Promise<{
  total: number;
  succeeded: number;
  failed: number;
}> {
  const pending = getPendingQueueItems();
  let succeeded = 0;
  let failed = 0;

  for (const item of pending) {
    const ok = await syncSingleItem(item);
    if (ok) succeeded++;
    else failed++;
  }

  return {
    total: pending.length,
    succeeded,
    failed,
  };
}

// Auto-sincronizar únicamente cuando se recupera la conexión a internet
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[syncQueueService] Conexión restablecida. Sincronizando cola local...");
    syncAllPending().catch((err) => console.warn("[syncQueueService] Auto-sync error:", err));
  });
}
