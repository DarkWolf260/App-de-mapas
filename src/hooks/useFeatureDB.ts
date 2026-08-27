import { useState, useEffect, useCallback } from "react";
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
  RealtimeChannelStatus,
} from "../repositories/interfaces";
import type { DailyLog, DrawnFeature, NovedadEntry } from "../types";
import { fetchDailyActivity, saveDailyActivity, type DailyActivity } from "../services/activityService";

interface UseFeatureDBOptions {
  featureRepo?: IFeatureRepository;
  logRepo?: ILogRepository;
  novedadRepo?: INovedadRepository;
  migrationRepo?: IMigrationRepository;
  realtime?: IRealtimeProvider;
  selectedDate?: string;
}

export function useFeatureDB(opts: UseFeatureDBOptions = {}) {
  const featureRepo = opts.featureRepo ?? supabaseFeatureRepo;
  const logRepo = opts.logRepo ?? supabaseLogRepo;
  const novedadRepo = opts.novedadRepo ?? supabaseNovedadRepo;
  const migrationRepo = opts.migrationRepo ?? supabaseMigrationRepo;
  const realtime = opts.realtime ?? supabaseRealtime;

  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeChannelStatus>("CONNECTING");

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
  }, [featureRepo, logRepo, opts.selectedDate]);

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

    const unsubRealtime = realtime.subscribeToChanges(
      (payload) => {
        if (!payload || !payload.table) {
          fetchFromSupabase();
          return;
        }

        if (payload.table === "drawn_features" || payload.table === "daily_logs") {
          fetchFromSupabase();
        } else if (payload.table === "novedades") {
          if (payload.eventType === "INSERT" && payload.new && payload.new.id) {
            setGlobalNovedades((prev) => {
              if (prev.some((n) => n.id === payload.new.id)) return prev;
              const entry: NovedadEntry = {
                id: payload.new.id,
                timestamp: payload.new.timestamp || payload.new.created_at || "",
                time: payload.new.time || "",
                text: payload.new.text || "",
                type: payload.new.type || "novedad",
              };
              return [...prev, entry];
            });
          } else if (payload.eventType === "UPDATE" && payload.new && payload.new.id) {
            setGlobalNovedades((prev) =>
              prev.map((n) =>
                n.id === payload.new.id
                  ? { ...n, text: payload.new.text ?? n.text, time: payload.new.time ?? n.time }
                  : n
              )
            );
          } else if (payload.eventType === "DELETE" && payload.old && payload.old.id) {
            setGlobalNovedades((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      },
      (status) => {
        setRealtimeStatus(status);
      }
    );

    return () => {
      unsubAuth();
      unsubRealtime();
    };
  }, [fetchFromSupabase, syncLocalRxDBToSupabase, realtime]);

  const handleFeatureAdded = async (feat: DrawnFeature) => {
    setDrawnFeatures((prev) => [...prev.filter((f) => String(f.id) !== String(feat.id)), feat]);
    await featureRepo.upsert(feat);
  };

  const handleRenameFeature = async (id: number | string, title: string) => {
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, title } : f)));
    await featureRepo.updateTitle(id, title);
  };

  const handleUpdateFeatureDescription = async (id: number | string, desc: string) => {
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, description: desc } : f)));
    await featureRepo.updateDescription(id, desc);
  };

  const handleUpdateFeatureColor = async (id: number | string, color: string) => {
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, color } : f)));
    await featureRepo.updateColor(id, color);
  };

  const handleToggleFeatureLock = async (id: number | string, locked: boolean) => {
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, locked } : f)));
    await featureRepo.updateLock(id, locked);
  };

  const handleUpdateFeatureCollapsed = async (id: number | string, isCollapsed: boolean, collapsedCount: string | number) => {
    setDrawnFeatures((prev) =>
      prev.map((f) =>
        String(f.id) === String(id)
          ? { ...f, isCollapsed, collapsedCount: String(collapsedCount || "") }
          : f
      )
    );
    await featureRepo.updateCollapsed(id, isCollapsed, collapsedCount);
  };

  const handleSaveDailyLog = async (featureId: number | string, log: DailyLog) => {
    await logRepo.save(featureId, log);
  };

  const handleFeatureDeleted = async (id: number | string) => {
    setDrawnFeatures((prev) => prev.filter((f) => String(f.id) !== String(id)));
    await featureRepo.delete(id);
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

  const [dailyActivity, setDailyActivity] = useState<DailyActivity>({ date: "", activities: "", description: "" });

  const fetchDailyActivityState = useCallback(async (date: string) => {
    const entry = await fetchDailyActivity(date);
    setDailyActivity(entry);
  }, []);

  const saveDailyActivityState = useCallback(async (date: string, activities: string, description: string) => {
    const previous = dailyActivity;
    setDailyActivity({ date, activities, description });
    try {
      await saveDailyActivity(date, activities, description);
    } catch {
      setDailyActivity(previous);
      showToast("Error al guardar actividades. Verifique su conexión.", "error");
    }
  }, [dailyActivity]);

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
    dailyActivity,
    fetchDailyActivity: fetchDailyActivityState,
    saveDailyActivity: saveDailyActivityState,
    refreshFeatures: fetchFromSupabase,
    realtimeStatus,
    isRealtimeConnected: realtimeStatus === "SUBSCRIBED",
  };
}
