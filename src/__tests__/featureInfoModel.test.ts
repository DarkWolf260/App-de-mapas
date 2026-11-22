import { describe, it, expect } from "vitest";
import type { DrawnFeature } from "../types";
import { buildFeatureInfoModel, getPointReportSummary } from "../components/popup/featureInfoModel";

const sectorPoly: DrawnFeature = {
  id: "sector-1",
  title: "Sector Prueba",
  type: "polygon",
  color: "#3b82f6",
  geojsonGeometry: {
    type: "Polygon",
    coordinates: [
      [
        [-66.9, 10.6],
        [-66.8, 10.6],
        [-66.8, 10.7],
        [-66.9, 10.7],
        [-66.9, 10.6],
      ],
    ],
  },
  dailyLogs: [],
};

const insidePoint: DrawnFeature = {
  id: "pt-in",
  title: "Punto Interior",
  type: "point",
  color: "#991b1b",
  geojsonGeometry: { type: "Point", coordinates: [-66.85, 10.65] },
  dailyLogs: [
    {
      date: "2026-11-22",
      department: "pc",
      rescuedCount: "3",
      groups: [{ id: "g1", groupName: "Grupo 1A", officersCount: "5", hasArrived: true }],
      customActivities: [{ id: "a1", name: "Guardia preventiva", value: "1" }],
      observations: "Sin novedad",
    },
  ],
};

const outsidePoint: DrawnFeature = {
  id: "pt-out",
  title: "Punto Exterior",
  type: "point",
  color: "#991b1b",
  geojsonGeometry: { type: "Point", coordinates: [-67.05, 10.65] },
  dailyLogs: [
    {
      date: "2026-11-22",
      department: "pc",
      rescuedCount: "9",
    },
  ],
};

describe("featureInfoModel", () => {
  it("calcula el resumen de un punto con métricas, grupos y actividades", () => {
    const model = buildFeatureInfoModel({
      activeFeat: insidePoint,
      dailyLog: insidePoint.dailyLogs?.[0],
      popupEditDate: "2026-11-22",
      activeDepartment: "pc",
      selectedDept: "pc",
    });

    expect(model.isPolygon).toBe(false);
    expect(model.activeGroups).toHaveLength(1);
    expect(model.activities).toHaveLength(1);
    expect(model.observations).toBe("Sin novedad");
    expect(model.hasPointMetrics).toBe(true);
    expect(model.hasAnyData).toBe(true);
  });

  it("detecta puntos vacíos sin datos para la fecha", () => {
    const model = buildFeatureInfoModel({
      activeFeat: insidePoint,
      dailyLog: { date: "2026-11-21", groups: [] },
      popupEditDate: "2026-11-21",
      activeDepartment: "pc",
      selectedDept: "pc",
    });

    expect(model.hasAnyData).toBe(false);
    expect(model.activeGroups).toHaveLength(0);
    expect(model.activities).toHaveLength(0);
  });

  it("agrega solo los puntos contenidos dentro del polígono del sector", () => {
    const model = buildFeatureInfoModel({
      activeFeat: sectorPoly,
      dailyLog: { date: "2026-11-22", groups: [] },
      drawnFeatures: [sectorPoly, insidePoint, outsidePoint],
      popupEditDate: "2026-11-22",
      activeDepartment: "pc",
      selectedDept: "pc",
    });

    expect(model.isPolygon).toBe(true);
    expect(model.containedCount).toBe(1);
    expect(model.reportedPoints).toHaveLength(1);
    expect(model.reportedPoints[0].point.id).toBe("pt-in");
    expect(model.reportedPoints[0].summary.totalRescued).toBe(3);
    expect(model.reportedPoints[0].summary.hasArrived).toBe(true);
    expect(model.aggregatedLog.rescuedCount).toBe("3");
  });

  it("getPointReportSummary suma métricas planas y de grupos", () => {
    const summary = getPointReportSummary({
      rescuedCount: "2",
      groups: [{ id: "g1", groupName: "G1", officersCount: "4", rescuedCount: "1", recoveredCount: "2" }],
    });
    expect(summary.totalPersonnel).toBe(4);
    expect(summary.totalRescued).toBe(3);
    expect(summary.totalRecovered).toBe(2);
    expect(summary.hasAnyLogData).toBe(true);
  });
});
