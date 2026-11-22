import { supabase } from "../lib/supabaseClient";
import type { DrawnFeature } from "../types";
import { saveFeatureToLocalRxDB, deleteFeatureFromLocalRxDB } from "./offlineSync";

export async function fetchFeatures(): Promise<DrawnFeature[]> {
  const allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from("drawn_features").select("*").range(from, to);
    if (error) {
      console.error("[featureService] fetch error:", error);
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
  return allData.map(rowToFeature);
}

export async function upsertFeature(feat: DrawnFeature): Promise<void> {
  const idStr = String(feat.id);
  // 1. Write-ahead in local RxDB
  await saveFeatureToLocalRxDB(feat);

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
  } catch (err: any) {
    console.warn("[featureService] Error al subir a Supabase:", err);
    throw err;
  }
}

export async function updateFeatureTitle(id: number | string, title: string): Promise<void> {
  const idStr = String(id);
  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar título en Supabase:", err);
    throw err;
  }
}

export async function updateFeatureDescription(
  id: number | string,
  description: string,
  _featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ description, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar descripción en Supabase:", err);
    throw err;
  }
}

export async function updateFeatureColor(
  id: number | string,
  color: string,
  _featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ color, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar color en Supabase:", err);
    throw err;
  }
}

export async function updateFeatureLock(
  id: number | string,
  locked: boolean,
  _featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  try {
    const { error } = await supabase
      .from("drawn_features")
      .update({ locked, updated_at: new Date().toISOString() })
      .eq("id", idStr);
    if (error) throw error;
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar bloqueo en Supabase:", err);
    throw err;
  }
}

export async function updateFeatureCollapsed(
  id: number | string,
  isCollapsed: boolean,
  collapsedCount: string | number,
  _featureTitle?: string
): Promise<void> {
  const idStr = String(id);
  const countValue = isCollapsed ? (parseInt(String(collapsedCount || "0"), 10) || 0) : null;

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
  } catch (err: any) {
    console.warn("[featureService] Error al actualizar colapso en Supabase:", err);
    throw err;
  }
}

export async function deleteFeature(
  id: number | string,
  _featureTitle?: string
): Promise<void> {
  const idStr = String(id ?? "").trim();
  if (!idStr || idStr === "NaN" || idStr === "undefined" || idStr === "null") {
    console.warn("[featureService] deleteFeature ignorado para ID inválido:", id);
    return;
  }
  await deleteFeatureFromLocalRxDB(idStr);

  try {
    const { error } = await supabase.from("drawn_features").delete().eq("id", idStr);
    if (error) throw error;
  } catch (err: any) {
    console.warn("[featureService] Error al eliminar en Supabase:", err);
    throw err;
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
