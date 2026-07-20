import React, { useState, useEffect, useMemo } from "react";
import MapComponent from "./components/MapComponent";
import Sidebar from "./components/Sidebar";
import { ChevronLeft, Menu } from "lucide-react";
import { initDatabase, RxDrawnDatabase } from "./db/database";
import { RangeReportModal } from "./components/RangeReportModal";
import { FloatingSearchBar } from "./components/FloatingSearchBar";

// ── Shared types ──────────────────────────────────────────────────────────────

export interface GeoJSONGeometry {
  type: "Point" | "LineString" | "Polygon";
  coordinates: number[] | number[][] | number[][][];
}

export interface DrawnFeature {
  id: number;
  title: string;
  type: "point" | "polyline" | "polygon";
  description?: string;
  color?: string;
  locked?: boolean;
  dailyLogs?: Array<{
    date: string;
    groupName: string;
    managerName: string;
    managerPhone: string;
    unitOut: string;
    departureTime?: string;
    arrivalTime?: string;
    officersCount?: string;
    rescuedCount?: string;
    recoveredCount?: string;
    groupName2?: string;
    managerName2?: string;
    managerPhone2?: string;
    unitOut2?: string;
    departureTime2?: string;
    arrivalTime2?: string;
    officersCount2?: string;
    rescuedCount2?: string;
    recoveredCount2?: string;
    hasArrivedG1?: boolean;
    hasArrivedG2?: boolean;
  }>;
  geojsonGeometry: GeoJSONGeometry;
  _isUpdate?: boolean;
}

export interface LayerVisibility {
  sketch: boolean;
  polygonLabels: boolean;
  pointLabels: boolean;
  hideNestedAreas: boolean;
}

export interface RemoveFeatureId {
  id: number;
  timestamp: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

function App() {
  const apiKey: string = import.meta.env.VITE_ARCGIS_API_KEY ?? "";
  const [activeCity, setActiveCity] = useState<string>("venezuela");
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    sketch: true,
    polygonLabels: true,
    pointLabels: true,
    hideNestedAreas: false,
  });
  const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>([]);
  const [zoomToFeature, setZoomToFeature] = useState<DrawnFeature | null>(null);
  const [removeFeatureId, setRemoveFeatureId] = useState<RemoveFeatureId | null>(null);
  const [importedFeatures, setImportedFeatures] = useState<DrawnFeature[]>([]);
  const [rangeReportFeature, setRangeReportFeature] = useState<DrawnFeature | "all" | null>(null);

  // RxDB instance
  const [db, setDb] = useState<RxDrawnDatabase | null>(null);

  // 1. Initialize RxDB
  useEffect(() => {
    initDatabase().then((database) => {
      setDb(database);
    });
  }, []);

  // 2. Reactively subscribe to database changes
  useEffect(() => {
    if (!db) return;
    const sub = db.features.find().$.subscribe((docs) => {
      const list = docs.map((doc) => ({
        id: isNaN(Number(doc.id)) ? (doc.id as any) : Number(doc.id),
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

  const handleToggleLayer = (layerName: keyof LayerVisibility): void => {
    setLayerVisibility((prev) => ({ ...prev, [layerName]: !prev[layerName] }));
  };

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
      // Document does not exist, insert it
      await db.features.insert({
        id: idStr,
        title: newFeat.title,
        type: newFeat.type,
        color: newFeat.color || "#3b82f6",
        geojsonGeometry: newFeat.geojsonGeometry,
      });
    }
  };

  const handleFeatureDeleted = async (id: number): Promise<void> => {
    setRemoveFeatureId({ id, timestamp: Date.now() });
    if (!db) return;
    try {
      const doc = await db.features.findOne(String(id)).exec();
      if (doc) {
        await doc.remove();
      }
    } catch (e) {
      console.warn("RxDB: Conflict during delete ignored safely", e);
    }
  };

  const handleRenameFeature = async (id: number, newTitle: string): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) {
      await doc.patch({
        title: newTitle,
      });
    }
  };

  const handleUpdateFeatureDescription = async (id: number, newDesc: string): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) {
      await doc.patch({
        description: newDesc,
      });
    }
  };
  const handleToggleFeatureLock = async (id: number, locked: boolean): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(id)).exec();
    if (doc) {
      await doc.patch({
        locked: locked,
      });
    }
  };
  const handleSaveDailyLog = async (
    featureId: number,
    log: {
      date: string;
      groupName: string;
      managerName: string;
      managerPhone: string;
      unitOut: string;
      departureTime?: string;
      arrivalTime?: string;
      officersCount?: string;
      groupName2?: string;
      managerName2?: string;
      managerPhone2?: string;
      unitOut2?: string;
      departureTime2?: string;
      arrivalTime2?: string;
      officersCount2?: string;
    }
  ): Promise<void> => {
    if (!db) return;
    const doc = await db.features.findOne(String(featureId)).exec();
    if (doc) {
      const logs = doc.dailyLogs ? [...doc.dailyLogs] : [];
      const idx = logs.findIndex((l) => l.date === log.date);
      if (idx >= 0) {
        logs[idx] = log;
      } else {
        logs.push(log);
      }
      await doc.patch({
        dailyLogs: logs
      });
    }
  };

  const handleExportGeoJSON = (): void => {
    const geojson = {
      type: "FeatureCollection",
      features: drawnFeatures.map((feat) => ({
        type: "Feature",
        geometry: feat.geojsonGeometry,
        properties: {
          title: feat.title,
          type: feat.type,
          color: feat.color,
          description: feat.description,
          locked: !!feat.locked,
          dailyLogs: feat.dailyLogs || [],
          source: "custom_drawing"
        },
      })),
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataStr);
    a.setAttribute("download", `mapa_proteccion_civil_${Date.now()}.geojson`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportGeoJSON = async (geojsonText: string): Promise<void> => {
    try {
      const geojson = JSON.parse(geojsonText) as { type: string; features: Array<{ id?: string; geometry: GeoJSONGeometry; properties?: Record<string, any> }> };
      if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        alert("El archivo no es un FeatureCollection GeoJSON válido.");
        return;
      }
      const newDrawn: DrawnFeature[] = [];
      const toInsert: any[] = [];
      geojson.features.forEach((feat, index) => {
        const title = feat.properties?.title ?? `Elemento ${index + 1}`;
        const id = feat.id ? String(feat.id) : `draw-imp-${Date.now()}-${index}`;
        const color = feat.properties?.color || "#3b82f6";
        const description = feat.properties?.description || "";
        const locked = !!feat.properties?.locked;
        const dailyLogs = Array.isArray(feat.properties?.dailyLogs) ? feat.properties.dailyLogs : [];

        if (feat.geometry.type === "Point") {
          const item = { id, title, type: "point" as const, color, description, locked, dailyLogs, geojsonGeometry: feat.geometry };
          newDrawn.push(item as any);
          toInsert.push(item);
        } else if (feat.geometry.type === "LineString" || feat.geometry.type === "Polygon") {
          const item = {
            id,
            title,
            type: feat.geometry.type === "LineString" ? ("polyline" as const) : ("polygon" as const),
            color,
            description,
            locked,
            dailyLogs,
            geojsonGeometry: feat.geometry
          };
          newDrawn.push(item as any);
          toInsert.push(item);
        }
      });
      if (toInsert.length > 0 && db) {
        await db.features.bulkInsert(toInsert);
        setImportedFeatures(newDrawn);
      }
      alert(`Se importaron con éxito ${toInsert.length} geometrías.`);
    } catch (e) {
      alert("Error al parsear el archivo GeoJSON.");
      console.error(e);
    }
  };

  const [hiddenFeatures, setHiddenFeatures] = useState<Record<number, boolean>>({});

  const handleToggleFeatureVisibility = (id: number): void => {
    setHiddenFeatures((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleFeaturesVisibility = (ids: number[], visible: boolean): void => {
    setHiddenFeatures((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[id] = !visible;
      });
      return next;
    });
  };

  const [featureOrder, setFeatureOrder] = useState<number[]>([]);

  // Load order from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pc_feature_order");
    if (saved) {
      try {
        setFeatureOrder(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Automatically keep featureOrder in sync when drawnFeatures list changes
  useEffect(() => {
    if (drawnFeatures.length > 0) {
      setFeatureOrder((prev) => {
        const next = [...prev];
        let changed = false;
        drawnFeatures.forEach((f) => {
          if (!next.includes(f.id)) {
            next.unshift(f.id); // Add new drawings to the top by default
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("pc_feature_order", JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }
  }, [drawnFeatures]);

  const sortedDrawnFeatures = useMemo(() => {
    return [...drawnFeatures].sort((a, b) => {
      const indexA = featureOrder.indexOf(a.id);
      const indexB = featureOrder.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [drawnFeatures, featureOrder]);

  const handleReorderFeature = (id: number, direction: "up" | "down"): void => {
    setFeatureOrder((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const next = [...prev];
      if (direction === "up" && index > 0) {
        // Swap with the previous element (move up in the list, drawn on top)
        const temp = next[index];
        next[index] = next[index - 1];
        next[index - 1] = temp;
      } else if (direction === "down" && index < next.length - 1) {
        // Swap with the next element (move down in the list, drawn below)
        const temp = next[index];
        next[index] = next[index + 1];
        next[index + 1] = temp;
      }
      localStorage.setItem("pc_feature_order", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="app-container">
      <MapComponent
        apiKey={apiKey}
        activeCity={activeCity}
        activeBasemap="satellite-free"
        layerVisibility={layerVisibility}
        onFeatureAdded={handleFeatureAdded}
        onFeatureDeleted={handleFeatureDeleted}
        zoomToFeature={zoomToFeature}
        removeFeatureId={removeFeatureId}
        importedFeatures={importedFeatures}
        drawnFeatures={sortedDrawnFeatures}
        hiddenFeatures={hiddenFeatures}
        onSaveDailyLog={handleSaveDailyLog}
        onOpenRangeReport={(feat) => setRangeReportFeature(feat)}
        onToggleFeatureLock={handleToggleFeatureLock}
      />

      <FloatingSearchBar
        drawnFeatures={sortedDrawnFeatures}
        onZoomToFeature={setZoomToFeature}
        showSidebar={showSidebar}
      />

      <button
        className={`sidebar-toggle ${!showSidebar ? "collapsed" : ""}`}
        onClick={() => setShowSidebar(!showSidebar)}
        title={showSidebar ? "Ocultar panel lateral" : "Mostrar panel lateral"}
      >
        {showSidebar ? <ChevronLeft size={18} /> : <Menu size={18} />}
      </button>

      <Sidebar
        activeCity={activeCity}
        layerVisibility={layerVisibility}
        onToggleLayer={handleToggleLayer}
        drawnFeatures={sortedDrawnFeatures}
        onRenameFeature={handleRenameFeature}
        onDeleteFeature={handleFeatureDeleted}
        onZoomToFeature={setZoomToFeature}
        onExportGeoJSON={handleExportGeoJSON}
        onImportGeoJSON={handleImportGeoJSON}
        hiddenFeatures={hiddenFeatures}
        onToggleFeatureVisibility={handleToggleFeatureVisibility}
        onToggleFeaturesVisibility={handleToggleFeaturesVisibility}
        onReorderFeature={handleReorderFeature}
        onUpdateFeatureDescription={handleUpdateFeatureDescription}
        onToggleFeatureLock={handleToggleFeatureLock}
        onSaveDailyLog={handleSaveDailyLog}
        onOpenRangeReport={(feat) => setRangeReportFeature(feat)}
        className={showSidebar ? "" : "collapsed"}
      />

      <RangeReportModal
        feat={rangeReportFeature}
        allFeatures={sortedDrawnFeatures.filter((f) => f.type === "point")}
        onClose={() => setRangeReportFeature(null)}
        onSaveDailyLog={handleSaveDailyLog}
      />
    </div>
  );
}

export default App;
