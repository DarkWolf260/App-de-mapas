import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { WorkGroup } from "../types";

export function useWorkGroups() {
  const [workGroups, setWorkGroupsState] = useState<WorkGroup[]>([]);

  const fetchWorkGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("work_groups").select("*");
      if (error) {
        console.error("Error cargando grupos de trabajo desde Supabase:", error);
        return;
      }
      if (data) {
        const list: WorkGroup[] = data.map((row) => ({
          id: row.id,
          name: row.name,
          leaderName: row.leader_name || "",
          leaderPhone: row.leader_phone || "",
          department: row.department || "pc",
          notes: row.notes || "",
        }));
        setWorkGroupsState(list);
      }
    } catch (err) {
      console.error("Error al consultar work_groups:", err);
    }
  }, []);

  useEffect(() => {
    fetchWorkGroups();

    const channel = supabase
      .channel("supabase-realtime-work-groups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "work_groups" },
        () => fetchWorkGroups()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWorkGroups]);

  const saveWorkGroups = async (groups: WorkGroup[]) => {
    setWorkGroupsState(groups);
    try {
      for (const g of groups) {
        await supabase.from("work_groups").upsert({
          id: g.id,
          name: g.name,
          leader_name: g.leaderName || "",
          leader_phone: g.leaderPhone || "",
          department: g.department || "pc",
          notes: g.notes || "",
          updated_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error al guardar grupos de trabajo en Supabase:", err);
    }
  };

  return { workGroups, saveWorkGroups };
}
