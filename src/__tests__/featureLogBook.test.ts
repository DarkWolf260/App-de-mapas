import { describe, it, expect } from "vitest";
import {
  FeatureLogBook,
  emptyLog,
  getNormalizedGroupList,
  getTotalPersonnel,
  logHasPersonnel,
  logIsArrived,
  logMatchesArrivalFilter,
  logHasAnyData,
  getGroupData,
  splitGroupNames,
  mergeCustomActivities,
  mergeLogs,
  aggregatePolygonLog,
  getDayStats,
  fromDatabaseRow,
  toDatabaseRow,
} from "../utils/featureLogBook";
import type { DailyLog, DrawnFeature } from "../types";

describe("FeatureLogBook - Group Normalization & State", () => {
  it("splits multiple group names with varied delimiters", () => {
    expect(splitGroupNames("Alpha y Beta")).toEqual(["Alpha", "Beta"]);
    expect(splitGroupNames("Alpha / Beta + Gamma")).toEqual(["Alpha", "Beta", "Gamma"]);
    expect(splitGroupNames("Alpha")).toEqual(["Alpha"]);
  });

  it("normalizes groups expanding joint group names into commission entries", () => {
    const log: DailyLog = {
      date: "2026-08-28",
      groups: [
        {
          id: "g1",
          groupName: "Guardia A / Rescate B",
          officersCount: "6",
          rescuedCount: "2",
          hasArrived: true,
        },
      ],
    };
    const normalized = getNormalizedGroupList(log);
    expect(normalized.length).toBe(2);
    expect(normalized[0].groupName).toBe("Guardia A");
    expect(normalized[1].groupName).toBe("Rescate B");
    expect(normalized[0].commissionId).toBe("comision_1");
    expect(normalized[1].commissionId).toBe("comision_1");
    expect(normalized[0].rescuedCount).toBe("2");
    expect(normalized[1].rescuedCount).toBe("2");
  });

  it("calculates total personnel correctly across groups", () => {
    const log: DailyLog = {
      date: "2026-08-28",
      groups: [
        { id: "1", groupName: "G1", officersCount: "4" },
        { id: "2", groupName: "G2", officersCount: "6" },
      ],
    };
    expect(getTotalPersonnel(log)).toBe(10);
    expect(logHasPersonnel(log)).toBe(true);
  });

  it("evaluates arrival filter properly", () => {
    const logArrived: DailyLog = {
      date: "2026-08-28",
      groups: [{ id: "1", groupName: "G1", hasArrived: true }],
    };
    const logPending: DailyLog = {
      date: "2026-08-28",
      groups: [{ id: "1", groupName: "G1", hasArrived: false }],
    };
    expect(logMatchesArrivalFilter(logArrived, "arrived")).toBe(true);
    expect(logMatchesArrivalFilter(logPending, "arrived")).toBe(false);
    expect(logMatchesArrivalFilter(logPending, "not_arrived")).toBe(true);
  });

  it("detects any data presence including custom activities and novedades", () => {
    const logEmpty = emptyLog("2026-08-28");
    expect(logHasAnyData(logEmpty)).toBe(false);

    const logCustomActs: DailyLog = {
      date: "2026-08-28",
      customActivities: [{ id: "ca1", name: "Patrullaje", value: "3" }],
    };
    expect(logHasAnyData(logCustomActs)).toBe(true);
  });
});

describe("FeatureLogBook - Merge Engine", () => {
  it("merges custom activities combining counts and deduplicating descriptions", () => {
    const listA = [
      { id: "1", name: "Inspección", value: "3", description: "Zona Norte" },
      { id: "2", name: "Guardia", value: "1" },
    ];
    const listB = [
      { id: "3", name: "inspección", value: "2", description: "Zona Sur" },
      { id: "4", name: "Entrega de Agua", value: "100L" },
    ];
    const merged = mergeCustomActivities(listA, listB);
    expect(merged.length).toBe(3);

    const insp = merged.find((x) => x.name.toLowerCase() === "inspección");
    expect(insp?.value).toBe("5");
    expect(insp?.description).toContain("Zona Norte");
    expect(insp?.description).toContain("Zona Sur");
  });

  it("merges multiple daily logs preserving department context and combining stats", () => {
    const log1: DailyLog = {
      date: "2026-08-28",
      department: "pc",
      rescuedCount: "2",
      groups: [{ id: "g1", groupName: "Equipo PC" }],
    };
    const log2: DailyLog = {
      date: "2026-08-28",
      department: "bomberos",
      rescuedCount: "3",
      groups: [{ id: "g2", groupName: "Equipo Bomberos" }],
    };
    const merged = mergeLogs([log1, log2]);
    expect(merged).not.toBeNull();
    expect(merged?.rescuedCount).toBe("5");
    expect(merged?.groups?.length).toBe(2);
    expect(merged?.groups?.[0].department).toBe("pc");
    expect(merged?.groups?.[1].department).toBe("bomberos");
  });
});

describe("FeatureLogBook - Spatial Polygon Aggregation", () => {
  it("aggregates polygon own stats, groups, and contained points deduplicating commissions", () => {
    const polyLog: Partial<DailyLog> = {
      rescuedCount: "1",
      customActivities: [{ id: "c1", name: "Puesto de Mando", value: "1" }],
    };
    const polyGroups = [
      { id: "g1", groupName: "Comando Conjunto", commissionId: "comm_1", prehospitalCareCount: "4" },
    ];
    const containedWithLogs = [
      {
        point: { id: 10, title: "Punto 1", type: "point" as const },
        log: {
          groups: [{ id: "g2", groupName: "Comando Conjunto", commissionId: "comm_1", prehospitalCareCount: "4", rescuedCount: "3" }],
          customActivities: [{ id: "c2", name: "Evacuación", value: "5" }],
        },
      },
    ];

    const aggregated = aggregatePolygonLog(polyLog, polyGroups as any, containedWithLogs as any);
    expect(aggregated._hasData).toBe(true);
    // rescuedCount: 1 (poly) + 3 (point) = 4
    expect(aggregated.rescuedCount).toBe("4");
    // prehospitalCareCount: deduplicated across comm_1 = 4
    expect(aggregated.prehospitalCareCount).toBe("4");
    expect(aggregated.customActivities?.length).toBe(2);
  });
});

describe("FeatureLogBook - Database Serialization (toDatabaseRow / fromDatabaseRow)", () => {
  it("serializes DailyLog with custom activities and deserializes faithfully", () => {
    const log: DailyLog = {
      date: "2026-08-28",
      department: "pc",
      rescuedCount: "4",
      recoveredCount: "1",
      observations: "Todo en orden",
      groups: [{ id: "g1", groupName: "Rescate 1", officersCount: "5" }],
      customActivities: [{ id: "act1", name: "Guardia", value: "2", description: "Puesto 1" }],
    };

    const row = toDatabaseRow(42, log);
    expect(row.feature_id).toBe("42");
    expect(row.rescued_count).toBe("4");
    expect(row.department).toBe("pc");

    const deserialized = fromDatabaseRow(row);
    expect(deserialized.date).toBe("2026-08-28");
    expect(deserialized.rescuedCount).toBe("4");
    expect(deserialized.groups?.[0]?.groupName).toBe("Rescate 1");
    expect(deserialized.customActivities?.length).toBe(1);
    expect(deserialized.customActivities?.[0]?.name).toBe("Guardia");
  });
});
