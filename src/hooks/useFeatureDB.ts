import { useState, useEffect, useCallback } from "react";
import { initDatabase } from "../db/database";
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
import { FeatureLogBook } from "../utils/featureLogBook";
import { useNovedades } from "./useNovedades";
import { useDailyActivity } from "./useDailyActivity";

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

  // Novedades sub-hook
  const {
    globalNovedades,
    setGlobalNovedades,
    fetchGlobalNovedades,
    saveGlobalNovedad,
    deleteGlobalNovedad,
    updateGlobalNovedad,
  } = useNovedades({ novedadRepo });

  // Daily Activity sub-hook
  const {
    dailyActivity,
    fetchDailyActivity,
    saveDailyActivity,
  } = useDailyActivity();

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
  }, [fetchFromSupabase, syncLocalRxDBToSupabase, realtime, setGlobalNovedades]);

  const handleFeatureAdded = async (feat: DrawnFeature) => {
    setDrawnFeatures((prev) => [...prev.filter((f) => String(f.id) !== String(feat.id)), feat]);
    await featureRepo.upsert(feat);
  };

  const handleRenameFeature = async (id: number | string, title: string) => {
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, title } : f)));
    await featureRepo.updateTitle(id, title);
  };

  const handleUpdateFeatureDescription = async (id: number | string, desc: string) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, description: desc } : f)));
    await featureRepo.updateDescription(id, desc, feat?.title);
  };

  const handleUpdateFeatureColor = async (id: number | string, color: string) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, color } : f)));
    await featureRepo.updateColor(id, color, feat?.title);
  };

  const handleToggleFeatureLock = async (id: number | string, locked: boolean) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, locked } : f)));
    await featureRepo.updateLock(id, locked, feat?.title);
  };

  const handleUpdateFeatureCollapsed = async (id: number | string, isCollapsed: boolean, collapsedCount: string | number) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) =>
      prev.map((f) =>
        String(f.id) === String(id)
          ? { ...f, isCollapsed, collapsedCount: String(collapsedCount || "") }
          : f
      )
    );
    await featureRepo.updateCollapsed(id, isCollapsed, collapsedCount, feat?.title);
  };

  const handleSaveDailyLog = async (featureId: number | string, log: DailyLog) => {
    const fidStr = String(featureId);
    setDrawnFeatures((prev) =>
      prev.map((f) => {
        if (String(f.id) !== fidStr) return f;
        const existingLogs = f.dailyLogs || [];
        const deptToMatch = log.department || "pc";
        const filtered = existingLogs.filter(
          (l) => !(l.date === log.date && (l.department || "pc") === deptToMatch)
        );
        const hasData = FeatureLogBook.hasAnyData(log);
        return {
          ...f,
          dailyLogs: hasData ? [...filtered, log] : filtered,
        };
      })
    );
    await logRepo.save(featureId, log);
  };

  const handleFeatureDeleted = async (id: number | string) => {
    const idStr = String(id ?? "").trim();
    if (!idStr || idStr === "NaN" || idStr === "undefined") return;
    const feat = drawnFeatures.find((f) => String(f.id) === idStr);
    setDrawnFeatures((prev) => prev.filter((f) => String(f.id) !== idStr));
    await featureRepo.delete(id, feat?.title);
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
    dailyActivity,
    fetchDailyActivity,
    saveDailyActivity,
    refreshFeatures: fetchFromSupabase,
    realtimeStatus,
    isRealtimeConnected: realtimeStatus === "SUBSCRIBED",
  };
}
