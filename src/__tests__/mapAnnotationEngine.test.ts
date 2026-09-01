import { describe, it, expect } from "vitest";
import {
  getRequiredZoom,
  choosePlacement,
  deconflictNativeNoPersonnelLabels,
  deconflictPersonnelHtmlLabels,
  MapAnnotationEngine,
  type ScreenLabelItem,
} from "../utils/mapAnnotationEngine";

describe("MapAnnotationEngine - Zoom Thresholds", () => {
  it("determines required zoom for features with and without personnel", () => {
    // Feature with personnel / metrics: zoom 8
    expect(getRequiredZoom(false, false, true)).toBe(8);
    // Standalone polygon: zoom 10
    expect(getRequiredZoom(true, false, false)).toBe(10);
    // Subpolygon: zoom 11
    expect(getRequiredZoom(true, true, false)).toBe(11);
    // Regular point: zoom 11
    expect(getRequiredZoom(false, false, false)).toBe(11);
  });
});

describe("MapAnnotationEngine - Placement & Collision Boxes", () => {
  it("places label on top by default when no obstacles exist", () => {
    const { placement, box } = choosePlacement(100, 100, 50, 20, false, []);
    expect(placement).toBe("top");
    expect(box.x1).toBe(75);
    expect(box.x2).toBe(125);
    expect(box.y2).toBe(88); // 100 - 12 (offset)
    expect(box.y1).toBe(68); // 88 - 20 (height)
  });

  it("chooses alternative direction when top placement collides", () => {
    const topObstacle = { x1: 70, y1: 60, x2: 130, y2: 90 };
    const { placement } = choosePlacement(100, 100, 50, 20, false, [topObstacle]);
    expect(placement).toBe("bottom");
  });

  it("forces top placement if allowOverlap is true", () => {
    const obstacle = { x1: 50, y1: 50, x2: 150, y2: 150 };
    const { placement } = choosePlacement(100, 100, 50, 20, true, [obstacle]);
    expect(placement).toBe("top");
  });
});

describe("MapAnnotationEngine - Collision Deconfliction", () => {
  it("hides colliding labels closer than minDistance", () => {
    const labels: ScreenLabelItem[] = [
      { graphic: {} as any, x: 100, y: 100, visible: true, priority: 2, hasPersonnel: false },
      { graphic: {} as any, x: 110, y: 105, visible: true, priority: 2, hasPersonnel: false }, // distance < 50
      { graphic: {} as any, x: 300, y: 300, visible: true, priority: 2, hasPersonnel: false }, // distant
    ];

    deconflictNativeNoPersonnelLabels(labels, 50);

    expect(labels[0].visible).toBe(true);
    expect(labels[1].visible).toBe(false);
    expect(labels[2].visible).toBe(true);
  });

  it("deconflicts personnel labels when called", () => {
    const personnelLabels: ScreenLabelItem[] = [
      { graphic: {} as any, x: 100, y: 100, visible: true, priority: 1, hasPersonnel: true },
      { graphic: {} as any, x: 120, y: 110, visible: true, priority: 1, hasPersonnel: true }, // close
      { graphic: {} as any, x: 400, y: 400, visible: true, priority: 1, hasPersonnel: true },
    ];

    deconflictPersonnelHtmlLabels(personnelLabels, 55);

    expect(personnelLabels[0].visible).toBe(true);
    expect(personnelLabels[1].visible).toBe(false);
    expect(personnelLabels[2].visible).toBe(true);
  });
});

describe("MapAnnotationEngine - buildHtmlLabels Metrics Extraction", () => {
  it("extracts recovered and rescued counts from groups on a specific date (e.g. 7 de julio)", () => {
    const feat = {
      id: "point-1",
      title: "Sector Las Flores",
      dailyLogs: [
        {
          date: "2024-07-07",
          department: "pc" as const,
          groups: [
            {
              id: "g1",
              groupName: "Grupo Rescate A",
              recoveredCount: "3",
              rescuedCount: "5",
              officersCount: "4",
              hasArrived: true,
            },
          ],
        },
      ],
    };

    const dummyGraphic: any = {
      attributes: { parentId: "point-1" },
      symbol: { clone: () => ({}) },
      visible: true,
    };

    const screenLabels: ScreenLabelItem[] = [
      { graphic: dummyGraphic, x: 100, y: 100, visible: true, priority: 1, hasPersonnel: true },
    ];

    const refs: any = {
      drawnFeaturesRef: { current: [feat] },
      hiddenFeaturesRef: { current: {} },
      activeDepartmentRef: { current: "mixto" },
      showAccumulatedRef: { current: false },
    };

    const labels = MapAnnotationEngine.buildHtmlLabels(screenLabels, refs, true, "2024-07-07");
    expect(labels).toHaveLength(1);
    expect(labels[0].recoveredCount).toBe(3);
    expect(labels[0].rescuedCount).toBe(5);
    expect(labels[0].title).toBe("Sector Las Flores");
  });
});
