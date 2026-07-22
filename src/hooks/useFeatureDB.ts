import { useState, useEffect } from "react";
import { initDatabase, RxDrawnDatabase } from "../db/database";
import type { DailyLog, DrawnFeature } from "../types";

export function useFeatureDB() {
  const [db, setDb] = useState<RxDrawnDatabase | null>(null);
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);

  useEffect(() => {
    initDatabase().then(setDb);
  }, []);

  useEffect(() => {
    if (!db) return;
    const sub = db.features.find().$.subscribe((docs) => {
      const list = docs.map((doc) => ({
        id: isNaN(Number(doc.id)) ? (doc.id as unknown as number) : Number(doc.id),
        title: doc.title,
        type: doc.type,
        description: doc.description || "",
        color: doc.color || "#3b82f6",
        locked: !!doc.locked,
        dailyLogs: doc.dailyLogs || [],
        geojsonGeometry: doc.geojsonGeometry,
      }));
      setDrawnFeatures(list);
    });
    return () => sub.unsubscribe();
  }, [db]);

  const handleFeatureAdded = async (newFeat: DrawnFeature): Promise<void> => {
    if (!db) return;
    const idStr = String(newFeat.id);
    const doc = await db.features.findOne(idStr).exec();
    if (doc) {
      try {
        await doc.patch({
          geojsonGeometry: newFeat.geojsonGeometry,
          title: newFeat.title || doc.title,
          color: newFeat.color || doc.color || "#3b82f6",
          description: newFeat.description || doc.description || "",
        });
      } catch (err) {
        console.warn("RxDB: Patch conflict (concurrency), safely ignored:", err);
      }
    } else {
      await db.features.insert({
        id: idStr,
        title: newFeat.title,
        type: newFeat.type,
        color: newFeat.color || "#3b82f6",
        geojsonGeometry: newFeat.geojsonGeometry,
      });
    }
  };

  const handleRenameFeature = async (id: number, newTitle: string): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) await doc.patch({ title: newTitle });
  };

  const handleUpdateFeatureDescription = async (id: number, newDesc: string): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) await doc.patch({ description: newDesc });
  };

  const handleUpdateFeatureColor = async (id: number, newColor: string): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) await doc.patch({ color: newColor });
  };

  const handleToggleFeatureLock = async (id: number, locked: boolean): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) await doc.patch({ locked });
  };

  const handleSaveDailyLog = async (featureId: number, log: DailyLog): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(featureId)).exec();
    if (doc) {
      const logs = doc.dailyLogs ? [...doc.dailyLogs] : [];
      const idx = logs.findIndex((l) => l.date === log.date && l.department === log.department);
      if (idx >= 0) {
        logs[idx] = log;
      } else {
        logs.push(log);
      }
      await doc.patch({ dailyLogs: logs });
    }
  };

  return {
    db,
    drawnFeatures,
    handleFeatureAdded,
    handleRenameFeature,
    handleUpdateFeatureDescription,
    handleUpdateFeatureColor,
    handleToggleFeatureLock,
    handleSaveDailyLog,
  };
}
