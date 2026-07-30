import type { DrawnFeature } from "../types";
import { getDashboardStats } from "../utils/dashboardStats";

function makeFeature(overrides: Partial<DrawnFeature>): DrawnFeature {
  return {
    id: 1,
    title: "Punto 1",
    type: "point",
    geojsonGeometry: { type: "Point", coordinates: [-66.9, 10.6] },
    ...overrides,
  };
}

describe("getDashboardStats", () => {
  const date = "2026-07-29";

  it("returns zeros when there is no data", () => {
    const stats = getDashboardStats([], date);
    expect(stats.totalTeams).toBe(0);
    expect(stats.totalPersonnel).toBe(0);
    expect(stats.totalRecovered).toBe(0);
    expect(stats.totalEdan).toBe(0);
    expect(stats.pc.recoveryAreas).toEqual([]);
  });

  it("counts unique teams, personnel and edan per department", () => {
    const features: DrawnFeature[] = [
      makeFeature({
        id: 1,
        title: "Base A",
        dailyLogs: [
          {
            date,
            department: "pc",
            groups: [
              { id: "g1", groupName: "Alpha", officersCount: "5", edanCount: "3" },
              { id: "g2", groupName: "Beta", officersCount: "4", edanCount: "2" },
            ],
          },
          {
            date,
            department: "bomberos",
            groups: [{ id: "g3", groupName: "Gamma", officersCount: "6", edanCount: "1" }],
          },
        ],
      }),
      makeFeature({
        id: 2,
        title: "Base B",
        dailyLogs: [
          {
            date,
            department: "pc",
            // "alpha" duplicates "Alpha" (case-insensitive) -> same team
            groups: [{ id: "g4", groupName: "alpha", officersCount: "2" }],
          },
        ],
      }),
    ];

    const stats = getDashboardStats(features, date);
    expect(stats.pc.teamsCount).toBe(3);
    expect(stats.pc.teams).toEqual([{ name: "Alpha", count: 2 }, { name: "Beta", count: 1 }]);
    expect(stats.pc.personnel).toBe(11);
    expect(stats.pc.edan).toBe(5);
    expect(stats.bomberos.teamsCount).toBe(1);
    expect(stats.bomberos.teams).toEqual([{ name: "Gamma", count: 1 }]);
    expect(stats.bomberos.personnel).toBe(6);
    expect(stats.bomberos.edan).toBe(1);
    expect(stats.totalTeams).toBe(4);
    expect(stats.totalPersonnel).toBe(17);
    expect(stats.totalEdan).toBe(6);
  });

  it("ignores logs from other dates", () => {
    const features: DrawnFeature[] = [
      makeFeature({
        dailyLogs: [
          { date: "2026-07-28", department: "pc", groups: [{ id: "g1", groupName: "Ayer", officersCount: "9" }] },
        ],
      }),
    ];
    const stats = getDashboardStats(features, date);
    expect(stats.totalTeams).toBe(0);
    expect(stats.totalPersonnel).toBe(0);
  });

  it("treats logs without department as pc", () => {
    const features: DrawnFeature[] = [
      makeFeature({
        dailyLogs: [{ date, groups: [{ id: "g1", groupName: "SinDept", officersCount: "3" }] }],
      }),
    ];
    const stats = getDashboardStats(features, date);
    expect(stats.pc.teamsCount).toBe(1);
    expect(stats.bomberos.teamsCount).toBe(0);
  });

  it("de-duplicates recovered bodies within a joint commission and lists recovery areas", () => {
    const features: DrawnFeature[] = [
      makeFeature({
        id: 10,
        title: "Zona Colapsada",
        dailyLogs: [
          {
            date,
            department: "pc",
            groups: [
              { id: "g1", groupName: "Alpha", recoveredCount: "4", commissionId: "comision_1" },
              { id: "g2", groupName: "Beta", recoveredCount: "4", commissionId: "comision_1" },
            ],
          },
          {
            date,
            department: "bomberos",
            recoveredCount: "2",
          },
        ],
      }),
    ];

    const stats = getDashboardStats(features, date);
    // Same commission reports 4 twice -> counted once
    expect(stats.pc.recovered).toBe(4);
    expect(stats.bomberos.recovered).toBe(2);
    expect(stats.totalRecovered).toBe(6);
    expect(stats.pc.recoveryAreas).toEqual([{ featureId: 10, title: "Zona Colapsada", count: 4 }]);
    expect(stats.bomberos.recoveryAreas).toEqual([{ featureId: 10, title: "Zona Colapsada", count: 2 }]);
  });
});
