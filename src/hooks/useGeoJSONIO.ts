import type { RxDrawnDatabase, RxDrawnFeatureDocument } from "../db/database";
import type { DrawnFeature, GeoJSONGeometry } from "../types";

interface GeoJSONFeature {
  id?: string;
  geometry: GeoJSONGeometry;
  properties?: Record<string, unknown>;
}

export interface ParsedFeature {
  index: number;
  title: string;
  type: "point" | "polyline" | "polygon";
  color: string;
  description: string;
  locked: boolean;
  dailyLogs: DrawnFeature["dailyLogs"];
  geometry: GeoJSONGeometry;
  isDuplicate: boolean;
  selected: boolean;
}

export function useGeoJSONIO(
  db: RxDrawnDatabase | null,
  drawnFeatures: DrawnFeature[],
  setImportedFeatures: (features: DrawnFeature[]) => void
) {
  const parseAndCheckDuplicates = (geojsonText: string): ParsedFeature[] | null => {
    try {
      const geojson = JSON.parse(geojsonText) as { type: string; features: GeoJSONFeature[] };
      if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        return null;
      }

      const existingKeys = new Set(
        drawnFeatures.map((f) => {
          const coords = f.geojsonGeometry?.coordinates;
          const firstCoord = Array.isArray(coords) ? JSON.stringify(coords[0]) : "";
          return `${f.title}|${f.type}|${firstCoord}`;
        })
      );

      const results: ParsedFeature[] = [];
      geojson.features.forEach((feat, index) => {
        const title = (feat.properties?.title as string) ?? `Elemento ${index + 1}`;
        const color = (feat.properties?.color as string) || "#3b82f6";
        const description = (feat.properties?.description as string) || "";
        const locked = !!feat.properties?.locked;
        const dailyLogs = Array.isArray(feat.properties?.dailyLogs) ? (feat.properties.dailyLogs as DrawnFeature["dailyLogs"]) : [];

        let type: "point" | "polyline" | "polygon" | null = null;
        if (feat.geometry.type === "Point") type = "point";
        else if (feat.geometry.type === "LineString") type = "polyline";
        else if (feat.geometry.type === "Polygon") type = "polygon";
        if (!type) return;

        const firstCoord = Array.isArray(feat.geometry.coordinates) ? JSON.stringify(feat.geometry.coordinates[0]) : "";
        const key = `${title}|${type}|${firstCoord}`;
        const isDuplicate = existingKeys.has(key);

        results.push({
          index,
          title,
          type,
          color,
          description,
          locked,
          dailyLogs,
          geometry: feat.geometry,
          isDuplicate,
          selected: !isDuplicate,
        });

        if (!isDuplicate) existingKeys.add(key);
      });

      return results;
    } catch {
      return null;
    }
  };

  const handleImportFeatures = async (features: ParsedFeature[]): Promise<{ imported: number; skipped: number }> => {
    if (!db) return { imported: 0, skipped: 0 };

    const toImport = features.filter((f) => f.selected && !f.isDuplicate);
    if (toImport.length === 0) return { imported: 0, skipped: features.length };

    const newDrawn: DrawnFeature[] = [];
    const toInsert: RxDrawnFeatureDocument[] = [];

    toImport.forEach((f) => {
      const id = `draw-imp-${Date.now()}-${f.index}`;
      const item: RxDrawnFeatureDocument = {
        id,
        title: f.title,
        type: f.type,
        color: f.color,
        description: f.description,
        locked: f.locked,
        dailyLogs: f.dailyLogs,
        geojsonGeometry: f.geometry,
      };
      newDrawn.push(item);
      toInsert.push(item);
    });

    if (toInsert.length > 0) {
      await db.features.bulkInsert(toInsert);
      setImportedFeatures(newDrawn);
    }

    return {
      imported: toInsert.length,
      skipped: features.length - toInsert.length,
    };
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
          source: "custom_drawing",
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

  return { handleExportGeoJSON, parseAndCheckDuplicates, handleImportFeatures };
}
