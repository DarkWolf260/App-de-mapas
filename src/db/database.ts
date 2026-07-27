import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import type { DailyLog } from "../types";

addRxPlugin(RxDBMigrationSchemaPlugin);

export const FeatureSchema = {
  title: "feature schema",
  version: 15,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 100 },
    title: { type: "string" },
    type: { type: "string" },
    description: { type: "string" },
    color: { type: "string" },
    locked: { type: "boolean" },
    isCollapsed: { type: "boolean" },
    collapsedCount: { type: "string" },
    dailyLogs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          department: { type: "string" },
          groups: { type: "array" },
          observations: { type: "string" },
          novedades: { type: "array" },
          rescuedCount: { type: "string" },
          recoveredCount: { type: "string" },
          rescuedPetsCount: { type: "string" },
          prehospitalCareCount: { type: "string" },
          transfersCount: { type: "string" },
        },
        required: ["date"],
      },
    },
    geojsonGeometry: {
      type: "object",
      properties: { type: { type: "string" }, coordinates: { type: "array" } },
      required: ["type", "coordinates"],
    },
  },
  required: ["id", "title", "type", "geojsonGeometry"],
};

export type RxDrawnFeatureDocument = {
  id: string;
  title: string;
  type: "point" | "polyline" | "polygon";
  description?: string;
  color?: string;
  locked?: boolean;
  isCollapsed?: boolean;
  collapsedCount?: string;
  dailyLogs?: DailyLog[];
  geojsonGeometry: { type: "Point" | "LineString" | "Polygon"; coordinates: any };
};

export type RxDrawnFeatureCollection = RxCollection<RxDrawnFeatureDocument>;
export type RxDrawnDatabaseCollections = { features: RxDrawnFeatureCollection };
export type RxDrawnDatabase = RxDatabase<RxDrawnDatabaseCollections>;

let dbPromise: Promise<RxDrawnDatabase> | null = null;
let _dbInstance: RxDrawnDatabase | null = null;

export const initDatabase = (): Promise<RxDrawnDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await createRxDatabase<RxDrawnDatabaseCollections>({
        name: "proteccion_civil_db",
        storage: getRxStorageDexie(),
      });
      _dbInstance = db;

      await db.addCollections({
        features: {
          schema: FeatureSchema,
          migrationStrategies: {
            1: (d: any) => { d.description = ""; return d; },
            2: (d: any) => { d.color = "#3b82f6"; return d; },
            3: (d: any) => { d.dailyLogs = []; return d; },
            4: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, departureTime: "", arrivalTime: "" })); return d; },
            5: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, officersCount: "" })); return d; },
            6: (d: any) => { d.locked = false; return d; },
            7: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, groupName2: "", managerName2: "", managerPhone2: "", unitOut2: "", departureTime2: "", arrivalTime2: "", officersCount2: "" })); return d; },
            8: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, rescuedCount: "", recoveredCount: "", rescuedCount2: "", recoveredCount2: "" })); return d; },
            9: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, hasArrivedG1: false, hasArrivedG2: false })); return d; },
            10: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, rescuedPetsCount: "" })); return d; },
            11: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, observations: "" })); return d; },
            12: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, department: "pc" })); return d; },
            13: (d: any) => { d.isCollapsed = false; d.collapsedCount = ""; return d; },
            14: (d: any) => { if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({ ...l, novedades: l.novedades || [] })); return d; },
            15: (d: any) => {
              if (d.dailyLogs) d.dailyLogs = d.dailyLogs.map((l: any) => ({
                date: l.date, department: l.department || "pc",
                groups: l.groups || [],
                observations: l.observations || "", novedades: l.novedades || [],
                rescuedCount: l.rescuedCount || "", recoveredCount: l.recoveredCount || "",
                rescuedPetsCount: l.rescuedPetsCount || "", prehospitalCareCount: l.prehospitalCareCount || "",
                transfersCount: l.transfersCount || "",
              }));
              return d;
            },
          },
        },
      });

      try {
        const oldData = localStorage.getItem("pc_drawn_features");
        if (oldData) {
          const parsed = JSON.parse(oldData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existing = await db.features.find().exec();
            if (existing.length === 0) {
              await db.features.bulkInsert(parsed.map((item: any) => ({
                id: String(item.id), title: String(item.title),
                type: String(item.type) as "point" | "polyline" | "polygon",
                geojsonGeometry: item.geojsonGeometry,
              })));
            }
            localStorage.removeItem("pc_drawn_features");
          }
        }
      } catch (err) { console.error("RxDB: Migration failed", err); }

      return db;
    })();
  }
  return dbPromise;
};

export const closeDatabase = async (): Promise<void> => {
  if (_dbInstance) {
    try { await _dbInstance.destroy(); } catch (err) { console.error("RxDB: Destroy failed", err); }
    _dbInstance = null; dbPromise = null;
  }
};
