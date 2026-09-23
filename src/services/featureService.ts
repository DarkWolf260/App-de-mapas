import { supabase } from "../lib/supabaseClient";
import type { DrawnFeature } from "../types";
import { saveFeatureToLocalRxDB, deleteFeatureFromLocalRxDB } from "./offlineSync";
import { enqueueSyncItem, markItemStatus, getQueueItems } from "./syncQueueService";

export async function fetchFeatures(): Promise<DrawnFeature[]> {
  const { data, error } = await supabase.from("drawn_features").select("*").range(0, 50000);
  if (error) {
    console.error("[featureService] fetch error:", error);
    return [];
  }
  return (data || []).map(rowToFeature);
}

export async function upsertFeature(feat: DrawnFeature): Promise<void> {
  const idStr = String(feat.id);
  // 1. Write-ahead in local RxDB
  await saveFeatureToLocalRxDB(feat);

  // 2. Encolar en la cola local de envíos
  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "upsert",
    title: feat.title || `Elemento ${feat.type}`,
    details: `Tipo: ${feat.type} | Color: ${feat.color || "Defecto"}`,
    payload: feat,
  });

  try {
    const { error } = await supabase.from("drawn_features").upsert({
      id: idStr,
      title: feat.title,
      type: feat.type,
      color: feat.color || "#3b82f6",
      description: feat.description || "",
      geojson_geometry: feat.geojsonGeometry,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al subir a Supabase, guardado en cola local:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión con el servidor");
  }
}

export async function updateFeatureTitle(id: number | string, title: string): Promise<void> {
  const idStr = String(id);
  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "update",
    title: `Renombrar a "${title}"`,
    details: `ID: ${idStr}`,
    payload: { id: idStr, payload: { title } },
  });

  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar título en Supabase:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión");
  }
}


function resolveFeatureTitle(idStr: string, providedTitle?: string): string {
  if (providedTitle && providedTitle.trim()) return providedTitle.trim();
  const existing = getQueueItems().find(
    (i) => i.entityType === "feature" && i.entityId === idStr
  );
  if (existing?.payload?.title) return existing.payload.title;
  if (
    existing?.title &&
    !existing.title.startsWith("Bloquear") &&
    !existing.title.startsWith("Desbloquear") &&
    !existing.title.startsWith("Eliminar") &&
    !existing.title.startsWith("Actualizar")
  ) {
    return existing.title;
  }
  return "";
}

export async function updateFeatureDescription(
  id: number | string,
  description: string,
  featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  const name = resolveFeatureTitle(idStr, featureTitle);
  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "update",
    title: name ? `Descripción: ${name}` : "Actualizar descripción",
    details: description ? (description.length > 50 ? description.substring(0, 50) + "..." : description) : `ID: ${idStr}`,
    payload: { id: idStr, payload: { description }, title: name },
  });

  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ description, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar descripción en Supabase:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión");
  }
}

export async function updateFeatureColor(
  id: number | string,
  color: string,
  featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  const name = resolveFeatureTitle(idStr, featureTitle);
  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "update",
    title: name ? `Color: ${name}` : "Actualizar color",
    details: `Color: ${color}`,
    payload: { id: idStr, payload: { color }, title: name },
  });

  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ color, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar color en Supabase:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión");
  }
}

export async function updateFeatureLock(
  id: number | string,
  locked: boolean,
  featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  const name = resolveFeatureTitle(idStr, featureTitle);
  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "update",
    title: name
      ? `${locked ? "Bloquear" : "Desbloquear"}: ${name}`
      : (locked ? "Bloquear elemento" : "Desbloquear elemento"),
    details: name
      ? (locked ? "Edición bloqueada" : "Edición desbloqueada")
      : `ID: ${idStr}`,
    payload: { id: idStr, payload: { locked }, title: name },
  });

  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ locked, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar bloqueo en Supabase:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión");
  }
}

export async function updateFeatureCollapsed(
  id: number | string,
  isCollapsed: boolean,
  collapsedCount: string | number,
  featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  const name = resolveFeatureTitle(idStr, featureTitle);
  const countValue = isCollapsed ? (parseInt(String(collapsedCount || "0"), 10) || 0) : null;

  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "update",
    title: name
      ? (isCollapsed ? `Estructura colapsada (${collapsedCount}): ${name}` : `Sin colapso: ${name}`)
      : (isCollapsed ? `Estructura colapsada (${collapsedCount})` : "Sin estructura colapsada"),
    details: isCollapsed ? `Afectados/atrapados: ${collapsedCount}` : "Estructura no colapsada",
    payload: {
      id: idStr,
      payload: {
        is_collapsed: isCollapsed,
        collapsed_count: countValue,
      },
      title: name,
    },
  });

  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({
        is_collapsed: isCollapsed,
        collapsed_count: countValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", idStr);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar colapso en Supabase:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión");
  }
}

export async function deleteFeature(
  id: number | string,
  featureTitle?: string
): Promise<void> {
  const idStr = String(id ?? "").trim();
  if (!idStr || idStr === "NaN" || idStr === "undefined" || idStr === "null") {
    console.warn("[featureService] deleteFeature ignorado para ID inválido:", id);
    return;
  }
  await deleteFeatureFromLocalRxDB(idStr);

  const name = resolveFeatureTitle(idStr, featureTitle);
  const queueItem = enqueueSyncItem({
    entityType: "feature",
    entityId: idStr,
    action: "delete",
    title: name ? `Eliminar: ${name}` : "Eliminar elemento del mapa",
    details: `ID: ${idStr}`,
    payload: { id: idStr, title: name },
  });

  try {
    const { error } = await supabase.from("drawn_features").delete().eq("id", idStr);
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (err: any) {
    console.warn("[featureService] Error al eliminar en Supabase:", err);
    markItemStatus(queueItem.id, "failed", err?.message || "Sin conexión");
  }
}

function rowToFeature(row: any): DrawnFeature {
  return {
    id: isNaN(Number(row.id)) ? row.id : Number(row.id),
    title: row.title,
    type: row.type,
    description: row.description || "",
    color: row.color || "#3b82f6",
    locked: !!row.locked,
    isCollapsed: !!row.is_collapsed,
    collapsedCount: row.collapsed_count || "",
    geojsonGeometry: row.geojson_geometry,
  };
}
