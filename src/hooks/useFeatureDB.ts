import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { initDatabase } from "../db/database";
import type { DailyLog, DrawnFeature, NovedadEntry } from "../types";
import { getNormalizedGroupList } from "../utils/logUtils";
import { showToast } from "../utils/toast";

export function useFeatureDB() {
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);

  // Función para cargar features y registros diarios desde Supabase (con respaldo local de RxDB)
  const fetchFromSupabase = useCallback(async () => {
    try {
      const { data: featsData, error: featsErr } = await supabase
        .from("drawn_features")
        .select("*");

      if (featsErr) {
        console.error("[Supabase:fetch] Error al cargar puntos/polígonos:", featsErr);
      }

      const { data: logsData, error: logsErr } = await supabase
        .from("daily_logs")
        .select("*");

      if (logsErr) {
        console.error("[Supabase:fetch] Error al cargar registros diarios:", logsErr);
      }

      // console.log(`[Supabase:fetch] feats=${featsData?.length ?? 0} logs=${logsData?.length ?? 0}`);

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
              isCollapsed: !!doc.isCollapsed,
              collapsedCount: doc.collapsedCount || "",
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
          const parsedGroups = Array.isArray(row.groups)
            ? row.groups
            : (typeof row.groups === "string" && row.groups.trim() ? JSON.parse(row.groups) : undefined);

          const log: DailyLog = {
            date: row.date,
            department: row.department,
            groups: parsedGroups && parsedGroups.length > 0 ? parsedGroups : undefined,
            groupName: row.group_name || "",
            unitOut: row.unit_out || "",
            managerName: row.manager_name || "",
            managerPhone: row.manager_phone || "",
            officersCount: row.officers_count || "",
            hasArrivedG1: !!row.has_arrived_g1,
            commissionId: row.commission_id || "independiente",
            isVolunteer: !!row.is_volunteer,

            groupName2: row.group_name2 || "",
            unitOut2: row.unit_out2 || "",
            managerName2: row.manager_name2 || "",
            managerPhone2: row.manager_phone2 || "",
            officersCount2: row.officers_count2 || "",
            hasArrivedG2: !!row.has_arrived_g2,
            rescuedCount2: row.rescued_count2 || "",
            recoveredCount2: row.recovered_count2 || "",
            rescuedPetsCount2: row.rescued_pets_count2 || "",
            prehospitalCareCount2: row.prehospital_care_count2 || "",
            transfersCount2: row.transfers_count2 || "",
            commissionId2: row.commission_id2 || "independiente",
            isVolunteer2: !!row.is_volunteer2,

            groupName3: row.group_name3 || "",
            unitOut3: row.unit_out3 || "",
            managerName3: row.manager_name3 || "",
            managerPhone3: row.manager_phone3 || "",
            officersCount3: row.officers_count3 || "",
            hasArrivedG3: !!row.has_arrived_g3,
            rescuedCount3: row.rescued_count3 || "",
            recoveredCount3: row.recovered_count3 || "",
            rescuedPetsCount3: row.rescued_pets_count3 || "",
            prehospitalCareCount3: row.prehospital_care_count3 || "",
            transfersCount3: row.transfers_count3 || "",
            commissionId3: row.commission_id3 || "independiente",
            isVolunteer3: !!row.is_volunteer3,

            groupName4: row.group_name4 || "",
            unitOut4: row.unit_out4 || "",
            managerName4: row.manager_name4 || "",
            managerPhone4: row.manager_phone4 || "",
            officersCount4: row.officers_count4 || "",
            hasArrivedG4: !!row.has_arrived_g4,
            rescuedCount4: row.rescued_count4 || "",
            recoveredCount4: row.recovered_count4 || "",
            rescuedPetsCount4: row.rescued_pets_count4 || "",
            prehospitalCareCount4: row.prehospital_care_count4 || "",
            transfersCount4: row.transfers_count4 || "",
            commissionId4: row.commission_id4 || "independiente",
            isVolunteer4: !!row.is_volunteer4,

            rescuedCount: row.rescued_count || "",
            recoveredCount: row.recovered_count || "",
            rescuedPetsCount: row.rescued_pets_count || "",
            prehospitalCareCount: row.prehospital_care_count || "",
            transfersCount: row.transfers_count || "",
            observations: row.observations || "",
            novedades: Array.isArray(row.novedades)
              ? row.novedades
              : (typeof row.novedades === "string" && row.novedades.trim() ? JSON.parse(row.novedades) : []),
          };

          if (!logsMap.has(fid)) logsMap.set(fid, []);
          logsMap.get(fid)!.push(log);
        });
      }

      // console.log(`[Supabase:fetch:arrival_sample]`, logsData?.slice(0, 3));

      const list: DrawnFeature[] = (featsData || []).map((row: any) => ({
        id: isNaN(Number(row.id)) ? (row.id as unknown as number) : Number(row.id),
        title: row.title,
        type: row.type,
        description: row.description || "",
        color: row.color || "#3b82f6",
        locked: !!row.locked,
        isCollapsed: !!row.is_collapsed,
        collapsedCount: row.collapsed_count || "",
        dailyLogs: logsMap.get(String(row.id)) || [],
        geojsonGeometry: row.geojson_geometry,
      }));

      setDrawnFeatures(list);
    } catch (err) {
      console.error("[Supabase:fetch:exception] Error de sincronización con Supabase:", err);
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
                has_arrived_g1: !!log.hasArrivedG1,
                group_name2: log.groupName2 || "",
                unit_out2: log.unitOut2 || "",
                manager_name2: log.managerName2 || "",
                manager_phone2: log.managerPhone2 || "",
                officers_count2: log.officersCount2 || "",
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
          fetchFromSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_logs" },
        () => {
          fetchFromSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "novedades" },
        () => {
          fetchFromSupabase();
        }
      )
      .subscribe((_status) => {
        // Realtime connected
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

  const handleUpdateFeatureCollapsed = async (id: number, isCollapsed: boolean, collapsedCount: string | number): Promise<void> => {
    try {
      const { error } = await supabase
        .from("drawn_features")
        .update({
          is_collapsed: isCollapsed,
          collapsed_count: String(collapsedCount || ""),
          updated_at: new Date().toISOString()
        })
        .eq("id", String(id));
      if (error) console.error("Error al actualizar edificio colapsado:", error);
      else fetchFromSupabase();
    } catch (err) {
      console.error("Error al actualizar edificio colapsado en Supabase:", err);
    }
  };

  const handleSaveDailyLog = async (featureId: number, log: DailyLog): Promise<void> => {
    try {
      const fidStr = String(featureId);
      const deptToUse = log.department || "pc";

      const { data: existingRecords, error: lookupErr } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("feature_id", fidStr)
        .eq("date", log.date)
        .eq("department", deptToUse);

      if (lookupErr) {
        console.error("[Supabase:save] lookup error:", lookupErr);
      }

      const rawGroupsList = getNormalizedGroupList(log);

      // Filter out truly empty groups (no name, no metrics, no officers, no unit, no manager)
      const groupsList = rawGroupsList.filter((g) =>
        !!(g.groupName?.trim() || g.officersCount?.trim() || g.unitOut?.trim() || g.managerName?.trim() ||
           g.rescuedCount?.trim() || g.recoveredCount?.trim() || g.rescuedPetsCount?.trim() ||
           g.prehospitalCareCount?.trim() || g.transfersCount?.trim())
      );

      const g0 = groupsList[0];
      const g1 = groupsList[1];
      const g2 = groupsList[2];
      const g3 = groupsList[3];

      // If groups exist, clear flat metric fields to prevent double-counting
      // (the groups array already carries all per-group metrics)
      const cleanLog = groupsList.length > 0
        ? { ...log, rescuedCount: "", recoveredCount: "", rescuedPetsCount: "", prehospitalCareCount: "", transfersCount: "" }
        : log;

      const payload = {
        feature_id: fidStr,
        date: cleanLog.date,
        department: deptToUse,
        groups: groupsList,
        group_name: g0?.groupName || log.groupName || "",
        unit_out: g0?.unitOut || log.unitOut || "",
        manager_name: g0?.managerName || log.managerName || "",
        manager_phone: g0?.managerPhone || log.managerPhone || "",
        officers_count: g0?.officersCount || log.officersCount || "",
        has_arrived_g1: g0?.hasArrived ?? !!log.hasArrivedG1,
        commission_id: g0?.commissionId || log.commissionId || "independiente",
        is_volunteer: g0?.isVolunteer ?? !!log.isVolunteer,
        group_name2: g1?.groupName || log.groupName2 || "",
        unit_out2: g1?.unitOut || log.unitOut2 || "",
        manager_name2: g1?.managerName || log.managerName2 || "",
        manager_phone2: g1?.managerPhone || log.managerPhone2 || "",
        officers_count2: g1?.officersCount || log.officersCount2 || "",
        has_arrived_g2: g1?.hasArrived ?? !!log.hasArrivedG2,
        rescued_count2: g1?.rescuedCount || log.rescuedCount2 || "",
        recovered_count2: g1?.recoveredCount || log.recoveredCount2 || "",
        rescued_pets_count2: g1?.rescuedPetsCount || log.rescuedPetsCount2 || "",
        prehospital_care_count2: g1?.prehospitalCareCount || log.prehospitalCareCount2 || "",
        transfers_count2: g1?.transfersCount || log.transfersCount2 || "",
        commission_id2: g1?.commissionId || log.commissionId2 || "independiente",
        is_volunteer2: g1?.isVolunteer ?? !!log.isVolunteer2,
        group_name3: g2?.groupName || log.groupName3 || "",
        unit_out3: g2?.unitOut || log.unitOut3 || "",
        manager_name3: g2?.managerName || log.managerName3 || "",
        manager_phone3: g2?.managerPhone || log.managerPhone3 || "",
        officers_count3: g2?.officersCount || log.officersCount3 || "",
        has_arrived_g3: g2?.hasArrived ?? !!log.hasArrivedG3,
        rescued_count3: g2?.rescuedCount || log.rescuedCount3 || "",
        recovered_count3: g2?.recoveredCount || log.recoveredCount3 || "",
        rescued_pets_count3: g2?.rescuedPetsCount || log.rescuedPetsCount3 || "",
        prehospital_care_count3: g2?.prehospitalCareCount || log.prehospitalCareCount3 || "",
        transfers_count3: g2?.transfersCount || log.transfersCount3 || "",
        commission_id3: g2?.commissionId || log.commissionId3 || "independiente",
        is_volunteer3: g2?.isVolunteer ?? !!log.isVolunteer3,
        group_name4: g3?.groupName || log.groupName4 || "",
        unit_out4: g3?.unitOut || log.unitOut4 || "",
        manager_name4: g3?.managerName || log.managerName4 || "",
        manager_phone4: g3?.managerPhone || log.managerPhone4 || "",
        officers_count4: g3?.officersCount || log.officersCount4 || "",
        has_arrived_g4: g3?.hasArrived ?? !!log.hasArrivedG4,
        rescued_count4: g3?.rescuedCount || log.rescuedCount4 || "",
        recovered_count4: g3?.recoveredCount || log.recoveredCount4 || "",
        rescued_pets_count4: g3?.rescuedPetsCount || log.rescuedPetsCount4 || "",
        prehospital_care_count4: g3?.prehospitalCareCount || log.prehospitalCareCount4 || "",
        transfers_count4: g3?.transfersCount || log.transfersCount4 || "",
        commission_id4: g3?.commissionId || log.commissionId4 || "independiente",
        is_volunteer4: g3?.isVolunteer ?? !!log.isVolunteer4,
        rescued_count: cleanLog.rescuedCount || "",
        recovered_count: cleanLog.recoveredCount || "",
        rescued_pets_count: cleanLog.rescuedPetsCount || "",
        prehospital_care_count: cleanLog.prehospitalCareCount || "",
        transfers_count: cleanLog.transfersCount || "",
        observations: log.observations || "",
        novedades: log.novedades || [],
        updated_at: new Date().toISOString(),
      };

      if (existingRecords && existingRecords.length > 0) {
        const firstId = existingRecords[0].id;
        const { data: updateData, error: updateErr } = await supabase.from("daily_logs").update(payload).eq("id", firstId).select("id");
        if (updateErr) {
          console.error(`[Supabase:save] UPDATE FAILED for id=${firstId}:`, updateErr);
        } else if (!updateData || updateData.length === 0) {
          console.warn(`[Supabase:save] UPDATE silently blocked (RLS?) id=${firstId}`);
        }
        if (existingRecords.length > 1) {
          const extraIds = existingRecords.slice(1).map((r) => r.id);
          await supabase.from("daily_logs").delete().in("id", extraIds);
        }
      } else {
        const { data: insertData, error: insertErr } = await supabase.from("daily_logs").insert(payload).select("id");
        if (insertErr) {
          console.error("[Supabase:save] INSERT FAILED:", insertErr);
        } else if (!insertData || insertData.length === 0) {
          console.warn("[Supabase:save] INSERT silently blocked (RLS?)");
        }
      }

      // Realtime subscription handles refetching automatically
    } catch (err) {
      console.error("[Supabase:save] Error al guardar registro diario:", err);
    }
  };

  // ── Novedades independientes de la bitácora (tabla `novedades`) ──
  const [globalNovedades, setGlobalNovedades] = useState<NovedadEntry[]>([]);

  const fetchGlobalNovedades = useCallback(async (date: string, department?: string) => {
    try {
      let query = supabase.from("novedades").select("*").eq("date", date);
      if (department && department !== "mixto") {
        query = query.eq("department", department);
      }
      const { data, error } = await query;
      if (error) {
        console.error("[Supabase:fetch] Error al cargar novedades globales:", error);
        return;
      }
      const entries: NovedadEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        timestamp: row.timestamp || row.created_at || "",
        time: row.time || "",
        text: row.text || "",
        type: row.type || "novedad",
      }));
      setGlobalNovedades(entries);
    } catch (err) {
      console.error("[Supabase:fetch:exception] Error cargando novedades globales:", err);
    }
  }, []);

  const saveGlobalNovedad = useCallback(async (entry: NovedadEntry, date: string, department: string = "pc"): Promise<void> => {
    setGlobalNovedades((prev) => [...prev, entry]);
    try {
      const { error } = await supabase.from("novedades").insert({
        id: entry.id,
        date,
        time: entry.time,
        text: entry.text,
        type: entry.type,
        timestamp: entry.timestamp,
        department,
      });
      if (error) {
        setGlobalNovedades((prev) => prev.filter((n) => n.id !== entry.id));
        console.error("[Supabase:save] Error guardando novedad global:", error);
        showToast("Error al guardar novedad. Verifique su conexión.", "error");
      }
    } catch (err) {
      setGlobalNovedades((prev) => prev.filter((n) => n.id !== entry.id));
      console.error("[Supabase:save:exception] Error guardando novedad global:", err);
      showToast("Sin conexión con el servidor. Reintente.", "error");
    }
  }, []);

  const deleteGlobalNovedad = useCallback(async (entryId: string): Promise<void> => {
    let removedEntry: NovedadEntry | undefined;
    setGlobalNovedades((prev) => {
      removedEntry = prev.find((n) => n.id === entryId);
      return prev.filter((n) => n.id !== entryId);
    });
    try {
      const { error } = await supabase.from("novedades").delete().eq("id", entryId);
      if (error) {
        if (removedEntry) setGlobalNovedades((prev) => [...prev, removedEntry!]);
        console.error("[Supabase:delete] Error eliminando novedad global:", error);
        showToast("Error al eliminar novedad. Verifique su conexión.", "error");
      }
    } catch (err) {
      if (removedEntry) setGlobalNovedades((prev) => [...prev, removedEntry!]);
      console.error("[Supabase:delete:exception] Error eliminando novedad global:", err);
      showToast("Sin conexión con el servidor. Reintente.", "error");
    }
  }, []);

  const updateGlobalNovedad = useCallback(async (entryId: string, newText: string, newTime?: string): Promise<void> => {
    let previousEntry: NovedadEntry | undefined;
    setGlobalNovedades((prev) => {
      const idx = prev.findIndex((n) => n.id === entryId);
      if (idx === -1) return prev;
      previousEntry = prev[idx];
      const updated = [...prev];
      updated[idx] = { ...prev[idx], text: newText, ...(newTime !== undefined ? { time: newTime } : {}) };
      return updated;
    });
    try {
      const updatePayload: Record<string, string> = { text: newText };
      if (newTime !== undefined) updatePayload.time = newTime;
      const { error } = await supabase.from("novedades").update(updatePayload).eq("id", entryId);
      if (error) {
        if (previousEntry) setGlobalNovedades((prev) => prev.map((n) => n.id === entryId ? previousEntry! : n));
        console.error("[Supabase:update] Error actualizando novedad global:", error);
        showToast("Error al editar novedad. Verifique su conexión.", "error");
      }
    } catch (err) {
      if (previousEntry) setGlobalNovedades((prev) => prev.map((n) => n.id === entryId ? previousEntry! : n));
      console.error("[Supabase:update:exception] Error actualizando novedad global:", err);
      showToast("Sin conexión con el servidor. Reintente.", "error");
    }
  }, []);

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
    handleUpdateFeatureCollapsed,
    handleSaveDailyLog,
    handleFeatureDeleted,
    globalNovedades,
    fetchGlobalNovedades,
    saveGlobalNovedad,
    deleteGlobalNovedad,
    updateGlobalNovedad,
    refreshFeatures: fetchFromSupabase,
  };
}
