import { typeLabel, symbolForType, makeSymbols, formatFeatureLabelText } from "../utils/mapUtils";

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
    expect(typeLabel("anything")).toBe("Punto");
  });
});

describe("symbolForType", () => {
  it("returns simple-marker for point", () => {
    const sym = symbolForType("point", "#ff0000");
    expect(sym.type).toBe("simple-marker");
  });

  it("returns simple-line for polyline", () => {
    const sym = symbolForType("polyline", "#ff0000");
    expect(sym.type).toBe("simple-line");
  });

  it("returns simple-fill for polygon", () => {
    const sym = symbolForType("polygon", "#ff0000");
    expect(sym.type).toBe("simple-fill");
  });
});

describe("makeSymbols", () => {
  it("returns objects with correct types and color arrays", () => {
    const syms = makeSymbols([255, 0, 0]);

    expect(syms.point.type).toBe("simple-marker");
    expect(syms.point.color).toEqual([255, 0, 0, 0.9]);

    expect(syms.polyline.type).toBe("simple-line");
    expect(syms.polyline.color).toEqual([255, 0, 0, 0.95]);

    expect(syms.polygon.type).toBe("simple-fill");
    expect(syms.polygon.color).toEqual([255, 0, 0, 0.25]);
    expect(syms.polygon.outline.color).toEqual([255, 0, 0, 0.95]);
  });
});

describe("formatFeatureLabelText", () => {
  it("shows group name and unit when point has <= 2 groups", () => {
    const feat = {
      id: 1,
      title: "Punto Alpha",
      type: "point",
      dailyLogs: [
        {
          date: "2026-07-24",
          groupName: "Grupo 1",
          unitOut: "Unidad A",
          groupName2: "Grupo 2",
          unitOut2: "Unidad B",
        },
      ],
    } as any;

    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toBe("Punto Alpha (Grupo 1, Unidad A | Grupo 2, Unidad B)");
  });

  it("shows ONLY group names when point has > 2 groups", () => {
    const feat = {
      id: 2,
      title: "Punto Bravo",
      type: "point",
      dailyLogs: [
        {
          date: "2026-07-24",
          groupName: "Grupo 1",
          unitOut: "Unidad A",
          groupName2: "Grupo 2",
          unitOut2: "Unidad B",
          groupName3: "Grupo 3",
          unitOut3: "Unidad C",
        },
      ],
    } as any;

    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toBe("Punto Bravo (Grupo 1 | Grupo 2 | Grupo 3)");
  });

  it("includes Colapsado tag when feature isCollapsed is true", () => {
    const feat = {
      id: 3,
      title: "Residencias Las Palmas",
      type: "point",
      isCollapsed: true,
      collapsedCount: "2",
      dailyLogs: [],
    } as any;

    const labelStr = formatFeatureLabelText(feat, "2026-07-24");
    expect(labelStr).toBe("Residencias Las Palmas (Colapsado: 2)");
  });
});
