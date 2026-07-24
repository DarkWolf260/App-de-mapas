import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
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
      if (data && data.length > 0) {
        const list: WorkGroup[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          leaderName: row.leader_name || "",
          leaderPhone: row.leader_phone || "",
          department: row.department || "pc",
          notes: row.notes || "",
        }));
        setWorkGroupsState(list);
      } else {
        // Si Supabase no tiene grupos guardados aún, recuperar y migrar desde localStorage
        const localStr = localStorage.getItem("pc_work_groups");
        if (localStr) {
          try {
            const localGroups: WorkGroup[] = JSON.parse(localStr);
            if (Array.isArray(localGroups) && localGroups.length > 0) {
              console.log(`Migrando ${localGroups.length} grupos de trabajo locales a Supabase...`);
              setWorkGroupsState(localGroups);
              for (const g of localGroups) {
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
            }
          } catch (e) {
            console.error("Error leyendo grupos locales de localStorage:", e);
          }
        }
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
    localStorage.setItem("pc_work_groups", JSON.stringify(groups));
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
