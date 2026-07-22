import type { RxDrawnDatabase, RxDrawnFeatureDocument } from "../db/database";
import type { DrawnFeature, GeoJSONGeometry } from "../types";

interface GeoJSONFeature {
  id?: string;
  geometry: GeoJSONGeometry;
  properties?: Record<string, unknown>;
}

export function useGeoJSONIO(
  db: RxDrawnDatabase | null,
  drawnFeatures: DrawnFeature[],
  setImportedFeatures: (features: DrawnFeature[]) => void
) {
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

  const handleImportGeoJSON = async (geojsonText: string): Promise<void> => {
    try {
      const geojson = JSON.parse(geojsonText) as { type: string; features: GeoJSONFeature[] };
      if (geojson.type !== "FeatureCollection" || !Array.isArray(geojson.features)) {
        alert("El archivo no es un FeatureCollection GeoJSON válido.");
        return;
      }

      const existingDocs = db ? await db.features.find().exec() : [];
      const existingKeys = new Set(
        existingDocs.map((d) => {
          const g = d.geojsonGeometry;
          const coords = g?.coordinates;
          const firstCoord = Array.isArray(coords) ? JSON.stringify(coords[0]) : "";
          return `${d.title}|${d.type}|${firstCoord}`;
        })
      );

      const newDrawn: DrawnFeature[] = [];
      const toInsert: RxDrawnFeatureDocument[] = [];
      let skipped = 0;

      geojson.features.forEach((feat, index) => {
        const title = (feat.properties?.title as string) ?? `Elemento ${index + 1}`;
        const color = (feat.properties?.color as string) || "#3b82f6";
        const description = (feat.properties?.description as string) || "";
        const locked = !!feat.properties?.locked;
        const dailyLogs = Array.isArray(feat.properties?.dailyLogs) ? (feat.properties.dailyLogs as DrawnFeature["dailyLogs"]) : [];

        let type: DrawnFeature["type"] | null = null;
        if (feat.geometry.type === "Point") type = "point";
        else if (feat.geometry.type === "LineString") type = "polyline";
        else if (feat.geometry.type === "Polygon") type = "polygon";
        if (!type) return;

        const firstCoord = Array.isArray(feat.geometry.coordinates) ? JSON.stringify(feat.geometry.coordinates[0]) : "";
        const key = `${title}|${type}|${firstCoord}`;
        if (existingKeys.has(key)) {
          skipped++;
          return;
        }

        const id = feat.id ? String(feat.id) : `draw-imp-${Date.now()}-${index}`;
        const item: RxDrawnFeatureDocument = { id, title, type, color, description, locked, dailyLogs, geojsonGeometry: feat.geometry };
        newDrawn.push(item);
        toInsert.push(item);
        existingKeys.add(key);
      });

      if (toInsert.length > 0 && db) {
        await db.features.bulkInsert(toInsert);
        setImportedFeatures(newDrawn);
      }

      const parts = [`Se importaron ${toInsert.length} geometrías`];
      if (skipped > 0) parts.push(`${skipped} duplicado(s) omitido(s)`);
      alert(parts.join(". ") + ".");
    } catch (e) {
      alert("Error al parsear el archivo GeoJSON.");
      console.error(e);
    }
  };

  return { handleExportGeoJSON, handleImportGeoJSON };
}
