import { useState, useEffect, useCallback, useRef } from "react";
import {
  supabaseFeatureRepo,
  supabaseLogRepo,
  supabaseMigrationRepo,
  supabaseRealtime,
} from "../repositories/supabaseImpl";
import type {
  IFeatureRepository,
  ILogRepository,
  IMigrationRepository,
  IRealtimeProvider,
  RealtimeChannelStatus,
} from "../repositories/interfaces";
import type { DailyLog, DrawnFeature } from "../types";
import { FeatureLogBook } from "../utils/featureLogBook";
import { showToast } from "../utils/toast";

interface UseFeatureDBOptions {
  featureRepo?: IFeatureRepository;
  logRepo?: ILogRepository;
  migrationRepo?: IMigrationRepository;
  realtime?: IRealtimeProvider;
  selectedDate?: string;
}

export function useFeatureDB(opts: UseFeatureDBOptions = {}) {
  const featureRepo = opts.featureRepo ?? supabaseFeatureRepo;
  const logRepo = opts.logRepo ?? supabaseLogRepo;
  const migrationRepo = opts.migrationRepo ?? supabaseMigrationRepo;
  const realtime = opts.realtime ?? supabaseRealtime;

  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeChannelStatus>("CONNECTING");
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFromSupabase = useCallback(async () => {
    try {
      const features = await featureRepo.fetchAll();
      const logsMap = await logRepo.fetchAll();

      if (features.length === 0) {
        try {
          const { initDatabase } = await import("../db/database");
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

  const scheduleRefetch = useCallback(() => {
    if (refetchTimerRef.current) {
      clearTimeout(refetchTimerRef.current);
    }
    refetchTimerRef.current = setTimeout(() => {
      refetchTimerRef.current = null;
      fetchFromSupabase();
    }, 350);
  }, [fetchFromSupabase]);

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
          scheduleRefetch();
          return;
        }

        if (payload.table === "drawn_features" || payload.table === "daily_logs") {
          scheduleRefetch();
        }
      },
      (status) => {
        setRealtimeStatus(status);
      }
    );

    return () => {
      if (refetchTimerRef.current) {
        clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = null;
      }
      unsubAuth();
      unsubRealtime();
    };
  }, [fetchFromSupabase, scheduleRefetch, syncLocalRxDBToSupabase, realtime]);

  const runMutation = async (action: () => Promise<void>, errorMsg: string) => {
    try {
      await action();
    } catch {
      showToast(errorMsg, "error");
      await fetchFromSupabase();
    }
  };

  const handleFeatureAdded = async (feat: DrawnFeature) => {
    setDrawnFeatures((prev) => [...prev.filter((f) => String(f.id) !== String(feat.id)), feat]);
    await runMutation(
      () => featureRepo.upsert(feat),
      "No se pudo guardar el elemento en el servidor. Verifica tus permisos o conexión."
    );
  };

  const handleRenameFeature = async (id: number | string, title: string) => {
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, title } : f)));
    await runMutation(
      () => featureRepo.updateTitle(id, title),
      "No se pudo actualizar el nombre. Verifica tus permisos."
    );
  };

  const handleUpdateFeatureDescription = async (id: number | string, desc: string) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, description: desc } : f)));
    await runMutation(
      () => featureRepo.updateDescription(id, desc, feat?.title),
      "No se pudo actualizar la descripción. Verifica tus permisos."
    );
  };

  const handleUpdateFeatureColor = async (id: number | string, color: string) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, color } : f)));
    await runMutation(
      () => featureRepo.updateColor(id, color, feat?.title),
      "No se pudo actualizar el color. Verifica tus permisos."
    );
  };

  const handleToggleFeatureLock = async (id: number | string, locked: boolean) => {
    const feat = drawnFeatures.find((f) => String(f.id) === String(id));
    setDrawnFeatures((prev) => prev.map((f) => (String(f.id) === String(id) ? { ...f, locked } : f)));
    await runMutation(
      () => featureRepo.updateLock(id, locked, feat?.title),
      "No se pudo cambiar el bloqueo del elemento. Verifica tus permisos."
    );
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
    await runMutation(
      () => featureRepo.updateCollapsed(id, isCollapsed, collapsedCount, feat?.title),
      "No se pudo actualizar el estado de colapso. Verifica tus permisos."
    );
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
    await runMutation(
      () => logRepo.save(featureId, log),
      "No se pudo guardar la bitácora. Verifica tus permisos o si la fecha está restringida."
    );
  };

  const handleFeatureDeleted = async (id: number | string) => {
    const idStr = String(id ?? "").trim();
    if (!idStr || idStr === "NaN" || idStr === "undefined") return;
    const feat = drawnFeatures.find((f) => String(f.id) === idStr);
    setDrawnFeatures((prev) => prev.filter((f) => String(f.id) !== idStr));
    await runMutation(
      () => featureRepo.delete(id, feat?.title),
      "No se pudo eliminar el elemento. Verifica tus permisos."
    );
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
    refreshFeatures: fetchFromSupabase,
    realtimeStatus,
    isRealtimeConnected: realtimeStatus === "SUBSCRIBED",
  };
}
