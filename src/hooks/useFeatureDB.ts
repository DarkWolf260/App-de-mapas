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

            groupName3: row.group_name3 || "",
            unitOut3: row.unit_out3 || "",
            managerName3: row.manager_name3 || "",
            managerPhone3: row.manager_phone3 || "",
            officersCount3: row.officers_count3 || "",
            departureTime3: row.departure_time3 || "",
            arrivalTime3: row.arrival_time3 || "",
            hasArrivedG3: !!row.has_arrived_g3,
            rescuedCount3: row.rescued_count3 || "",
            recoveredCount3: row.recovered_count3 || "",
            rescuedPetsCount3: row.rescued_pets_count3 || "",
            prehospitalCareCount3: row.prehospital_care_count3 || "",
            transfersCount3: row.transfers_count3 || "",

            groupName4: row.group_name4 || "",
            unitOut4: row.unit_out4 || "",
            managerName4: row.manager_name4 || "",
            managerPhone4: row.manager_phone4 || "",
            officersCount4: row.officers_count4 || "",
            departureTime4: row.departure_time4 || "",
            arrivalTime4: row.arrival_time4 || "",
            hasArrivedG4: !!row.has_arrived_g4,
            rescuedCount4: row.rescued_count4 || "",
            recoveredCount4: row.recovered_count4 || "",
            rescuedPetsCount4: row.rescued_pets_count4 || "",
            prehospitalCareCount4: row.prehospital_care_count4 || "",
            transfersCount4: row.transfers_count4 || "",

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

  // Migrar automáticamente datos locales previos de RxDB a Supabase SOLO una vez cuando el Admin está autenticado
  const syncLocalRxDBToSupabase = useCallback(async () => {
    try {
      if (localStorage.getItem("rxdb_migrated_to_supabase") === "true") {
        return; // Ya fue migrado exitosamente, no repetir migración
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return; // Evitar peticiones 401 si no hay usuario administrador logueado

      const rxDb = await initDatabase();
      const rxDocs = await rxDb.features.find().exec();
      if (rxDocs && rxDocs.length > 0) {
        console.log(`Migrando ${rxDocs.length} elementos locales desde RxDB a Supabase por primera vez...`);
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
        localStorage.setItem("rxdb_migrated_to_supabase", "true");
        await rxDb.features.find().remove();
        console.log("Migración a Supabase completada. RxDB local limpiado.");
        await fetchFromSupabase();
      } else {
        localStorage.setItem("rxdb_migrated_to_supabase", "true");
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

    // 3. Suscripción en tiempo real a Supabase (escucha cambios en vivo para todos los dispositivos)
    const channel = supabase
      .channel("supabase-realtime-coe")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drawn_features" },
        () => {
          console.log("[Supabase Realtime] Cambio detectado en drawn_features, actualizando...");
          fetchFromSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs" },
        () => {
          console.log("[Supabase Realtime] Cambio detectado en daily_logs, actualizando...");
          fetchFromSupabase();
        }
      )
      .subscribe((status) => {
        console.log("[Supabase Realtime Estado]:", status);
      });

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

        group_name3: log.groupName3 || "",
        unit_out3: log.unitOut3 || "",
        manager_name3: log.managerName3 || "",
        manager_phone3: log.managerPhone3 || "",
        officers_count3: log.officersCount3 || "",
        departure_time3: log.departureTime3 || "",
        arrival_time3: log.arrivalTime3 || "",
        has_arrived_g3: !!log.hasArrivedG3,
        rescued_count3: log.rescuedCount3 || "",
        recovered_count3: log.recoveredCount3 || "",
        rescued_pets_count3: log.rescuedPetsCount3 || "",
        prehospital_care_count3: log.prehospitalCareCount3 || "",
        transfers_count3: log.transfersCount3 || "",

        group_name4: log.groupName4 || "",
        unit_out4: log.unitOut4 || "",
        manager_name4: log.managerName4 || "",
        manager_phone4: log.managerPhone4 || "",
        officers_count4: log.officersCount4 || "",
        departure_time4: log.departureTime4 || "",
        arrival_time4: log.arrivalTime4 || "",
        has_arrived_g4: !!log.hasArrivedG4,
        rescued_count4: log.rescuedCount4 || "",
        recovered_count4: log.recoveredCount4 || "",
        rescued_pets_count4: log.rescuedPetsCount4 || "",
        prehospital_care_count4: log.prehospitalCareCount4 || "",
        transfers_count4: log.transfersCount4 || "",

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
