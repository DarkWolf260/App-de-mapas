import { useState, useEffect, useCallback, useRef } from "react";
import { initDatabase } from "../db/database";
import { showToast } from "../utils/toast";
import {
  supabaseFeatureRepo,
  supabaseLogRepo,
  supabaseNovedadRepo,
  supabaseMigrationRepo,
  supabaseRealtime,
} from "../repositories/supabaseImpl";
import type {
  IFeatureRepository,
  ILogRepository,
  INovedadRepository,
  IMigrationRepository,
  IRealtimeProvider,
} from "../repositories/interfaces";
import type { DailyLog, DrawnFeature, NovedadEntry } from "../types";

interface UseFeatureDBOptions {
  featureRepo?: IFeatureRepository;
  logRepo?: ILogRepository;
  novedadRepo?: INovedadRepository;
  migrationRepo?: IMigrationRepository;
  realtime?: IRealtimeProvider;
}

export function useFeatureDB(opts: UseFeatureDBOptions = {}) {
  const featureRepo = opts.featureRepo ?? supabaseFeatureRepo;
  const logRepo = opts.logRepo ?? supabaseLogRepo;
  const novedadRepo = opts.novedadRepo ?? supabaseNovedadRepo;
  const migrationRepo = opts.migrationRepo ?? supabaseMigrationRepo;
  const realtime = opts.realtime ?? supabaseRealtime;

  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);

  const fetchFromSupabase = useCallback(async () => {
    try {
      const features = await featureRepo.fetchAll();
      const logsMap = await logRepo.fetchAll();

      if (features.length === 0) {
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

      const list: DrawnFeature[] = features.map((feat) => ({
        ...feat,
        dailyLogs: logsMap.get(String(feat.id)) || [],
      }));

      setDrawnFeatures(list);
    } catch (err) {
      console.error("[fetch] exception:", err);
    }
  }, [featureRepo, logRepo]);

  const syncLocalRxDBToSupabase = useCallback(async () => {
    await migrationRepo.run(fetchFromSupabase);
  }, [fetchFromSupabase, migrationRepo]);

  useEffect(() => {
    fetchFromSupabase().then(() => {
      syncLocalRxDBToSupabase();
    });

    const unsubAuth = realtime.subscribeToAuthChanges((event) => {
      if (event === "SIGNED_IN") {
        syncLocalRxDBToSupabase();
      }
    });

    const unsubRealtime = realtime.subscribeToChanges(() => {
      fetchFromSupabase();
    });

    return () => {
      unsubAuth();
      unsubRealtime();
    };
  }, [fetchFromSupabase, syncLocalRxDBToSupabase, realtime]);

  const handleFeatureAdded = async (feat: DrawnFeature) => {
    await featureRepo.upsert(feat);
    fetchFromSupabase();
  };

  const handleRenameFeature = async (id: number, title: string) => {
    await featureRepo.updateTitle(id, title);
    fetchFromSupabase();
  };

  const handleUpdateFeatureDescription = async (id: number, desc: string) => {
    await featureRepo.updateDescription(id, desc);
    fetchFromSupabase();
  };

  const handleUpdateFeatureColor = async (id: number, color: string) => {
    await featureRepo.updateColor(id, color);
    fetchFromSupabase();
  };

  const handleToggleFeatureLock = async (id: number, locked: boolean) => {
    await featureRepo.updateLock(id, locked);
    fetchFromSupabase();
  };

  const handleUpdateFeatureCollapsed = async (id: number, isCollapsed: boolean, collapsedCount: string | number) => {
    await featureRepo.updateCollapsed(id, isCollapsed, collapsedCount);
    fetchFromSupabase();
  };

  const handleSaveDailyLog = async (featureId: number, log: DailyLog) => {
    await logRepo.save(featureId, log);
  };

  const handleFeatureDeleted = async (id: number) => {
    await featureRepo.delete(id);
    fetchFromSupabase();
  };

  const [globalNovedades, setGlobalNovedades] = useState<NovedadEntry[]>([]);

  const fetchGlobalNovedades = useCallback(async (date: string, department?: string) => {
    const entries = await novedadRepo.fetch(date, department);
    setGlobalNovedades(entries);
  }, [novedadRepo]);

  const saveGlobalNovedad = useCallback(async (entry: NovedadEntry, date: string, department = "pc") => {
    setGlobalNovedades((prev) => [...prev, entry]);
    try {
      await novedadRepo.insert(entry, date, department);
    } catch {
      setGlobalNovedades((prev) => prev.filter((n) => n.id !== entry.id));
      showToast("Error al guardar novedad. Verifique su conexión.", "error");
    }
  }, [novedadRepo]);

  const deleteGlobalNovedad = useCallback(async (entryId: string) => {
    let removed: NovedadEntry | undefined;
    setGlobalNovedades((prev) => {
      removed = prev.find((n) => n.id === entryId);
      return prev.filter((n) => n.id !== entryId);
    });
    try {
      await novedadRepo.delete(entryId);
    } catch {
      if (removed) setGlobalNovedades((prev) => [...prev, removed!]);
      showToast("Error al eliminar novedad. Verifique su conexión.", "error");
    }
  }, [novedadRepo]);

  const updateGlobalNovedad = useCallback(async (entryId: string, newText: string, newTime?: string) => {
    let previous: NovedadEntry | undefined;
    setGlobalNovedades((prev) => {
      const idx = prev.findIndex((n) => n.id === entryId);
      if (idx === -1) return prev;
      previous = prev[idx];
      const updated = [...prev];
      updated[idx] = { ...prev[idx], text: newText, ...(newTime !== undefined ? { time: newTime } : {}) };
      return updated;
    });
    try {
      const payload: Record<string, string> = { text: newText };
      if (newTime !== undefined) payload.time = newTime;
      await novedadRepo.update(entryId, payload);
    } catch {
      if (previous) setGlobalNovedades((prev) => prev.map((n) => n.id === entryId ? previous! : n));
      showToast("Error al editar novedad. Verifique su conexión.", "error");
    }
  }, [novedadRepo]);

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
