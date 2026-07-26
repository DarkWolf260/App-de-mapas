import {
  getMetricValue,
  getMetricNumeric,
  hasAnyMetric,
  formatCoordFromFeature,
  formatCoordinates,
  getCoordLabel,
  getGroupColor,
  METRIC_FIELDS,
  GROUP_COLORS,
  COMMISSION_INDEPENDENT,
} from "../components/popup/metricFields";

describe("getGroupColor", () => {
  it("returns correct color for index 0", () => {
    expect(getGroupColor(0)).toBe(GROUP_COLORS[0]);
  });

  it("wraps around using modulo", () => {
    expect(getGroupColor(GROUP_COLORS.length)).toBe(GROUP_COLORS[0]);
    expect(getGroupColor(GROUP_COLORS.length + 1)).toBe(GROUP_COLORS[1]);
  });
});

describe("getMetricValue", () => {
  it("returns field value from DailyLog", () => {
    const log = { rescuedCount: "5", recoveredCount: "3" };
    expect(getMetricValue(log, "rescuedCount")).toBe("5");
    expect(getMetricValue(log, "recoveredCount")).toBe("3");
  });

  it("returns empty string when field is missing", () => {
    expect(getMetricValue({}, "rescuedCount")).toBe("");
  });

  it("returns empty string when field is falsy", () => {
    expect(getMetricValue({ rescuedCount: "" }, "rescuedCount")).toBe("");
  });
});

describe("getMetricNumeric", () => {
  it("parses numeric string to number", () => {
    expect(getMetricNumeric({ rescuedCount: "7" }, "rescuedCount")).toBe(7);
  });

  it("returns 0 for empty/missing values", () => {
    expect(getMetricNumeric({}, "rescuedCount")).toBe(0);
    expect(getMetricNumeric({ rescuedCount: "" }, "rescuedCount")).toBe(0);
    expect(getMetricNumeric({ rescuedCount: "abc" }, "rescuedCount")).toBe(0);
  });
});

describe("hasAnyMetric", () => {
  it("returns false when all metrics are empty or 0", () => {
    expect(hasAnyMetric({})).toBe(false);
    expect(hasAnyMetric({ rescuedCount: "0", recoveredCount: "0" })).toBe(false);
  });

  it("returns true when any metric is non-zero", () => {
    expect(hasAnyMetric({ rescuedCount: "1" })).toBe(true);
    expect(hasAnyMetric({ transfersCount: "5" })).toBe(true);
  });
});

describe("formatCoordFromFeature", () => {
  it("returns null when no geojsonGeometry", () => {
    expect(formatCoordFromFeature({ type: "point" })).toBeNull();
  });

  it("extracts lat/lon from point geometry", () => {
    const feat = { type: "point", geojsonGeometry: { coordinates: [-66.9, 10.6] } };
    expect(formatCoordFromFeature(feat)).toEqual({ lat: 10.6, lon: -66.9 });
  });

  it("extracts first coordinate from polyline", () => {
    const feat = { type: "polyline", geojsonGeometry: { coordinates: [[-66.9, 10.6], [-66.8, 10.7]] } };
    expect(formatCoordFromFeature(feat)).toEqual({ lat: 10.6, lon: -66.9 });
  });

  it("extracts first ring coordinate from polygon", () => {
    const feat = { type: "polygon", geojsonGeometry: { coordinates: [[[-66.9, 10.6], [-66.8, 10.6], [-66.8, 10.7], [-66.9, 10.6]]] } };
    expect(formatCoordFromFeature(feat)).toEqual({ lat: 10.6, lon: -66.9 });
  });

  it("returns null for unsupported type", () => {
    expect(formatCoordFromFeature({ type: "unknown", geojsonGeometry: { coordinates: [] } })).toBeNull();
  });
});

describe("formatCoordinates", () => {
  it("returns formatted string for point", () => {
    const feat = { type: "point", geojsonGeometry: { coordinates: [-66.9303, 10.6011] } };
    expect(formatCoordinates(feat)).toBe("10.601100, -66.930300");
  });

  it("returns 'Sin coordenadas' when no geometry", () => {
    expect(formatCoordinates({ type: "point" })).toBe("Sin coordenadas");
  });
});

describe("getCoordLabel", () => {
  it("returns correct labels per type", () => {
    expect(getCoordLabel({ type: "point" })).toBe("Ubicación");
    expect(getCoordLabel({ type: "polyline" })).toBe("Punto inicial");
    expect(getCoordLabel({ type: "polygon" })).toBe("Primer vértice");
    expect(getCoordLabel({ type: "unknown" })).toBe("Coordenadas");
  });
});

describe("constants", () => {
  it("METRIC_FIELDS has 5 entries", () => {
    expect(METRIC_FIELDS.length).toBe(5);
  });

  it("GROUP_COLORS has entries", () => {
    expect(GROUP_COLORS.length).toBeGreaterThan(0);
  });

  it("COMMISSION_INDEPENDENT is 'independiente'", () => {
    expect(COMMISSION_INDEPENDENT).toBe("independiente");
  });
});
