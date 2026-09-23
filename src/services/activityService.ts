import { supabase } from "../lib/supabaseClient";
import { enqueueSyncItem, markItemStatus } from "./syncQueueService";

export interface DailyActivity {
  date: string;
  activities: string;
  description: string;
}

export async function fetchDailyActivity(date: string): Promise<DailyActivity> {
  const { data, error } = await supabase
    .from("daily_activities")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) {
    console.error("[activityService] fetch error:", error);
    return { date, activities: "", description: "" };
  }
  return {
    date,
    activities: data?.activities || "",
    description: data?.description || "",
  };
}

export async function saveDailyActivity(date: string, activities: string, description: string): Promise<void> {
  const queueItem = enqueueSyncItem({
    entityType: "daily_activity",
    entityId: date,
    action: "upsert",
    title: `Actividades del día ${date}`,
    details: activities ? activities.substring(0, 50) + "..." : "Resumen de jornada",
    payload: { date, activities, description },
  });

  try {
    const { error } = await supabase
      .from("daily_activities")
      .upsert(
        { date, activities, description, updated_at: new Date().toISOString() },
        { onConflict: "date" },
      );
    if (error) throw error;
    markItemStatus(queueItem.id, "synced");
  } catch (error: any) {
    console.error("[activityService] save error:", error);
    markItemStatus(queueItem.id, "failed", error?.message || "Sin conexión");
    throw error;
  }
}
