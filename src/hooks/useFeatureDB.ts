import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { initDatabase } from "../db/database";
import type { DailyLog, DrawnFeature } from "../types";

export function useFeatureDB() {
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);

  // Función para cargar features y registros diarios desde Supabase (con respaldo local de RxDB)
  const fetchFromSupabase = useCallback(async () => {
    try {
      const { data: featsData, error: featsErr } = await supabase
        .from("drawn_features")
        .select("*");

      if (featsErr) {
        console.error("Error al cargar puntos/polígonos desde Supabase:", featsErr);
      }

      const { data: logsData, error: logsErr } = await supabase
        .from("daily_logs")
        .select("*");

      if (logsErr) {
        console.error("Error al cargar registros diarios desde Supabase:", logsErr);
      }

      // Si Supabase retorna vacío o aún no tiene datos subidos, mostrar el respaldo local de RxDB
      if (!featsData || featsData.length === 0) {
        try {
          const rxDb = await initDatabase();
          const rxDocs = await rxDb.features.find().exec();
          if (rxDocs && rxDocs.length > 0) {
            const localList: DrawnFeature[] = rxDocs.map((doc: any) => ({
              id: isNaN(Number(doc.id)) ? doc.id : Number(doc.id),
              title: doc.title,
              type: doc.type,
              description: doc.description || "",
              color: doc.color || "#3b82f6",
              locked: !!doc.locked,
              dailyLogs: doc.dailyLogs || [],
              geojsonGeometry: doc.geojsonGeometry,
            }));
            setDrawnFeatures(localList);
            return;
          }
        } catch (rxErr) {
          console.warn("RxDB fallback error:", rxErr);
        }
      }

      // Agrupar registros diarios por id de punto/polígono
      const logsMap = new Map<string, DailyLog[]>();
      if (logsData) {
        logsData.forEach((row: any) => {
          const fid = String(row.feature_id);
          const log: DailyLog = {
            date: row.date,
            department: row.department,
            groupName: row.group_name || "",
            unitOut: row.unit_out || "",
            managerName: row.manager_name || "",
            managerPhone: row.manager_phone || "",
            officersCount: row.officers_count || "",
            departureTime: row.departure_time || "",
            arrivalTime: row.arrival_time || "",
            hasArrivedG1: !!row.has_arrived_g1,
            groupName2: row.group_name2 || "",
            unitOut2: row.unit_out2 || "",
            managerName2: row.manager_name2 || "",
            managerPhone2: row.manager_phone2 || "",
            officersCount2: row.officers_count2 || "",
            departureTime2: row.departure_time2 || "",
            arrivalTime2: row.arrival_time2 || "",
            hasArrivedG2: !!row.has_arrived_g2,
            rescuedCount: row.rescued_count || "",
            recoveredCount: row.recovered_count || "",
            rescuedPetsCount: row.rescued_pets_count || "",
            prehospitalCareCount: row.prehospital_care_count || "",
            transfersCount: row.transfers_count || "",
            observations: row.observations || "",
          };

          if (!logsMap.has(fid)) logsMap.set(fid, []);
          logsMap.get(fid)!.push(log);
        });
      }

      const list: DrawnFeature[] = (featsData || []).map((row: any) => ({
        id: isNaN(Number(row.id)) ? (row.id as unknown as number) : Number(row.id),
        title: row.title,
        type: row.type,
        description: row.description || "",
        color: row.color || "#3b82f6",
        locked: !!row.locked,
        dailyLogs: logsMap.get(String(row.id)) || [],
        geojsonGeometry: row.geojson_geometry,
      }));

      setDrawnFeatures(list);
    } catch (err) {
      console.error("Error de sincronización con Supabase:", err);
    }
  }, []);

  // Migrar automáticamente datos locales previos de RxDB a Supabase SOLO cuando el Admin está autenticado
  const syncLocalRxDBToSupabase = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return; // Evitar peticiones 401 si no hay usuario administrador logueado

      const rxDb = await initDatabase();
      const rxDocs = await rxDb.features.find().exec();
      if (rxDocs && rxDocs.length > 0) {
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
              const payload = {
                feature_id: idStr,
                date: log.date,
                department: deptToUse,
                group_name: log.groupName || "",
                unit_out: log.unitOut || "",
                manager_name: log.managerName || "",
                manager_phone: log.managerPhone || "",
                officers_count: log.officersCount || "",
                departure_time: log.departureTime || "",
                arrival_time: log.arrivalTime || "",
                has_arrived_g1: !!log.hasArrivedG1,
                group_name2: log.groupName2 || "",
                unit_out2: log.unitOut2 || "",
                manager_name2: log.managerName2 || "",
                manager_phone2: log.managerPhone2 || "",
                officers_count2: log.officersCount2 || "",
                departure_time2: log.departureTime2 || "",
                arrival_time2: log.arrivalTime2 || "",
                has_arrived_g2: !!log.hasArrivedG2,
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
        await fetchFromSupabase();
      }
    } catch (err) {
      console.error("Error en la migración de RxDB a Supabase:", err);
    }
  }, [fetchFromSupabase]);

  useEffect(() => {
    // 1. Cargar datos iniciales de Supabase y migrar si el admin está logueado
    fetchFromSupabase().then(() => {
      syncLocalRxDBToSupabase();
    });

    // 2. Suscribirse a cambios de autenticación para migrar cuando inicie sesión el Admin
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        syncLocalRxDBToSupabase();
      }
    });

    // 3. Suscripción en tiempo real a Supabase
    const channel = supabase
      .channel("supabase-realtime-coe")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drawn_features" },
        () => fetchFromSupabase()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs" },
        () => fetchFromSupabase()
      )
      .subscribe();

    return () => {
      authSub.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchFromSupabase, syncLocalRxDBToSupabase]);

  // Operaciones de escritura en Supabase
  const handleFeatureAdded = async (newFeat: DrawnFeature): Promise<void> => {
    try {
      const idStr = String(newFeat.id);
      const { error } = await supabase.from("drawn_features").upsert({
        id: idStr,
        title: newFeat.title,
        type: newFeat.type,
        color: newFeat.color || "#3b82f6",
        description: newFeat.description || "",
        geojson_geometry: newFeat.geojsonGeometry,
        updated_at: new Date().toISOString(),
      });
      if (error) console.error("Error guardando punto en Supabase:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al insertar punto en Supabase:", err);
    }
  };

  const handleRenameFeature = async (id: number, newTitle: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("drawn_features")
        .update({ title: newTitle, updated_at: new Date().toISOString() })
        .eq("id", String(id));
      if (error) console.error("Error renombrando punto:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al renombrar punto en Supabase:", err);
    }
  };

  const handleUpdateFeatureDescription = async (id: number, newDesc: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("drawn_features")
        .update({ description: newDesc, updated_at: new Date().toISOString() })
        .eq("id", String(id));
      if (error) console.error("Error al actualizar descripción:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al actualizar descripción en Supabase:", err);
    }
  };

  const handleUpdateFeatureColor = async (id: number, newColor: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("drawn_features")
        .update({ color: newColor, updated_at: new Date().toISOString() })
        .eq("id", String(id));
      if (error) console.error("Error al actualizar color:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al actualizar color en Supabase:", err);
    }
  };

  const handleToggleFeatureLock = async (id: number, locked: boolean): Promise<void> => {
    try {
      const { error } = await supabase
        .from("drawn_features")
        .update({ locked, updated_at: new Date().toISOString() })
        .eq("id", String(id));
      if (error) console.error("Error al cambiar candado:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al cambiar candado en Supabase:", err);
    }
  };

  const handleSaveDailyLog = async (featureId: number, log: DailyLog): Promise<void> => {
    try {
      const fidStr = String(featureId);
      const deptToUse = log.department || "pc";

      const { data: existing } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("feature_id", fidStr)
        .eq("date", log.date)
        .eq("department", deptToUse)
        .maybeSingle();

      const payload = {
        feature_id: fidStr,
        date: log.date,
        department: deptToUse,
        group_name: log.groupName || "",
        unit_out: log.unitOut || "",
        manager_name: log.managerName || "",
        manager_phone: log.managerPhone || "",
        officers_count: log.officersCount || "",
        departure_time: log.departureTime || "",
        arrival_time: log.arrivalTime || "",
        has_arrived_g1: !!log.hasArrivedG1,
        group_name2: log.groupName2 || "",
        unit_out2: log.unitOut2 || "",
        manager_name2: log.managerName2 || "",
        manager_phone2: log.managerPhone2 || "",
        officers_count2: log.officersCount2 || "",
        departure_time2: log.departureTime2 || "",
        arrival_time2: log.arrivalTime2 || "",
        has_arrived_g2: !!log.hasArrivedG2,
        rescued_count: log.rescuedCount || "",
        recovered_count: log.recoveredCount || "",
        rescued_pets_count: log.rescuedPetsCount || "",
        prehospital_care_count: log.prehospitalCareCount || "",
        transfers_count: log.transfersCount || "",
        observations: log.observations || "",
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await supabase.from("daily_logs").update(payload).eq("id", existing.id);
      } else {
        await supabase.from("daily_logs").insert(payload);
      }

      fetchFromSupabase();
    } catch (err) {
      console.error("Error al guardar registro diario en Supabase:", err);
    }
  };

  const handleFeatureDeleted = async (id: number): Promise<void> => {
    try {
      const { error } = await supabase.from("drawn_features").delete().eq("id", String(id));
      if (error) console.error("Error al eliminar punto de Supabase:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al eliminar punto en Supabase:", err);
    }
  };

  return {
    drawnFeatures,
    handleFeatureAdded,
    handleRenameFeature,
    handleUpdateFeatureDescription,
    handleUpdateFeatureColor,
    handleToggleFeatureLock,
    handleSaveDailyLog,
    handleFeatureDeleted,
  };
}
