import * as featureService from "../services/featureService";
import * as logService from "../services/logService";
import * as novedadService from "../services/novedadService";
import { migrateRxDBToSupabase as runMigration } from "../services/migrationService";
import { supabase } from "../lib/supabaseClient";
import type {
  IFeatureRepository,
  ILogRepository,
  INovedadRepository,
  IMigrationRepository,
  IRealtimeProvider,
} from "./interfaces";

export const supabaseFeatureRepo: IFeatureRepository = {
  fetchAll: featureService.fetchFeatures,
  upsert: featureService.upsertFeature,
  updateTitle: featureService.updateFeatureTitle,
  updateDescription: featureService.updateFeatureDescription,
  updateColor: featureService.updateFeatureColor,
  updateLock: featureService.updateFeatureLock,
  updateCollapsed: featureService.updateFeatureCollapsed,
  delete: featureService.deleteFeature,
};

export const supabaseLogRepo: ILogRepository = {
  fetchAll: logService.fetchLogs,
  save: logService.saveDailyLog,
};

export const supabaseNovedadRepo: INovedadRepository = {
  fetch: novedadService.fetchNovedades,
  insert: novedadService.insertNovedad,
  delete: novedadService.deleteNovedad,
  update: novedadService.updateNovedad,
};

export const supabaseMigrationRepo: IMigrationRepository = {
  run: runMigration,
};

export const supabaseRealtime: IRealtimeProvider = {
  subscribeToChanges(callback: () => void) {
    const channel = supabase
      .channel("supabase-realtime-coe")
      .on("postgres_changes", { event: "*", schema: "public", table: "drawn_features" }, callback)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_logs" }, callback)
      .on("postgres_changes", { event: "*", schema: "public", table: "novedades" }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  subscribeToAuthChanges(callback: (event: string) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      callback(event);
    });
    return () => {
      subscription.unsubscribe();
    };
  },
};
