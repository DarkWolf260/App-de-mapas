import { supabase } from "../lib/supabaseClient";
import type { DrawnFeature } from "../types";

export async function fetchFeatures(): Promise<DrawnFeature[]> {
  const { data, error } = await supabase.from("drawn_features").select("*");
  if (error) {
    console.error("[featureService] fetch error:", error);
    return [];
  }
  return (data || []).map(rowToFeature);
}

export async function upsertFeature(feat: DrawnFeature): Promise<void> {
  const idStr = String(feat.id);
  const { error } = await supabase.from("drawn_features").upsert({
    id: idStr,
    title: feat.title,
    type: feat.type,
    color: feat.color || "#3b82f6",
    description: feat.description || "",
    geojson_geometry: feat.geojsonGeometry,
    updated_at: new Date().toISOString(),
  });
  if (error) console.error("[featureService] upsert error:", error);
}

export async function updateFeatureTitle(id: number, title: string): Promise<void> {
  const { error } = await supabase
    .from("drawn_features")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", String(id));
  if (error) console.error("[featureService] update title error:", error);
}

export async function updateFeatureDescription(id: number, description: string): Promise<void> {
  const { error } = await supabase
    .from("drawn_features")
    .update({ description, updated_at: new Date().toISOString() })
    .eq("id", String(id));
  if (error) console.error("[featureService] update description error:", error);
}

export async function updateFeatureColor(id: number, color: string): Promise<void> {
  const { error } = await supabase
    .from("drawn_features")
    .update({ color, updated_at: new Date().toISOString() })
    .eq("id", String(id));
  if (error) console.error("[featureService] update color error:", error);
}

export async function updateFeatureLock(id: number, locked: boolean): Promise<void> {
  const { error } = await supabase
    .from("drawn_features")
    .update({ locked, updated_at: new Date().toISOString() })
    .eq("id", String(id));
  if (error) console.error("[featureService] update lock error:", error);
}

export async function updateFeatureCollapsed(id: number, isCollapsed: boolean, collapsedCount: string | number): Promise<void> {
  const { error } = await supabase
    .from("drawn_features")
    .update({
      is_collapsed: isCollapsed,
      collapsed_count: String(collapsedCount || ""),
      updated_at: new Date().toISOString(),
    })
    .eq("id", String(id));
  if (error) console.error("[featureService] update collapsed error:", error);
}

export async function deleteFeature(id: number): Promise<void> {
  const { error } = await supabase.from("drawn_features").delete().eq("id", String(id));
  if (error) console.error("[featureService] delete error:", error);
}

function rowToFeature(row: any): DrawnFeature {
  return {
    id: isNaN(Number(row.id)) ? (row.id as unknown as number) : Number(row.id),
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
