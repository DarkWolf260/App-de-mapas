import {
  formatDateFriendly,
  emptyLog,
  getTotalPersonnel,
  logHasPersonnel,
  logIsArrived,
  logMatchesArrivalFilter,
  logHasAnyData,
  getGroupData,
  splitGroupNames,
  getDatesRange,
  getNormalizedGroupList,
  getDayStats,
  featureMatchesSearch,
  isSectorFeature,
  REPORT_START_DATE,
  mergeCustomActivities,
} from "../utils/logUtils";

describe("formatDateFriendly", () => {
  it("returns '15 Jul' for 2026-07-15", () => {
    expect(formatDateFriendly("2026-07-15")).toBe("15 Jul");
  });

  it("returns '01 Ene' for 2026-01-01", () => {
    expect(formatDateFriendly("2026-01-01")).toBe("01 Ene");
  });

  it("returns the input for invalid format", () => {
    expect(formatDateFriendly("invalid")).toBe("invalid");
  });
});

describe("emptyLog", () => {
  it("returns a DailyLog with date set and all fields empty/false", () => {
    const log = emptyLog("2026-07-15");
    expect(log.date).toBe("2026-07-15");
    expect(log.groups).toEqual([]);
    expect(log.observations).toBe("");
  });
});

describe("getTotalPersonnel", () => {
  it("sums officersCount from groups array", () => {
    const log = emptyLog("2026-07-15");
    log.groups = [
      { id: "g1", groupName: "Alpha", officersCount: "5" },
      { id: "g2", groupName: "Beta", officersCount: "3" },
    ];
    expect(getTotalPersonnel(log)).toBe(8);
  });

  it("returns 0 for empty counts", () => {
    expect(getTotalPersonnel(emptyLog("2026-07-15"))).toBe(0);
  });
});

describe("logHasPersonnel", () => {
  it("returns true when officersCount > 0", () => {
    const log = emptyLog("2026-07-15");
    log.groups = [{ id: "g1", groupName: "Alpha", officersCount: "5" }];
    expect(logHasPersonnel(log)).toBe(true);
  });

  it("returns false when all counts are 0/empty", () => {
    expect(logHasPersonnel(emptyLog("2026-07-15"))).toBe(false);
  });
});

describe("logIsArrived", () => {
  it("returns true when group has arrived", () => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const log = emptyLog(todayStr);
    log.groups = [{ id: "g1", groupName: "Alpha", hasArrived: true }];
    expect(logIsArrived(log)).toBe(true);
  });

  it("returns false when group has not arrived and is within 48h", () => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const log = emptyLog(todayStr);
    log.groups = [{ id: "g1", groupName: "Alpha", hasArrived: false }];
    expect(logIsArrived(log)).toBe(false);
  });

  it("returns true automatically when group is older than 48h", () => {
    const oldLog = emptyLog("2026-01-01");
    oldLog.groups = [{ id: "g1", groupName: "Alpha", hasArrived: false }];
    expect(logIsArrived(oldLog)).toBe(true);
  });
});

describe("logMatchesArrivalFilter", () => {
  it("returns true for undefined log with 'all' filter", () => {
    expect(logMatchesArrivalFilter(undefined, "all")).toBe(true);
  });

  it("returns false for undefined log with 'arrived' filter", () => {
    expect(logMatchesArrivalFilter(undefined, "arrived")).toBe(false);
  });

  it("returns true for arrived log with 'arrived' filter", () => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const log = emptyLog(todayStr);
    log.groups = [{ id: "g1", groupName: "Alpha", hasArrived: true }];
    expect(logMatchesArrivalFilter(log, "arrived")).toBe(true);
  });
});

describe("logHasAnyData", () => {
  it("returns true when groupName is set", () => {
    const log = emptyLog("2026-07-15");
    log.groups = [{ id: "g1", groupName: "Alpha" }];
    expect(logHasAnyData(log)).toBe(true);
  });

  it("returns false when all fields empty", () => {
    expect(logHasAnyData(emptyLog("2026-07-15"))).toBe(false);
  });
});

describe("getGroupData", () => {
  it("returns group 1 fields correctly", () => {
    const log = emptyLog("2026-07-15");
    log.groups = [
      { id: "g1", groupName: "Alpha", managerName: "Juan", officersCount: "5" },
    ];
    const data = getGroupData(log, 1);
    expect(data.groupName).toBe("Alpha");
    expect(data.managerName).toBe("Juan");
    expect(data.officersCount).toBe("5");
  });

  it("returns group 2 fields correctly", () => {
    const log = emptyLog("2026-07-15");
    log.groups = [
      { id: "g1", groupName: "Alpha", officersCount: "5" },
      { id: "g2", groupName: "Beta", managerName: "Maria", officersCount: "3" },
    ];
    const data = getGroupData(log, 2);
    expect(data.groupName).toBe("Beta");
    expect(data.managerName).toBe("Maria");
    expect(data.officersCount).toBe("3");
  });
});

describe("splitGroupNames", () => {
  it("splits compound names joined by 'y' or '/'", () => {
    expect(splitGroupNames("REDAN Los Llanos y PC Miranda")).toEqual(["REDAN Los Llanos", "PC Miranda"]);
    expect(splitGroupNames("PC Nva. Esparta y La Guaira")).toEqual(["PC Nva. Esparta", "La Guaira"]);
    expect(splitGroupNames("PC Lara / PC Zulia")).toEqual(["PC Lara", "PC Zulia"]);
    expect(splitGroupNames("Unidad de Avanzada")).toEqual(["Unidad de Avanzada"]);
  });
});

describe("REPORT_START_DATE", () => {
  it("is '2026-06-24'", () => {
    expect(REPORT_START_DATE).toBe("2026-06-24");
  });
});

describe("getDatesRange", () => {
  it("returns array from start to today in reverse chronological order", () => {
    const today = new Date().toLocaleDateString("en-CA");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString("en-CA");
    const range = getDatesRange(yesterdayStr);
    expect(range[0]).toBe(today);
    expect(range[1]).toBe(yesterdayStr);
    expect(range.length).toBe(2);
  });

  it("returns single-element array when start is today", () => {
    const today = new Date().toLocaleDateString("en-CA");
    const range = getDatesRange(today);
    expect(range).toEqual([today]);
  });

  it("returns empty array when start is after today", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString("en-CA");
    const range = getDatesRange(tomorrowStr);
    expect(range).toEqual([]);
  });
});

describe("getNormalizedGroupList", () => {
  it("returns empty array for undefined log", () => {
    expect(getNormalizedGroupList(undefined)).toEqual([]);
  });

  it("returns empty array for empty log with no data", () => {
    const log = emptyLog("2026-07-15");
    expect(getNormalizedGroupList(log)).toEqual([]);
  });

  it("reads groups from groups array", () => {
    const log = {
      date: "2026-07-15",
      groups: [
        { id: "g1", groupName: "PC La Guaira", officersCount: "10" },
        { id: "g2", groupName: "Bomberos", officersCount: "5" },
      ],
    } as any;
    const groups = getNormalizedGroupList(log);
    expect(groups.length).toBe(2);
    expect(groups[0].groupName).toBe("PC La Guaira");
    expect(groups[0].officersCount).toBe("10");
    expect(groups[1].groupName).toBe("Bomberos");
    expect(groups[1].officersCount).toBe("5");
  });

  it("reads metrics from groups array", () => {
    const log = {
      date: "2026-07-15",
      groups: [
        { id: "g1", groupName: "Alpha", officersCount: "8", rescuedCount: "3", recoveredCount: "1", hasArrived: true },
        { id: "g2", groupName: "Bravo", officersCount: "4", rescuedCount: "2" },
      ],
    } as any;
    const groups = getNormalizedGroupList(log);
    expect(groups.length).toBe(2);
    expect(groups[0].groupName).toBe("Alpha");
    expect(groups[0].rescuedCount).toBe("3");
    expect(groups[0].hasArrived).toBe(true);
  });

  it("expands compound names into multiple entries", () => {
    const log = {
      date: "2026-07-15",
      groups: [{ id: "g1", groupName: "PC Lara y PC Zulia", officersCount: "6" }],
    } as any;
    const groups = getNormalizedGroupList(log);
    expect(groups.length).toBe(2);
    expect(groups[0].groupName).toBe("PC Lara");
    expect(groups[1].groupName).toBe("PC Zulia");
    expect(groups[0].commissionId).toBe("comision_1");
  });
});

describe("featureMatchesSearch", () => {
  const pt = {
    title: "Residencias Las Palmas",
    dailyLogs: [
      {
        date: "2026-07-15",
        groups: [{ id: "g1", groupName: "PC La Guaira", managerName: "Juan Perez", unitOut: "U-12" }],
        observations: "evacuacion",
      },
    ],
  };

  it("returns true for empty query", () => {
    expect(featureMatchesSearch(pt, "", "2026-07-15")).toBe(true);
  });

  it("matches by title", () => {
    expect(featureMatchesSearch(pt, "palmas", "2026-07-15")).toBe(true);
  });

  it("matches by groupName in groups array", () => {
    expect(featureMatchesSearch(pt, "la guaira", "2026-07-15")).toBe(true);
  });

  it("matches by managerName in groups array", () => {
    expect(featureMatchesSearch(pt, "juan", "2026-07-15")).toBe(true);
  });

  it("matches by observations", () => {
    expect(featureMatchesSearch(pt, "evacuacion", "2026-07-15")).toBe(true);
  });

  it("returns false when no match", () => {
    expect(featureMatchesSearch(pt, "xyz123", "2026-07-15")).toBe(false);
  });

  it("returns false when log date does not match", () => {
    expect(featureMatchesSearch(pt, "guaira", "2026-99-99")).toBe(false);
  });
});

describe("isSectorFeature", () => {
  it("returns true for polygon type", () => {
    expect(isSectorFeature({ type: "polygon" })).toBe(true);
  });

  it("returns true for polyline type", () => {
    expect(isSectorFeature({ type: "polyline" })).toBe(true);
  });

  it("returns true for area type", () => {
    expect(isSectorFeature({ type: "area" })).toBe(true);
  });

  it("returns false for point type", () => {
    expect(isSectorFeature({ type: "point" })).toBe(false);
  });

  it("returns true for geojsonGeometry with Polygon type", () => {
    expect(isSectorFeature({ geojsonGeometry: { type: "Polygon" } })).toBe(true);
  });

  it("returns false for geojsonGeometry with Point type", () => {
    expect(isSectorFeature({ geojsonGeometry: { type: "Point" } })).toBe(false);
  });

  it("returns false for null/undefined", () => {
    expect(isSectorFeature(null as any)).toBe(false);
    expect(isSectorFeature(undefined as any)).toBe(false);
  });
});

describe("getDayStats", () => {
  it("returns zeros for no features", () => {
    const stats = getDayStats([], "2026-07-15");
    expect(stats.totalPersonnel).toBe(0);
    expect(stats.totalRescued).toBe(0);
    expect(stats.activePoints).toBe(0);
  });

  it("counts active points with data", () => {
    const features = [
      {
        dailyLogs: [
          { date: "2026-07-15", groups: [{ id: "g1", groupName: "Alpha", officersCount: "5", rescuedCount: "2" }] },
        ],
      },
      {
        dailyLogs: [
          { date: "2026-07-15", groups: [{ id: "g1", groupName: "Bravo", officersCount: "3" }] },
        ],
      },
    ];
    const stats = getDayStats(features as any, "2026-07-15");
    expect(stats.activePoints).toBe(2);
    expect(stats.totalPersonnel).toBe(8);
  });

  it("ignores logs with no data", () => {
    const features = [
      {
        dailyLogs: [
          { date: "2026-07-15", groups: [] },
        ],
      },
    ];
    const stats = getDayStats(features as any, "2026-07-15");
    expect(stats.activePoints).toBe(0);
  });

  it("filters by department", () => {
    const features = [
      {
        dailyLogs: [
          { date: "2026-07-15", department: "pc", groups: [{ id: "g1", groupName: "Alpha", officersCount: "5" }] },
        ],
      },
      {
        dailyLogs: [
          { date: "2026-07-15", department: "bomberos", groups: [{ id: "g1", groupName: "Bravo", officersCount: "3" }] },
        ],
      },
    ];
    const stats = getDayStats(features as any, "2026-07-15", "pc");
    expect(stats.activePoints).toBe(1);
    expect(stats.totalPersonnel).toBe(5);
  });

  it("counts groupsArrived", () => {
    const features = [
      {
        dailyLogs: [
          { date: "2026-07-15", groups: [{ id: "g1", groupName: "Alpha", officersCount: "5", hasArrived: true }] },
        ],
      },
    ];
    const stats = getDayStats(features as any, "2026-07-15");
    expect(stats.groupsArrived).toBe(1);
  });
});

describe("mergeCustomActivities", () => {
  it("combines custom activities and sums numeric values", () => {
    const listA = [{ id: "1", name: "Inspecciones", value: "3", description: "Sector 1" }];
    const listB = [{ id: "2", name: "Inspecciones", value: "5", description: "Sector 2" }, { id: "3", name: "Despeje de vía", value: "2" }];
    const merged = mergeCustomActivities(listA, listB);
    expect(merged.length).toBe(2);
    const insp = merged.find((m: any) => m.name === "Inspecciones");
    expect(insp?.value).toBe("8");
    expect(insp?.description).toBe("Sector 1 • Sector 2");
  });
});
