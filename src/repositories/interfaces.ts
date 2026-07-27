import type { DrawnFeature, DailyLog, NovedadEntry } from "../types";

export interface IFeatureRepository {
  fetchAll(): Promise<DrawnFeature[]>;
  upsert(feat: DrawnFeature): Promise<void>;
  updateTitle(id: number, title: string): Promise<void>;
  updateDescription(id: number, desc: string): Promise<void>;
  updateColor(id: number, color: string): Promise<void>;
  updateLock(id: number, locked: boolean): Promise<void>;
  updateCollapsed(id: number, isCollapsed: boolean, collapsedCount: string | number): Promise<void>;
  delete(id: number): Promise<void>;
}

export interface ILogRepository {
  fetchAll(): Promise<Map<string, DailyLog[]>>;
  save(featureId: number, log: DailyLog): Promise<void>;
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

export interface IRealtimeProvider {
  subscribeToChanges(callback: () => void): () => void;
  subscribeToAuthChanges(callback: (event: string) => void): () => void;
}
