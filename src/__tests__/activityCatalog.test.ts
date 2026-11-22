import { describe, it, expect } from "vitest";
import type { DrawnFeature, LayerVisibility } from "../types";
import {
  ACTIVITY_CATALOG_GROUPS,
  ALL_CATALOG_ACTIVITIES,
  DEMOLISHED_POINT_COLOR,
  FORMACION_POINT_COLOR,
  getDemolitionInfo,
  getFeatureActivityHistory,
  isDemolidosFeaturedPolygon,
  isDemolishedFeature,
  isFormacionFeature,
  shouldShowFeatureForLayerMode,
} from "../utils/activityCatalog";

const makePoint = (overrides: Partial<DrawnFeature> = {}): DrawnFeature => ({
  id: "p1",
  title: "Punto de prueba",
  type: "point",
  color: "#991b1b",
  geojsonGeometry: { type: "Point", coordinates: [-66.9, 10.6] },
  dailyLogs: [],
  ...overrides,
});

const makePolygon = (overrides: Partial<DrawnFeature> = {}): DrawnFeature => ({
  id: "poly1",
  title: "Sector D",
  type: "polygon",
  color: "#86198f",
  geojsonGeometry: {
    type: "Polygon",
    coordinates: [[[-66.9, 10.6], [-66.89, 10.6], [-66.89, 10.61], [-66.9, 10.6]]],
  },
  dailyLogs: [],
  ...overrides,
});

const baseVisibility: LayerVisibility = {
  sketch: true,
  polygonLabels: true,
  pointLabels: true,
  hideNestedAreas: true,
  inspecciones: false,
  formacion: false,
  demolidos: false,
};

describe("activityCatalog", () => {
  it("contiene los 3 nombres exactos de prevención operativa sin duplicados", () => {
    expect(ALL_CATALOG_ACTIVITIES).toContain("Guardia preventiva");
    expect(ALL_CATALOG_ACTIVITIES).toContain("Puesto preventivo");
    expect(ALL_CATALOG_ACTIVITIES).toContain("Recorrido preventivo");
    expect(new Set(ALL_CATALOG_ACTIVITIES).size).toBe(ALL_CATALOG_ACTIVITIES.length);
    expect(ACTIVITY_CATALOG_GROUPS.length).toBe(5);
  });

  it("identifica edificios demolidos por color negro o actividad de demolición ejecutada", () => {
    const blackPoint = makePoint({ color: DEMOLISHED_POINT_COLOR });
    const finalizedByLog = makePoint({
      dailyLogs: [{ date: "2026-09-30", customActivities: [{ id: "1", name: "Demolición controlada", value: "1", description: "FINALIZADA" }] }],
    });
    const scheduledOnly = makePoint({
      dailyLogs: [{ date: "2026-10-08", customActivities: [{ id: "2", name: "Demolición controlada", value: "1", description: "PROGRAMADA" }] }],
    });
    const polygon = makePolygon({ color: DEMOLISHED_POINT_COLOR });

    expect(isDemolishedFeature(blackPoint)).toBe(true);
    expect(isDemolishedFeature(finalizedByLog)).toBe(true);
    expect(isDemolishedFeature(scheduledOnly)).toBe(false);
    expect(isDemolishedFeature(polygon)).toBe(false);
  });

  it("identifica puntos de formación y prevención comunitaria sin incluir áreas operativas", () => {
    const violetPoint = makePoint({ color: FORMACION_POINT_COLOR });
    const trainingPoint = makePoint({
      dailyLogs: [{ date: "2026-09-28", customActivities: [{ id: "1", name: "Actividad educativa", value: "20" }] }],
    });
    const mixedOperationalBase = makePoint({
      dailyLogs: [
        {
          date: "2026-10-16",
          customActivities: [
            { id: "1", name: "Capacitación", value: "32" },
            { id: "2", name: "Base de operaciones", value: "1" },
          ],
        },
      ],
    });

    expect(isFormacionFeature(violetPoint)).toBe(true);
    expect(isFormacionFeature(trainingPoint)).toBe(true);
    expect(isFormacionFeature(mixedOperationalBase)).toBe(false);
  });

  it("filtra correctamente las features según el modo de capa activo", () => {
    const opsPoint = makePoint({ id: "ops" });
    const formPoint = makePoint({ id: "form", color: FORMACION_POINT_COLOR });
    const demoPoint = makePoint({ id: "demo", color: DEMOLISHED_POINT_COLOR });
    const sectorPoly = makePolygon({ id: "poly" });

    // Modo operativo normal: todos visibles
    expect(shouldShowFeatureForLayerMode(opsPoint, baseVisibility)).toBe(true);
    expect(shouldShowFeatureForLayerMode(formPoint, baseVisibility)).toBe(true);
    expect(shouldShowFeatureForLayerMode(demoPoint, baseVisibility)).toBe(true);

    // Solo Formación: polígonos + formación
    const formVis = { ...baseVisibility, formacion: true };
    expect(shouldShowFeatureForLayerMode(opsPoint, formVis)).toBe(false);
    expect(shouldShowFeatureForLayerMode(formPoint, formVis)).toBe(true);
    expect(shouldShowFeatureForLayerMode(demoPoint, formVis)).toBe(false);
    expect(shouldShowFeatureForLayerMode(sectorPoly, formVis)).toBe(true);

    // Solo Demolidos: polígonos + demolidos
    const demoVis = { ...baseVisibility, demolidos: true };
    expect(shouldShowFeatureForLayerMode(opsPoint, demoVis)).toBe(false);
    expect(shouldShowFeatureForLayerMode(formPoint, demoVis)).toBe(false);
    expect(shouldShowFeatureForLayerMode(demoPoint, demoVis)).toBe(true);
    expect(shouldShowFeatureForLayerMode(sectorPoly, demoVis)).toBe(true);
  });

  it("obtiene la primera fecha de finalización de demolición y no las repeticiones posteriores", () => {
    const avilaMar = makePoint({
      title: "Edificio Ávila mar",
      color: DEMOLISHED_POINT_COLOR,
      dailyLogs: [
        { date: "2026-09-15", customActivities: [{ id: "1", name: "Demolición controlada", value: "1", description: "Se programa demolición" }] },
        { date: "2026-09-16", customActivities: [{ id: "2", name: "Demolición controlada", value: "1", description: "FINALIZADO" }] },
        { date: "2026-09-30", customActivities: [{ id: "3", name: "Demolición controlada", value: "1", description: "FINALIZADA" }] },
      ],
    });
    const info = getDemolitionInfo(avilaMar);
    expect(info.demolishedDate).toBe("2026-09-16");

    const ibiza = makePoint({
      title: "Edificio Ibiza",
      color: DEMOLISHED_POINT_COLOR,
      dailyLogs: [
        { date: "2026-11-04", customActivities: [{ id: "1", name: "Guardia preventiva", value: "1" }] },
        { date: "2026-11-06", customActivities: [{ id: "2", name: "Demolición controlada", value: "1", description: "FINALIZADA" }] },
      ],
    });
    expect(getDemolitionInfo(ibiza).demolishedDate).toBe("2026-11-06");

    const opp36 = makePoint({
      title: "Residencias Luisa Cáceres de Arismendi - OPP 36",
      color: DEMOLISHED_POINT_COLOR,
      dailyLogs: [
        { date: "2026-07-30", customActivities: [{ id: "1", name: "Demolición controlada", value: "1", description: "Torre C — Finalizada" }] },
        { date: "2026-09-05", customActivities: [{ id: "2", name: "Demolición controlada", value: "2", description: "Torres A y B — Finalizada" }] },
      ],
    });
    const oppInfo = getDemolitionInfo(opp36);
    expect(oppInfo.events).toEqual([
      { date: "2026-07-30", label: "Torre C" },
      { date: "2026-09-05", label: "Torres A y B" },
    ]);

    const hugoPoly = makePolygon({ id: "draw-imp-1784845030059-16", title: "Urbanismo Hugo Chavez" });
    expect(isDemolidosFeaturedPolygon(hugoPoly)).toBe(true);
    expect(isDemolidosFeaturedPolygon(makePolygon({ id: "other", title: "Sector C" }))).toBe(false);
  });

  it("devuelve el historial de actividades ordenado de la fecha más reciente a la más antigua", () => {
    const school = makePoint({
      title: "C.E.I GUAICAMACUTO",
      color: FORMACION_POINT_COLOR,
      dailyLogs: [
        { date: "2026-09-28", department: "pc", customActivities: [{ id: "1", name: "Actividad educativa", value: "16", description: "Charla" }] },
        { date: "2026-10-15", department: "pc", customActivities: [{ id: "2", name: "Simulacro", value: "1", description: "Evacuación" }] },
      ],
    });
    const history = getFeatureActivityHistory(school);
    expect(history).toHaveLength(2);
    expect(history[0].date).toBe("2026-10-15");
    expect(history[1].date).toBe("2026-09-28");
  });
});
