import { supabase } from "../lib/supabaseClient";
import { initDatabase } from "../db/database";
import type { DrawnFeature } from "../types";

export async function migrateRxDBToSupabase(onAfterMigration: () => Promise<void>): Promise<void> {
  try {
    if (localStorage.getItem("rxdb_migrated_to_supabase") === "true") return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const rxDb = await initDatabase();
    const rxDocs = await rxDb.features.find().exec();
    if (!rxDocs || rxDocs.length === 0) {
      localStorage.setItem("rxdb_migrated_to_supabase", "true");
      return;
    }

    console.log(`Migrando ${rxDocs.length} elementos locales desde RxDB a Supabase...`);
    for (const doc of rxDocs) {
      const idStr = String(doc.id);
      await supabase.from("drawn_features").upsert({
        id: idStr,
        title: doc.title,
        type: doc.type,
        color: doc.color || "#3b82f6",
        description: doc.description || "",
        locked: !!doc.locked,
        geojson_geometry: doc.geojsonGeometry,
        updated_at: new Date().toISOString(),
      });

      if (doc.dailyLogs && Array.isArray(doc.dailyLogs)) {
        for (const log of doc.dailyLogs) {
          const deptToUse = log.department || "pc";
          const groupsToSave = (log.groups || []).filter((g: any) =>
            g.groupName?.trim() || g.unitOut?.trim() || g.managerName?.trim() || g.officersCount
          );
          const payload = {
            feature_id: idStr,
            date: log.date,
            department: deptToUse,
            groups: groupsToSave,
            rescued_count: log.rescuedCount || "",
            recovered_count: log.recoveredCount || "",
            rescued_pets_count: log.rescuedPetsCount || "",
            prehospital_care_count: log.prehospitalCareCount || "",
            transfers_count: log.transfersCount || "",
            observations: log.observations || "",
            updated_at: new Date().toISOString(),
          };
          const { data: existing } = await supabase
            .from("daily_logs")
            .select("id")
            .eq("feature_id", idStr)
            .eq("date", log.date)
            .eq("department", deptToUse)
            .maybeSingle();

          if (existing?.id) {
            await supabase.from("daily_logs").update(payload).eq("id", existing.id);
          } else {
            await supabase.from("daily_logs").insert(payload);
          }
        }
      }
    }
    localStorage.setItem("rxdb_migrated_to_supabase", "true");
    await rxDb.features.find().remove();
    console.log("Migración a Supabase completada. RxDB local limpiado.");
    await onAfterMigration();
  } catch (err) {
    console.error("Error en la migración de RxDB a Supabase:", err);
  }
}
