import type { DrawnFeature, DailyLog, NovedadEntry } from "../types";

export interface IFeatureRepository {
  fetchAll(): Promise<DrawnFeature[]>;
  upsert(feat: DrawnFeature): Promise<void>;
  updateTitle(id: number | string, title: string): Promise<void>;
  updateDescription(id: number | string, desc: string): Promise<void>;
  updateColor(id: number | string, color: string): Promise<void>;
  updateLock(id: number | string, locked: boolean): Promise<void>;
  updateCollapsed(id: number | string, isCollapsed: boolean, collapsedCount: string | number): Promise<void>;
  delete(id: number | string): Promise<void>;
}

export interface ILogRepository {
  fetchAll(date?: string): Promise<Map<string, DailyLog[]>>;
  save(featureId: number | string, log: DailyLog): Promise<void>;
}

export interface INovedadRepository {
  fetch(date: string, department?: string): Promise<NovedadEntry[]>;
  insert(entry: NovedadEntry, date: string, department: string): Promise<void>;
  delete(id: string): Promise<void>;
  update(id: string, data: Record<string, string>): Promise<void>;
}

export interface IMigrationRepository {
  run(onAfter: () => Promise<void>): Promise<void>;
}

export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type RealtimeChannelStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR" | "CONNECTING";

export interface RealtimePayload {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE" | string;
  new: Record<string, any>;
  old: Record<string, any>;
}

export interface IRealtimeProvider {
  subscribeToChanges(
    callback: (payload?: RealtimePayload) => void,
    onStatusChange?: (status: RealtimeChannelStatus) => void
  ): () => void;
  subscribeToAuthChanges(callback: (event: string) => void): () => void;
}

