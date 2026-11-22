import type { DrawnFeature } from "../types";

export async function saveFeatureToLocalRxDB(feat: DrawnFeature): Promise<void> {
  try {
    const { initDatabase } = await import("../db/database");
    const db = await initDatabase();
    const idStr = String(feat.id);
    const existing = await db.features.findOne(idStr).exec();

    const docData: any = {
      id: idStr,
      title: feat.title,
      type: feat.type,
      description: feat.description || "",
      color: feat.color || "#3b82f6",
      locked: !!feat.locked,
      isCollapsed: !!feat.isCollapsed,
      collapsedCount: String(feat.collapsedCount || ""),
      dailyLogs: feat.dailyLogs || [],
      geojsonGeometry: feat.geojsonGeometry,
    };

    if (existing) {
      await existing.patch(docData);
    } else {
      await db.features.insert(docData);
    }
  } catch (err) {
    console.warn("[offlineSync] saveFeatureToLocalRxDB error:", err);
  }
}

export async function deleteFeatureFromLocalRxDB(id: string | number): Promise<void> {
  try {
    const { initDatabase } = await import("../db/database");
    const db = await initDatabase();
    const idStr = String(id);
    const existing = await db.features.findOne(idStr).exec();
    if (existing) {
      await existing.remove();
    }
  } catch (err) {
    console.warn("[offlineSync] deleteFeatureFromLocalRxDB error:", err);
  }
}
