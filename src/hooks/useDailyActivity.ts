import { useState, useCallback } from "react";
import { fetchDailyActivity, saveDailyActivity, type DailyActivity } from "../services/activityService";
import { showToast } from "../utils/toast";

export function useDailyActivity() {
  const [dailyActivity, setDailyActivity] = useState<DailyActivity>({
    date: "",
    activities: "",
    description: "",
  });

  const fetchDailyActivityState = useCallback(async (date: string) => {
    try {
      const entry = await fetchDailyActivity(date);
      setDailyActivity(entry);
    } catch (err) {
      console.error("[useDailyActivity] fetch error:", err);
    }
  }, []);

  const saveDailyActivityState = useCallback(
    async (date: string, activities: string, description: string) => {
      const previous = dailyActivity;
      setDailyActivity({ date, activities, description });
      try {
        await saveDailyActivity(date, activities, description);
      } catch {
        setDailyActivity(previous);
        showToast("Error al guardar actividades. Verifique su conexión.", "error");
      }
    },
    [dailyActivity]
  );

  return {
    dailyActivity,
    setDailyActivity,
    fetchDailyActivity: fetchDailyActivityState,
    saveDailyActivity: saveDailyActivityState,
  };
}
