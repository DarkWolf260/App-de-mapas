import { aggregatePolygonLog } from "../components/popup/aggregatePolygonLog";
import type { DailyLog, GroupLogEntry } from "../types";

describe("aggregatePolygonLog", () => {
  it("returns polygon own metrics when no groups or contained points", () => {
    const polygonLog: Partial<DailyLog> = {
      rescuedCount: "3",
      recoveredCount: "1",
      prehospitalCareCount: "2",
    };
    const result = aggregatePolygonLog(polygonLog, [], []);
    expect(result.rescuedCount).toBe("3");
    expect(result.recoveredCount).toBe("1");
    expect(result.prehospitalCareCount).toBe("2");
    expect(result._hasData).toBe(true);
  });

  it("aggregates group metrics into polygon totals", () => {
    const polygonLog: Partial<DailyLog> = {};
    const groups: GroupLogEntry[] = [
      { id: "g1", groupName: "Alpha", rescuedCount: "5", recoveredCount: "2", prehospitalCareCount: "1", transfersCount: "3", commissionId: "independiente" },
    ];
    const result = aggregatePolygonLog(polygonLog, groups, []);
    expect(result.rescuedCount).toBe("5");
    expect(result.recoveredCount).toBe("2");
    expect(result.transfersCount).toBe("3");
  });

  it("de-duplicates joint commission groups", () => {
    const polygonLog: Partial<DailyLog> = {};
    const groups: GroupLogEntry[] = [
      { id: "g1", groupName: "Alpha", rescuedCount: "5", commissionId: "comision_1" },
      { id: "g2", groupName: "Bravo", rescuedCount: "3", commissionId: "comision_1" },
    ];
    const result = aggregatePolygonLog(polygonLog, groups, []);
    expect(result.rescuedCount).toBe("5");
  });

  it("adds contained point metrics", () => {
    const polygonLog: Partial<DailyLog> = {};
    const contained = [
      {
        point: { id: 10, title: "Punto A", type: "point" as const, geojsonGeometry: { type: "Point" as const, coordinates: [0, 0] } },
        log: { rescuedCount: "2" } as Partial<DailyLog>,
      },
    ];
    const result = aggregatePolygonLog(polygonLog, [], contained);
    expect(result.rescuedCount).toBe("2");
  });

  it("appends observations from contained points", () => {
    const polygonLog: Partial<DailyLog> = { observations: "obs poligono" };
    const contained = [
      {
        point: { id: 10, title: "Punto A", type: "point" as const, geojsonGeometry: { type: "Point" as const, coordinates: [0, 0] } },
        log: { observations: "obs punto" } as Partial<DailyLog>,
      },
    ];
    const result = aggregatePolygonLog(polygonLog, [], contained);
    expect(result.observations).toContain("Polígono: obs poligono");
    expect(result.observations).toContain("Punto A: obs punto");
  });

  it("returns _hasData false when no metrics and no contained points", () => {
    const result = aggregatePolygonLog({}, [], []);
    expect(result._hasData).toBe(false);
  });

  it("sets metric to undefined when total is 0", () => {
    const result = aggregatePolygonLog({}, [], []);
    expect(result.rescuedCount).toBeUndefined();
    expect(result.recoveredCount).toBeUndefined();
  });
});
