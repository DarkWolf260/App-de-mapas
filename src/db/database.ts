import { createRxDatabase, RxDatabase, RxCollection, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import type { DailyLog } from "../types";

addRxPlugin(RxDBMigrationSchemaPlugin);

// ── Database Schema ───────────────────────────────────────────────────────────

export const FeatureSchema = {
  title: "feature schema",
  version: 13,
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
          groupName: { type: "string" },
          managerName: { type: "string" },
          managerPhone: { type: "string" },
          unitOut: { type: "string" },
          officersCount: { type: "string" },
          rescuedCount: { type: "string" },
          recoveredCount: { type: "string" },
          rescuedPetsCount: { type: "string" },
          groupName2: { type: "string" },
          managerName2: { type: "string" },
          managerPhone2: { type: "string" },
          unitOut2: { type: "string" },
          officersCount2: { type: "string" },
          rescuedCount2: { type: "string" },
          recoveredCount2: { type: "string" },
          hasArrivedG1: { type: "boolean" },
          hasArrivedG2: { type: "boolean" },
          observations: { type: "string" },
        },
        required: ["date"],
      },
    },
    geojsonGeometry: {
      type: "object",
      properties: {
        type: { type: "string" },
        coordinates: { type: "array" },
      },
      required: ["type", "coordinates"],
    },
  },
  required: ["id", "title", "type", "geojsonGeometry"],
};

// ── Types ─────────────────────────────────────────────────────────────────────

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
  geojsonGeometry: {
    type: "Point" | "LineString" | "Polygon";
    coordinates: any;
  };
};

export type RxDrawnFeatureCollection = RxCollection<RxDrawnFeatureDocument>;

export type RxDrawnDatabaseCollections = {
  features: RxDrawnFeatureCollection;
};

export type RxDrawnDatabase = RxDatabase<RxDrawnDatabaseCollections>;

// ── Database Initialization ──────────────────────────────────────────────────

let dbPromise: Promise<RxDrawnDatabase> | null = null;

export const initDatabase = (): Promise<RxDrawnDatabase> => {
  if (!dbPromise) {
    dbPromise = (async () => {
      // 1. Create database
      const db = await createRxDatabase<RxDrawnDatabaseCollections>({
        name: "proteccion_civil_db",
        storage: getRxStorageDexie(),
      });

      // 2. Add collections
      await db.addCollections({
        features: {
          schema: FeatureSchema,
          migrationStrategies: {
            1: (oldDoc: any) => {
              oldDoc.description = "";
              return oldDoc;
            },
            2: (oldDoc: any) => {
              oldDoc.color = "#3b82f6";
              return oldDoc;
            },
            3: (oldDoc: any) => {
              oldDoc.dailyLogs = [];
              return oldDoc;
            },
            4: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  departureTime: "",
                  arrivalTime: ""
                }));
              }
              return oldDoc;
            },
            5: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  officersCount: ""
                }));
              }
              return oldDoc;
            },
            6: (oldDoc: any) => {
              oldDoc.locked = false;
              return oldDoc;
            },
            7: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  groupName2: "",
                  managerName2: "",
                  managerPhone2: "",
                  unitOut2: "",
                  departureTime2: "",
                  arrivalTime2: "",
                  officersCount2: ""
                }));
              }
              return oldDoc;
            },
            8: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  rescuedCount: "",
                  recoveredCount: "",
                  rescuedCount2: "",
                  recoveredCount2: ""
                }));
              }
              return oldDoc;
            },
            9: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  hasArrivedG1: false,
                  hasArrivedG2: false
                }));
              }
              return oldDoc;
            },
            10: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  rescuedPetsCount: ""
                }));
              }
              return oldDoc;
            },
            11: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  observations: ""
                }));
              }
              return oldDoc;
            },
            12: (oldDoc: any) => {
              if (oldDoc.dailyLogs && Array.isArray(oldDoc.dailyLogs)) {
                oldDoc.dailyLogs = oldDoc.dailyLogs.map((log: any) => ({
                  ...log,
                  department: "pc"
                }));
              }
              return oldDoc;
            },
            13: (oldDoc: any) => {
              oldDoc.isCollapsed = false;
              oldDoc.collapsedCount = "";
              return oldDoc;
            }
          }
        },
      });

      // 3. Migrate from localStorage (if exists)
      try {
        const oldData = localStorage.getItem("pc_drawn_features");
        if (oldData) {
          const parsed = JSON.parse(oldData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const featuresCollection = db.features;
            const existing = await featuresCollection.find().exec();
            if (existing.length === 0) {
              const toInsert = parsed.map((item: any) => ({
                id: String(item.id),
                title: String(item.title),
                type: String(item.type) as "point" | "polyline" | "polygon",
                geojsonGeometry: item.geojsonGeometry,
              }));
              await featuresCollection.bulkInsert(toInsert);
              console.log("RxDB: Migrated features from localStorage");
            }
            localStorage.removeItem("pc_drawn_features");
          }
        }
      } catch (err) {
        console.error("RxDB: Migration failed", err);
      }

      return db;
    })();
  }
  return dbPromise;
};
