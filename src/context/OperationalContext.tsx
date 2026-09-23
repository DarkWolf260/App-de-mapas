import React, { createContext, useContext } from "react";
import type { DrawnFeature, DailyLog, NovedadEntry } from "../types";
import type { DailyActivity } from "../services/activityService";
import type { RealtimeChannelStatus } from "../repositories/interfaces";

export interface OperationalContextValue {
  drawnFeatures: DrawnFeature[];
  handleFeatureAdded: (feat: DrawnFeature) => Promise<void>;
  handleRenameFeature: (id: number | string, title: string) => Promise<void>;
  handleUpdateFeatureDescription: (id: number | string, desc: string) => Promise<void>;
  handleUpdateFeatureColor: (id: number | string, color: string) => Promise<void>;
  handleToggleFeatureLock: (id: number | string, locked: boolean) => Promise<void>;
  handleUpdateFeatureCollapsed: (
    id: number | string,
    isCollapsed: boolean,
    collapsedCount: string | number
  ) => Promise<void>;
  handleSaveDailyLog: (featureId: number | string, log: DailyLog) => Promise<void>;
  handleFeatureDeleted: (id: number | string) => Promise<void>;
  globalNovedades: NovedadEntry[];
  fetchGlobalNovedades: (date: string, department?: string) => Promise<void>;
  saveGlobalNovedad: (entry: NovedadEntry, date: string, department?: string) => Promise<void>;
  deleteGlobalNovedad: (entryId: string) => Promise<void>;
  updateGlobalNovedad: (entryId: string, newText: string, newTime?: string) => Promise<void>;
  dailyActivity: DailyActivity;
  fetchDailyActivity: (date: string) => Promise<void>;
  saveDailyActivity: (date: string, activities: string, description: string) => Promise<void>;
  refreshFeatures: () => Promise<void>;
  realtimeStatus: RealtimeChannelStatus;
  isRealtimeConnected: boolean;
}

const OperationalContext = createContext<OperationalContextValue | null>(null);

export const OperationalProvider: React.FC<{
  value: OperationalContextValue;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <OperationalContext.Provider value={value}>
      {children}
    </OperationalContext.Provider>
  );
};

export function useOperational(): OperationalContextValue {
  const ctx = useContext(OperationalContext);
  if (!ctx) {
    throw new Error("useOperational must be used within an OperationalProvider");
  }
  return ctx;
}
