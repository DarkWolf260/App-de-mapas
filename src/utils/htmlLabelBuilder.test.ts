import { describe, it, expect } from "vitest";
import { featureToLabelData, buildHtmlLabelString, buildAdaptiveLabelString, buildCompactPinString } from "./htmlLabelBuilder";
import type { DrawnFeature } from "../types";

describe("htmlLabelBuilder", () => {
  const sampleFeature: DrawnFeature = {
    id: "site-101",
    title: "Sitio Alfa",
    type: "point",
    color: "#38bdf8",
    geojsonGeometry: {
      type: "Point",
      coordinates: [-66.9, 10.5],
    },
    dailyLogs: [
      {
        date: "2026-03-24",
        department: "pc",
        rescuedCount: "2",
        recoveredCount: "1",
        rescuedPetsCount: "3",
        prehospitalCareCount: "4",
        transfersCount: "5",
        observations: "Operaciones en progreso",
        customActivities: [
          { id: "ca1", name: "Evacuaciones", value: "10", description: "Evacuaciones preventivas del sector sur" },
        ],
        groups: [
          {
            id: "g1",
            groupName: "Bravo 1",
            unitOut: "Móvil 04",
            hasArrived: true,
            rescuedCount: "2",
          },
        ],
      },
    ],
  };

  it("extracts complete statistics and custom activities from daily logs", () => {
    const labelData = featureToLabelData(sampleFeature, {}, "2026-03-24");
    expect(labelData).not.toBeNull();
    expect(labelData?.title).toBe("Sitio Alfa");
    expect(labelData?.rescuedCount).toBe(4); // 2 from group + 2 from top-level
    expect(labelData?.recoveredCount).toBe(1);
    expect(labelData?.rescuedPetsCount).toBe(3);
    expect(labelData?.prehospitalCount).toBe(4);
    expect(labelData?.transfersCount).toBe(5);
    expect(labelData?.teamNames).toContain("Bravo 1 - Móvil 04");
    expect(labelData?.customActivities).toHaveLength(1);
    expect(labelData?.customActivities?.[0].name).toBe("Evacuaciones");
    expect(labelData?.customActivities?.[0].value).toBe("10");
  });

  it("builds full HTML card with badges for stats and custom activities", () => {
    const labelData = featureToLabelData(sampleFeature, {}, "2026-03-24")!;
    const html = buildHtmlLabelString(labelData);

    expect(html).toContain("Resc. 4");
    expect(html).toContain("Recup. 1");
    expect(html).toContain("Masc. 3");
    expect(html).toContain("Atenc. 4");
    expect(html).toContain("Trasl. 5");
    expect(html).toContain("Evacuaciones: 10");
    expect(html).toContain("Evacuaciones preventivas del sector sur");
    expect(html).toContain("Bravo 1 - Móvil 04");
  });

  it("switches to compact pin at zoom < 16 and card at zoom >= 16", () => {
    const labelData = featureToLabelData(sampleFeature, {}, "2026-03-24")!;
    const pinHtml = buildAdaptiveLabelString(labelData, 15);
    const cardHtml = buildAdaptiveLabelString(labelData, 16);

    expect(pinHtml).toContain("custom-compact-pin-wrapper");
    expect(cardHtml).toContain("custom-html-label-card");
  });

  it("generates sector cards only for direct information added to the sector", () => {
    const emptySectorFeature: DrawnFeature = {
      id: "sector-1",
      title: "Sector A - Macuto",
      type: "polygon",
      color: "#f59e0b",
      geojsonGeometry: {
        type: "Polygon",
        coordinates: [
          [
            [-66.92, 10.58],
            [-66.88, 10.58],
            [-66.88, 10.62],
            [-66.92, 10.62],
            [-66.92, 10.58],
          ],
        ],
      },
    };

    // Sin bitácora directa, el sector no genera tarjeta propia (los puntos hijos ya tienen sus etiquetas)
    const labelDataEmpty = featureToLabelData(emptySectorFeature, {}, "2026-03-24");
    expect(labelDataEmpty).toBeNull();

    // Con bitácora directa, el sector genera su tarjeta con su información específica
    const directSectorFeature: DrawnFeature = {
      ...emptySectorFeature,
      dailyLogs: [
        {
          date: "2026-03-24",
          department: "pc",
          groups: [{ id: "gs1", groupName: "Puesto de Comando Sectorial", unitOut: "Unidad Móvil 01", hasArrived: true }],
          rescuedCount: "1",
          customActivities: [{ id: "ca_sec", name: "Puesto de Mando", value: "Activo" }],
        },
      ],
    };

    const labelDataDirect = featureToLabelData(directSectorFeature, {}, "2026-03-24");
    expect(labelDataDirect).not.toBeNull();
    expect(labelDataDirect?.title).toBe("Sector A - Macuto");
    expect(labelDataDirect?.teamNames).toContain("Puesto de Comando Sectorial - Unidad Móvil 01");
    expect(labelDataDirect?.rescuedCount).toBe(1);
    expect(labelDataDirect?.customActivities?.[0].name).toBe("Puesto de Mando");
  });
});

