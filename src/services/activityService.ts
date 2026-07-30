import { supabase } from "../lib/supabaseClient";

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
  const { error } = await supabase
    .from("daily_activities")
    .upsert(
      { date, activities, description, updated_at: new Date().toISOString() },
      { onConflict: "date" },
    );
  if (error) {
    console.error("[activityService] save error:", error);
    throw error;
  }
}
