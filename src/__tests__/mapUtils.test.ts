import { describe, it, expect, vi, beforeEach } from "vitest";
import { typeLabel, symbolForType, makeSymbols, formatFeatureLabelText, getLabelText, getBasemapValue, DEFAULT_CENTER, DEFAULT_ZOOM } from "../utils/mapUtils";

describe("typeLabel", () => {
  it("returns 'Poligono' for polygon", () => {
    expect(typeLabel("polygon")).toBe("Poligono");
  });

  it("returns 'Linea' for polyline", () => {
    expect(typeLabel("polyline")).toBe("Linea");
  });

  it("returns 'Punto' for point", () => {
    expect(typeLabel("point")).toBe("Punto");
  });

  it("returns 'Punto' as default for unknown type", () => {
    expect(typeLabel("unknown")).toBe("Punto");
  });
});

describe("symbolForType", () => {
  it("returns simple-marker for point", () => {
    const sym = symbolForType("point", "#3b82f6");
    expect(sym.type).toBe("simple-marker");
  });

  it("returns simple-line for polyline", () => {
    const sym = symbolForType("polyline", "#3b82f6");
    expect(sym.type).toBe("simple-line");
  });

  it("returns simple-fill for polygon", () => {
    const sym = symbolForType("polygon", "#3b82f6");
    expect(sym.type).toBe("simple-fill");
  });
});

describe("makeSymbols", () => {
  it("returns objects with correct types and color arrays", () => {
    const syms = makeSymbols([59, 130, 246]);
    expect(syms.point.type).toBe("simple-marker");
    expect(syms.point.color).toEqual([59, 130, 246, 0.9]);
    expect(syms.polyline.type).toBe("simple-line");
    expect(syms.polygon.type).toBe("simple-fill");
  });
});

describe("formatFeatureLabelText", () => {
  it("shows group name and unit when point has <= 2 groups", () => {
    const feat = {
      id: 1,
      title: "Punto Alpha",
      type: "point",
      dailyLogs: [{
        date: "2026-07-24",
        groups: [
          { id: "g1", groupName: "Grupo 1", unitOut: "Unidad A" },
          { id: "g2", groupName: "Grupo 2", unitOut: "Unidad B" },
        ],
      }],
    } as any;

    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toContain("Grupo 1, Unidad A");
    expect(labelStr).toContain("Grupo 2, Unidad B");
  });

  it("shows ONLY group names when point has > 2 groups", () => {
    const feat = {
      id: 2,
      title: "Punto Bravo",
      type: "point",
      dailyLogs: [{
        date: "2026-07-24",
        groups: [
          { id: "g1", groupName: "Grupo 1" },
          { id: "g2", groupName: "Grupo 2" },
          { id: "g3", groupName: "Grupo 3" },
        ],
      }],
    } as any;

    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toContain("Grupo 1");
    expect(labelStr).toContain("Grupo 2");
    expect(labelStr).toContain("Grupo 3");
  });

  it("returns title without adding overlay labels when point has no personnel logs", () => {
    const feat = {
      id: 3,
      title: "Punto Charlie",
      type: "point",
      dailyLogs: [{
        date: "2026-07-24",
        groups: [],
      }],
    } as any;
    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toBe("Punto Charlie");
  });

  it("includes rescued and recovered counts in label", () => {
    const feat = {
      id: 4,
      title: "Punto Delta",
      type: "point",
      dailyLogs: [{
        date: "2026-07-24",
        groups: [
          { id: "g1", groupName: "Grupo 1", rescuedCount: "3", recoveredCount: "1" },
        ],
      }],
    } as any;
    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toContain("3 Resc.");
    expect(labelStr).toContain("1 Recup.");
  });

  it("filters by activeDepartment", () => {
    const feat = {
      id: 5,
      title: "Punto B",
      type: "point",
      dailyLogs: [
        { date: "2026-07-24", department: "pc", groups: [{ id: "g1", groupName: "PC Group" }] },
        { date: "2026-07-24", department: "bomberos", groups: [{ id: "g1", groupName: "Bomberos Group" }] },
      ],
    } as any;
    const labelPc = formatFeatureLabelText(feat, "2026-07-24", "pc");
    expect(labelPc).toContain("PC Group");
    expect(labelPc).not.toContain("Bomberos Group");
  });
});

describe("getLabelText", () => {
  it("delegates to formatFeatureLabelText with date", () => {
    const feat = {
      id: 6,
      title: "Test",
      type: "point",
      dailyLogs: [{
        date: "2026-07-24",
        groups: [{ id: "g1", groupName: "G1" }],
      }],
    } as any;
    const label = getLabelText(feat, "2026-07-24");
    expect(label).toContain("G1");
  });

  it("uses current date when no dateStr provided", () => {
    const feat = {
      id: 6,
      title: "Test",
      type: "point",
      dailyLogs: [],
    } as any;
    const label = getLabelText(feat);
    expect(label).toBe("Test");
  });
});

describe("getBasemapValue", () => {
  it("returns string for non-satellite keys", () => {
    expect(typeof getBasemapValue("dark-gray-vector")).toBe("string");
  });

  it("returns Basemap object for satellite-free", () => {
    const bm = getBasemapValue("satellite-free");
    expect(bm).not.toBeNull();
  });
});

describe("DEFAULT_CENTER and DEFAULT_ZOOM", () => {
  it("DEFAULT_CENTER is a [lon, lat] tuple", () => {
    expect(Array.isArray(DEFAULT_CENTER)).toBe(true);
    expect(DEFAULT_CENTER.length).toBe(2);
  });

  it("DEFAULT_ZOOM is a positive number", () => {
    expect(DEFAULT_ZOOM).toBeGreaterThan(0);
  });
});
