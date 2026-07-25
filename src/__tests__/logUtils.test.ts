import {
  formatDateFriendly,
  emptyLog,
  getTotalPersonnel,
  logHasPersonnel,
  logIsArrived,
  logMatchesArrivalFilter,
  logHasAnyData,
  getGroupData,
  REPORT_START_DATE,
} from "../utils/logUtils";
import type { DailyLog } from "../types";

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
    expect(log.groupName).toBe("");
    expect(log.managerName).toBe("");
    expect(log.officersCount).toBe("");
    expect(log.hasArrivedG1).toBe(false);
    expect(log.hasArrivedG2).toBe(false);
    expect(log.observations).toBe("");
  });
});

describe("getTotalPersonnel", () => {
  it("sums officersCount and officersCount2", () => {
    const log = emptyLog("2026-07-15");
    log.officersCount = "5";
    log.officersCount2 = "3";
    expect(getTotalPersonnel(log)).toBe(8);
  });

  it("returns 0 for empty counts", () => {
    expect(getTotalPersonnel(emptyLog("2026-07-15"))).toBe(0);
  });
});

describe("logHasPersonnel", () => {
  it("returns true when officersCount > 0", () => {
    const log = emptyLog("2026-07-15");
    log.officersCount = "5";
    expect(logHasPersonnel(log)).toBe(true);
  });

  it("returns false when all counts are 0/empty", () => {
    expect(logHasPersonnel(emptyLog("2026-07-15"))).toBe(false);
  });
});

describe("logIsArrived", () => {
  it("returns true when hasArrivedG1 is true", () => {
    const log = emptyLog("2026-07-15");
    log.groupName = "Alpha";
    log.hasArrivedG1 = true;
    expect(logIsArrived(log)).toBe(true);
  });

  it("returns true when hasArrivedG2 is true", () => {
    const log = emptyLog("2026-07-15");
    log.groupName2 = "Beta";
    log.hasArrivedG2 = true;
    expect(logIsArrived(log)).toBe(true);
  });

  it("returns false when neither group has arrived", () => {
    expect(logIsArrived(emptyLog("2026-07-15"))).toBe(false);
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
    const log = emptyLog("2026-07-15");
    log.groupName = "Alpha";
    log.hasArrivedG1 = true;
    expect(logMatchesArrivalFilter(log, "arrived")).toBe(true);
  });
});

describe("logHasAnyData", () => {
  it("returns true when groupName is set", () => {
    const log = emptyLog("2026-07-15");
    log.groupName = "Alpha";
    expect(logHasAnyData(log)).toBe(true);
  });

  it("returns false when all fields empty", () => {
    expect(logHasAnyData(emptyLog("2026-07-15"))).toBe(false);
  });
});

describe("getGroupData", () => {
  it("returns group 1 fields correctly", () => {
    const log = emptyLog("2026-07-15");
    log.groupName = "Alpha";
    log.managerName = "Juan";
    log.officersCount = "5";
    const data = getGroupData(log, 1);
    expect(data.groupName).toBe("Alpha");
    expect(data.managerName).toBe("Juan");
    expect(data.officersCount).toBe("5");
  });

  it("returns group 2 fields correctly", () => {
    const log = emptyLog("2026-07-15");
    log.groupName2 = "Beta";
    log.managerName2 = "Maria";
    log.officersCount2 = "3";
    const data = getGroupData(log, 2);
    expect(data.groupName).toBe("Beta");
    expect(data.managerName).toBe("Maria");
    expect(data.officersCount).toBe("3");
  });
});

describe("REPORT_START_DATE", () => {
  it("is '2026-06-24'", () => {
    expect(REPORT_START_DATE).toBe("2026-06-24");
  });
});
